import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
type GitFile = {
    path: string;
    additions: number;
    deletions: number;
    status: string;
};
type GitStatus = {
    workspaceId: string;
    initialized: false;
} | {
    workspaceId: string;
    initialized: true;
    branch: string;
    files: GitFile[];
    commits: number;
    clean: boolean;
    originConfigured: boolean;
    upstreamConfigured: boolean;
};
export interface GitActionInjected {
    status: (workspaceId: string) => Promise<GitStatus>;
    init: (workspaceId: string) => Promise<GitStatus>;
    connectRemote: (workspaceId: string, url: string) => Promise<GitStatus>;
    commit: (workspaceId: string, message: string) => Promise<GitStatus>;
    push: (workspaceId: string) => Promise<GitStatus>;
}
export type GitActionProps = PropsRuntime<'conversation.session.header.actions'> & GitActionInjected;
/** Session-header Git control with explicit, keyboard-friendly setup/commit/push actions. */
export declare function GitAction({ sessionId, useSessions, useWorkspaces, status, init, connectRemote, commit, push }: GitActionProps): import("react").JSX.Element;
export {};
