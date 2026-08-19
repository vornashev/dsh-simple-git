import { WorkspaceId } from "@deepseek-ai/dsh-workspace";
//#region lib/types/index.js
/** Host half of the independently installable Git header plugin. */
const MAX_COMMIT_MESSAGE = 200;
const locks = /* @__PURE__ */ new Map();
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
function parsePayload(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const value = payload;
	if (typeof value.workspaceId !== "string" || value.message !== void 0 && typeof value.message !== "string") return void 0;
	return value.message === void 0 ? { workspaceId: value.workspaceId } : {
		workspaceId: value.workspaceId,
		message: value.message
	};
}
function sanitizeError(error) {
	return (error instanceof Error ? error.message : String(error)).replace(/([a-z][a-z0-9+.-]*:\/\/)([^\s/@]+):([^\s/@]+)@/gi, "$1[credentials]@").slice(0, 1e3);
}
async function runGit(shell, workdir, command, stdin, signal) {
	const result = await shell.run(shell.resolve({
		command,
		workdir,
		stdin,
		signal,
		stdoutMaxBytes: 2e6,
		timeoutMs: 3e4,
		sandboxPolicy: {
			mode: "danger-full-access",
			workspaceRoot: workdir
		}
	}));
	if (result.exitCode !== 0) throw new Error(sanitizeError(result.stderr.text || `git command failed with exit code ${result.exitCode ?? "null"}`));
	return result.stdout.text;
}
async function hasHead(shell, path, signal) {
	try {
		await runGit(shell, path, "git rev-parse --verify HEAD", void 0, signal);
		return true;
	} catch {
		return false;
	}
}
function parseNumstat(value) {
	const stats = /* @__PURE__ */ new Map();
	for (const record of value.split("\0")) {
		if (record === "") continue;
		const [rawAdditions, rawDeletions, path] = record.split("	");
		const additions = Number(rawAdditions);
		const deletions = Number(rawDeletions);
		if (path !== void 0 && path !== "" && Number.isFinite(additions) && Number.isFinite(deletions)) stats.set(path, [additions, deletions]);
	}
	return stats;
}
function parseStatus(value, stats) {
	const records = value.split("\0");
	const files = [];
	for (let index = 0; index < records.length; index += 1) {
		const record = records[index];
		if (record === "") continue;
		const status = record.slice(0, 2).trim() || "?";
		const path = record.slice(3);
		const [additions, deletions] = stats.get(path) ?? [0, 0];
		files.push({
			path,
			additions,
			deletions,
			status
		});
		if (/^[RC]/.test(status) && records[index + 1] !== void 0) index += 1;
	}
	return files;
}
async function status(shell, workspaceId, path, signal) {
	const head = await hasHead(shell, path, signal);
	const [branch, porcelain, diff, commits] = await Promise.all([
		runGit(shell, path, "git branch --show-current", void 0, signal),
		runGit(shell, path, "git status --porcelain=v1 -z", void 0, signal),
		head ? runGit(shell, path, "git diff HEAD --numstat -z", void 0, signal) : Promise.resolve(""),
		head ? runGit(shell, path, "git rev-list --count HEAD --not --remotes", void 0, signal) : Promise.resolve("0")
	]);
	const files = parseStatus(porcelain, parseNumstat(diff));
	return {
		workspaceId,
		branch: branch.trim(),
		files,
		commits: Number(commits.trim()) || 0,
		clean: files.length === 0
	};
}
async function withWorkspaceLock(workspaceId, action) {
	const current = (locks.get(workspaceId) ?? Promise.resolve()).catch(() => void 0).then(action);
	const completion = current.then(() => void 0, () => void 0);
	locks.set(workspaceId, completion);
	try {
		return await current;
	} finally {
		if (locks.get(workspaceId) === completion) locks.delete(workspaceId);
	}
}
const inject = [
	"connection",
	"shell",
	"workspaceRegistry"
];
/** Register the plugin-owned Git RPC channel on the Host Connection service. */
function apply(ctx) {
	ctx.connection.rpc.handle("/simple-git", async (endpoint, rawPayload, signal) => {
		const payload = parsePayload(rawPayload);
		if (payload === void 0) return fail("Git request payload is invalid.");
		const workspace = ctx.workspaceRegistry.get(WorkspaceId(payload.workspaceId));
		if (workspace === void 0) return fail(`Workspace ${payload.workspaceId} was not found.`);
		return withWorkspaceLock(payload.workspaceId, async () => {
			try {
				if (endpoint === "status") return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal));
				if (endpoint === "commit") {
					const message = payload.message?.trim() ?? "";
					if (message.length === 0) return fail("Commit message is required.");
					if (message.length > MAX_COMMIT_MESSAGE) return fail(`Commit message must be ${MAX_COMMIT_MESSAGE} characters or fewer.`);
					await runGit(ctx.shell, workspace.path, "git add -A", void 0, signal);
					await runGit(ctx.shell, workspace.path, "git commit -F -", `${message}\n`, signal);
					return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal));
				}
				if (endpoint === "push") {
					await runGit(ctx.shell, workspace.path, "git push", void 0, signal);
					return ok(await status(ctx.shell, payload.workspaceId, workspace.path, signal));
				}
				return fail(`Unknown Git endpoint ${endpoint}.`);
			} catch (error) {
				return fail(sanitizeError(error));
			}
		});
	}, { authority: "trusted-host" });
}
//#endregion
export { apply, inject, parseNumstat, parseStatus, sanitizeError };
