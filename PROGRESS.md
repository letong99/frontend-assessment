# Meridian Banking — Implementation Progress

Last updated: 2026-10-30 (Asia/Singapore)

## Current status

- Branch: `feat/meridian-app`
- Stage: Phase 5 — assessment hardening and delivery readiness
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

### 2026-10-30 — Phases 1–2 foundation and dashboard completed

- Added typed React Query functions for customer, accounts, transactions, payees, and transfer creation. Every read accepts the query cancellation signal; transfer mutations do not retry.
- Implemented persistent retail/premium and light/dark preferences using semantic CSS tokens. A small guarded pre-paint script applies stored/system theme before React starts to reduce theme flash.
- Replaced the starter screen with the responsive Meridian dashboard: customer greeting, deposit total, all account cards, exactly eight recent transactions, local description search, transfer-limit summary, theme/segment controls, loading skeletons, empty results, and retryable API errors.
- Added dashboard and preference component tests without changing the supplied API contract or mock data.

### 2026-10-30 — Phases 3–4 transfer workflow integrated

- Implemented the native modal transfer flow as recipient, amount, review, and success states while keeping a single React Hook Form instance across the workflow.
- Added saved-payee search/selection and new-recipient entry, account selection, amount/note validation, review editing, server field-error mapping, duplicate-submit protection, and the required general send-failure message.
- Centralized contextual Zod rules for positive/two-decimal amounts, available account balance, remaining daily limit, recipient fields, and the 50-character note limit.
- Made a successful `POST /api/transfers` immediately authoritative for the success screen, then explicitly refetched customer, accounts, and the eight-transaction dashboard query before enabling return to the dashboard. Refresh failures keep the confirmed success visible and offer a retry.
- Added integration coverage proving an over-balance amount never sends a request and a successful transfer updates the account balance, total, daily limit, and newest transaction.
- Added explicit Testing Library cleanup to the Vitest setup because test globals are disabled; this prevents rendered applications and native dialogs leaking between tests.
- Completed the full quality gate and production artifact check after integration.

### 2026-10-30 — assessment hardening completed

- Audited the integrated implementation against every required D/T/TH/E item and reviewed the transfer, responsive CSS, accessibility, and tests independently.
- Moved the duplicate-submit lock before the first asynchronous validation boundary, so rapid double activation cannot create two POST requests.
- Removed an empty-account loading deadlock; an empty deposit-account result now reaches an explicit, non-actionable transfer state instead of waiting forever.
- Established one native saved-payee radio group, linked its validation message, connected the new-recipient disclosure, and added deterministic focus movement to each step and the success heading.
- Prevented Escape from bypassing the post-success dashboard synchronization gate, and made the success view scroll safely on short, zoomed, landscape, and mobile viewports.
- Preserved the final desktop grid in the loading skeleton, changed narrow account cards to a true one-column layout, and improved the daily-limit landmark name.
- Removed the fixed light browser theme colour and scoped feature eyebrow styles so dark mode and feature CSS do not leak across boundaries.
- Expanded integration coverage for failed-send value retention and retry, duplicate activation, payee-load retry, new-recipient masking/request shape, and validation accessibility. A later evidence pass brings the suite to 23 passing tests.
- Attempted interactive desktop/mobile browser verification. The local production server and worker loaded, but the host denied Chrome's required macOS Mach-port access; visual, console, focus, and overflow checks remain a named manual step.

### 2026-10-30 — delivery handoff prepared

- Replaced the starter README with the assessment handoff: requirement coverage, local commands, architecture, deliberate trade-offs, state handling, test evidence, AI disclosure, and known gaps.
- Added a least-privilege GitHub Actions quality gate for pushes and pull requests. It uses Node 22, locked installation, `npm run check`, the production build, a non-empty worker assertion, concurrency cancellation, and a seven-day `dist` artifact.
- Added executable focus assertions for the Recipient, Amount, and success headings to supplement the browser checklist.
- Kept deployment separate from CI: no hosting provider, production environment, or `main` merge was assumed from the feature branch.

### 2026-10-30 — behavioral evidence expanded

- Added dialog tests for both close paths and opener-focus restoration, arrow-key saved-payee selection, and backend field-error visibility/linkage.
- Added explicit account/transaction/payee empty-result coverage and confirmed new-recipient entry remains available with no saved payees.
- Exercised a post-201 dashboard refresh failure: the success state remains authoritative, Escape cannot expose stale data, Retry synchronizes the dashboard, and return becomes available afterward.
- Refined the dashboard error boundary so a background refetch failure retains previously loaded data; the full-page dashboard error is reserved for missing initial data.
- Re-ran the complete gate: ESLint, strict TypeScript, all 23 tests in 5 files, production build, worker assertion, and diff whitespace check pass.

### 2026-10-30 — API-derived customer greeting

- Removed the literal customer name from the dashboard greeting. The fixed salutation remains requirement copy, while the first name now comes from `GET /api/customer` through the existing typed React Query boundary.
- Added a regression test that overrides the customer response with `Mei Lin` and proves the heading renders `Good evening, Mei` rather than the seed customer name.

### 2026-10-30 — idle-refetch blank state fixed

- Reproduced the protocol condition behind the header-only page: without browser MSW interception, Vite answers `/api/customer` with `index.html`, HTTP 200, and `text/html`.
- Corrected `apiFetch` so successful endpoint responses must be top-level JSON objects. HTML, invalid JSON, `null`, arrays, and error envelopes with a 2xx status now reject as typed `ApiError` code `INVALID_RESPONSE`; malformed non-2xx responses remain typed `UNKNOWN` API errors.
- Made the dashboard render state exhaustive: pending data shows skeletons, complete data shows content, and any settled state missing required data shows the Retry error. A background refetch error with prior data keeps that data visible.
- Added four API-boundary unit tests plus dashboard tests for initial HTML fallback/recovery and the exact loaded-dashboard background-refetch failure.

### 2026-10-30 — backend collaboration safeguards documented

- Kept every supplied endpoint, request type, mock handler and seed record unchanged.
- Expanded the production appendix with a joint frontend/backend transfer-safety contract covering responsibility boundaries, authoritative validation, atomic database processing, idempotency and replay behavior, exact money, authentication/authorization, ambiguous outcomes, audit/outbox/reconciliation, and multi-instance correctness.
- Added production acceptance scenarios for concurrent funds/limit contention, duplicate requests, lost responses, stale client data, unauthorized access, injected partial failures, money boundaries and exactly-once audit/outbox effects.
- Recorded the open decisions and accountable disciplines that must close them before a real transfer API is integrated.

### 2026-10-30 — complete transaction history pagination

- Preserved the assessment-required concurrent `limit=8` initial request and eight newest rows.
- Added a lazy `View all 15 transactions` path that uses the supplied endpoint's existing `limit=50` capability, then pages the full supplied history in groups of eight without changing the endpoint, handler, or seed data.
- Added accessible Previous/Next controls, a live visible-range summary, page reset on search changes, narrow-screen wrapping, and full-history search after expansion.
- Kept the recent list usable if history loading fails and added an inline Retry state.
- Changed post-transfer synchronization to refetch every active transaction query variant so both recent and expanded views remain authoritative.
- Added behavioral coverage for lazy loading, page boundaries, older-record discovery/search, page reset, cache isolation, and degraded history loading.

## Decisions

| ID | Decision | Reason | Status |
| --- | --- | --- | --- |
| D-001 | Use one short-lived implementation branch with checkpoint commits after each stable phase. | Reduces branch overhead while preventing code loss and keeping rollback points. | Active |
| D-002 | Do not add optional libraries until the required prototype is working. | The installed stack already covers server state, forms, validation, mocks, and tests. | Active |
| D-003 | Treat `brief/candidate-brief.md` and `brief/api-contract.md` as authoritative over the implementation plan. | Prevents planning drift from changing the supplied contract. | Active |
| D-004 | Use the user-local Node `v22.23.4` via an explicit PATH for project commands. | Meets the required runtime without modifying global shell/system configuration. | Active |
| D-005 | Use React Query as the only server-state boundary, with feature-scoped query keys and cancellation-aware fetchers. | Keeps API lifecycle/error handling consistent and makes post-mutation synchronization explicit. | Active |
| D-006 | Keep transaction filtering local to the eight records returned by `GET /api/transactions?limit=8`. | This satisfied the original assessment scope before full-history browsing was requested. | Superseded by D-022 |
| D-007 | Let an explicit stored theme/segment preference override defaults; otherwise use the system theme and API customer segment. | Preserves user intent while supplying sensible first-visit behavior. | Active |
| D-008 | Use the platform `<dialog>` element instead of adding a dialog dependency. | The required modal semantics, Escape handling, backdrop, and focus containment are available without increasing the assessment bundle. | Active |
| D-009 | Use one React Hook Form instance and one contextual Zod rule source across all transfer steps. | Prevents validation drift and retains user values when moving backward to edit. | Active |
| D-010 | Treat HTTP 201 as transfer success, then model dashboard synchronization as a separate recoverable state. | A refresh failure must never imply a completed transfer failed or invite a duplicate payment. | Active |
| D-011 | Disable return from success until the first dashboard synchronization attempt completes. | Prevents showing knowingly stale financial data while still providing a retry path if synchronization fails. | Active |
| D-012 | Add explicit `cleanup()` in shared test teardown. | Vitest runs with globals disabled, so implicit Testing Library cleanup was not registered and DOM/dialog state leaked between tests. | Active |
| D-013 | Acquire the duplicate-submit lock synchronously before validation. | Validation is asynchronous; locking afterward leaves a same-tick race that can send money twice. | Active |
| D-014 | Use a true single-column account list below 640 px. | This follows D8 literally and avoids making horizontal scrolling part of the core mobile interaction. | Active |
| D-015 | Keep server field messages in a dedicated review-alert list while also mapping known paths into React Hook Form. | Nested and unknown backend messages remain visible on Review, and known messages remain linked to their fields when the user goes Back. | Active |
| D-016 | Keep CI provider-neutral and deployment as an explicit later stage. | Quality checks can run on every branch/PR, while publishing requires a selected hosting target and controlled main-branch merge. | Active |
| D-017 | Reserve the full dashboard error screen for queries without usable data. | React Query retains prior data after a background refetch failure; keeping it avoids unnecessary layout replacement while the transfer dialog owns synchronization recovery. | Active |
| D-018 | Derive customer identity shown in the dashboard from the customer API response. | The seed currently contains Ava, but personalization must follow server data rather than a component literal. | Active |
| D-019 | Enforce the supplied API's top-level JSON-object contract at the shared fetch boundary. | Vite's SPA fallback is HTTP 200 HTML; accepting a parse failure as successful `null` data corrupts query state silently. | Active |
| D-020 | Make dashboard rendering exhaustive based on pending state and complete required data. | No settled query-state combination should render only the header; prior data remains useful during a background failure. | Active |
| D-021 | Keep the supplied assessment endpoints unchanged and document production transaction safety/authentication as a backend-collaboration contract. | Frontend locking is a UX safeguard; atomicity, authoritative validation, authorization, idempotency and reconciliation require an agreed backend boundary. | Active |
| D-022 | Preserve the required eight-row initial query, then lazy-load up to 50 records and paginate locally in groups of eight. | It exposes the complete 15-record supplied history, avoids a nested-scroll accessibility trap, keeps initial loading bounded, and requires no endpoint changes. | Active |

## Problems and investigations

| ID | Problem | Impact | Action / outcome | Status |
| --- | --- | --- | --- | --- |
| P-001 | `node` and `npm` were not available on the current shell PATH. | Baseline commands were initially blocked. | Installed a checksum-verified Node 22 binary in a task-specific user-local directory. | Resolved |
| P-002 | The user-local npm launcher could not find `node` on its first direct invocation. | npm commands require an explicit runtime PATH in this environment. | Prefix project commands with `/Users/wletong/.local/share/codex-node-v22/bin`; no global shell configuration changed. | Resolved |
| P-003 | The browser `matchMedia` API is absent in JSDOM. | Initial preference tests could fail before rendering. | Guarded both the pre-paint script and runtime preference initialization while preserving browser system-theme behavior. | Resolved |
| P-004 | React compiler lint rejected a broad React Hook Form `watch()` subscription. | The transfer slice failed lint despite correct runtime behavior. | Replaced it with `useWatch({ control })` and documented why the complete default-value shape is safe. | Resolved |
| P-005 | `Intl.NumberFormat` emits a non-breaking space in SGD labels, while Testing Library text matching normalizes whitespace. | Exact money assertions failed despite correct UI output. | Asserted raw text content or the actual accessible name returned by the formatter. | Resolved |
| P-006 | Rendered apps accumulated across integration tests because Testing Library auto-cleanup depends on global `afterEach`, which is disabled here. | The second test interacted with the first app and native dialog. | Registered explicit cleanup in `src/test/setup.ts`; the two-test sequence and full suite now pass. | Resolved |
| P-007 | The submission lock was set after awaiting form validation. | Two rapid activations could both reach `POST /api/transfers`. | Moved the lock before the first await and added a delayed-response double-activation regression test. | Resolved |
| P-008 | The transfer's loading predicate treated a missing selected account as a pending query. | An empty accounts response could display `Preparing your transfer…` forever. | Loading now reflects query state only; the amount step owns the explicit no-deposit-account state. | Resolved |
| P-009 | Chrome could not launch through the available browser bridge because the host denied macOS Mach-port access. | Automated interactive responsive/keyboard/console evidence could not be collected in this environment. | Verified the local server and worker via HTTP, kept the limitation explicit, and left the browser matrix for a normal local browser or deployed URL. Temporary profiles were moved to Trash. | Open |
| P-010 | An induced post-success refetch failure initially replaced the populated dashboard with its initial-load error underneath the success dialog. | It created a second alert and discarded useful stale data during a recoverable background failure. | The dashboard now renders its full error only when a failed query has no data; the transfer warning and retry remain responsible for synchronization recovery. | Resolved |
| P-011 | The dashboard greeting embedded `Ava` directly in JSX. | A different signed-in customer response would still display the seed customer's name. | Passed the typed `Customer` object into the dashboard content and rendered `customer.firstName`; added a non-Ava API regression test. | Resolved |
| P-012 | After an idle tab refetched, an un-intercepted `/api/*` request could receive Vite's 200 HTML fallback; JSON parsing was swallowed and `null` cached as successful data. | The dashboard matched neither loading, error, nor content and displayed only its header. | Reject invalid successful responses at `apiFetch`, preserve last good query data on refetch failure, and route missing settled data to Retry. | Resolved |
| P-013 | The assessment mock has no authentication, durable atomic transaction or idempotency; its contract permits the same request to move money twice. | It must never be represented as safe for real financial processing, and frontend controls cannot close that trust gap. | Left the assessment implementation unchanged and captured owners, proposed production semantics, processing invariants and joint acceptance tests in `DEVELOPMENT_PLAN.md` §13. | Deferred to real backend collaboration |
| P-014 | `GET /api/transactions` accepts at most 50 rows and has no cursor/offset parameter. | The complete supplied 15-record dataset is available, but a production history over 50 records cannot be fully browsed with this contract. | Use the existing maximum only for the assessment; design cursor pagination and server-side search with the backend team before production integration. | Deferred to real backend collaboration |

## Verification evidence

| Check | Result | Notes |
| --- | --- | --- |
| Git worktree before branch creation | Clean | Started from `docs/update-development-plan` at the reviewed plan commit. |
| Node runtime | Failed | `zsh: command not found: node`. |
| User-local Node installation | Passed | Checksum-verified Node `v22.23.4` installed at `/Users/wletong/.local/share/codex-node-v22`. |
| Baseline install/check/build | Passed | Clean install, quality checks, production build, and worker assertion all completed. |
| `npm ci` | Passed | 319 packages installed; 0 vulnerabilities. Deprecation notices are transitive/tooling warnings and do not block the assessment. |
| Baseline `npm run check` | Passed | ESLint, TypeScript, and 3 starter tests passed before implementation. |
| Focused transfer integration | Passed | All 11 App scenarios pass, including required flows, focus/keyboard semantics, backend mapping, duplicate protection, empty payees, and refresh recovery. |
| Hardened `npm run check` | Passed | ESLint, strict TypeScript, and all 32 tests across 6 files passed. |
| Transaction-history pagination | Passed | Focused tests prove lazy cache separation, all 15 supplied records across two pages, oldest-record access, older-record search/page reset, disabled page bounds, history-load recovery, and post-transfer refresh of the active 50-row cache. |
| API-derived greeting | Passed | A customer override with first name `Mei` renders `Good evening, Mei` and no Ava heading. |
| Invalid 2xx response handling | Passed | Unit tests reject HTML, `null`, and error envelopes returned with HTTP 200; malformed HTTP failures remain typed. |
| Idle/focus refetch regression | Passed | Initial HTML fallback reaches Retry and recovers; background HTML refetch retains the previously loaded dashboard. |
| Hardened `npm run build` | Passed | Vite production build transformed 420 modules and completed successfully. Rollup only reported non-blocking annotation warnings from Zod dependencies. |
| Worker artifact | Passed | `dist/mockServiceWorker.js` exists and is non-empty (9,666 bytes). |
| Local production HTTP smoke | Passed | Vite served the built page at `127.0.0.1:4173`; the HTML and 9,666-byte mock worker were reachable. |
| Interactive browser matrix | Blocked | Chrome launch failed at the host sandbox boundary; this is not evidence of an application failure. |

## Next steps

1. Confirm the pushed GitHub Actions run and review the feature branch before merge.
2. Run a normal-browser desktop/mobile/keyboard matrix when a usable browser or deployed URL is available.
3. Complete deployment after the repository/hosting target and main-branch merge are confirmed.

## Deferred and future work

- E2E tooling, progress bar, discard confirmation, and debug menu remain optional; they are not needed for the assessment core.
- Live deployment and its real-browser smoke test remain pending. A production build is ready, but this feature branch has intentionally not been merged to `main` or connected to a hosting project.
- Production authentication, authorization, precise ledger money types, audit, monitoring, and resilient rollout are design concerns only; this repository uses a synthetic in-browser mock API.
