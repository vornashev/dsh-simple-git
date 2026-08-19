window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-git",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-css:D:\deepseek-harness\packages\client\ui-git\src\client\GitAction.module.css.mjs
		const css = "._5OaJya_root{display:inline-flex;position:relative}._5OaJya_trigger{border:1px solid var(--dsw-alias-border-l2);min-height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border-radius:6px;align-items:center;gap:5px;padding:0 8px;font-size:12px;display:inline-flex}._5OaJya_trigger:hover,._5OaJya_trigger:focus-visible{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3);outline:none}._5OaJya_triggerClean{color:var(--dsw-alias-label-tertiary)}._5OaJya_triggerError{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}._5OaJya_icon{font-family:var(--dsw-font-mono);font-size:11px}._5OaJya_delta{color:var(--dsw-alias-state-success-primary)}._5OaJya_deleted{color:var(--dsw-alias-state-error-primary)}._5OaJya_menu{z-index:20;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-menu);width:310px;box-shadow:var(--dsw-shadow-lv3);border-radius:8px;margin:0;padding:7px;list-style:none;position:absolute;top:calc(100% + 6px);right:0}._5OaJya_menu:before{content:\"\";height:7px;position:absolute;top:-7px;left:0;right:0}._5OaJya_row{grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:5px 6px;font-size:11px;display:grid}._5OaJya_path{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);overflow:hidden}._5OaJya_status,._5OaJya_count{color:var(--dsw-alias-label-tertiary);font-family:var(--dsw-font-mono)}._5OaJya_footer{border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);margin-top:5px;padding:7px 6px 2px;font-size:11px}._5OaJya_push,._5OaJya_retry{color:var(--dsw-static-deepseek-500);cursor:pointer;font:inherit;background:0 0;border:0;margin-left:6px;font-size:11px}._5OaJya_errorDetail{color:var(--dsw-alias-state-error-primary);gap:5px;padding:7px 6px;font-size:11px;line-height:1.35;display:grid}._5OaJya_errorDetail strong{color:var(--dsw-alias-label-primary);font-size:12px}._5OaJya_errorDetail ._5OaJya_retry{justify-self:start;margin-left:0;padding:0}";
		const tagId = "@deepseek-ai/dsh-client-ui-git/GitAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-git";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var GitAction_module_css_default = {
			"trigger": "_5OaJya_trigger",
			"menu": "_5OaJya_menu",
			"root": "_5OaJya_root",
			"count": "_5OaJya_count",
			"retry": "_5OaJya_retry",
			"row": "_5OaJya_row",
			"errorDetail": "_5OaJya_errorDetail",
			"push": "_5OaJya_push",
			"triggerError": "_5OaJya_triggerError",
			"path": "_5OaJya_path",
			"delta": "_5OaJya_delta",
			"icon": "_5OaJya_icon",
			"triggerClean": "_5OaJya_triggerClean",
			"status": "_5OaJya_status",
			"footer": "_5OaJya_footer",
			"deleted": "_5OaJya_deleted"
		};
		//#endregion
		//#region src/client/GitAction.tsx
		function isGitStatus(value) {
			if (typeof value !== "object" || value === null) return false;
			const candidate = value;
			return typeof candidate.branch === "string" && typeof candidate.commits === "number" && Array.isArray(candidate.files);
		}
		/** Session-header Git control with hover disclosure and explicit commit/push actions. */
		function GitAction({ sessionId, useSessions, useWorkspaces, status, commit, push }) {
			const cwd = useSessions((state) => state.byId[sessionId]?.cwd);
			const workspaceId = useWorkspaces((state) => state.items.find((item) => item.path === cwd)?.workspaceId);
			const title = useSessions((state) => state.byId[sessionId]?.displayTitle) ?? "workspace update";
			const [snapshot, setSnapshot] = (0, react.useState)();
			const [open, setOpen] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)();
			const refresh = (0, react.useCallback)(async () => {
				if (workspaceId === void 0) {
					setError("This session is not attached to a workspace.");
					return;
				}
				try {
					const next = await status(workspaceId);
					if (isGitStatus(next)) {
						setSnapshot(next);
						setError(void 0);
					} else setError("Git returned an invalid status response.");
				} catch (reason) {
					setError(reason instanceof Error ? reason.message : String(reason));
				}
			}, [workspaceId, status]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			const totals = (0, react.useMemo)(() => (snapshot?.files ?? []).reduce((result, file) => ({
				additions: result.additions + file.additions,
				deletions: result.deletions + file.deletions
			}), {
				additions: 0,
				deletions: 0
			}), [snapshot?.files]);
			const run = async (operation) => {
				setBusy(true);
				setError(void 0);
				try {
					setSnapshot(await operation());
				} catch (reason) {
					setError(reason instanceof Error ? reason.message : String(reason));
				} finally {
					setBusy(false);
				}
			};
			const message = `chore: ${title} (${snapshot?.files.map((file) => file.path).slice(0, 3).join(", ") ?? "workspace update"})`;
			const onKeyDown = (event) => {
				if (event.key === "Escape") setOpen(false);
			};
			const errorMessage = error ?? (snapshot === void 0 ? "Loading Git status…" : void 0);
			const triggerLabel = error !== void 0 ? "Git error" : snapshot === void 0 ? "Git…" : snapshot.clean ? `Git: ${snapshot.commits} unpushed commits` : `Commit ${snapshot.files.length} files`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: GitAction_module_css_default.root,
				onMouseEnter: () => {
					setOpen(true);
				},
				onMouseLeave: () => {
					setOpen(false);
				},
				onKeyDown,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: clsx(GitAction_module_css_default.trigger, snapshot?.clean && GitAction_module_css_default.triggerClean, error !== void 0 && GitAction_module_css_default.triggerError),
					"aria-expanded": open,
					"aria-label": triggerLabel,
					onClick: () => {
						setOpen((value) => !value);
					},
					disabled: busy,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: GitAction_module_css_default.icon,
						children: error !== void 0 ? "!" : snapshot === void 0 ? "…" : snapshot.clean ? "✓" : "↥"
					}), error !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "Git error" }) : snapshot === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "Git…" }) : snapshot.clean ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [snapshot.commits, " unpushed commits"] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [snapshot.files.length, " files"] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: GitAction_module_css_default.delta,
							children: ["+", totals.additions]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: GitAction_module_css_default.deleted,
							children: ["−", totals.deletions]
						})
					] })]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: GitAction_module_css_default.menu,
					role: "dialog",
					"aria-label": "Git status",
					children: [errorMessage !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: GitAction_module_css_default.errorDetail,
						role: error !== void 0 ? "alert" : "status",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: error !== void 0 ? "Git is unavailable" : "Checking Git status" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: errorMessage }),
							error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: GitAction_module_css_default.retry,
								onClick: () => {
									refresh();
								},
								children: "Retry"
							})
						]
					}) : snapshot?.files.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: GitAction_module_css_default.footer,
						children: [
							"Working tree clean on ",
							snapshot.branch || "detached HEAD",
							"."
						]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: snapshot?.files.map((file) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
						className: GitAction_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: GitAction_module_css_default.path,
								title: file.path,
								children: file.path
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: GitAction_module_css_default.status,
								children: file.status
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: GitAction_module_css_default.count,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", {
										className: GitAction_module_css_default.delta,
										children: ["+", file.additions]
									}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", {
										className: GitAction_module_css_default.deleted,
										children: ["−", file.deletions]
									})
								]
							})
						]
					}, `${file.status}:${file.path}`)) }), snapshot !== void 0 && error === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: GitAction_module_css_default.footer,
						children: snapshot.clean ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [snapshot.commits, " unpushed commits"] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: GitAction_module_css_default.push,
							onClick: () => {
								run(() => push(workspaceId));
							},
							children: "Push to Git"
						})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: GitAction_module_css_default.push,
							onClick: () => {
								run(() => commit(workspaceId, message));
							},
							children: "Commit changes"
						})
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		const inject = ["connection", "slots"];
		function unwrap(result) {
			if (!result.ok) throw new Error(result.error.message);
			return result.value;
		}
		function apply(ctx) {
			const call = async (endpoint, payload) => unwrap(await ctx.connection.rpc.call("/git", endpoint, payload));
			const injected = () => ({
				status: (workspaceId) => call("git.status", { workspaceId }),
				commit: (workspaceId, message) => call("git.commit", {
					workspaceId,
					message
				}),
				push: (workspaceId) => call("git.push", { workspaceId })
			});
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "git",
				order: 10,
				inject: injected
			}, GitAction));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map