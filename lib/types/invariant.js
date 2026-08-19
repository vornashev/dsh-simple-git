const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-git';
export const name = 'client-ui-git-invariant';
export const inject = ['invariants'];
/** No runtime invariant: the plugin owns only a disposable header slot entry. */
const install = () => { };
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//# sourceMappingURL=invariant.js.map