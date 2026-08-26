import { GitAction } from './GitAction.js';
export const inject = ['connection', 'slots'];
function unwrap(result) {
    if (!result.ok)
        throw new Error(result.error.message);
    return result.value;
}
export function apply(ctx) {
    const call = async (endpoint, payload) => unwrap(await ctx.connection.rpc.call('/simple-git', endpoint, payload));
    const injected = () => ({
        status: workspaceId => call('status', { workspaceId }),
        init: workspaceId => call('init', { workspaceId }),
        connectRemote: (workspaceId, url) => call('remote', { workspaceId, url }),
        commit: (workspaceId, message) => call('commit', { workspaceId, message }),
        push: workspaceId => call('push', { workspaceId }),
    });
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions', id: 'git', order: 10, inject: injected,
    }, GitAction));
}
