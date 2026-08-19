import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
export declare const inject: string[];
export declare function apply(ctx: ClientContext & {
    connection: ConnectionHandle;
}): void;
