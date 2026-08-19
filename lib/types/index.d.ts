/** Host half of the independently installable Git header plugin. */
import type { Context } from '@deepseek-ai/cordis';
import { WorkspaceId } from '@deepseek-ai/dsh-workspace';
export declare const inject: string[];
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
type ShellRequest = {
    command: string;
    workdir: string;
    stdin?: string | undefined;
    stdoutMaxBytes: number;
    timeoutMs: number;
    sandboxPolicy: {
        mode: 'danger-full-access';
        workspaceRoot: string;
    };
};
type ShellSpec = ShellRequest;
type ShellExecutor = {
    resolve: (request: ShellRequest) => ShellSpec;
    run: (spec: ShellSpec) => Promise<{
        exitCode: number | null;
        stderr: {
            text: string;
        };
        stdout: {
            text: string;
        };
    }>;
};
type HostConnectionHandle = {
    rpc: {
        handle: (channel: string, handler: (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<RpcResult<unknown>>, options: {
            authority: 'trusted-host';
        }) => unknown;
    };
};
type WorkspaceRegistry = {
    get: (workspaceId: ReturnType<typeof WorkspaceId>) => {
        path: string;
    } | undefined;
};
/** Register the plugin-owned Git RPC channel on the Host Connection service. */
export declare function apply(ctx: Context & {
    connection: HostConnectionHandle;
    shell: ShellExecutor;
    workspaceRegistry: WorkspaceRegistry;
}): void;
export {};
//# sourceMappingURL=index.d.ts.map