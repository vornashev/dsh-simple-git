window.__ModuleLoader__.load({
	id: "dsh-simple-git",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
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
		//#region \0dsh-css:D:\deepseek-harness-plugins\dsh-simple-git\src\client\GitAction.module.css.mjs
		const css = ".BRME0q_root{display:inline-flex;position:relative}.BRME0q_trigger{border:1px solid var(--dsw-alias-border-l2);min-height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border-radius:6px;align-items:center;gap:5px;padding:0 10px;font-size:12px;display:inline-flex}.BRME0q_trigger:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.BRME0q_trigger:focus-visible{outline:2px solid var(--dsw-static-deepseek-500);outline-offset:2px}.BRME0q_trigger:disabled,.BRME0q_push:disabled,.BRME0q_retry:disabled,.BRME0q_message:disabled{cursor:not-allowed;opacity:.65}.BRME0q_triggerClean{color:var(--dsw-alias-label-tertiary)}.BRME0q_triggerError{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.BRME0q_icon{font-family:var(--dsw-font-mono);font-size:11px}.BRME0q_delta{color:var(--dsw-alias-state-success-primary)}.BRME0q_deleted{color:var(--dsw-alias-state-error-primary)}.BRME0q_menu{z-index:20;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-menu);width:310px;max-width:calc(100vw - 16px);max-height:min(70vh,520px);box-shadow:var(--dsw-shadow-lv3);border-radius:8px;margin:0;padding:7px;position:absolute;top:calc(100% + 6px);right:0;overflow-y:auto}.BRME0q_menu:before{content:\"\";height:7px;position:absolute;top:-7px;left:0;right:0}.BRME0q_menu ul{margin:0;padding:0;list-style:none}.BRME0q_row{grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:5px 6px;font-size:11px;display:grid}.BRME0q_path{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);overflow:hidden}.BRME0q_status,.BRME0q_count{color:var(--dsw-alias-label-tertiary);font-family:var(--dsw-font-mono)}.BRME0q_footer{border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);grid-template-columns:1fr auto;gap:6px;margin-top:5px;padding:7px 6px 2px;font-size:11px;display:grid}.BRME0q_messageLabel{color:var(--dsw-alias-label-secondary);grid-column:1/-1}.BRME0q_message{border:1px solid var(--dsw-alias-border-l2);min-width:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font:inherit;border-radius:4px;grid-column:1/-1;padding:5px;font-size:11px}.BRME0q_push,.BRME0q_retry{color:var(--dsw-static-deepseek-500);cursor:pointer;font:inherit;background:0 0;border:0;margin-left:6px;font-size:11px}.BRME0q_push:focus-visible,.BRME0q_retry:focus-visible,.BRME0q_message:focus-visible{outline:2px solid var(--dsw-static-deepseek-500);outline-offset:1px}.BRME0q_errorDetail{color:var(--dsw-alias-state-error-primary);gap:5px;padding:7px 6px;font-size:11px;line-height:1.35;display:grid}.BRME0q_errorDetail strong{color:var(--dsw-alias-label-primary);font-size:12px}.BRME0q_errorDetail .BRME0q_retry{justify-self:start;margin-left:0;padding:0}.BRME0q_live{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}@media (width<=480px){.BRME0q_menu{width:auto;max-width:none;position:fixed;top:52px;left:8px;right:8px}}@media (prefers-reduced-motion:reduce){.BRME0q_menu{scroll-behavior:auto}}";
		const tagId = "dsh-simple-git/GitAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-simple-git";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var GitAction_module_css_default = {
			"delta": "BRME0q_delta",
			"root": "BRME0q_root",
			"count": "BRME0q_count",
			"messageLabel": "BRME0q_messageLabel",
			"icon": "BRME0q_icon",
			"live": "BRME0q_live",
			"message": "BRME0q_message",
			"push": "BRME0q_push",
			"menu": "BRME0q_menu",
			"trigger": "BRME0q_trigger",
			"retry": "BRME0q_retry",
			"triggerError": "BRME0q_triggerError",
			"row": "BRME0q_row",
			"path": "BRME0q_path",
			"triggerClean": "BRME0q_triggerClean",
			"status": "BRME0q_status",
			"footer": "BRME0q_footer",
			"errorDetail": "BRME0q_errorDetail",
			"deleted": "BRME0q_deleted"
		};
		//#endregion
		//#region src/client/GitAction.tsx
		function isGitFile(value) {
			if (typeof value !== "object" || value === null) return false;
			const file = value;
			const additions = file.additions;
			const deletions = file.deletions;
			return typeof file.path === "string" && typeof file.status === "string" && typeof additions === "number" && typeof deletions === "number" && Number.isFinite(additions) && Number.isFinite(deletions) && additions >= 0 && deletions >= 0;
		}
		function isGitStatus(value) {
			if (typeof value !== "object" || value === null) return false;
			const candidate = value;
			return typeof candidate.workspaceId === "string" && typeof candidate.branch === "string" && typeof candidate.commits === "number" && Number.isFinite(candidate.commits) && candidate.commits >= 0 && typeof candidate.clean === "boolean" && Array.isArray(candidate.files) && candidate.files.every(isGitFile);
		}
		/** Session-header Git control with explicit, keyboard-friendly commit/push actions. */
		function GitAction({ sessionId, useSessions, useWorkspaces, status, commit, push }) {
			const cwd = useSessions((state) => state.byId[sessionId]?.cwd);
			const workspaceId = useWorkspaces((state) => state.items.find((item) => item.path === cwd)?.workspaceId);
			const title = useSessions((state) => state.byId[sessionId]?.displayTitle) ?? "workspace update";
			const [snapshot, setSnapshot] = (0, react.useState)();
			const [open, setOpen] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)();
			const [message, setMessage] = (0, react.useState)("");
			const sequence = (0, react.useRef)(0);
			const triggerRef = (0, react.useRef)(null);
			const panelId = (0, react.useId)();
			const refresh = (0, react.useCallback)(async () => {
				const requestedWorkspace = workspaceId;
				const request = ++sequence.current;
				if (requestedWorkspace === void 0) {
					setSnapshot(void 0);
					setError("This session is not attached to a workspace.");
					return;
				}
				try {
					const next = await status(requestedWorkspace);
					if (request !== sequence.current || requestedWorkspace !== workspaceId) return;
					if (!isGitStatus(next) || next.workspaceId !== requestedWorkspace) throw new Error("Git returned an invalid status response.");
					setSnapshot(next);
					setError(void 0);
				} catch (reason) {
					if (request === sequence.current) setError(reason instanceof Error ? reason.message : String(reason));
				}
			}, [workspaceId, status]);
			(0, react.useEffect)(() => {
				setSnapshot(void 0);
				setError(void 0);
				setMessage("");
				refresh();
			}, [workspaceId, refresh]);
			const totals = (0, react.useMemo)(() => (snapshot?.files ?? []).reduce((result, file) => ({
				additions: result.additions + file.additions,
				deletions: result.deletions + file.deletions
			}), {
				additions: 0,
				deletions: 0
			}), [snapshot?.files]);
			const run = async (operation) => {
				const requestedWorkspace = workspaceId;
				if (requestedWorkspace === void 0 || busy) return;
				const request = ++sequence.current;
				setBusy(true);
				setError(void 0);
				try {
					const next = await operation(requestedWorkspace);
					if (request !== sequence.current || !isGitStatus(next) || next.workspaceId !== requestedWorkspace) return;
					setSnapshot(next);
					setMessage("");
				} catch (reason) {
					if (request === sequence.current) setError(reason instanceof Error ? reason.message : String(reason));
				} finally {
					if (request === sequence.current) setBusy(false);
				}
			};
			const defaultMessage = `chore: ${title} (${snapshot?.files.map((file) => file.path).slice(0, 3).join(", ") ?? "workspace update"})`;
			const commitMessage = message.trim() || defaultMessage;
			const onKeyDown = (event) => {
				if (event.key === "Escape") {
					setOpen(false);
					triggerRef.current?.focus();
				}
			};
			const errorMessage = error ?? (snapshot === void 0 ? "Loading Git status…" : void 0);
			const triggerLabel = error !== void 0 ? "Git error" : snapshot === void 0 ? "Git status loading" : snapshot.clean ? `Git: ${snapshot.commits} unpushed commits` : `Commit all ${snapshot.files.length} changed files`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: GitAction_module_css_default.root,
				onKeyDown,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					ref: triggerRef,
					type: "button",
					className: clsx(GitAction_module_css_default.trigger, snapshot?.clean && GitAction_module_css_default.triggerClean, error !== void 0 && GitAction_module_css_default.triggerError),
					"aria-expanded": open,
					"aria-haspopup": "dialog",
					"aria-controls": panelId,
					"aria-label": triggerLabel,
					"aria-busy": busy,
					onClick: () => {
						setOpen((value) => !value);
					},
					disabled: busy,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: GitAction_module_css_default.icon,
						"aria-hidden": "true",
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
					id: panelId,
					className: GitAction_module_css_default.menu,
					role: "dialog",
					"aria-label": "Git status",
					"aria-modal": "false",
					children: [
						errorMessage !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
									disabled: busy,
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
						}, `${file.status}:${file.path}`)) }),
						snapshot !== void 0 && error === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: GitAction_module_css_default.footer,
							"aria-busy": busy,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: GitAction_module_css_default.messageLabel,
									htmlFor: `${panelId}-message`,
									children: "Commit message"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: `${panelId}-message`,
									className: GitAction_module_css_default.message,
									value: message,
									onChange: (event) => {
										setMessage(event.target.value);
									},
									placeholder: defaultMessage,
									maxLength: 200,
									disabled: busy || snapshot.clean
								}),
								snapshot.clean ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [snapshot.commits, " unpushed commits"] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: GitAction_module_css_default.push,
									onClick: () => {
										run(push);
									},
									disabled: busy || snapshot.commits === 0,
									children: "Push to Git"
								})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: GitAction_module_css_default.push,
									onClick: () => {
										run((id) => commit(id, commitMessage));
									},
									disabled: busy || commitMessage.length === 0,
									children: busy ? "Committing…" : `Commit all ${snapshot.files.length} files`
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: GitAction_module_css_default.live,
							role: "status",
							"aria-live": "polite",
							children: busy ? "Git operation in progress…" : error ?? ""
						})
					]
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
			const call = async (endpoint, payload) => unwrap(await ctx.connection.rpc.call("/simple-git", endpoint, payload));
			const injected = () => ({
				status: (workspaceId) => call("status", { workspaceId }),
				commit: (workspaceId, message) => call("commit", {
					workspaceId,
					message
				}),
				push: (workspaceId) => call("push", { workspaceId })
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