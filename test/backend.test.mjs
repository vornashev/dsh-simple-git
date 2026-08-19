import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseNumstat, parseStatus, sanitizeError } from '../lib/index.js'

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

test('does not interpolate workspace paths into Git commands', async () => {
  const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../lib/index.js', import.meta.url), 'utf8'))
  assert.doesNotMatch(source, /git -C/)
  assert.match(source, /\/simple-git/)
})
