type Context = { invariants: { register: (name: string, install: () => void) => () => void } }

const PACKAGE_NAME = 'dsh-simple-git'
export const name = 'client-ui-git-invariant'
export const inject = ['invariants']

/** No runtime invariant: the plugin owns only a disposable header slot entry. */
const install = (): void => {}
export const apply = (ctx: Context): Promise<() => void> => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
