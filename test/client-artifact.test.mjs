import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'

const client = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')

test('client artifact uses isolated RPC channel and accessible disclosure', () => {
  assert.match(client, /\/simple-git/)
  assert.match(client, /aria-haspopup/)
  assert.match(client, /aria-busy/)
  assert.match(client, /aria-live/)
  assert.match(client, /Set up Git/)
  assert.match(client, /Initialize repository/)
  assert.match(client, /Connect GitHub/)
  assert.match(client, /triggerSetup/)
  assert.match(client, /statusError/)
  assert.match(client, /actionError/)
  assert.match(client, /Committing…/)
  assert.match(client, /Pushing…/)
  assert.match(client, /git-spin/)
  assert.doesNotMatch(client, /git\.status/)
  assert.doesNotMatch(client, /workspaceId!/)
})
