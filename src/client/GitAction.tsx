import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GitAction.module.css'

type GitFile = { path: string; additions: number; deletions: number; status: string }
type GitStatus = { workspaceId: string; branch: string; files: GitFile[]; commits: number; clean: boolean }

export interface GitActionInjected {
  status: (workspaceId: string) => Promise<GitStatus>
  commit: (workspaceId: string, message: string) => Promise<GitStatus>
  push: (workspaceId: string) => Promise<GitStatus>
}
export type GitActionProps = PropsRuntime<'conversation.session.header.actions'> & GitActionInjected

function isGitFile(value: unknown): value is GitFile {
  if (typeof value !== 'object' || value === null) return false
  const file = value as Partial<GitFile>
  const additions = file.additions
  const deletions = file.deletions
  return typeof file.path === 'string' && typeof file.status === 'string'
    && typeof additions === 'number' && typeof deletions === 'number'
    && Number.isFinite(additions) && Number.isFinite(deletions)
    && additions >= 0 && deletions >= 0
}

function isGitStatus(value: unknown): value is GitStatus {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<GitStatus>
  return typeof candidate.workspaceId === 'string' && typeof candidate.branch === 'string'
    && typeof candidate.commits === 'number' && Number.isFinite(candidate.commits) && candidate.commits >= 0
    && typeof candidate.clean === 'boolean' && Array.isArray(candidate.files) && candidate.files.every(isGitFile)
}

/** Session-header Git control with explicit, keyboard-friendly commit/push actions. */
export function GitAction({ sessionId, useSessions, useWorkspaces, status, commit, push }: GitActionProps) {
  const cwd = useSessions(state => state.byId[sessionId]?.cwd)
  const workspaceId = useWorkspaces(state => state.items.find(item => item.path === cwd)?.workspaceId)
  const title = useSessions(state => state.byId[sessionId]?.displayTitle) ?? 'workspace update'
  const [snapshot, setSnapshot] = useState<GitStatus | undefined>()
  const [open, setOpen] = useState(false)
  const [operation, setOperation] = useState<'refreshing' | 'committing' | 'pushing' | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [feedback, setFeedback] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const sequence = useRef(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const refresh = useCallback(async () => {
    const requestedWorkspace = workspaceId
    const request = ++sequence.current
    if (requestedWorkspace === undefined) {
      setSnapshot(undefined)
      setError('This session is not attached to a workspace.')
      return
    }
    setOperation('refreshing')
    setFeedback(undefined)
    try {
      const next = await status(requestedWorkspace)
      if (request !== sequence.current || requestedWorkspace !== workspaceId) return
      if (!isGitStatus(next) || next.workspaceId !== requestedWorkspace) throw new Error('Git returned an invalid status response.')
      setSnapshot(next)
      setError(undefined)
    } catch (reason: unknown) {
      if (request === sequence.current) setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (request === sequence.current) setOperation(undefined)
    }
  }, [workspaceId, status])

  useEffect(() => {
    setSnapshot(undefined)
    setError(undefined)
    setFeedback(undefined)
    setOperation(undefined)
    setMessage('')
    void refresh()
  }, [workspaceId, refresh])

  const totals = useMemo(() => (snapshot?.files ?? []).reduce((result, file) => ({
    additions: result.additions + file.additions, deletions: result.deletions + file.deletions,
  }), { additions: 0, deletions: 0 }), [snapshot?.files])

  const run = async (action: (id: string) => Promise<GitStatus>, kind: 'committing' | 'pushing'): Promise<void> => {
    const requestedWorkspace = workspaceId
    if (requestedWorkspace === undefined || operation !== undefined) return
    const request = ++sequence.current
    setOperation(kind); setError(undefined); setFeedback(undefined)
    try {
      const next = await action(requestedWorkspace)
      if (request !== sequence.current || !isGitStatus(next) || next.workspaceId !== requestedWorkspace) return
      setSnapshot(next); setMessage('')
      setFeedback(kind === 'committing' ? 'Changes committed successfully.' : 'Changes pushed successfully.')
    } catch (reason: unknown) {
      if (request === sequence.current) setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (request === sequence.current) setOperation(undefined)
    }
  }

  const defaultMessage = `chore: ${title} (${snapshot?.files.map(file => file.path).slice(0, 3).join(', ') ?? 'workspace update'})`
  const commitMessage = message.trim() || defaultMessage
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
  }
  const busy = operation !== undefined
  const loading = operation === 'refreshing' || snapshot === undefined
  const triggerLabel = error !== undefined ? 'Git error' : loading ? 'Git status loading' : snapshot.clean ? `Git: ${snapshot.commits} unpushed commits` : `Commit all ${snapshot.files.length} changed files`

  return (
    <div className={css.root} onKeyDown={onKeyDown}>
      <button ref={triggerRef} type="button" className={clsx(css.trigger, snapshot?.clean && css.triggerClean, error !== undefined && css.triggerError)} aria-expanded={open} aria-haspopup="dialog" aria-controls={panelId} aria-label={triggerLabel} aria-busy={busy} onClick={() => { setOpen(value => !value) }} disabled={busy}>
        <span className={css.icon} aria-hidden="true">{busy ? <span className={css.spinner} /> : error !== undefined ? '!' : snapshot === undefined ? '…' : snapshot.clean ? '✓' : '↥'}</span>
        {error !== undefined ? <span>Git error</span> : loading ? <span>{operation === 'committing' ? 'Committing…' : operation === 'pushing' ? 'Pushing…' : 'Git…'}</span> : snapshot.clean ? <span>{snapshot.commits} unpushed commits</span> : <><span>{snapshot.files.length} files</span><span className={css.delta}>+{totals.additions}</span><span className={css.deleted}>−{totals.deletions}</span></>}
      </button>
      {open && <div id={panelId} className={css.menu} role="dialog" aria-label="Git status" aria-modal="false">
        {error !== undefined ? <div className={css.errorDetail} role="alert"><strong>Git is unavailable</strong><span>{error}</span><button type="button" className={css.retry} onClick={() => { void refresh() }} disabled={busy}>{busy ? 'Retrying…' : 'Retry'}</button></div> : loading ? <div className={css.loading} role="status" aria-busy="true"><span className={css.spinner} aria-hidden="true" /><span>Checking Git status…</span></div> : snapshot?.files.length === 0 ? <div className={css.footer}>Working tree clean on {snapshot.branch || 'detached HEAD'}.</div> : <ul>{snapshot?.files.map(file => <li className={css.row} key={`${file.status}:${file.path}`}><span className={css.path} title={file.path}>{file.path}</span><span className={css.status}>{file.status}</span><span className={css.count}><b className={css.delta}>+{file.additions}</b> <b className={css.deleted}>−{file.deletions}</b></span></li>)}</ul>}
        {snapshot !== undefined && error === undefined && <div className={css.footer} aria-busy={busy}><label className={css.messageLabel} htmlFor={`${panelId}-message`}>Commit message</label><input id={`${panelId}-message`} className={css.message} value={message} onChange={event => { setMessage(event.target.value); setFeedback(undefined) }} placeholder={defaultMessage} maxLength={200} disabled={busy || snapshot.clean} />{snapshot.clean ? <><span>{snapshot.commits} unpushed commits</span><button type="button" className={css.push} onClick={() => { void run(push, 'pushing') }} disabled={busy || snapshot.commits === 0}>{operation === 'pushing' ? <><span className={css.spinner} /> Pushing…</> : 'Push to Git'}</button></> : <button type="button" className={css.push} onClick={() => { void run(id => commit(id, commitMessage), 'committing') }} disabled={busy || commitMessage.length === 0}>{operation === 'committing' ? <><span className={css.spinner} /> Committing…</> : `Commit all ${snapshot.files.length} files`}</button>}</div>}
        <div className={css.live} role="status" aria-live="polite">{busy ? `${operation === 'refreshing' ? 'Refreshing' : operation === 'committing' ? 'Committing' : 'Pushing'} Git…` : error ?? feedback ?? ''}</div>
      </div>}
    </div>
  )
}
