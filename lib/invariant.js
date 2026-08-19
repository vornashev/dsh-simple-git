//#region lib/types/invariant.js
const PACKAGE_NAME = "dsh-simple-git";
const name = "client-ui-git-invariant";
const inject = ["invariants"];
/** No runtime invariant: the plugin owns only a disposable header slot entry. */
const install = () => {};
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
