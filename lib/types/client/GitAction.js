import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import css from './GitAction.module.css';
function classNames(...values) {
    return values.filter((value) => typeof value === 'string').join(' ');
}
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
    if (typeof candidate.workspaceId !== 'string' || typeof candidate.initialized !== 'boolean')
        return false;
    if (!candidate.initialized)
        return true;
    return typeof candidate.branch === 'string'
        && typeof candidate.commits === 'number' && Number.isFinite(candidate.commits) && candidate.commits >= 0
        && typeof candidate.clean === 'boolean'
        && typeof candidate.originConfigured === 'boolean'
        && typeof candidate.upstreamConfigured === 'boolean'
        && Array.isArray(candidate.files) && candidate.files.every(isGitFile);
}
const operationLabels = {
    refreshing: 'Refreshing',
    initializing: 'Initializing',
    connecting: 'Connecting',
    committing: 'Committing',
    pushing: 'Pushing',
};
/** Session-header Git control with explicit, keyboard-friendly setup/commit/push actions. */
export function GitAction({ sessionId, useSessions, useWorkspaces, status, init, connectRemote, commit, push }) {
    const cwd = useSessions(state => state.byId[sessionId]?.cwd);
    const workspaceId = useWorkspaces(state => state.items.find(item => item.path === cwd)?.workspaceId);
    const title = useSessions(state => state.byId[sessionId]?.displayTitle) ?? 'workspace update';
    const [snapshot, setSnapshot] = useState();
    const [open, setOpen] = useState(false);
    const [operation, setOperation] = useState();
    const [statusError, setStatusError] = useState();
    const [actionError, setActionError] = useState();
    const [feedback, setFeedback] = useState();
    const [message, setMessage] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    const sequence = useRef(0);
    const triggerRef = useRef(null);
    const panelId = useId();
    const refresh = useCallback(async () => {
        const requestedWorkspace = workspaceId;
        const request = ++sequence.current;
        if (requestedWorkspace === undefined) {
            setSnapshot(undefined);
            setStatusError('This session is not attached to a workspace.');
            return;
        }
        setOperation('refreshing');
        setFeedback(undefined);
        setActionError(undefined);
        try {
            const next = await status(requestedWorkspace);
            if (request !== sequence.current || requestedWorkspace !== workspaceId)
                return;
            if (!isGitStatus(next) || next.workspaceId !== requestedWorkspace)
                throw new Error('Git returned an invalid status response.');
            setSnapshot(next);
            setStatusError(undefined);
        }
        catch (reason) {
            if (request === sequence.current)
                setStatusError(reason instanceof Error ? reason.message : String(reason));
        }
        finally {
            if (request === sequence.current)
                setOperation(undefined);
        }
    }, [workspaceId, status]);
    useEffect(() => {
        setSnapshot(undefined);
        setStatusError(undefined);
        setActionError(undefined);
        setFeedback(undefined);
        setOperation(undefined);
        setMessage('');
        setRemoteUrl('');
        void refresh();
    }, [workspaceId, refresh]);
    const repository = snapshot?.initialized ? snapshot : undefined;
    const totals = useMemo(() => (repository?.files ?? []).reduce((result, file) => ({
        additions: result.additions + file.additions, deletions: result.deletions + file.deletions,
    }), { additions: 0, deletions: 0 }), [repository?.files]);
    const run = async (action, kind) => {
        const requestedWorkspace = workspaceId;
        if (requestedWorkspace === undefined || operation !== undefined)
            return;
        const request = ++sequence.current;
        setOperation(kind);
        setActionError(undefined);
        setFeedback(undefined);
        try {
            const next = await action(requestedWorkspace);
            if (request !== sequence.current || !isGitStatus(next) || next.workspaceId !== requestedWorkspace)
                return;
            setSnapshot(next);
            if (kind === 'committing')
                setMessage('');
            if (kind === 'connecting')
                setRemoteUrl('');
            setFeedback(kind === 'initializing'
                ? 'Git repository initialized.'
                : kind === 'connecting'
                    ? 'GitHub repository connected as origin.'
                    : kind === 'committing'
                        ? 'Changes committed successfully.'
                        : 'Changes pushed successfully.');
        }
        catch (reason) {
            if (request === sequence.current)
                setActionError(reason instanceof Error ? reason.message : String(reason));
        }
        finally {
            if (request === sequence.current)
                setOperation(undefined);
        }
    };
    const defaultMessage = `chore: ${title} (${repository?.files.map(file => file.path).slice(0, 3).join(', ') || 'workspace update'})`;
    const commitMessage = message.trim() || defaultMessage;
    const onRemoteSubmit = (event) => {
        event.preventDefault();
        if (remoteUrl.trim() !== '')
            void run(id => connectRemote(id, remoteUrl), 'connecting');
    };
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            triggerRef.current?.focus();
        }
    };
    const busy = operation !== undefined;
    const loading = operation === 'refreshing' || snapshot === undefined;
    const needsRemote = repository !== undefined && !repository.originConfigured && !repository.upstreamConfigured;
    const triggerLabel = statusError !== undefined
        ? 'Git error'
        : loading
            ? 'Git status loading'
            : !snapshot.initialized
                ? 'Set up Git for this workspace'
                : snapshot.clean
                    ? `Git: ${snapshot.commits} unpushed commits`
                    : `Commit all ${snapshot.files.length} changed files`;
    return (_jsxs("div", { className: css.root, onKeyDown: onKeyDown, children: [_jsxs("button", { ref: triggerRef, type: "button", className: classNames(css.trigger, snapshot?.initialized === false && css.triggerSetup, repository?.clean && css.triggerClean, statusError !== undefined && css.triggerError), "aria-expanded": open, "aria-haspopup": "dialog", "aria-controls": panelId, "aria-label": triggerLabel, "aria-busy": busy, onClick: () => { setOpen(value => !value); }, disabled: busy, children: [_jsx("span", { className: css.icon, "aria-hidden": "true", children: busy ? _jsx("span", { className: css.spinner }) : statusError !== undefined ? '!' : snapshot === undefined ? '…' : !snapshot.initialized ? '◇' : snapshot.clean ? '✓' : '↥' }), operation !== undefined && operation !== 'refreshing'
                        ? _jsxs("span", { children: [operationLabels[operation], "\u2026"] })
                        : statusError !== undefined
                            ? _jsx("span", { children: "Git error" })
                            : loading
                                ? _jsx("span", { children: "Git\u2026" })
                                : !snapshot.initialized
                                    ? _jsx("span", { children: "Set up Git" })
                                    : snapshot.clean
                                        ? _jsxs("span", { children: [snapshot.commits, " unpushed commits"] })
                                        : _jsxs(_Fragment, { children: [_jsxs("span", { children: [snapshot.files.length, " files"] }), _jsxs("span", { className: css.delta, children: ["+", totals.additions] }), _jsxs("span", { className: css.deleted, children: ["\u2212", totals.deletions] })] })] }), open && _jsxs("div", { id: panelId, className: css.menu, role: "dialog", "aria-label": "Git status", "aria-modal": "false", children: [statusError !== undefined
                        ? _jsxs("div", { className: css.errorDetail, role: "alert", children: [_jsx("strong", { children: "Git is unavailable" }), _jsx("span", { children: statusError }), _jsx("button", { type: "button", className: css.retry, onClick: () => { void refresh(); }, disabled: busy, children: busy ? 'Retrying…' : 'Retry' })] })
                        : loading
                            ? _jsxs("div", { className: css.loading, role: "status", "aria-busy": "true", children: [_jsx("span", { className: css.spinner, "aria-hidden": "true" }), _jsx("span", { children: "Checking Git status\u2026" })] })
                            : !snapshot.initialized
                                ? _jsxs("div", { className: css.setup, "aria-busy": busy, children: [_jsx("span", { className: css.setupIcon, "aria-hidden": "true", children: "\u25C7" }), _jsx("strong", { children: "Start tracking this workspace" }), _jsx("span", { children: "Initialize a local Git repository here. Nothing is committed or pushed automatically." }), _jsx("button", { type: "button", className: css.primaryAction, onClick: () => { void run(init, 'initializing'); }, disabled: busy, children: operation === 'initializing' ? _jsxs(_Fragment, { children: [_jsx("span", { className: css.spinner }), " Initializing\u2026"] }) : 'Initialize repository' })] })
                                : snapshot.files.length === 0
                                    ? _jsxs("div", { className: css.summary, children: ["Working tree clean on ", snapshot.branch || 'detached HEAD', "."] })
                                    : _jsx("ul", { children: snapshot.files.map(file => _jsxs("li", { className: css.row, children: [_jsx("span", { className: css.path, title: file.path, children: file.path }), _jsx("span", { className: css.status, children: file.status }), _jsxs("span", { className: css.count, children: [_jsxs("b", { className: css.delta, children: ["+", file.additions] }), " ", _jsxs("b", { className: css.deleted, children: ["\u2212", file.deletions] })] })] }, `${file.status}:${file.path}`)) }), actionError !== undefined && statusError === undefined && _jsx("div", { className: css.actionError, role: "alert", children: actionError }), needsRemote && _jsxs("form", { className: css.remoteSetup, "aria-busy": busy, onSubmit: onRemoteSubmit, children: [_jsx("strong", { children: "Connect GitHub" }), _jsxs("span", { children: ["Add an existing GitHub repository as remote ", _jsx("code", { children: "origin" }), "."] }), _jsx("label", { className: css.messageLabel, htmlFor: `${panelId}-remote`, children: "GitHub repository URL" }), _jsx("input", { id: `${panelId}-remote`, className: css.message, value: remoteUrl, onChange: event => { setRemoteUrl(event.target.value); setActionError(undefined); setFeedback(undefined); }, placeholder: "https://github.com/owner/repository.git", maxLength: 500, autoCapitalize: "none", autoCorrect: "off", spellCheck: false, disabled: busy }), _jsx("button", { type: "submit", className: css.secondaryAction, disabled: busy || remoteUrl.trim() === '', children: operation === 'connecting' ? _jsxs(_Fragment, { children: [_jsx("span", { className: css.spinner }), " Connecting\u2026"] }) : 'Connect GitHub' })] }), repository !== undefined && _jsxs("div", { className: css.footer, "aria-busy": busy, children: [_jsx("label", { className: css.messageLabel, htmlFor: `${panelId}-message`, children: "Commit message" }), _jsx("input", { id: `${panelId}-message`, className: css.message, value: message, onChange: event => { setMessage(event.target.value); setActionError(undefined); setFeedback(undefined); }, placeholder: defaultMessage, maxLength: 200, disabled: busy || repository.clean }), repository.clean
                                ? _jsxs(_Fragment, { children: [_jsxs("span", { children: [repository.commits, " unpushed commits"] }), _jsx("button", { type: "button", className: css.push, onClick: () => { void run(push, 'pushing'); }, disabled: busy || repository.commits === 0 || needsRemote, children: operation === 'pushing' ? _jsxs(_Fragment, { children: [_jsx("span", { className: css.spinner }), " Pushing\u2026"] }) : 'Push to Git' })] })
                                : _jsx("button", { type: "button", className: css.push, onClick: () => { void run(id => commit(id, commitMessage), 'committing'); }, disabled: busy || commitMessage.length === 0, children: operation === 'committing' ? _jsxs(_Fragment, { children: [_jsx("span", { className: css.spinner }), " Committing\u2026"] }) : `Commit all ${repository.files.length} files` })] }), _jsx("div", { className: css.live, role: "status", "aria-live": "polite", children: busy ? `${operationLabels[operation]} Git…` : statusError ?? actionError ?? feedback ?? '' })] })] }));
}
