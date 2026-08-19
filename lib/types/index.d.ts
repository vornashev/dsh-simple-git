/** Host half of the independently installable Git header plugin. */
import { type WorkspaceRegistry } from '@deepseek-ai/dsh-workspace';
type Context = Record<string, unknown>;
type RpcResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details: Record<string, never>;
    };
};
type HostConnectionHandle = {
    rpc: {
        handle: (channel: string, handler: (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<RpcResult<unknown>>, options: {
            authority: 'trusted-host';
        }) => unknown;
    };
};
type ShellExecutor = {
    resolve: (request: {
        command: string;
        workdir: string;
        stdin?: string;
        stdoutMaxBytes?: number;
        timeoutMs?: number;
        signal?: AbortSignal;
        sandboxPolicy?: unknown;
    }) => unknown;
    run: (spec: unknown) => Promise<{
        exitCode: number | null;
        stderr: {
            text: string;
        };
        stdout: {
            text: string;
        };
    }>;
};
type GitFile = {
    path: string;
    additions: number;
    deletions: number;
    status: string;
};
export declare function sanitizeError(error: unknown): string;
export declare function parseNumstat(value: string): Map<string, [number, number]>;
export declare function parseStatus(value: string, stats: Map<string, [number, number]>): GitFile[];
export declare const inject: string[];
/** Register the plugin-owned Git RPC channel on the Host Connection service. */
export declare function apply(ctx: Context & {
    connection: HostConnectionHandle;
    shell: ShellExecutor;
    workspaceRegistry: WorkspaceRegistry;
}): void;
export {};
