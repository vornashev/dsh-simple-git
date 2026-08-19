# dsh-simple-git

Standalone Git header plugin for DeepSeek Harness.

The plugin shows workspace changes and line deltas, handles loading and Host errors without disappearing, supports an editable commit message, commits all workspace changes only after an explicit click, and offers push only when there are unpushed commits.

## Install from GitHub

Use an immutable tag or commit in production:

```sh
dsh plugin --profile web add github:vornashev/dsh-simple-git#<tag-or-commit>
dsh --profile web
```

For local development:

```sh
dsh plugin --profile web add link:D:/deepseek-harness-plugins/dsh-simple-git
dsh --profile web
```

Restart the Host after changing the plugin. The profile must not load another plugin that owns the same Git UI or route.

## Safety and scope

Commit and push are always explicit user actions. The Host executes Git with `danger-full-access`, so repository hooks can run code with Host permissions; install this plugin only for workspaces you trust. Commit intentionally stages all workspace changes in the MVP. Selective staging, diff browsing, branch management, pull/fetch, reset, revert, and force-push are not included.

The plugin uses the private-to-this-plugin Host Connection `/simple-git` channel, avoiding collisions with other Git integrations.
