import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import css from './GitAction.module.css';
function isGitFile(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const file = value;
    const additions = file.additions;
    const deletions = file.deletions;
    return typeof file.path === 'string' && typeof file.status === 'string'
        && typeof additions === 'number' && typeof deletions === 'number'
        && Number.isFinite(additions) && Number.isFinite(deletions)
        && additions >= 0 && deletions >= 0;
}
function isGitStatus(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const candidate = value;
    return typeof candidate.workspaceId === 'string' && typeof candidate.branch === 'string'
        && typeof candidate.commits === 'number' && Number.isFinite(candidate.commits) && candidate.commits >= 0
        && typeof candidate.clean === 'boolean' && Array.isArray(candidate.files) && candidate.files.every(isGitFile);
}
/** Session-header Git control with explicit, keyboard-friendly commit/push actions. */
export function GitAction({ sessionId, useSessions, useWorkspaces, status, commit, push }) {
    const cwd = useSessions(state => state.byId[sessionId]?.cwd);
    const workspaceId = useWorkspaces(state => state.items.find(item => item.path === cwd)?.workspaceId);
    const title = useSessions(state => state.byId[sessionId]?.displayTitle) ?? 'workspace update';
    const [snapshot, setSnapshot] = useState();
    const [open, setOpen] = useState(false);
    const [operation, setOperation] = useState();
    const [error, setError] = useState();
    const [feedback, setFeedback] = useState();
    const [message, setMessage] = useState('');
    const sequence = useRef(0);
    const triggerRef = useRef(null);
    const panelId = useId();
    const refresh = useCallback(async () => {
        const requestedWorkspace = workspaceId;
        const request = ++sequence.current;
        if (requestedWorkspace === undefined) {
            setSnapshot(undefined);
            setError('This session is not attached to a workspace.');
            return;
        }
        setOperation('refreshing');
        setFeedback(undefined);
        try {
            const next = await status(requestedWorkspace);
            if (request !== sequence.current || requestedWorkspace !== workspaceId)
                return;
            if (!isGitStatus(next) || next.workspaceId !== requestedWorkspace)
                throw new Error('Git returned an invalid status response.');
            setSnapshot(next);
            setError(undefined);
        }
        catch (reason) {
            if (request === sequence.current)
                setError(reason instanceof Error ? reason.message : String(reason));
        }
        finally {
            if (request === sequence.current)
                setOperation(undefined);
        }
    }, [workspaceId, status]);
    useEffect(() => {
        setSnapshot(undefined);
        setError(undefined);
        setFeedback(undefined);
        setOperation(undefined);
        setMessage('');
        void refresh();
    }, [workspaceId, refresh]);
    const totals = useMemo(() => (snapshot?.files ?? []).reduce((result, file) => ({
        additions: result.additions + file.additions, deletions: result.deletions + file.deletions,
    }), { additions: 0, deletions: 0 }), [snapshot?.files]);
    const run = async (action, kind) => {
        const requestedWorkspace = workspaceId;
        if (requestedWorkspace === undefined || operation !== undefined)
            return;
        const request = ++sequence.current;
        setOperation(kind);
        setError(undefined);
        setFeedback(undefined);
        try {
            const next = await action(requestedWorkspace);
            if (request !== sequence.current || !isGitStatus(next) || next.workspaceId !== requestedWorkspace)
                return;
            setSnapshot(next);
            setMessage('');
            setFeedback(kind === 'committing' ? 'Changes committed successfully.' : 'Changes pushed successfully.');
        }
        catch (reason) {
            if (request === sequence.current)
                setError(reason instanceof Error ? reason.message : String(reason));
        }
        finally {
            if (request === sequence.current)
                setOperation(undefined);
        }
    };
    const defaultMessage = `chore: ${title} (${snapshot?.files.map(file => file.path).slice(0, 3).join(', ') ?? 'workspace update'})`;
    const commitMessage = message.trim() || defaultMessage;
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            triggerRef.current?.focus();
        }
    };
    const busy = operation !== undefined;
    const loading = operation === 'refreshing' || snapshot === undefined;
    const triggerLabel = error !== undefined ? 'Git error' : loading ? 'Git status loading' : snapshot.clean ? `Git: ${snapshot.commits} unpushed commits` : `Commit all ${snapshot.files.length} changed files`;
    return (_jsxs("div", { className: css.root, onKeyDown: onKeyDown, children: [_jsxs("button", { ref: triggerRef, type: "button", className: clsx(css.trigger, snapshot?.clean && css.triggerClean, error !== undefined && css.triggerError), "aria-expanded": open, "aria-haspopup": "dialog", "aria-controls": panelId, "aria-label": triggerLabel, "aria-busy": busy, onClick: () => { setOpen(value => !value); }, disabled: busy, children: [_jsx("span", { className: css.icon, "aria-hidden": "true", children: busy ? _jsx("span", { className: css.spinner }) : error !== undefined ? '!' : snapshot === undefined ? '…' : snapshot.clean ? '✓' : '↥' }), error !== undefined ? _jsx("span", { children: "Git error" }) : loading ? _jsx("span", { children: operation === 'committing' ? 'Committing…' : operation === 'pushing' ? 'Pushing…' : 'Git…' }) : snapshot.clean ? _jsxs("span", { children: [snapshot.commits, " unpushed commits"] }) : _jsxs(_Fragment, { children: [_jsxs("span", { children: [snapshot.files.length, " files"] }), _jsxs("span", { className: css.delta, children: ["+", totals.additions] }), _jsxs("span", { className: css.deleted, children: ["\u2212", totals.deletions] })] })] }), open && _jsxs("div", { id: panelId, className: css.menu, role: "dialog", "aria-label": "Git status", "aria-modal": "false", children: [error !== undefined ? _jsxs("div", { className: css.errorDetail, role: "alert", children: [_jsx("strong", { children: "Git is unavailable" }), _jsx("span", { children: error }), _jsx("button", { type: "button", className: css.retry, onClick: () => { void refresh(); }, disabled: busy, children: busy ? 'Retrying…' : 'Retry' })] }) : loading ? _jsxs("div", { className: css.loading, role: "status", "aria-busy": "true", children: [_jsx("span", { className: css.spinner, "aria-hidden": "true" }), _jsx("span", { children: "Checking Git status\u2026" })] }) : snapshot?.files.length === 0 ? _jsxs("div", { className: css.footer, children: ["Working tree clean on ", snapshot.branch || 'detached HEAD', "."] }) : _jsx("ul", { children: snapshot?.files.map(file => _jsxs("li", { className: css.row, children: [_jsx("span", { className: css.path, title: file.path, children: file.path }), _jsx("span", { className: css.status, children: file.status }), _jsxs("span", { className: css.count, children: [_jsxs("b", { className: css.delta, children: ["+", file.additions] }), " ", _jsxs("b", { className: css.deleted, children: ["\u2212", file.deletions] })] })] }, `${file.status}:${file.path}`)) }), snapshot !== undefined && error === undefined && _jsxs("div", { className: css.footer, "aria-busy": busy, children: [_jsx("label", { className: css.messageLabel, htmlFor: `${panelId}-message`, children: "Commit message" }), _jsx("input", { id: `${panelId}-message`, className: css.message, value: message, onChange: event => { setMessage(event.target.value); setFeedback(undefined); }, placeholder: defaultMessage, maxLength: 200, disabled: busy || snapshot.clean }), snapshot.clean ? _jsxs(_Fragment, { children: [_jsxs("span", { children: [snapshot.commits, " unpushed commits"] }), _jsx("button", { type: "button", className: css.push, onClick: () => { void run(push, 'pushing'); }, disabled: busy || snapshot.commits === 0, children: operation === 'pushing' ? _jsxs(_Fragment, { children: [_jsx("span", { className: css.spinner }), " Pushing\u2026"] }) : 'Push to Git' })] }) : _jsx("button", { type: "button", className: css.push, onClick: () => { void run(id => commit(id, commitMessage), 'committing'); }, disabled: busy || commitMessage.length === 0, children: operation === 'committing' ? _jsxs(_Fragment, { children: [_jsx("span", { className: css.spinner }), " Committing\u2026"] }) : `Commit all ${snapshot.files.length} files` })] }), _jsx("div", { className: css.live, role: "status", "aria-live": "polite", children: busy ? `${operation === 'refreshing' ? 'Refreshing' : operation === 'committing' ? 'Committing' : 'Pushing'} Git…` : error ?? feedback ?? '' })] })] }));
}
