import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
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

function isGitStatus(value: unknown): value is GitStatus {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<GitStatus>
  return typeof candidate.branch === 'string' && typeof candidate.commits === 'number' && Array.isArray(candidate.files)
}

/** Session-header Git control with hover disclosure and explicit commit/push actions. */
export function GitAction({ sessionId, useSessions, useWorkspaces, status, commit, push }: GitActionProps) {
  const cwd = useSessions(state => state.byId[sessionId]?.cwd)
  const workspaceId = useWorkspaces(state => state.items.find(item => item.path === cwd)?.workspaceId)
  const title = useSessions(state => state.byId[sessionId]?.displayTitle) ?? 'workspace update'
  const [snapshot, setSnapshot] = useState<GitStatus | undefined>()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const refresh = useCallback(async () => {
    if (workspaceId === undefined) {
      setError('This session is not attached to a workspace.')
      return
    }
    try {
      const next = await status(workspaceId)
      if (isGitStatus(next)) {
        setSnapshot(next)
        setError(undefined)
      } else {
        setError('Git returned an invalid status response.')
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }, [workspaceId, status])
  useEffect(() => { void refresh() }, [refresh])

  const totals = useMemo(() => (snapshot?.files ?? []).reduce((result: { additions: number; deletions: number }, file: GitFile) => ({
    additions: result.additions + file.additions, deletions: result.deletions + file.deletions,
  }), { additions: 0, deletions: 0 }), [snapshot?.files])

  const run = async (operation: () => Promise<GitStatus>): Promise<void> => {
    setBusy(true); setError(undefined)
    try { setSnapshot(await operation()) } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : String(reason)) }
    finally { setBusy(false) }
  }
  const message = `chore: ${title} (${snapshot?.files.map((file: GitFile) => file.path).slice(0, 3).join(', ') ?? 'workspace update'})`
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') setOpen(false)
  }
  const errorMessage = error ?? (snapshot === undefined ? 'Loading Git status…' : undefined)
  const triggerLabel = error !== undefined ? 'Git error' : snapshot === undefined ? 'Git…' : snapshot.clean ? `Git: ${snapshot.commits} unpushed commits` : `Commit ${snapshot.files.length} files`

  return (
    <div className={css.root} onMouseEnter={() => { setOpen(true) }} onMouseLeave={() => { setOpen(false) }} onKeyDown={onKeyDown}>
      <button type="button" className={clsx(css.trigger, snapshot?.clean && css.triggerClean, error !== undefined && css.triggerError)} aria-expanded={open} aria-label={triggerLabel} onClick={() => { setOpen((value: boolean) => !value) }} disabled={busy}>
        <span className={css.icon}>{error !== undefined ? '!' : snapshot === undefined ? '…' : snapshot.clean ? '✓' : '↥'}</span>
        {error !== undefined ? <span>Git error</span> : snapshot === undefined ? <span>Git…</span> : snapshot.clean ? <span>{snapshot.commits} unpushed commits</span> : <><span>{snapshot.files.length} files</span><span className={css.delta}>+{totals.additions}</span><span className={css.deleted}>−{totals.deletions}</span></>}
      </button>
      {open && <div className={css.menu} role="dialog" aria-label="Git status">
        {errorMessage !== undefined ? <div className={css.errorDetail} role={error !== undefined ? 'alert' : 'status'}><strong>{error !== undefined ? 'Git is unavailable' : 'Checking Git status'}</strong><span>{errorMessage}</span>{error !== undefined && <button type="button" className={css.retry} onClick={() => { void refresh() }}>Retry</button>}</div> : snapshot?.files.length === 0 ? <div className={css.footer}>Working tree clean on {snapshot.branch || 'detached HEAD'}.</div> : <ul>{snapshot?.files.map((file: GitFile) => <li className={css.row} key={`${file.status}:${file.path}`}><span className={css.path} title={file.path}>{file.path}</span><span className={css.status}>{file.status}</span><span className={css.count}><b className={css.delta}>+{file.additions}</b> <b className={css.deleted}>−{file.deletions}</b></span></li>)}</ul>}
        {snapshot !== undefined && error === undefined && <div className={css.footer}>{snapshot.clean ? <><span>{snapshot.commits} unpushed commits</span><button type="button" className={css.push} onClick={() => { void run(() => push(workspaceId!)) }}>Push to Git</button></> : <button type="button" className={css.push} onClick={() => { void run(() => commit(workspaceId!, message)) }}>Commit changes</button>}</div>}
      </div>}
    </div>
  )
}
