import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import { GitAction, type GitActionInjected } from './GitAction.js'

export const inject = ['connection', 'slots']

function unwrap<T>(result: RpcResult<unknown>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value as T
}

export function apply(ctx: ClientContext & { connection: ConnectionHandle }): void {
  const call = async <T>(endpoint: string, payload: unknown): Promise<T> =>
    unwrap<T>(await ctx.connection.rpc.call('/simple-git', endpoint, payload))
  const injected = (): GitActionInjected => ({
    status: workspaceId => call('status', { workspaceId }),
    init: workspaceId => call('init', { workspaceId }),
    connectRemote: (workspaceId, url) => call('remote', { workspaceId, url }),
    commit: (workspaceId, message) => call('commit', { workspaceId, message }),
    push: workspaceId => call('push', { workspaceId }),
  })
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions', id: 'git', order: 10, inject: injected,
  }, GitAction))
}
