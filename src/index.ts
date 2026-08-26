/** Host half of the independently installable Git header plugin. */

import { WorkspaceId, type WorkspaceRegistry } from '@deepseek-ai/dsh-workspace'

type Context = Record<string, unknown>
type RpcResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: Record<string, never> } }
type HostConnectionHandle = { rpc: { handle: (channel: string, handler: (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<RpcResult<unknown>>, options: { authority: 'trusted-host' }) => unknown } }
type ShellRunResult = { exitCode: number | null; stderr: { text: string }; stdout: { text: string } }
type ShellExecutor = { resolve: (request: { command: string; workdir: string; stdin?: string; stdoutMaxBytes?: number; timeoutMs?: number; signal?: AbortSignal; sandboxPolicy?: unknown }) => unknown; run: (spec: unknown) => Promise<ShellRunResult> }

type GitFile = { path: string; additions: number; deletions: number; status: string }
type GitStatus =
  | { workspaceId: string; initialized: false }
  | { workspaceId: string; initialized: true; branch: string; files: GitFile[]; commits: number; clean: boolean; originConfigured: boolean; upstreamConfigured: boolean }
type GitPayload = { workspaceId: string; message?: string; url?: string }

const MAX_COMMIT_MESSAGE = 200
const MAX_REMOTE_URL = 500
const locks = new Map<string, Promise<void>>()

function ok<T>(value: T): RpcResult<T> { return { ok: true, value } }
function fail(message: string): RpcResult<never> { return { ok: false, error: { code: 'internal', message, details: {} } } }

function parsePayload(payload: unknown): GitPayload | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const value = payload as Partial<GitPayload>
  if (typeof value.workspaceId !== 'string'
    || (value.message !== undefined && typeof value.message !== 'string')
    || (value.url !== undefined && typeof value.url !== 'string')) return undefined
  return {
    workspaceId: value.workspaceId,
    ...(value.message === undefined ? {} : { message: value.message }),
    ...(value.url === undefined ? {} : { url: value.url }),
  }
}

function cleanGitOutput(value: string): string {
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '').trim()
}

export function formatGitError(command: string, exitCode: number | null, stderr: string, stdout = ''): string {
  const detail = cleanGitOutput(stderr || stdout)
  const lower = detail.toLowerCase()
  if (lower.includes('nothing to commit')) return 'Нет изменений для коммита.'
  if (lower.includes('not a git repository')) return 'Эта папка не является Git-репозиторием.'
  if (lower.includes('author identity unknown') || lower.includes('please tell me who you are')) return 'Git не знает имя и email автора. Настройте user.name и user.email.'
  if (lower.includes('no configured push destination')) return 'Для репозитория не настроен удалённый репозиторий (remote).'
  if (lower.includes('has no upstream branch')) return 'Для текущей ветки не настроена удалённая upstream-ветка.'
  if (lower.includes('non-fast-forward') || lower.includes('[rejected]') || lower.includes('fetch first') || lower.includes('remote contains work') || lower.includes('rejected')) return 'Push отклонён: удалённая ветка содержит изменения. Сначала выполните pull или rebase.'
  if (lower.includes('src refspec') && lower.includes('does not match any')) return 'Не удалось выполнить push: текущая ветка ещё не содержит коммитов или не существует.'
  if (lower.includes('could not read username') || lower.includes('authentication failed') || lower.includes('permission denied')) return 'Не удалось выполнить push: Git не смог пройти аутентификацию или у вас нет доступа к репозиторию.'
  if (detail !== '') return detail.slice(0, 1000)
  return `git ${command.replace(/^git\s+/, '')} завершился с кодом ${exitCode ?? 'неизвестно'}.`
}

export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)([^\s/@]+):([^\s/@]+)@/gi, '$1[credentials]@').slice(0, 1000)
}

async function executeGit(shell: ShellExecutor, workdir: string, command: string, stdin?: string, signal?: AbortSignal): Promise<ShellRunResult> {
  return shell.run(shell.resolve({ command, workdir, stdin, signal, stdoutMaxBytes: 2_000_000, timeoutMs: 30_000, sandboxPolicy: { mode: 'danger-full-access', workspaceRoot: workdir } }))
}

async function runGit(shell: ShellExecutor, workdir: string, command: string, stdin?: string, signal?: AbortSignal): Promise<string> {
  const result = await executeGit(shell, workdir, command, stdin, signal)
  if (result.exitCode !== 0) throw new Error(sanitizeError(formatGitError(command, result.exitCode, result.stderr.text, result.stdout.text)))
  return result.stdout.text
}

/** True only when the registered workspace itself is the worktree root. */
async function isRepository(shell: ShellExecutor, path: string, signal: AbortSignal): Promise<boolean> {
  const command = 'git rev-parse --is-inside-work-tree --show-prefix'
  const result = await executeGit(shell, path, command, undefined, signal)
  if (result.exitCode === 128) return false
  if (result.exitCode !== 0) throw new Error(sanitizeError(formatGitError(command, result.exitCode, result.stderr.text, result.stdout.text)))
  const lines = cleanGitOutput(result.stdout.text).split(/\r?\n/)
  return lines.length === 1 && lines[0] === 'true'
}

async function hasHead(shell: ShellExecutor, path: string, signal: AbortSignal): Promise<boolean> {
  const command = 'git rev-parse --verify --quiet HEAD'
  const result = await executeGit(shell, path, command, undefined, signal)
  if (result.exitCode === 0) return true
  if (result.exitCode === 1) return false
  throw new Error(sanitizeError(formatGitError(command, result.exitCode, result.stderr.text, result.stdout.text)))
}

async function hasOrigin(shell: ShellExecutor, path: string, signal: AbortSignal): Promise<boolean> {
  const command = 'git config --get remote.origin.url'
  const result = await executeGit(shell, path, command, undefined, signal)
  if (result.exitCode === 0) return cleanGitOutput(result.stdout.text) !== ''
  if (result.exitCode === 1) return false
  throw new Error(sanitizeError(formatGitError(command, result.exitCode, result.stderr.text, result.stdout.text)))
}

async function hasUpstream(shell: ShellExecutor, path: string, signal: AbortSignal): Promise<boolean> {
  const command = "git rev-parse --verify --quiet '@{upstream}'"
  const result = await executeGit(shell, path, command, undefined, signal)
  if (result.exitCode === 0) return true
  if (result.exitCode === 1) return false
  throw new Error(sanitizeError(formatGitError(command, result.exitCode, result.stderr.text, result.stdout.text)))
}

export function normalizeGitHubRemote(value: string): string {
  const input = value.trim()
  if (input.length === 0) throw new Error('Укажите URL существующего репозитория GitHub.')
  if (input.length > MAX_REMOTE_URL) throw new Error(`URL репозитория должен быть не длиннее ${MAX_REMOTE_URL} символов.`)
  const https = /^https:\/\/github\.com\/([a-z0-9_.-]+)\/([a-z0-9_.-]+?)(?:\.git)?\/?$/i.exec(input)
  if (https !== null) return `https://github.com/${https[1]}/${https[2]}.git`
  const ssh = /^git@github\.com:([a-z0-9_.-]+)\/([a-z0-9_.-]+?)(?:\.git)?$/i.exec(input)
  if (ssh !== null) return `git@github.com:${ssh[1]}/${ssh[2]}.git`
  throw new Error('Используйте HTTPS или SSH URL репозитория на github.com без встроенных credentials.')
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
  if (!await isRepository(shell, path, signal)) return { workspaceId, initialized: false }
  const head = await hasHead(shell, path, signal)
  const [branch, porcelain, diff, commits, originConfigured, upstreamConfigured] = await Promise.all([
    runGit(shell, path, 'git branch --show-current', undefined, signal),
    runGit(shell, path, 'git status --porcelain=v1 -z', undefined, signal),
    head ? runGit(shell, path, 'git diff HEAD --numstat -z', undefined, signal) : Promise.resolve(''),
    head ? runGit(shell, path, 'git rev-list --count HEAD --not --remotes', undefined, signal) : Promise.resolve('0'),
    hasOrigin(shell, path, signal),
    head ? hasUpstream(shell, path, signal) : Promise.resolve(false),
  ])
  const files = parseStatus(porcelain, parseNumstat(diff))
  return {
    workspaceId,
    initialized: true,
    branch: branch.trim(),
    files,
    commits: Number(commits.trim()) || 0,
    clean: files.length === 0,
    originConfigured,
    upstreamConfigured,
  }
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
        if (endpoint === 'init') {
          if (!await isRepository(ctx.shell, workspace.path, signal)) await runGit(ctx.shell, workspace.path, 'git init', undefined, signal)
          return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        }
        if (endpoint === 'remote') {
          if (!await isRepository(ctx.shell, workspace.path, signal)) return fail('Сначала инициализируйте Git-репозиторий.')
          if (await hasOrigin(ctx.shell, workspace.path, signal)) return fail('Remote origin уже настроен. Плагин не изменяет существующий remote автоматически.')
          const remote = normalizeGitHubRemote(payload.url ?? '')
          await runGit(ctx.shell, workspace.path, `git remote add origin ${remote}`, undefined, signal)
          return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        }
        if (endpoint === 'commit') {
          if (!await isRepository(ctx.shell, workspace.path, signal)) return fail('Сначала инициализируйте Git-репозиторий.')
          const message = payload.message?.trim() ?? ''
          if (message.length === 0) return fail('Commit message is required.')
          if (message.length > MAX_COMMIT_MESSAGE) return fail(`Commit message must be ${MAX_COMMIT_MESSAGE} characters or fewer.`)
          await runGit(ctx.shell, workspace.path, 'git add -A', undefined, signal)
          await runGit(ctx.shell, workspace.path, 'git commit -F -', `${message}\n`, signal)
          return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        }
        if (endpoint === 'push') {
          const snapshot = await status(ctx.shell, payload.workspaceId, workspace.path, signal)
          if (!snapshot.initialized) return fail('Сначала инициализируйте Git-репозиторий.')
          if (snapshot.branch === '') return fail('Нельзя настроить первый push из detached HEAD. Переключитесь на ветку.')
          if (snapshot.upstreamConfigured) await runGit(ctx.shell, workspace.path, 'git push', undefined, signal)
          else if (snapshot.originConfigured) await runGit(ctx.shell, workspace.path, 'git push -u origin HEAD', undefined, signal)
          else return fail('Сначала подключите GitHub-репозиторий как remote origin.')
          return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal))
        }
        return fail(`Unknown Git endpoint ${endpoint}.`)
      } catch (error: unknown) {
        return fail(sanitizeError(error))
      }
    })
  }, { authority: 'trusted-host' })
}
