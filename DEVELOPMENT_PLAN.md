# Meridian Banking Frontend — Delivery Plan

## 1. Purpose and expected outcome

Deliver a public, production-built single-page banking demo for the signed-in customer Ava Chen. The page must work end to end without a separately deployed backend and must demonstrate:

- a responsive account dashboard;
- recent transaction search;
- an accessible three-step money-transfer flow;
- client- and server-side failure handling;
- four visual combinations: light/dark and Retail/Premium;
- meaningful behavioral tests; and
- a repeatable quality and deployment process.

The final handoff consists of a public source repository, a live HTTPS URL, a project README, green automated checks, and code the developer can explain and modify during the follow-up interview.

This document distinguishes the deliberately small assessment solution from decisions that would need broader review in a real banking product.

## 2. Assessment constraints and success criteria

### Scope

Required: dashboard, transfer flow, validation, loading/empty/error states, responsive behavior, accessibility, themes, at least three specified tests, deployment, and a replacement README.

Optional only after the required path is complete: daily-limit progress bar, dirty-form discard confirmation, debug scenario menu, balance hiding, deep link, end-to-end test, and CI.

Explicitly out of scope: authentication, other navigation destinations, charts, notifications, payee management, transaction details, currencies other than SGD, and localization. Cards, Payments, and Insights remain visible but disabled.

### Assessment criteria translated into delivery gates

| Criterion | Evidence expected |
| --- | --- |
| Functional behavior | Reviewer can load the public URL, inspect accounts, search transactions, and complete or retry a transfer. |
| Engineering | Strict TypeScript, typed API layer, TanStack Query for server state, React Hook Form and Zod for one-source validation, no `any`. |
| State completeness | Loading skeletons, empty states, dashboard error/retry, form errors, submission state, API error, and success state all work. |
| Accessibility | Keyboard-complete dialog and payee selection, focus management, labels/error associations, announcements, visible focus, 44 px mobile targets, AA contrast. |
| Responsive design | No page overflow at 360–390 px; mobile sheet and fixed CTA; desktop dialog and 300 px right rail. |
| Testing | Required three behavioral tests plus focused validation, state, accessibility, and formatting coverage. |
| Operational quality | `npm run check` and `npm run build` pass; no normal-path console errors; service worker is present and active in deployment. |
| Communication | README explains structure, trade-offs, state demonstrations, tests, AI use, omissions, local run steps, and deployed URL. |

## 3. Expected application behavior

### Dashboard

1. On startup, fetch customer, accounts, and the newest eight transactions concurrently.
2. Preserve the eventual page geometry with skeletons while the roughly 500 ms mock responses are pending.
3. Render the exact greeting `Good evening, Ava`, logo, disabled decorative navigation, segment switch, theme control, and `AC` avatar.
4. Calculate total available from checking and savings only: `SGD 17,120.55`; never store this derived total separately.
5. Render all three account cards. The credit card remains excluded from available funds and reads `Amount due` with `-SGD 420.30`.
6. Render the latest eight transactions newest first. Incoming amounts get a leading `+` and positive styling; outgoing amounts use normal text; pending rows get a chip.
7. Filter the eight displayed transactions locally by description or category, case-insensitively. Show the match count and clear affordance. A zero result shows the specified empty-search copy and button.
8. Show the remaining daily transfer limit (`limit - transferredToday`) in the right rail. A progress bar is optional, but inexpensive and useful if required work is already stable.
9. If any essential dashboard request fails, replace the dashboard data area with the specified error and a Retry action that refetches all dashboard queries.

### Transfer dialog state machine

`closed -> recipient -> amount -> review -> submitting -> success`

Submission failure returns to `review` with all values intact. Back navigation retains values. Closing returns focus to the opener; a later reopen should start a clean transfer unless a deliberate draft policy is implemented.

#### Step 1 — recipient

- Load the four saved payees from the API when the transfer UI is needed.
- Permit keyboard search and single selection.
- Alternatively disclose fields for a new recipient: name, exactly eight account digits, and bank.
- The request must contain exactly one of `payeeId` or `recipient`.
- Provide a real empty-payee state; `Send to someone new` must remain usable.

#### Step 2 — amount

- Offer checking and savings only; never allow the credit card.
- Accept a required amount of at least SGD 1.00 and at most two decimals.
- Validate against the currently selected account balance and current remaining daily limit.
- Supply quick amounts 50, 100, 250, and 500 and a decimal mobile keyboard.
- Show available balance, remaining limit, and an optional note with live `n/50` count.
- Validate on blur and Continue; focus the first invalid input.

#### Step 3 — review and send

- Display source account, recipient, masked account, bank, amount, zero fee, total, and note.
- Back returns to the amount form without losing data.
- Confirm issues one POST only. It reads `Sending…` and is disabled while pending.
- A successful response shows amount, recipient, reference, arrival copy, and `Back to dashboard`.
- Before returning to the dashboard, refresh customer, accounts, and transactions so total, source balance, transaction list, and daily limit agree.
- A failed POST stays on review, preserves form state, displays the specified `role="alert"` message, and permits retry. Server field errors are mapped to their corresponding form controls.

### Theme and segment behavior

- Before React paints, set `data-theme` and `data-segment` on `<html>`.
- First theme visit follows `prefers-color-scheme`; explicit choices persist in `localStorage`.
- Customer segment supplies the first segment default unless an existing local preference overrides it.
- Segment changes brand variables only. Components use the supplied CSS tokens and contain no hard-coded colors.
- All controls expose state through a label or `aria-pressed`; reduced-motion preferences are respected.

### Responsive and accessibility behavior

- Desktop at 1024 px and above: centered content up to 1200 px, 24 px gutters, main area plus a 300 px limit rail, and a roughly 520 px modal.
- Mobile down to 360 px: one column, 16 px gutters, no page-level horizontal overflow, a fixed bottom transfer CTA above the safe area, and a full-screen transfer sheet.
- Account cards may form a deliberately contained horizontal scroller; the page itself may not scroll sideways.
- Dialog behavior includes an accessible name, modal semantics, initial focus, focus trap, Escape and close-button support, background interaction blocking, and opener-focus restoration.
- Every input is visibly labeled. Errors have stable IDs referenced by `aria-describedby`; invalid controls use `aria-invalid`. Success uses an `aria-live` region.

## 4. Provided backend resources

The assessment backend is MSW, not a remote service. The same handlers are used by the browser, Vitest, and the optional local Node server. State is in memory and resets on page refresh; this is expected demo behavior.

### Existing assets that must be reused

| Resource | Purpose / constraint |
| --- | --- |
| `src/api/client.ts` | Base-path-aware typed fetch wrapper; throws structured `ApiError`. Components should not call `fetch` directly. |
| `src/api/types.ts` | Customer, account, transaction, payee, transfer, request, response, and error types. |
| `mock-api/handlers.ts` | Canonical API behavior and mutable in-memory state. Do not modify to make UI/tests pass. |
| `mock-api/db.json` | Seed customer, 3 accounts, 15 transactions, and 4 payees. Do not alter. |
| `src/mocks/browser.ts` | Browser worker used locally and in the deployed static site. |
| `src/test/setup.ts` | Node MSW server; resets seed data before each test and handlers after each test. |
| `public/mockServiceWorker.js` | Must be copied into `dist/` and served at the correct base path. |
| `mock-api/server.mjs` | Optional port 4010 server for curl/manual contract inspection; not required in deployment. |
| `src/lib/format.ts` | Required SGD and Singapore-time formatters. |
| `brief/design-tokens.css` | Complete theme, segment, spacing, typography, focus, layout, and status token set. |

### API inventory

| Method and path | Frontend use | Important behavior |
| --- | --- | --- |
| `GET /api/customer` | Name, default segment, daily limit, amount transferred today | Segment override is local only. |
| `GET /api/accounts` | Cards, derived total, eligible source accounts, balance validation | Credit balance is negative and cannot fund a transfer. |
| `GET /api/transactions?limit=8` | Dashboard list and post-transfer refresh | Returns newest first and a pre-limit `total`. |
| `GET /api/payees` | Saved-recipient selection | Returns masked account numbers only and most-recently-used order. |
| `POST /api/transfers` | Execute transfer | On 201, debits account, creates transaction, increments daily usage, and returns transfer/account/limit data. Not idempotent. |
| `GET /api/health` | Starter-only connectivity check | Remove from the finished UI/data flow. |
| `POST /api/__reset` | Development utility | Not part of product UI. |

All responses normally take about 500 ms. GET hooks support `scenario=error`, `scenario=empty`, and a capped `delay`; a note containing `#fail` forces transfer failure without moving money. Tests should prefer per-test MSW overrides over product logic tied to these hooks.

### Backend error contract

The fetch helper throws `ApiError` containing HTTP status, code, message, optional `fields`, and optional metadata. The form must handle validation errors, insufficient funds, exceeded limits, unknown payees/accounts, and a general internal failure. Dynamic amount errors should use the backend or schema's current balance/limit, never hard-coded sample figures.

## 5. Proposed frontend architecture

Keep the structure feature-oriented but modest enough to explain in an interview:

```text
src/
  api/
    client.ts                 # provided transport/error abstraction
    types.ts                  # provided wire types
    queries.ts                # query keys and typed GET functions
    transfers.ts              # typed mutation function
  components/
    ui/                       # Button, Dialog, FieldError, Skeleton
    Header.tsx
  features/
    dashboard/                # balance, accounts, transactions, daily limit
    transfer/                 # dialog, steps, schema, request mapping
    preferences/              # theme and segment persistence
  lib/
    format.ts                 # provided formatters
  test/
    setup.ts                  # provided MSW lifecycle
    render.tsx                # test QueryClient/provider helper
  App.tsx
  main.tsx
  index.css
```

### State ownership

| State | Owner | Rationale |
| --- | --- | --- |
| Customer/accounts/transactions/payees | TanStack Query | Remote data needs loading, error, caching, refetch, and invalidation semantics. |
| Transfer mutation | TanStack Query mutation | Prevent duplicate submits and centralize success/error callbacks. |
| Transfer fields/errors | React Hook Form + Zod | One validation definition and reliable focus/error mapping. |
| Current dialog step/open state | Transfer dialog component | Ephemeral workflow state, not server state. |
| Search text | Transaction/payee feature component | Small, local, immediately derived filter. |
| Total balance/filter results/remaining limit | Derived during render | Avoid divergent duplicate state. |
| Theme and segment | `<html>` attributes + localStorage | Must apply before paint and survive reload. |

### Query and mutation policy

- Use stable query keys: `['customer']`, `['accounts']`, `['transactions', { limit: 8 }]`, and `['payees']`.
- Start the three dashboard hooks in the same render so requests run concurrently.
- Treat dashboard data as a coordinated view: a failure in an essential query enters the common dashboard error state.
- Fetch payees lazily when the dialog opens, unless prefetching proves measurably useful.
- On transfer success, invalidate/refetch customer, accounts, and transactions. This is the simplest correctness-first choice for the assessment and demonstrates server-state ownership. The mutation response can seed account/customer cache first for instant feedback, but that optimization is not necessary.
- Do not retry the transfer mutation automatically because the endpoint is non-idempotent. Keep confirm locked for the entire request.

### Form model

Use one discriminated model for `saved` versus `new` recipient, plus source account, amount input, and note. Build a Zod schema factory using current deposit accounts and remaining limit so the same rules serve blur and Continue validation. Preserve the amount as an input string until validation to distinguish blank, malformed, and valid numeric values; map it to a number only for the API request.

Map `ApiError.fields` keys such as `recipient.accountNumber` and `amount` into React Hook Form errors. Also show a general alert for a submission-level error.

### Dialog implementation decision

For this assessment, prefer the native `<dialog>` element with a small, tested focus-restoration wrapper if browser targets support it. If cross-browser testing reveals focus-trap gaps, add a focused accessible primitive rather than hand-building modal semantics. Whichever option is chosen must be documented and keyboard tested.

## 6. Decision points

### Decisions appropriate for this assessment

| Decision | Recommended choice | Trade-off |
| --- | --- | --- |
| Transaction search | Filter the eight loaded rows in memory | Exactly matches the displayed-list requirement and avoids request churn; it does not search all 15 server records. State this in README. |
| Post-transfer consistency | Invalidate and await the three affected queries | More requests than manual cache patching, but lower risk of inconsistent derived data. |
| Routing | No router | The brief is one page and one dialog; routing adds no required value. |
| Global client store | None | Query cache, form state, preferences, and local UI state cover all needs. |
| Component library | Avoid a broad UI framework; consider one narrowly scoped accessible dialog primitive only if needed | Keeps bundle and explanation surface small while not compromising modal accessibility. |
| Styling | Plain CSS using supplied tokens and feature-oriented class names | Fast, transparent, and directly satisfies token constraints. |
| Optional work | CI first, then one E2E happy path or discard confirmation | CI protects submission quality; visual extras must not delay required behavior. |
| Deployment | Netlify, Vercel, or Cloudflare Pages from `main` | All support the required static Vite output and HTTPS with minimal configuration. |

### Decisions required in a real production banking environment

These must not be silently inferred by a frontend developer:

| Area | Decision owners / questions |
| --- | --- |
| Authentication and session | Security/product: OIDC provider, MFA/step-up authentication for transfers, session timeout, refresh/revocation, device trust. |
| Authorization | Backend/security: customer/account/payee entitlements and object-level authorization; frontend checks are never authoritative. |
| Transfer safety | Payments/backend: idempotency keys, replay prevention, confirmation challenge, duplicate detection, transaction limits, cooling-off periods, immutable audit trail. |
| Money representation | Backend/platform: integer minor units or decimal type, currency metadata, rounding policy, fees, exchange rates, locale rules. JavaScript floats are inadequate as the source of truth. |
| Real-time consistency | Architecture: polling, event stream, or mutation response guarantees; handling pending/posted/reversed transfers and concurrent balance changes. |
| Compliance | Legal/risk: AML/KYC, sanctions screening, confirmation-of-payee, consent wording, retention, right-to-access/delete constraints, regulatory receipts. |
| Privacy | Security/legal: masking, sensitive-field logging rules, analytics redaction, CSP, third-party scripts, data residency, encryption in transit/at rest. |
| API contract | Frontend/backend: OpenAPI ownership, versioning, generated types, error taxonomy, rate limits, timeouts, retry policy, backward compatibility. |
| Availability | SRE/product: SLOs, maintenance/degraded states, circuit breaking, regional failover, offline behavior, reconciliation after ambiguous timeouts. |
| Accessibility | Design/accessibility: supported AT/browser matrix, WCAG version/level, independent audit, remediation ownership. |
| Browser/device support | Product: minimum Safari/Chrome/Firefox/Edge/iOS/Android versions and embedded-browser policy. |
| Observability | SRE/security: correlation IDs, privacy-safe logs, web vitals, traces, error reporting, alerts, fraud telemetry, audit versus diagnostic data. |
| Content/localization | Product/content: locales, time zones, plural rules, legal copy, RTL, currency coverage. |
| Feature delivery | Product/platform: feature flags, cohorting, kill switch, experiment constraints, rollback and data compatibility. |

### Real development-environment decisions

- Pin Node and package-manager versions and enforce the lockfile in local and CI environments.
- Decide whether local development uses contract mocks, a shared integration API, or ephemeral backend environments. Ideally support all three behind typed configuration.
- Generate API clients/types from the authoritative specification and detect contract drift in CI.
- Store secrets in a managed vault and CI environment; no `.env` secrets in source control or client bundles.
- Provide documented bootstrap scripts, editor settings, formatter/linter hooks, and a known-good container or dev environment if platform variance is costly.
- Define environment promotion (`dev -> test -> staging -> production`) with configuration validation and production-like staging data that is synthetic and privacy-safe.
- Decide dependency-update cadence, vulnerability policy, browser-test matrix, test-data ownership, and local HTTPS needs.

## 7. Test suite design

Use a test pyramid weighted toward behavior. Tests interact by role/label/text, not component internals or CSS selectors.

### Unit tests

- Existing money/date formatting, including negative money and Singapore timezone.
- Validation boundaries: blank, 0.99, 1.00, two versus three decimals, exact balance, over balance, exact limit, over limit, and note lengths 50/51.
- Pure derivations: deposit total, eligible source accounts, remaining limit, transaction filtering, signed display amount.
- Request mapping: saved payee and new recipient are mutually exclusive and empty notes are omitted or normalized consistently.

### Component/integration tests with Vitest, Testing Library, and MSW

Required acceptance tests:

1. Enter an amount over the selected balance; the dynamic error is shown and no POST occurs.
2. Complete a successful transfer; success details appear, then dashboard total/balance/transaction/remaining limit update.
3. Override a dashboard GET to fail; specified error appears; restore/replace response and Retry loads the dashboard.

Additional high-value tests:

- concurrent loading resolves from skeleton to expected dashboard values;
- transaction search matches description and category ignoring case, reports count, handles no results, and clears;
- credit account never appears as a transfer source;
- new-recipient validation and error associations work;
- transfer failure via MSW keeps review data, announces the error, permits retry, and never shows success;
- double click while pending causes one POST;
- Back retains values;
- payee empty/error states remain actionable;
- close via Escape/close control restores opener focus;
- preference toggles update root attributes and persistence;
- key controls and messages have expected accessible roles/names.

Each test receives a fresh QueryClient with retries disabled and the existing MSW database reset. Avoid shared mutable test state and fake implementation-specific delays.

### End-to-end tests

Optional for the assessment; required in a real delivery pipeline. With Playwright or equivalent, cover:

- desktop happy-path transfer against the production build;
- mobile 390 px transfer and fixed CTA;
- hard reload, worker activation, and API interception on the hosted preview;
- keyboard-only modal traversal and focus return;
- four theme/segment combinations with targeted visual snapshots;
- dashboard and submission failures using a safe non-production test mechanism.

### Non-functional checks

- Automated accessibility scan plus manual keyboard and screen-reader smoke test.
- Responsive checks at 360, 390, 640, 1024, and 1280 px; test long labels and zoom to 200%.
- Lighthouse/web-vitals budget for performance, accessibility, and best practices.
- Dependency audit, secret scan, and static analysis in the production pipeline.
- Validate no console errors, no unintended horizontal overflow, no theme flash, and no duplicate network submission.

## 8. Branching and collaboration design

### Assessment repository

Use lightweight trunk-based development:

- `main` is always buildable and is the deployment branch.
- Short-lived branches use `feat/dashboard`, `feat/transfer`, `test/transfer-flow`, or `docs/readme` naming.
- Rebase/update from `main`, open small PRs, require green CI, then squash merge.
- Conventional commit-style subjects are helpful but not mandatory. Never combine unrelated refactors with functional work.
- Tag the submitted build, for example `submission-v1.0.0`, after production verification.

For a solo take-home, direct commits to `main` are acceptable only if each commit remains coherent and checks run before push; short-lived branches better demonstrate a professional workflow without GitFlow overhead.

### Production team

Prefer trunk-based development with protected `main`, required reviews/CODEOWNERS for security-sensitive areas, required status checks, signed commits if mandated, and release tags. Use feature flags for incomplete or risky work rather than long-running branches. Hotfixes branch from the production tag and merge back immediately. Release branches are justified only when multiple supported versions or regulated release windows require them.

## 9. CI/CD pipeline design

### Pull-request pipeline

1. Checkout with locked dependencies and Node 22.
2. `npm ci` with dependency caching keyed by lockfile.
3. Run lint and typecheck in parallel where the CI system permits.
4. Run Vitest once with a coverage report; enforce agreed thresholds only after a meaningful baseline exists.
5. Run `npm run build` and assert `dist/mockServiceWorker.js` exists.
6. Upload test and build artifacts; deploy an isolated preview.
7. Run E2E/accessibility smoke tests against the preview if added.
8. Report a single required status to the PR and prevent merge on failure.

### Main-branch deployment

1. Repeat clean install and all quality gates; never deploy an unverified artifact rebuilt differently downstream.
2. Build once and attach artifact metadata (commit SHA, Node version, lockfile hash).
3. Deploy the exact `dist/` artifact to the static host over HTTPS.
4. Run smoke checks: page load, worker registered, `/api/customer` intercepted, transfer succeeds, refresh still loads.
5. Promote/alias the verified deployment to production.
6. Record URL and commit SHA; create/tag the assessment release.

### Rollback and production extensions

For the assessment, rollback means immediately repointing to the previous immutable static deployment. A real product additionally needs approval gates, environment protection, signed/SBOM artifacts, SAST/SCA/secret scanning, DAST as appropriate, canary or blue-green rollout, monitored error and web-vital thresholds, automated rollback criteria, and a documented incident/change-management trail.

### Suggested GitHub Actions shape

- `quality` job: lint + typecheck.
- `test` job: unit/integration tests and reports.
- `build` job: production build and worker assertion, dependent on quality/test or run concurrently with final aggregate gate.
- `preview` job: provider-managed PR preview, if available.
- `smoke` job: hosted artifact verification.
- `deploy-production` job: protected `main` only, consuming the tested artifact.

Do not expose deployment tokens to pull requests from untrusted forks. Pin third-party actions to trusted major versions or immutable SHAs according to organizational policy.

## 10. End-to-end development plan

### Phase 0 — baseline and requirement traceability

- Run the starter locally and baseline `npm run check` and `npm run build`.
- Create a D1–D8, T1–T8, TH1–TH3, and E1–E6 checklist mapped to components and tests.
- Confirm supported browsers and hosting choice; record assessment assumptions.
- Keep mock handlers/data unchanged.

Exit: baseline is green and every mandatory requirement has an implementation and verification owner/location.

### Phase 1 — foundations

- Add pre-paint preference initialization.
- Define query keys/functions and a reusable test render helper.
- Add shared primitives for buttons, fields, errors, skeletons, and dialog behavior.
- Establish responsive shell, global focus styles, reduced-motion rule, and token-only styling.

Exit: the application shell is responsive, theme/segment switches persist without flash, and API/query boundaries are typed.

### Phase 2 — dashboard vertical slice

- Fetch the three dashboard resources concurrently.
- Build loading, loaded, and coordinated error/retry states.
- Add header, total, account cards, daily limit, transactions, pending/in/out presentation, and local search.
- Verify 360/390/1024/1280 layouts and exact required copy.

Exit: D1–D8 and dashboard-related theme/accessibility checks pass.

### Phase 3 — transfer recipient and amount

- Implement modal/sheet semantics and workflow state.
- Fetch/search/select payees and implement new-recipient disclosure.
- Define the single Zod validation source integrated with React Hook Form.
- Add deposit-account selection, quick amounts, dynamic balance/limit checks, note count, blur/Continue validation, and first-error focus.

Exit: T1–T3, validation requirements, keyboard selection, and mobile input behavior pass.

### Phase 4 — review, submission, and synchronization

- Build review summary and Back behavior.
- Map the form model into the typed request.
- Implement non-retrying mutation, duplicate-submit guard, API field/general errors, and accessible success screen.
- Invalidate and await affected dashboard queries, then return to a visibly updated dashboard.

Exit: T4–T8 pass, including failure retry and one-request-only behavior.

### Phase 5 — automated verification

- Implement the three mandated integration tests first.
- Add high-risk validation, failure preservation, search, theme, and focus tests.
- Add one production-build E2E happy path if time remains.
- Run full checks repeatedly from a clean install environment.

Exit: deterministic green suite, no console errors, and all traceability entries have evidence.

### Phase 6 — CI, deployment, and live verification

- Add the PR quality/build workflow.
- Deploy `dist/` to the selected provider with Node 22.
- Confirm the service worker file, scope, HTTPS activation, base-path handling, and browser API interception.
- Complete a live transfer, verify balance/transaction/limit refresh, hard reload, mobile layout, normal Safari/Chrome behavior, and absence of console errors.

Exit: public URL works without a local server and rollback target is known.

### Phase 7 — documentation and submission

- Replace README using the required outline: URL/run steps, structure, decisions, loading/empty/error demonstrations, tests, AI use, and known omissions.
- Document why search is local and why affected queries are invalidated after a transfer.
- Explicitly identify AI-assisted work and two or three outputs that were changed/rejected/fixed.
- Prepare a short walkthrough: architecture, schema/form flow, confirm-to-refresh trace, and two deliberate trade-offs.
- Tag the verified commit and submit repository plus deployed URL.

Exit: another developer can run, review, test, deploy, and explain the application from the repository alone.

## 11. Definition of done

- All mandatory requirement IDs are implemented and manually verified.
- Exact specified copy and provided formatters are used.
- `npm ci`, `npm run check`, and `npm run build` succeed on Node 22.
- The three required behavioral tests pass; high-risk validation and failure paths have coverage.
- No `any`, direct component `fetch`, duplicated validation, hard-coded component colors, or copied server data in local state.
- Keyboard, focus, labels, announcements, contrast, reduced motion, mobile targets, and responsive layouts are verified.
- Confirm cannot create duplicate transfers; failures never show success and retain entered data.
- Dashboard state is consistent after success without a page reload.
- `dist/mockServiceWorker.js` exists and the deployed worker intercepts API requests over HTTPS.
- The live page works at 360/390 px and desktop widths with no page overflow or normal-path console errors.
- README and AI-use disclosure are complete, URLs are correct, and known issues are honest.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Service worker starts late or has the wrong scope/base | Keep startup awaited before render, use `BASE_URL`, assert the worker in build, and smoke-test the hosted artifact. |
| Duplicate transfer from repeated confirmation | Disable during mutation, send once, and never automatically retry a non-idempotent POST; test request count. |
| Client validation becomes stale after a prior transfer | Derive constraints from current query data and refetch affected resources after success; still map authoritative server errors. |
| Form values disappear between steps or on failure | One form owner across the workflow; test Back and failed submission explicitly. |
| Modal looks correct but fails keyboard use | Use native/tested dialog semantics and manually test focus entry, containment, Escape, background blocking, and restoration. |
| Theme flashes on reload | Inline/pre-React preference initialization on `<html>` before application render. |
| Optional polish consumes the time box | Complete requirement traceability and required tests first; stop at a stable explainable core. |
| Mock behavior is mistaken for production architecture | State clearly that MSW and refresh-reset data are assessment fixtures; retain the production decisions in this plan/README. |
