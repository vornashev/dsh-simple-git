/** Host half of the independently installable Git header plugin. */

import { WorkspaceId, type WorkspaceRegistry } from '@deepseek-ai/dsh-workspace'

type Context = Record<string, unknown>
type RpcResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: Record<string, never> } }
type HostConnectionHandle = { rpc: { handle: (channel: string, handler: (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<RpcResult<unknown>>, options: { authority: 'trusted-host' }) => unknown } }
type ShellExecutor = { resolve: (request: { command: string; workdir: string; stdin?: string; stdoutMaxBytes?: number; timeoutMs?: number; signal?: AbortSignal; sandboxPolicy?: unknown }) => unknown; run: (spec: unknown) => Promise<{ exitCode: number | null; stderr: { text: string }; stdout: { text: string } }> }

type GitFile = { path: string; additions: number; deletions: number; status: string }
type GitStatus = { workspaceId: string; branch: string; files: GitFile[]; commits: number; clean: boolean }
type GitPayload = { workspaceId: string; message?: string }

const MAX_COMMIT_MESSAGE = 200
const locks = new Map<string, Promise<void>>()

function ok<T>(value: T): RpcResult<T> { return { ok: true, value } }
function fail(message: string): RpcResult<never> { return { ok: false, error: { code: 'internal', message, details: {} } } }

function parsePayload(payload: unknown): GitPayload | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const value = payload as Partial<GitPayload>
  if (typeof value.workspaceId !== 'string' || (value.message !== undefined && typeof value.message !== 'string')) return undefined
  return value.message === undefined ? { workspaceId: value.workspaceId } : { workspaceId: value.workspaceId, message: value.message }
}

export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)([^\s/@]+):([^\s/@]+)@/gi, '$1[credentials]@').slice(0, 1000)
}

async function runGit(shell: ShellExecutor, workdir: string, command: string, stdin?: string, signal?: AbortSignal): Promise<string> {
  const result = await shell.run(shell.resolve({ command, workdir, stdin, signal, stdoutMaxBytes: 2_000_000, timeoutMs: 30_000, sandboxPolicy: { mode: 'danger-full-access', workspaceRoot: workdir } }))
  if (result.exitCode !== 0) throw new Error(sanitizeError(result.stderr.text || `git command failed with exit code ${result.exitCode ?? 'null'}`))
  return result.stdout.text
}

async function hasHead(shell: ShellExecutor, path: string, signal: AbortSignal): Promise<boolean> {
  try { await runGit(shell, path, 'git rev-parse --verify HEAD', undefined, signal); return true } catch { return false }
}

export function parseNumstat(value: string): Map<string, [number, number]> {
  const stats = new Map<string, [number, number]>()
  for (const record of value.split('\0')) {
    if (record === '') continue
    const [rawAdditions, rawDeletions, path] = record.split('\t')
    const additions = Number(rawAdditions)
    const deletions = Number(rawDeletions)
    if (path !== undefined && path !== '' && Number.isFinite(additions) && Number.isFinite(deletions)) stats.set(path, [additions, deletions])
  }
  return stats
}

export function parseStatus(value: string, stats: Map<string, [number, number]>): GitFile[] {
  const records = value.split('\0')
  const files: GitFile[] = []
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]
    if (record === '') continue
    const status = record.slice(0, 2).trim() || '?'
    const path = record.slice(3)
    const [additions, deletions] = stats.get(path) ?? [0, 0]
    files.push({ path, additions, deletions, status })
    if (/^[RC]/.test(status) && records[index + 1] !== undefined) index += 1
  }
  return files
}

async function status(shell: ShellExecutor, workspaceId: string, path: string, signal: AbortSignal): Promise<GitStatus> {
  const head = await hasHead(shell, path, signal)
  const [branch, porcelain, diff, commits] = await Promise.all([
    runGit(shell, path, 'git branch --show-current', undefined, signal),
    runGit(shell, path, 'git status --porcelain=v1 -z', undefined, signal),
    head ? runGit(shell, path, 'git diff HEAD --numstat -z', undefined, signal) : Promise.resolve(''),
    head ? runGit(shell, path, 'git rev-list --count HEAD --not --remotes', undefined, signal) : Promise.resolve('0'),
  ])
  const files = parseStatus(porcelain, parseNumstat(diff))
  return { workspaceId, branch: branch.trim(), files, commits: Number(commits.trim()) || 0, clean: files.length === 0 }
}

async function withWorkspaceLock<T>(workspaceId: string, action: () => Promise<T>): Promise<T> {
  const previous = locks.get(workspaceId) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(action)
  const completion = current.then(() => undefined, () => undefined)
  locks.set(workspaceId, completion)
  try { return await current } finally { if (locks.get(workspaceId) === completion) locks.delete(workspaceId) }
}

export const inject = ['connection', 'shell', 'workspaceRegistry']

/** Register the plugin-owned Git RPC channel on the Host Connection service. */
export function apply(ctx: Context & { connection: HostConnectionHandle; shell: ShellExecutor; workspaceRegistry: WorkspaceRegistry }): void {
  ctx.connection.rpc.handle('/simple-git', async (endpoint, rawPayload, signal) => {
    const payload = parsePayload(rawPayload)
    if (payload === undefined) return fail('Git request payload is invalid.')
    const workspace = ctx.workspaceRegistry.get(WorkspaceId(payload.workspaceId))
    if (workspace === undefined) return fail(`Workspace ${payload.workspaceId} was not found.`)
    return withWorkspaceLock(payload.workspaceId, async () => {
      try {
        if (endpoint === 'status') return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        if (endpoint === 'commit') {
          const message = payload.message?.trim() ?? ''
          if (message.length === 0) return fail('Commit message is required.')
          if (message.length > MAX_COMMIT_MESSAGE) return fail(`Commit message must be ${MAX_COMMIT_MESSAGE} characters or fewer.`)
          await runGit(ctx.shell, workspace.path, 'git add -A', undefined, signal)
          await runGit(ctx.shell, workspace.path, 'git commit -F -', `${message}\n`, signal)
          return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        }
        if (endpoint === 'push') {
          await runGit(ctx.shell, workspace.path, 'git push', undefined, signal)
          return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        }
        return fail(`Unknown Git endpoint ${endpoint}.`)
      } catch (error: unknown) {
        return fail(sanitizeError(error))
      }
    })
  }, { authority: 'trusted-host' })
}
