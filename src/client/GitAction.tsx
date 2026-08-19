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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
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
    try {
      const next = await status(requestedWorkspace)
      if (request !== sequence.current || requestedWorkspace !== workspaceId) return
      if (!isGitStatus(next) || next.workspaceId !== requestedWorkspace) throw new Error('Git returned an invalid status response.')
      setSnapshot(next)
      setError(undefined)
    } catch (reason: unknown) {
      if (request === sequence.current) setError(reason instanceof Error ? reason.message : String(reason))
    }
  }, [workspaceId, status])

  useEffect(() => {
    setSnapshot(undefined)
    setError(undefined)
    setMessage('')
    void refresh()
  }, [workspaceId, refresh])

  const totals = useMemo(() => (snapshot?.files ?? []).reduce((result, file) => ({
    additions: result.additions + file.additions, deletions: result.deletions + file.deletions,
  }), { additions: 0, deletions: 0 }), [snapshot?.files])

  const run = async (operation: (id: string) => Promise<GitStatus>): Promise<void> => {
    const requestedWorkspace = workspaceId
    if (requestedWorkspace === undefined || busy) return
    const request = ++sequence.current
    setBusy(true); setError(undefined)
    try {
      const next = await operation(requestedWorkspace)
      if (request !== sequence.current || !isGitStatus(next) || next.workspaceId !== requestedWorkspace) return
      setSnapshot(next); setMessage('')
    } catch (reason: unknown) {
      if (request === sequence.current) setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (request === sequence.current) setBusy(false)
    }
  }

  const defaultMessage = `chore: ${title} (${snapshot?.files.map(file => file.path).slice(0, 3).join(', ') ?? 'workspace update'})`
  const commitMessage = message.trim() || defaultMessage
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
  }
  const errorMessage = error ?? (snapshot === undefined ? 'Loading Git status…' : undefined)
  const triggerLabel = error !== undefined ? 'Git error' : snapshot === undefined ? 'Git status loading' : snapshot.clean ? `Git: ${snapshot.commits} unpushed commits` : `Commit all ${snapshot.files.length} changed files`

  return (
    <div className={css.root} onKeyDown={onKeyDown}>
      <button ref={triggerRef} type="button" className={clsx(css.trigger, snapshot?.clean && css.triggerClean, error !== undefined && css.triggerError)} aria-expanded={open} aria-haspopup="dialog" aria-controls={panelId} aria-label={triggerLabel} aria-busy={busy} onClick={() => { setOpen(value => !value) }} disabled={busy}>
        <span className={css.icon} aria-hidden="true">{error !== undefined ? '!' : snapshot === undefined ? '…' : snapshot.clean ? '✓' : '↥'}</span>
        {error !== undefined ? <span>Git error</span> : snapshot === undefined ? <span>Git…</span> : snapshot.clean ? <span>{snapshot.commits} unpushed commits</span> : <><span>{snapshot.files.length} files</span><span className={css.delta}>+{totals.additions}</span><span className={css.deleted}>−{totals.deletions}</span></>}
      </button>
      {open && <div id={panelId} className={css.menu} role="dialog" aria-label="Git status" aria-modal="false">
        {errorMessage !== undefined ? <div className={css.errorDetail} role={error !== undefined ? 'alert' : 'status'}><strong>{error !== undefined ? 'Git is unavailable' : 'Checking Git status'}</strong><span>{errorMessage}</span>{error !== undefined && <button type="button" className={css.retry} onClick={() => { void refresh() }} disabled={busy}>Retry</button>}</div> : snapshot?.files.length === 0 ? <div className={css.footer}>Working tree clean on {snapshot.branch || 'detached HEAD'}.</div> : <ul>{snapshot?.files.map(file => <li className={css.row} key={`${file.status}:${file.path}`}><span className={css.path} title={file.path}>{file.path}</span><span className={css.status}>{file.status}</span><span className={css.count}><b className={css.delta}>+{file.additions}</b> <b className={css.deleted}>−{file.deletions}</b></span></li>)}</ul>}
        {snapshot !== undefined && error === undefined && <div className={css.footer} aria-busy={busy}><label className={css.messageLabel} htmlFor={`${panelId}-message`}>Commit message</label><input id={`${panelId}-message`} className={css.message} value={message} onChange={event => { setMessage(event.target.value) }} placeholder={defaultMessage} maxLength={200} disabled={busy || snapshot.clean} />{snapshot.clean ? <><span>{snapshot.commits} unpushed commits</span><button type="button" className={css.push} onClick={() => { void run(push) }} disabled={busy || snapshot.commits === 0}>Push to Git</button></> : <button type="button" className={css.push} onClick={() => { void run(id => commit(id, commitMessage)) }} disabled={busy || commitMessage.length === 0}>{busy ? 'Committing…' : `Commit all ${snapshot.files.length} files`}</button>}</div>}
        <div className={css.live} role="status" aria-live="polite">{busy ? 'Git operation in progress…' : error ?? ''}</div>
      </div>}
    </div>
  )
}
