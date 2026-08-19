/** Host half of the independently installable Git header plugin. */

import type { Context } from '@deepseek-ai/cordis'
import type { RpcResult } from '@deepseek-ai/dsh-host-apiproxy/src/api/index.ts'
import type { HostConnectionHandle } from '@deepseek-ai/dsh-client-connection/src/rpc.ts'
import type { ShellExecutor } from '@deepseek-ai/dsh-shell/src/index.ts'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace/src/index.ts'
import type { WorkspaceRegistry } from '@deepseek-ai/dsh-workspace/src/index.ts'

export const inject = ['connection', 'shell', 'workspaceRegistry']

type GitFile = { path: string; additions: number; deletions: number; status: string }
type GitStatus = { workspaceId: string; branch: string; files: GitFile[]; commits: number; clean: boolean }
type GitPayload = { workspaceId: string; message?: string }

function ok<T>(value: T): RpcResult<T> { return { ok: true, value } }
function fail(message: string): RpcResult<never> { return { ok: false, error: { code: 'internal', message, details: {} } } }
function gitArg(path: string): string { return JSON.stringify(path) }
function parsePayload(payload: unknown): GitPayload | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const value = payload as Partial<GitPayload>
  if (typeof value.workspaceId !== 'string' || (value.message !== undefined && typeof value.message !== 'string')) return undefined
  return value.message === undefined
    ? { workspaceId: value.workspaceId }
    : { workspaceId: value.workspaceId, message: value.message }
}

async function runGit(shell: ShellExecutor, workdir: string, command: string, stdin?: string): Promise<string> {
  const result = await shell.run(shell.resolve({
    command, workdir, stdin, stdoutMaxBytes: 2_000_000, timeoutMs: 30_000,
    sandboxPolicy: { mode: 'danger-full-access', workspaceRoot: workdir },
  }))
  if (result.exitCode !== 0) throw new Error(result.stderr.text || `git command failed with exit code ${result.exitCode ?? 'null'}`)
  return result.stdout.text
}

async function status(shell: ShellExecutor, workspaceId: string, path: string): Promise<GitStatus> {
  const root = gitArg(path)
  const [branch, porcelain, diff, commits] = await Promise.all([
    runGit(shell, path, `git -C ${root} branch --show-current`),
    runGit(shell, path, `git -C ${root} status --porcelain=v1`),
    runGit(shell, path, `git -C ${root} diff HEAD --numstat`),
    runGit(shell, path, `git -C ${root} rev-list --count HEAD --not --remotes`),
  ])
  const stats = new Map<string, [number, number]>()
  for (const line of diff.trim().split(/\r?\n/)) {
    const [additions, deletions, file] = line.split('\t')
    if (file !== undefined) stats.set(file, [Number(additions) || 0, Number(deletions) || 0])
  }
  const files = porcelain.trim() === '' ? [] : porcelain.trim().split(/\r?\n/).map(line => {
    const file = line.slice(3)
    const [additions, deletions] = stats.get(file) ?? [0, 0]
    return { path: file, additions, deletions, status: line.slice(0, 2).trim() || '?' }
  })
  return { workspaceId, branch: branch.trim(), files, commits: Number(commits.trim()) || 0, clean: files.length === 0 }
}

/** Register the plugin-owned Git RPC channel on the Host Connection service. */
export function apply(ctx: Context & { connection: HostConnectionHandle; shell: ShellExecutor; workspaceRegistry: WorkspaceRegistry }): void {
  ctx.connection.rpc.handle('/git', async (endpoint, rawPayload) => {
    const payload = parsePayload(rawPayload)
    if (payload === undefined) return fail('Git request payload is invalid.')
    const workspace = ctx.workspaceRegistry.get(WorkspaceId(payload.workspaceId))
    if (workspace === undefined) return fail(`Workspace ${payload.workspaceId} was not found.`)
    try {
      if (endpoint === 'status') return ok(await status(ctx.shell, payload.workspaceId, workspace.path))
      if (endpoint === 'commit') {
        if (payload.message === undefined || payload.message.trim() === '') return fail('Commit message is required.')
        const root = gitArg(workspace.path)
        await runGit(ctx.shell, workspace.path, `git -C ${root} add -A`)
        await runGit(ctx.shell, workspace.path, `git -C ${root} commit -F -`, `${payload.message.trim()}\n`)
        return ok(await status(ctx.shell, payload.workspaceId, workspace.path))
      }
      if (endpoint === 'push') {
        await runGit(ctx.shell, workspace.path, `git -C ${rootArg(workspace.path)} push`)
        return ok(await status(ctx.shell, payload.workspaceId, workspace.path))
      }
      return fail(`Unknown Git endpoint ${endpoint}.`)
    } catch (error: unknown) {
      return { ok: false, error: { code: 'internal', message: error instanceof Error ? error.message : String(error), details: {} } }
    }
  }, { authority: 'trusted-host' })
}

function rootArg(path: string): string { return gitArg(path) }
