# dsh-simple-git

Standalone Git header plugin for DeepSeek Harness.

The plugin shows workspace changes and line deltas, handles loading and Host errors without disappearing, supports an editable commit message, commits all workspace changes only after an explicit click, and offers push only when there are unpushed commits.

## What's new in 0.3.0

Version 0.3.0 adds a complete first-use workflow for workspaces that do not have their own Git repository:

- the header control uses a neutral **Set up Git** state instead of presenting the folder as an error;
- the workspace can be initialized directly from the status panel;
- an existing GitHub repository can be connected as `origin` with an HTTPS or SSH URL;
- the first push configures upstream automatically, while later pushes use the existing upstream;
- repository-root checks prevent a nested workspace from staging or committing files from an enclosing repository;
- expected Git setup states are detected through stable exit codes, so localized Git diagnostics do not break the workflow.

Version 0.3.1 is the installable patch release: generated artifacts are shipped in the repository, so GitHub installation does not need to run package build scripts.
## Initialize and connect a workspace

A workspace that is not yet a Git repository is treated as a normal first-use state rather than an error. Open the neutral **Set up Git** control to follow this flow:

1. **Initialize repository** runs `git init` in the workspace.
2. **Connect GitHub** adds an existing GitHub repository as remote `origin`.
3. **Commit all** stages and commits the workspace changes after an explicit click.
4. **Push to Git** performs the first `git push -u origin HEAD`; later pushes use the configured upstream.

Connect GitHub accepts standard `https://github.com/owner/repository[.git]` and `git@github.com:owner/repository[.git]` URLs. It does not accept embedded credentials, overwrite an existing `origin`, or create a repository through the GitHub API.

## Install from GitHub

Use an immutable tag or commit in production:

```sh
dsh plugin --profile web add github:vornashev/dsh-simple-git#v0.3.1
dsh --profile web
```

For local development:

```sh
dsh plugin --profile web add link:D:/deepseek-harness-plugins/dsh-simple-git
dsh --profile web
```

Restart the Host after changing the plugin. The profile must not load another plugin that owns the same Git UI or route.

## Safety and scope

Initialize, connect, commit, and push are always explicit user actions. The Host executes Git with `danger-full-access`, so repository hooks can run code with Host permissions; install this plugin only for workspaces you trust. Commit intentionally stages all workspace changes in the MVP. Selective staging, diff browsing, branch management, pull/fetch, reset, revert, force-push, GitHub OAuth, and GitHub repository creation are not included.

The plugin uses the private-to-this-plugin Host Connection `/simple-git` channel, avoiding collisions with other Git integrations.
