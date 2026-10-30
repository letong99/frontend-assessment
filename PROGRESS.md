# Meridian Banking — Implementation Progress

Last updated: 2026-10-30 (Asia/Singapore)

## Current status

- Branch: `feat/meridian-app`
- Stage: Phase 1 — preferences, data boundary, and application shell
- Overall: in progress
- Working goal: complete the smallest accessible, responsive prototype that satisfies the mandatory assessment flow and tests.

## Completed work

### 2026-10-30 — implementation kickoff

- Re-read the project requirements, API/deployment assets, updated delivery plan, and local frontend-delivery skill.
- Classified the work as an assessment prototype: mandatory D/T/TH/E requirements first; production-only controls and optional polish remain deferred.
- Created `feat/meridian-app` from the reviewed plan commit.
- Started the clean-environment baseline.

### 2026-10-30 — Phase 0 baseline completed

- Installed a checksum-verified Node 22 runtime in a task-specific user-local directory because the machine had no existing Node installation.
- Installed the locked dependencies with `npm ci`; the audit reported zero vulnerabilities.
- Confirmed the untouched starter passes lint, strict typechecking, all 3 existing tests, and the production build.
- Confirmed `dist/mockServiceWorker.js` exists and is non-empty after the build.
- No starter behavior or supplied API/mock data was changed during the baseline.

## Decisions

| ID | Decision | Reason | Status |
| --- | --- | --- | --- |
| D-001 | Use one short-lived implementation branch with checkpoint commits after each stable phase. | Reduces branch overhead while preventing code loss and keeping rollback points. | Active |
| D-002 | Do not add optional libraries until the required prototype is working. | The installed stack already covers server state, forms, validation, mocks, and tests. | Active |
| D-003 | Treat `brief/candidate-brief.md` and `brief/api-contract.md` as authoritative over the implementation plan. | Prevents planning drift from changing the supplied contract. | Active |
| D-004 | Use the user-local Node `v22.23.4` via an explicit PATH for project commands. | Meets the required runtime without modifying global shell/system configuration. | Active |

## Problems and investigations

| ID | Problem | Impact | Action / outcome | Status |
| --- | --- | --- | --- | --- |
| P-001 | `node` and `npm` were not available on the current shell PATH. | Baseline commands were initially blocked. | Installed a checksum-verified Node 22 binary in a task-specific user-local directory. | Resolved |
| P-002 | The user-local npm launcher could not find `node` on its first direct invocation. | npm commands require an explicit runtime PATH in this environment. | Prefix project commands with `/Users/wletong/.local/share/codex-node-v22/bin`; no global shell configuration changed. | Resolved |

## Verification evidence

| Check | Result | Notes |
| --- | --- | --- |
| Git worktree before branch creation | Clean | Started from `docs/update-development-plan` at the reviewed plan commit. |
| Node runtime | Failed | `zsh: command not found: node`. |
| User-local Node installation | Passed | Checksum-verified Node `v22.23.4` installed at `/Users/wletong/.local/share/codex-node-v22`. |
| Baseline install/check/build | Passed | Clean install, quality checks, production build, and worker assertion all completed. |
| `npm ci` | Passed | 319 packages installed; 0 vulnerabilities. Deprecation notices are transitive/tooling warnings and do not block the assessment. |
| `npm run check` | Passed | ESLint, TypeScript, and 3 starter tests passed. |
| `npm run build` | Passed | Vite production build completed successfully. |
| Worker artifact | Passed | `dist/mockServiceWorker.js` exists and is approximately 9.4 KB. |

## Next steps

1. Implement and verify the preference/data foundation.
2. Replace the placeholder with the dashboard vertical slice and dashboard tests.
3. Commit and push each stable phase checkpoint.

## Deferred and future work

- CI implementation, E2E tooling, progress bar, discard confirmation, and debug menu remain optional until all mandatory requirements pass.
- Production authentication, authorization, precise ledger money types, audit, monitoring, and resilient rollout are design concerns only; this repository uses a synthetic in-browser mock API.
