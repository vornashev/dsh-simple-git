type Context = {
    invariants: {
        register: (name: string, install: () => void) => () => void;
    };
};
export declare const name = "client-ui-git-invariant";
export declare const inject: string[];
export declare const apply: (ctx: Context) => Promise<() => void>;
export {};
