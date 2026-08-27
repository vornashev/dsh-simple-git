import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply, formatGitError, normalizeGitHubRemote, parseNumstat, parseStatus, sanitizeError } from '../lib/index.js'

const gitResult = (exitCode = 0, stdout = '', stderr = '') => ({ exitCode, stdout: { text: stdout }, stderr: { text: stderr } })

function createRpcHarness(respond) {
  const commands = []
  let handler
  const shell = {
    resolve: request => request,
    run: async spec => {
      commands.push(spec.command)
      return respond(spec.command, commands)
    },
  }
  const connection = { rpc: { handle: (_channel, next) => { handler = next } } }
  const workspaceRegistry = { get: () => ({ path: 'C:/workspace' }) }
  apply({ connection, shell, workspaceRegistry })
  return {
    commands,
    request: (endpoint, payload = { workspaceId: 'workspace' }) => handler(endpoint, payload, new AbortController().signal),
  }
}

function repositoryResponse({ branch = 'main', head = true, origin = false, upstream = false } = {}) {
  return command => {
    if (command === 'git --version') return gitResult(0, 'git version 2.50.0\n')
    if (command === 'git rev-parse --is-inside-work-tree --show-prefix; exit 0') return gitResult(0, 'true\n')
    if (command === 'git rev-parse --verify --quiet HEAD; exit 0') return head ? gitResult(0, 'abc123\n') : gitResult(0, '', 'révision absente')
    if (command === 'git branch --show-current') return gitResult(0, `${branch}\n`)
    if (command === 'git status --porcelain=v1 -z') return gitResult()
    if (command === 'git diff HEAD --numstat -z') return gitResult()
    if (command === 'git rev-list --count HEAD --not --remotes') return gitResult(0, '1\n')
    if (command === 'git config --get remote.origin.url; exit 0') return origin ? gitResult(0, 'https://github.com/acme/widgets.git\n') : gitResult(0, '', 'kein Remote konfiguriert')
    if (command === "git rev-parse --verify --quiet '@{upstream}'; exit 0") return upstream ? gitResult(0, 'abc123\n') : gitResult(0, '', 'aucune branche amont')
    if (command === 'git push' || command === 'git push -u origin HEAD') return gitResult()
    throw new Error(`Unexpected Git command: ${command}`)
  }
}

test('parses NUL-delimited numstat and status records', () => {
  const stats = parseNumstat('3\t1\tchanged.ts\0-\t-\tbinary.bin\0')
  const files = parseStatus(' M changed.ts\0?? binary.bin\0', stats)
  assert.deepEqual(files, [
    { path: 'changed.ts', additions: 3, deletions: 1, status: 'M' },
    { path: 'binary.bin', additions: 0, deletions: 0, status: '??' },
  ])
})

test('keeps special characters in filenames', () => {
  const path = 'folder/$(not-a-command); `literal`.txt'
  const files = parseStatus(`?? ${path}\0`, new Map())
  assert.equal(files[0].path, path)
})

test('redacts credentials from Git errors', () => {
  assert.equal(sanitizeError('fatal: https://alice:secret@example.com/repo.git denied'), 'fatal: https://[credentials]@example.com/repo.git denied')
})

test('normalizes safe GitHub HTTPS and SSH remotes', () => {
  assert.equal(normalizeGitHubRemote(' https://github.com/acme/widgets '), 'https://github.com/acme/widgets.git')
  assert.equal(normalizeGitHubRemote('git@github.com:acme/widgets.git'), 'git@github.com:acme/widgets.git')
})

test('rejects credential-bearing, non-GitHub, and shell-like remotes', () => {
  assert.throws(() => normalizeGitHubRemote('https://alice:token@github.com/acme/widgets.git'), /without embedded credentials|без встроенных credentials/)
  assert.throws(() => normalizeGitHubRemote('https://gitlab.com/acme/widgets.git'), /github\.com/)
  assert.throws(() => normalizeGitHubRemote('https://github.com/acme/widgets;whoami'), /github\.com/)
})

test('returns a neutral status for a workspace without a repository', async () => {
  const harness = createRpcHarness(command => {
    if (command === 'git --version') return gitResult(0, 'git version 2.50.0\n')
    if (command === 'git rev-parse --is-inside-work-tree --show-prefix; exit 0') return gitResult(0, '', 'kein Git-Repository')
    throw new Error(`Unexpected Git command: ${command}`)
  })
  const result = await harness.request('status')
  assert.deepEqual(result, { ok: true, value: { workspaceId: 'workspace', initialized: false } })
  assert.deepEqual(harness.commands, ['git --version', 'git rev-parse --is-inside-work-tree --show-prefix; exit 0'])
})

test('does not treat a nested workspace as its enclosing repository root', async () => {
  const harness = createRpcHarness(command => {
    if (command === 'git --version') return gitResult(0, 'git version 2.50.0\n')
    if (command === 'git rev-parse --is-inside-work-tree --show-prefix; exit 0') return gitResult(0, 'true\nparent/workspace/\n')
    throw new Error(`Unexpected Git command: ${command}`)
  })
  const status = await harness.request('status')
  const commit = await harness.request('commit', { workspaceId: 'workspace', message: 'must not escape' })
  assert.deepEqual(status, { ok: true, value: { workspaceId: 'workspace', initialized: false } })
  assert.equal(commit.ok, false)
  assert.equal(harness.commands.includes('git add -A'), false)
})

test('uses probe output rather than localized diagnostics or shell-normalized exit codes', async () => {
  const harness = createRpcHarness(repositoryResponse({ head: false, origin: false }))
  const result = await harness.request('status')
  assert.equal(result.ok, true)
  assert.equal(result.value.initialized, true)
  assert.equal(result.value.commits, 0)
  assert.equal(result.value.originConfigured, false)
})

test('keeps detached HEAD status available without an upstream', async () => {
  const harness = createRpcHarness(repositoryResponse({ branch: '', origin: true }))
  const result = await harness.request('status')
  assert.equal(result.ok, true)
  assert.equal(result.value.initialized, true)
  assert.equal(result.value.branch, '')
  assert.equal(result.value.upstreamConfigured, false)
})

test('uses origin and configures upstream for the first push', async () => {
  const harness = createRpcHarness(repositoryResponse({ origin: true, upstream: false }))
  const result = await harness.request('push')
  assert.equal(result.ok, true)
  assert.equal(harness.commands.includes('git push -u origin HEAD'), true)
  assert.equal(harness.commands.includes('git push'), false)
})

test('uses ordinary push when an upstream already exists', async () => {
  const harness = createRpcHarness(repositoryResponse({ origin: true, upstream: true }))
  const result = await harness.request('push')
  assert.equal(result.ok, true)
  assert.equal(harness.commands.includes('git push'), true)
  assert.equal(harness.commands.includes('git push -u origin HEAD'), false)
})

test('refuses to overwrite an existing origin', async () => {
  const harness = createRpcHarness(repositoryResponse({ origin: true }))
  const result = await harness.request('remote', { workspaceId: 'workspace', url: 'https://github.com/acme/new.git' })
  assert.equal(result.ok, false)
  assert.match(result.error.message, /origin уже настроен/)
  assert.equal(harness.commands.some(command => command.startsWith('git remote add origin')), false)
})

test('turns common Git failures into actionable messages', () => {
  assert.equal(formatGitError('git push', 1, "error: failed to push some refs\n hint: Updates were rejected because the remote contains work"), 'Push отклонён: удалённая ветка содержит изменения. Сначала выполните pull или rebase.')
  assert.equal(formatGitError('git commit -F -', 1, 'nothing to commit, working tree clean'), 'Нет изменений для коммита.')
  assert.equal(formatGitError('git push', 1, 'fatal: No configured push destination.'), 'Для репозитория не настроен удалённый репозиторий (remote).')
})

test('does not interpolate workspace paths into Git commands', async () => {
  const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../lib/index.js', import.meta.url), 'utf8'))
  assert.doesNotMatch(source, /git -C/)
  assert.match(source, /\/simple-git/)
  assert.match(source, /git init/)
  assert.match(source, /git remote add origin/)
  assert.match(source, /git push -u origin HEAD/)
})
