import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GitAction.module.css'

type GitFile = { path: string; additions: number; deletions: number; status: string }
type GitStatus =
  | { workspaceId: string; initialized: false }
  | { workspaceId: string; initialized: true; branch: string; files: GitFile[]; commits: number; clean: boolean; originConfigured: boolean; upstreamConfigured: boolean }
type Operation = 'refreshing' | 'initializing' | 'connecting' | 'committing' | 'pushing'

export interface GitActionInjected {
  status: (workspaceId: string) => Promise<GitStatus>
  init: (workspaceId: string) => Promise<GitStatus>
  connectRemote: (workspaceId: string, url: string) => Promise<GitStatus>
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
  if (typeof candidate.workspaceId !== 'string' || typeof candidate.initialized !== 'boolean') return false
  if (!candidate.initialized) return true
  return typeof candidate.branch === 'string'
    && typeof candidate.commits === 'number' && Number.isFinite(candidate.commits) && candidate.commits >= 0
    && typeof candidate.clean === 'boolean'
    && typeof candidate.originConfigured === 'boolean'
    && typeof candidate.upstreamConfigured === 'boolean'
    && Array.isArray(candidate.files) && candidate.files.every(isGitFile)
}

const operationLabels: Record<Operation, string> = {
  refreshing: 'Refreshing',
  initializing: 'Initializing',
  connecting: 'Connecting',
  committing: 'Committing',
  pushing: 'Pushing',
}

/** Session-header Git control with explicit, keyboard-friendly setup/commit/push actions. */
export function GitAction({ sessionId, useSessions, useWorkspaces, status, init, connectRemote, commit, push }: GitActionProps) {
  const cwd = useSessions(state => state.byId[sessionId]?.cwd)
  const workspaceId = useWorkspaces(state => state.items.find(item => item.path === cwd)?.workspaceId)
  const title = useSessions(state => state.byId[sessionId]?.displayTitle) ?? 'workspace update'
  const [snapshot, setSnapshot] = useState<GitStatus | undefined>()
  const [open, setOpen] = useState(false)
  const [operation, setOperation] = useState<Operation | undefined>()
  const [statusError, setStatusError] = useState<string | undefined>()
  const [actionError, setActionError] = useState<string | undefined>()
  const [feedback, setFeedback] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [remoteUrl, setRemoteUrl] = useState('')
  const sequence = useRef(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const refresh = useCallback(async () => {
    const requestedWorkspace = workspaceId
    const request = ++sequence.current
    if (requestedWorkspace === undefined) {
      setSnapshot(undefined)
      setStatusError('This session is not attached to a workspace.')
      return
    }
    setOperation('refreshing')
    setFeedback(undefined)
    setActionError(undefined)
    try {
      const next = await status(requestedWorkspace)
      if (request !== sequence.current || requestedWorkspace !== workspaceId) return
      if (!isGitStatus(next) || next.workspaceId !== requestedWorkspace) throw new Error('Git returned an invalid status response.')
      setSnapshot(next)
      setStatusError(undefined)
    } catch (reason: unknown) {
      if (request === sequence.current) setStatusError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (request === sequence.current) setOperation(undefined)
    }
  }, [workspaceId, status])

  useEffect(() => {
    setSnapshot(undefined)
    setStatusError(undefined)
    setActionError(undefined)
    setFeedback(undefined)
    setOperation(undefined)
    setMessage('')
    setRemoteUrl('')
    void refresh()
  }, [workspaceId, refresh])

  const repository = snapshot?.initialized ? snapshot : undefined
  const totals = useMemo(() => (repository?.files ?? []).reduce((result, file) => ({
    additions: result.additions + file.additions, deletions: result.deletions + file.deletions,
  }), { additions: 0, deletions: 0 }), [repository?.files])

  const run = async (action: (id: string) => Promise<GitStatus>, kind: Exclude<Operation, 'refreshing'>): Promise<void> => {
    const requestedWorkspace = workspaceId
    if (requestedWorkspace === undefined || operation !== undefined) return
    const request = ++sequence.current
    setOperation(kind); setActionError(undefined); setFeedback(undefined)
    try {
      const next = await action(requestedWorkspace)
      if (request !== sequence.current || !isGitStatus(next) || next.workspaceId !== requestedWorkspace) return
      setSnapshot(next)
      if (kind === 'committing') setMessage('')
      if (kind === 'connecting') setRemoteUrl('')
      setFeedback(kind === 'initializing'
        ? 'Git repository initialized.'
        : kind === 'connecting'
          ? 'GitHub repository connected as origin.'
          : kind === 'committing'
            ? 'Changes committed successfully.'
            : 'Changes pushed successfully.')
    } catch (reason: unknown) {
      if (request === sequence.current) setActionError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (request === sequence.current) setOperation(undefined)
    }
  }

  const defaultMessage = `chore: ${title} (${repository?.files.map(file => file.path).slice(0, 3).join(', ') || 'workspace update'})`
  const commitMessage = message.trim() || defaultMessage
  const onRemoteSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (remoteUrl.trim() !== '') void run(id => connectRemote(id, remoteUrl), 'connecting')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
  }
  const busy = operation !== undefined
  const loading = operation === 'refreshing' || snapshot === undefined
  const needsRemote = repository !== undefined && !repository.originConfigured && !repository.upstreamConfigured
  const triggerLabel = statusError !== undefined
    ? 'Git error'
    : loading
      ? 'Git status loading'
      : !snapshot.initialized
        ? 'Set up Git for this workspace'
        : snapshot.clean
          ? `Git: ${snapshot.commits} unpushed commits`
          : `Commit all ${snapshot.files.length} changed files`

  return (
    <div className={css.root} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(css.trigger, snapshot?.initialized === false && css.triggerSetup, repository?.clean && css.triggerClean, statusError !== undefined && css.triggerError)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label={triggerLabel}
        aria-busy={busy}
        onClick={() => { setOpen(value => !value) }}
        disabled={busy}
      >
        <span className={css.icon} aria-hidden="true">{busy ? <span className={css.spinner} /> : statusError !== undefined ? '!' : snapshot === undefined ? '…' : !snapshot.initialized ? '◇' : snapshot.clean ? '✓' : '↥'}</span>
        {operation !== undefined && operation !== 'refreshing'
          ? <span>{operationLabels[operation]}…</span>
          : statusError !== undefined
            ? <span>Git error</span>
            : loading
              ? <span>Git…</span>
              : !snapshot.initialized
                ? <span>Set up Git</span>
                : snapshot.clean
                  ? <span>{snapshot.commits} unpushed commits</span>
                  : <><span>{snapshot.files.length} files</span><span className={css.delta}>+{totals.additions}</span><span className={css.deleted}>−{totals.deletions}</span></>}
      </button>
      {open && <div id={panelId} className={css.menu} role="dialog" aria-label="Git status" aria-modal="false">
        {statusError !== undefined
          ? <div className={css.errorDetail} role="alert"><strong>Git is unavailable</strong><span>{statusError}</span><button type="button" className={css.retry} onClick={() => { void refresh() }} disabled={busy}>{busy ? 'Retrying…' : 'Retry'}</button></div>
          : loading
            ? <div className={css.loading} role="status" aria-busy="true"><span className={css.spinner} aria-hidden="true" /><span>Checking Git status…</span></div>
            : !snapshot.initialized
              ? <div className={css.setup} aria-busy={busy}><span className={css.setupIcon} aria-hidden="true">◇</span><strong>Start tracking this workspace</strong><span>Initialize a local Git repository here. Nothing is committed or pushed automatically.</span><button type="button" className={css.primaryAction} onClick={() => { void run(init, 'initializing') }} disabled={busy}>{operation === 'initializing' ? <><span className={css.spinner} /> Initializing…</> : 'Initialize repository'}</button></div>
              : snapshot.files.length === 0
                ? <div className={css.summary}>Working tree clean on {snapshot.branch || 'detached HEAD'}.</div>
                : <ul>{snapshot.files.map(file => <li className={css.row} key={`${file.status}:${file.path}`}><span className={css.path} title={file.path}>{file.path}</span><span className={css.status}>{file.status}</span><span className={css.count}><b className={css.delta}>+{file.additions}</b> <b className={css.deleted}>−{file.deletions}</b></span></li>)}</ul>}
        {actionError !== undefined && statusError === undefined && <div className={css.actionError} role="alert">{actionError}</div>}
        {needsRemote && <form className={css.remoteSetup} aria-busy={busy} onSubmit={onRemoteSubmit}>
          <strong>Connect GitHub</strong>
          <span>Add an existing GitHub repository as remote <code>origin</code>.</span>
          <label className={css.messageLabel} htmlFor={`${panelId}-remote`}>GitHub repository URL</label>
          <input id={`${panelId}-remote`} className={css.message} value={remoteUrl} onChange={event => { setRemoteUrl(event.target.value); setActionError(undefined); setFeedback(undefined) }} placeholder="https://github.com/owner/repository.git" maxLength={500} autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={busy} />
          <button type="submit" className={css.secondaryAction} disabled={busy || remoteUrl.trim() === ''}>{operation === 'connecting' ? <><span className={css.spinner} /> Connecting…</> : 'Connect GitHub'}</button>
        </form>}
        {repository !== undefined && <div className={css.footer} aria-busy={busy}>
          <label className={css.messageLabel} htmlFor={`${panelId}-message`}>Commit message</label>
          <input id={`${panelId}-message`} className={css.message} value={message} onChange={event => { setMessage(event.target.value); setActionError(undefined); setFeedback(undefined) }} placeholder={defaultMessage} maxLength={200} disabled={busy || repository.clean} />
          {repository.clean
            ? <><span>{repository.commits} unpushed commits</span><button type="button" className={css.push} onClick={() => { void run(push, 'pushing') }} disabled={busy || repository.commits === 0 || needsRemote}>{operation === 'pushing' ? <><span className={css.spinner} /> Pushing…</> : 'Push to Git'}</button></>
            : <button type="button" className={css.push} onClick={() => { void run(id => commit(id, commitMessage), 'committing') }} disabled={busy || commitMessage.length === 0}>{operation === 'committing' ? <><span className={css.spinner} /> Committing…</> : `Commit all ${repository.files.length} files`}</button>}
        </div>}
        <div className={css.live} role="status" aria-live="polite">{busy ? `${operationLabels[operation]} Git…` : statusError ?? actionError ?? feedback ?? ''}</div>
      </div>}
    </div>
  )
}
