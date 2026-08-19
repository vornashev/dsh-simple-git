# dsh-simple-git

Standalone Git header plugin for DeepSeek Harness.

The bundle adds a Git control to the conversation header. It displays workspace changes and line deltas, shows loading and Host errors without disappearing, commits all workspace changes only after an explicit click, and offers push after the working tree is clean.

## Install

```sh
dsh plugin --profile web add github:vornashev/dsh-simple-git#master
dsh --profile web
```

The plugin uses the Host Connection `/git` channel and runs Git commands with the explicit `danger-full-access` policy because commit and push are user-triggered workspace operations.
