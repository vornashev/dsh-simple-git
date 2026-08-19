import { WorkspaceId } from "@deepseek-ai/dsh-workspace";
//#region lib/types/index.js
/** Host half of the independently installable Git header plugin. */
const inject = [
	"connection",
	"shell",
	"workspaceRegistry"
];
function ok(value) {
	return {
		ok: true,
		value
	};
}
function fail(message) {
	return {
		ok: false,
		error: {
			code: "internal",
			message,
			details: {}
		}
	};
}
function gitArg(path) {
	return JSON.stringify(path);
}
function parsePayload(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const value = payload;
	if (typeof value.workspaceId !== "string" || value.message !== void 0 && typeof value.message !== "string") return void 0;
	return value.message === void 0 ? { workspaceId: value.workspaceId } : {
		workspaceId: value.workspaceId,
		message: value.message
	};
}
async function runGit(shell, workdir, command, stdin) {
	const result = await shell.run(shell.resolve({
		command,
		workdir,
		stdin,
		stdoutMaxBytes: 2e6,
		timeoutMs: 3e4,
		sandboxPolicy: {
			mode: "danger-full-access",
			workspaceRoot: workdir
		}
	}));
	if (result.exitCode !== 0) throw new Error(result.stderr.text || `git command failed with exit code ${result.exitCode ?? "null"}`);
	return result.stdout.text;
}
async function status(shell, workspaceId, path) {
	const root = gitArg(path);
	const [branch, porcelain, diff, commits] = await Promise.all([
		runGit(shell, path, `git -C ${root} branch --show-current`),
		runGit(shell, path, `git -C ${root} status --porcelain=v1`),
		runGit(shell, path, `git -C ${root} diff HEAD --numstat`),
		runGit(shell, path, `git -C ${root} rev-list --count HEAD --not --remotes`)
	]);
	const stats = /* @__PURE__ */ new Map();
	for (const line of diff.trim().split(/\r?\n/)) {
		const [additions, deletions, file] = line.split("	");
		if (file !== void 0) stats.set(file, [Number(additions) || 0, Number(deletions) || 0]);
	}
	const files = porcelain.trim() === "" ? [] : porcelain.trim().split(/\r?\n/).map((line) => {
		const file = line.slice(3);
		const [additions, deletions] = stats.get(file) ?? [0, 0];
		return {
			path: file,
			additions,
			deletions,
			status: line.slice(0, 2).trim() || "?"
		};
	});
	return {
		workspaceId,
		branch: branch.trim(),
		files,
		commits: Number(commits.trim()) || 0,
		clean: files.length === 0
	};
}
/** Register the plugin-owned Git RPC channel on the Host Connection service. */
function apply(ctx) {
	ctx.connection.rpc.handle("/git", async (endpoint, rawPayload) => {
		const payload = parsePayload(rawPayload);
		if (payload === void 0) return fail("Git request payload is invalid.");
		const workspace = ctx.workspaceRegistry.get(WorkspaceId(payload.workspaceId));
		if (workspace === void 0) return fail(`Workspace ${payload.workspaceId} was not found.`);
		try {
			if (endpoint === "status") return ok(await status(ctx.shell, payload.workspaceId, workspace.path));
			if (endpoint === "commit") {
				if (payload.message === void 0 || payload.message.trim() === "") return fail("Commit message is required.");
				const root = gitArg(workspace.path);
				await runGit(ctx.shell, workspace.path, `git -C ${root} add -A`);
				await runGit(ctx.shell, workspace.path, `git -C ${root} commit -F -`, `${payload.message.trim()}\n`);
				return ok(await status(ctx.shell, payload.workspaceId, workspace.path));
			}
			if (endpoint === "push") {
				await runGit(ctx.shell, workspace.path, `git -C ${rootArg(workspace.path)} push`);
				return ok(await status(ctx.shell, payload.workspaceId, workspace.path));
			}
			return fail(`Unknown Git endpoint ${endpoint}.`);
		} catch (error) {
			return {
				ok: false,
				error: {
					code: "internal",
					message: error instanceof Error ? error.message : String(error),
					details: {}
				}
			};
		}
	}, { authority: "trusted-host" });
}
function rootArg(path) {
	return gitArg(path);
}
//#endregion
export { apply, inject };
