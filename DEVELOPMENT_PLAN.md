# Meridian Banking Frontend — Implementation and Delivery Plan

## 1. Plan purpose and authority

This is an **assessment implementation plan**, not a claim that the starter is a production banking system. The target is a public, production-built static demo that works end to end without a separately deployed backend and can be explained and modified confidently in the follow-up interview.

Authoritative sources, in order:

1. `brief/candidate-brief.md` for scope, behavior, exact copy, and assessment requirements;
2. `wireframes/wireframe.md` for layout and interaction shape;
3. `brief/api-contract.md` and the provided API types/handlers for data and error behavior;
4. `DEPLOYMENT.md` for the deployed MSW setup;
5. this plan for implementation decisions and sequencing.

If this plan drifts from an authoritative source, update the plan rather than changing the mock contract or seed data.

### Expected outcome

The final handoff must include:

- a responsive account dashboard for Ava Chen;
- recent-transaction search;
- an accessible recipient → amount → review → send flow;
- complete required loading, empty, validation, failure, retry, and success states;
- light/dark and Retail/Premium combinations;
- the three mandatory behavioral tests;
- a public HTTPS deployment that uses the browser MSW worker;
- a replacement README, including honest AI-use disclosure; and
- code small and clear enough to trace and change live without AI assistance.

## 2. Critical path, priorities, and time box

The expected effort is 8–12 hours. Required behavior wins over architecture polish and optional tooling.

### Priority order

| Priority | Work | Delivery rule |
| --- | --- | --- |
| P0 — required | D1–D8, T1–T8, validation, TH1–TH3, E1–E6, required tests, deployment, README | Must be complete before optional work starts. |
| P1 — recommended if stable | Minimal GitHub Actions check, unobtrusive deployed-state demo hook, one extra failure/focus test | Add only if P0 is green and explainable. |
| P2 — optional | Playwright E2E, discard confirmation, progress bar, debug menu, balance hiding, visual snapshots | Cut first when the time box is under pressure. |
| Production-only | Formal coverage thresholds, SAST/DAST/SBOM, RUM/SLOs, canary rollout, generated clients | Design is documented later; do not implement for this assessment. |

At roughly hour 8, freeze optional work and close mandatory requirement, accessibility, test, deployment, and README gaps. A smaller complete app is preferable to a larger app with unexplained abstractions.

### Working budget

| Activity | Budget |
| --- | ---: |
| Baseline, decisions, and traceability | 0.5 h |
| Preferences, data layer, shell | 1.0 h |
| Dashboard plus dashboard tests | 1.5–2.0 h |
| Recipient, amount, and validation | 2.0–2.5 h |
| Review, send, refresh, and transfer tests | 1.5–2.0 h |
| Accessibility, responsive, and regression hardening | 1.0–1.5 h |
| Deployment, README, and interview rehearsal | 1.0–1.5 h |
| Contingency | 0.5–1.0 h |

## 3. Scope and requirement traceability

### Scope

Required: dashboard, transfer flow, one-source validation, required states, responsive layout, accessibility, light/dark and Retail/Premium preferences, three specified tests, a working deployment, and README replacement.

Optional: daily-limit progress bar, dirty-form discard confirmation, debug scenario menu, balance hiding, a third segment, `#transfer` deep link, one E2E test, and CI implementation.

Out of scope: login, Cards/Payments/Insights pages, charts, notifications, payee management, transaction detail, currencies other than SGD, and translations. Decorative navigation stays visibly and semantically unavailable.

### Requirement-to-evidence map

Status starts as `planned` and should move to `verified` only with the stated evidence.

| IDs | Implementation area | Evidence | Phase | Status |
| --- | --- | --- | --- | --- |
| D1, D7 | Concurrent dashboard queries, stable skeleton, coordinated error and Retry | Loading assertion plus first-call-fails/Retry-succeeds integration test | 2 | Planned |
| D2–D5 | Header, total, accounts, signed transactions, pending chip | Dashboard integration assertions and exact-copy/manual visual check | 2 | Planned |
| D6 | Local filtering of the loaded eight rows | Description/category, count, no-result, and clear test | 2 | Planned |
| D8 | Mobile layout and fixed CTA | Manual 360/390 px overflow and target-size check | 2, 5 | Planned |
| T1, T8 | Native modal/sheet, stepper, focus, keyboard, announcements | Keyboard/focus integration checks plus manual keyboard/screen-reader smoke | 3, 5 | Planned |
| T2 | Saved-payee radio group/search and new-recipient disclosure | Selection, filtered-empty, no-payee, and validation behavior | 3 | Planned |
| T3 + validation | Deposit source, decimal amount, chips, balance/limit, note | Boundary tests including over-balance/no POST | 3 | Planned |
| T4 | Review summary and value retention | Back/forward retention test and manual copy check | 4 | Planned |
| T5, T7 | Guarded POST, sending state, success and recoverable failure | Success and failure integration tests; exact request count | 4 | Planned |
| T6 | Awaited customer/accounts/transactions refresh | Required success test after Back to dashboard | 4 | Planned |
| TH1–TH3 | Pre-paint root attributes, persistence, token-only styling | Preference tests plus four-combination manual check | 1, 5 | Planned |
| E1–E3 | Strict types, TanStack Query, RHF + Zod | Type/lint checks and code review | Continuous | Planned |
| E4 | Three mandated behavior tests | Green Vitest results | 2–4 | Planned |
| E5 | Clean quality/build and console | `npm run check`, `npm run build`, manual console check | 5 | Planned |
| E6 | Public deployment without local server | Hosted MSW and transfer smoke test | 6 | Planned |

## 4. Product behavior contract

### 4.1 Dashboard

1. Start `GET /api/customer`, `GET /api/accounts`, and `GET /api/transactions?limit=8` in the same render.
2. Show one coordinated skeleton layout until all essential initial data is available. Skeleton shapes reserve the final geometry, are hidden from assistive technology, and sit beneath one quiet loading status.
3. Show the Meridian identity, exact greeting, segment switch, theme toggle, AC avatar, Overview as current, and disabled decorative destinations.
4. Derive total available from non-credit accounts. Never store it separately.
5. Render all account cards; exclude credit from available funds and label it `Amount due`.
6. Render the newest eight transactions. Humanize category text for display while searching raw description/category case-insensitively.
7. Filter the eight loaded rows locally. For a non-empty search, expose the match count and a clear action. A filtered zero uses the exact required no-match state.
8. When the response `total` exceeds the eight loaded rows, offer `View all` without delaying the required initial dashboard. Lazily request the endpoint maximum (`limit=50`), then search and paginate the loaded history in groups of eight with an announced visible range and bounded Previous/Next controls.
9. Show remaining daily limit derived from customer data. The textual value is required for post-transfer visibility; the visual progress bar remains optional.
10. If any essential initial dashboard query fails, show the common required error. Retry refetches all three queries concurrently. A later history-load failure is local to the transaction component and preserves the initial eight rows.

#### Empty and degraded states

- Zero transactions with no active search: show a neutral `No recent transactions yet.` state.
- Expanded-history request failure: retain the initial eight rows and show `We couldn't load all transactions.` with Retry.
- Zero saved payees: keep `Send to someone new` available.
- Payee-query failure: show an inline Retry inside the dialog without failing the dashboard; new-recipient entry remains available.
- No eligible deposit account: prevent continuing to Amount and explain that no transfer source is available.
- An empty accounts response may show an account empty state and must disable transfer rather than crash. The seeded normal path remains the primary acceptance path.

### 4.2 Exact copy and formatting

| Area | Required text |
| --- | --- |
| Greeting | `Good evening, Ava` |
| Total | `Total available` / `Across 2 deposit accounts` |
| Primary action | `New transfer` |
| Transactions | `Recent transactions` / `Search transactions` |
| Transaction status | `Pending` |
| Search empty | `No transactions match your search.` / `Clear search` |
| Dashboard failure | `We couldn't load your dashboard.` / `Retry` |
| Dialog and steps | `New transfer` / `Who are you sending to?` / `How much?` / `Check the details` |
| Stepper | `Recipient` / `Amount` / `Review` |
| Actions | `Continue` / `Back` / `Confirm transfer` / `Sending…` |
| Generic send failure | `Something went wrong. Your money hasn't left your account. Try again.` |
| Success | `Transfer sent` / `The money should arrive within minutes.` / `Back to dashboard` |

Formatting rules:

- Use `formatMoney` everywhere; tests compare its output because `Intl` inserts a non-breaking space.
- Incoming amount: prefix `+` to `formatMoney(amount)`.
- Outgoing amount: pass `-amount` to `formatMoney`.
- Use `formatShortDate` for every transaction date; it is fixed to Singapore time.
- Use tabular numerals for prominent money and account values.
- Do not hand-format currency, dates, or masked values.

### 4.3 Transfer workflow

The explicit state model separates the irreversible POST from dashboard synchronization:

`closed -> recipient -> amount -> review -> submitting -> success[syncing] -> success[ready | sync-error]`

`success[sync-error] -> success[syncing]` on dashboard-refresh Retry; this transition never returns to submitting.

A rejected POST returns to `review` with all values intact. A 201 response enters success immediately and can never return to Review. Back navigation retains values. Closing before submission resets the draft; reopening after close or success starts a clean recipient step. Dirty-form confirmation is optional and not part of the initial implementation.

Escape and the close control work in recipient, amount, and idle review states. As a deliberate safety exception to T1, suppress dismissal only while the non-idempotent POST is in flight, with visible `Sending…` progress. After 201 there is no POST retry path.

#### Recipient

- Fetch payees only while the dialog is open.
- Use a semantic radio group for saved payees; do not preselect a recipient.
- Search saved payees by name or bank without breaking native keyboard behavior.
- `Send to someone new` is a disclosure in the same step, not a route.
- For a new recipient, use labeled name, 8-digit account-number, and bank-name inputs.
- Use a bank text input because no authoritative bank catalogue is provided; do not invent select options from seed data.
- Continue validates the active saved/new branch only.

#### Amount

- Default the source to the first eligible deposit account; never include the credit card.
- Keep amount as text until its decimal shape and business rules pass.
- Use `inputMode="decimal"` for Amount. Keep the account-number field as `type="text"` with `inputMode="numeric"` so leading zeros survive.
- Quick values 50, 100, 250, and 500 set the same form field and trigger the same validation source.
- Show the selected balance and current remaining limit.
- The optional note displays a live `n/50` counter.
- Validate on blur and Continue; Continue focuses the first invalid control.

#### Review and submission

- Show source account, recipient name/bank/masked number, amount, fee `SGD 0.00`, total, and note.
- Back returns to Amount without clearing any field.
- Confirm performs a final schema validation, takes a synchronous submission lock, and issues exactly one POST.
- Keep `Sending…` visible only while the POST is pending.
- On 201, retain the transfer response and immediately show success with amount, recipient, API reference, and arrival copy.
- Start concurrent customer, accounts, and transactions synchronization as an independent success substate.
- While syncing, keep the exact `Back to dashboard` action visible but unavailable and announce a separate `Updating dashboard…` status. When ready, the action closes/resets the dialog and reveals consistent data.
- If synchronization fails, preserve the success receipt, say that the transfer was sent but dashboard data could not refresh, and offer a GET-only Retry. Never show the generic transfer-failure message or resend the POST.

#### Submission errors

- 400/422 field errors map to matching form paths and are also summarized/announced on Review. Map `fromAccountId` to the source field, `payeeId` to saved-recipient selection, `recipient.name/accountNumber/bank` to new-recipient fields, and `amount`/`note` to their controls. Unknown keys remain in the Review alert. The corresponding Review row shows the message; Back exposes it under its input.
- General/internal failures use the exact brief message in a `role="alert"` region.
- Preserve all fields, clear stale server errors before retry, and never transition to success from a rejected request.

### 4.4 Validation contract

Define these rules once in the form schema. Trim recipient text for validation/request mapping without unexpectedly changing what is shown while typing.

| Field | Rule | Planned message |
| --- | --- | --- |
| Recipient mode/payee | One saved payee or one new-recipient object, never both | `Choose a recipient.` |
| New recipient name | 2–50 characters after trim | `Enter a recipient name between 2 and 50 characters.` |
| Account number | Exactly 8 ASCII digits | `Enter a valid 8-digit account number.` |
| Bank | Required; align to API length 2–30 after trim | `Enter a bank name between 2 and 30 characters.` |
| Source account | Existing checking/savings account only | `Choose an account to transfer from.` |
| Amount | Required; decimal text; at least 1.00; no more than 2 decimals | `Enter an amount of at least SGD 1.00.` / `Use at most 2 decimal places.` |
| Amount vs balance | Amount ≤ selected account balance | `Amount can't be more than your available balance (<real formatted balance>).` |
| Amount vs limit | Amount ≤ current remaining limit | `This transfer exceeds your remaining daily limit (<real formatted limit>).` |
| Note | Optional; maximum 50 characters | `Keep the note to 50 characters or fewer.` |

Accept forms such as `1`, `1.0`, and `1.00`; reject exponent, signed, comma-formatted, and three-decimal input. When both balance and limit could fail, match the API's balance-first precedence.

### 4.5 Theme and segment precedence

Use a tiny pre-React script in `index.html` so preferences apply before the app module can paint:

1. Read only valid stored theme/segment enum values inside `try/catch`.
2. Theme fallback: `prefers-color-scheme: dark`, otherwise light.
3. Segment fallback: Retail, because customer data is asynchronous and the seed default is Retail.
4. Set `data-theme` and `data-segment` on `<html>` immediately.
5. After customer data loads, apply `customer.segment` only when no explicit segment preference exists.
6. Persist explicit user changes and update the root attributes synchronously.

Components consume only supplied CSS variables. Toggles use labels or `aria-pressed`, focus remains visible, reduced motion is respected, and all four combinations meet WCAG AA.

### 4.6 Responsive and accessible behavior

- Below 640 px: 16 px gutters, one column, account-row scroller or stack contained within the page, fixed bottom CTA with matching content padding and `env(safe-area-inset-bottom)`.
- 640–1023 px: one-column/tablet composition; transfer remains a full-screen sheet because desktop is defined as 1024 px and above.
- At 1024 px and above: content up to 1200 px, 24 px gutters, main column plus 300 px rail, and an approximately 520 px centered dialog.
- Work down to 360 px without page-level horizontal scrolling; all tap targets are at least 44 px.
- Use a native `<dialog>` with `showModal()`. Verify background inertness, scroll behavior, Escape, close control, initial focus, and opener-focus restoration.
- Initial recipient focus goes to payee search; step changes focus the step heading; invalid Continue focuses the first invalid field.
- Stepper is an ordered list with `aria-current="step"`.
- Every field has a visible label, `aria-invalid` when applicable, and stable `aria-describedby` errors.
- Generic send failure uses `role="alert"`; success uses `aria-live` and receives sensible focus.
- Avoid custom listbox keyboard logic when native radio and form controls satisfy the behavior.

## 5. Provided backend and knowledge assets

The assessment backend is MSW, not a remote service. Browser, Vitest, and the optional Node server share the same handlers. Data is in memory and a page refresh resets it to seed state.

### Assets to reuse

| Resource | Use and constraint |
| --- | --- |
| `src/api/client.ts` | Base-path-aware typed fetch wrapper and structured `ApiError`; presentation components do not call `fetch`. |
| `src/api/types.ts` | Canonical frontend wire types. |
| `mock-api/handlers.ts` | API behavior and mutable in-memory state; do not edit to make UI/tests pass. |
| `mock-api/db.json` | Seed customer, accounts, transactions, and payees; do not alter. |
| `src/mocks/browser.ts` | Browser worker for local and deployed use. |
| `src/test/setup.ts` | Node MSW lifecycle and database reset per test. |
| `public/mockServiceWorker.js` | Required non-empty production artifact. |
| `mock-api/server.mjs` | Optional curl/debug server only; never a deployment dependency. |
| `src/lib/format.ts` | Required money/date formatters. |
| `brief/design-tokens.css` | Required theme, segment, status, layout, type, spacing, and focus tokens. |

### API inventory

| Operation | UI purpose | Cache/retry/cancellation | Mutation/error rule |
| --- | --- | --- | --- |
| `GET /api/customer` | Name, segment default, limit, used amount | Key `['customer']`; pass query `signal`; no automatic assessment retry | Refetch after transfer |
| `GET /api/accounts` | Cards, total, sources, balance validation | Key `['accounts']`; pass `signal`; no automatic assessment retry | Refetch after transfer |
| `GET /api/transactions?limit=8` | Required initial dashboard rows and search source | Key `['transactions', { limit: 8 }]`; pass `signal` | Refetch after transfer |
| `GET /api/transactions?limit=50` | Lazy full supplied history for eight-row client pages | Key `['transactions', { limit: 50 }]`; enabled by `View all`; pass `signal`; inline Retry | Refetch after transfer when active |
| `GET /api/payees` | Saved-recipient selection | Key `['payees']`; enabled only while dialog is open; local Retry | Independent of dashboard |
| `POST /api/transfers` | Execute transfer | No retry or cancellation after dispatch; explicit UI lock | Send exactly one of `payeeId`/`recipient`; map structured errors |
| `GET /api/health` | Manual worker smoke only | Not part of final UI state | Starter health screen/test is replaced |
| `POST /api/__reset` | Development utility | Not used by product UI | Tests use provided reset lifecycle |

GET responses take about 500 ms. Test/demo hooks are request query parameters, not page query parameters automatically. A page URL such as `?scenario=error` does nothing unless an optional adapter deliberately forwards it.

## 6. Frontend architecture and locked decisions

### Runtime context

`Browser -> React features -> typed API functions -> apiFetch(BASE_URL) -> MSW service worker -> shared handlers -> in-memory seed state`

Preferences flow from pre-paint `localStorage`/system detection to `<html>` attributes. Tests replace the browser worker with the provided Node MSW server. The mock boundary is suitable for the assessment but is not a security boundary.

### Proposed structure

Keep files coarse-grained until a second stable use justifies extraction:

```text
src/
  api/
    client.ts                 # provided
    types.ts                  # provided
    queries.ts                # query keys + typed GET functions/hooks
    transfers.ts              # typed POST + request mapping
  components/
    ui/                       # only primitives reused at least twice
    Header.tsx
  features/
    dashboard/
      Dashboard.tsx
      Dashboard.test.tsx
    transfer/
      TransferDialog.tsx
      transferSchema.ts
      transferRequest.ts
      TransferDialog.test.tsx
    preferences/
      preferences.ts
  lib/
    format.ts                 # provided
  test/
    setup.ts                  # provided
    render.tsx                # fresh QueryClient helper
  App.tsx
  main.tsx
  index.css
```

Do not create a component for every line of markup. Extract buttons, fields, skeletons, or errors only when reuse or testability is clear.

### State ownership

| State | Owner |
| --- | --- |
| Customer, accounts, transactions, payees | TanStack Query |
| Transfer POST lifecycle and receipt | TanStack Query mutation plus a synchronous submit guard |
| Post-success dashboard synchronization | Success-panel substate; never conflated with transfer failure |
| Recipient, source, amount, note, field errors | One React Hook Form owner across all steps |
| Dialog open and current step | Transfer feature local state |
| Transaction/payee search | Nearest feature component |
| Theme/segment | Root attributes plus safe localStorage adapter |
| Total, remaining limit, filtered rows, signed amounts | Derived at render time |

No router and no global client store are needed.

### Query policy

- Put typed endpoint functions/query keys in the API layer and pass TanStack Query's `AbortSignal` to `apiFetch` through `RequestInit`.
- Render the three dashboard hooks together so initial requests are concurrent.
- Set dashboard query retry to `false` for explicit, deterministic D7 behavior; the visible Retry is the recovery mechanism.
- Treat any essential initial-query error as the coordinated dashboard error.
- Retry all three dashboard reads concurrently, including those that previously succeeded.
- Keep the existing 30-second global stale-time unless testing shows an acceptance issue.
- Use `enabled: dialogOpen` and `retry: false` for payees; keep loading/error/empty/Retry local.
- Explicitly set transfer mutation retry to `false`.
- On 201, enter success, then invalidate/refetch customer, accounts, and transactions concurrently. Gate Back to dashboard on synchronization, and retry only those GETs after a sync failure.

### Form implementation

- One `useForm` instance spans all steps with `mode: 'onBlur'` and `shouldUnregister: false`.
- Use one schema factory/composed schema with the current deposit accounts and remaining limit; use `superRefine` for branch and cross-field rules.
- Keep `amount` as a string, validate its text shape, then transform/map to a number only at the request boundary.
- Step Continue calls `trigger(stepFields, { shouldFocus: true })`.
- Map every API field: `fromAccountId` to source account; `payeeId` to saved recipient; `recipient.name`, `recipient.accountNumber`, and `recipient.bank` to new-recipient controls; `amount` and `note` to their controls; unknown keys to the Review alert.
- Map saved versus new recipient to mutually exclusive request shapes.
- Omit an empty note consistently.
- POST JSON with an explicit `Content-Type: application/json` header.
- Preserve server errors until the user edits the affected field or retries; clear obsolete errors before the next POST.

### Dialog implementation

Use native `<dialog>` and `showModal()` to avoid a new dependency. Wrap only the behavior needed for:

- open/close and clean reset;
- in-flight POST dismissal guard;
- initial and step focus;
- cancel/Escape handling;
- focus restoration;
- desktop modal/mobile sheet styling; and
- a sticky mobile footer above the safe area.

Add a dialog library only if real target-browser testing finds a blocker that cannot be fixed safely within the time box.

## 7. Test suite design

Use Vitest, Testing Library, user-event, and the existing MSW setup. Tests assert observable behavior through roles, labels, text, and network effects.

### Required executable tests

1. **Over balance sends nothing**
   - Open transfer, select a payee, continue, choose checking, and enter an amount above `SGD 4,280.55`.
   - Continue shows the exact dynamic balance error and focuses/associates it with Amount.
   - Count `POST /api/transfers` calls and assert zero.

2. **Successful transfer refreshes the dashboard**
   - Send a known amount from checking to a saved payee.
   - Assert `Sending…` cannot be submitted twice.
   - Assert success appears after 201 with amount, recipient, and the actual returned reference/format rather than a hard-coded random reference.
   - Wait for the success panel's dashboard synchronization to become ready.
   - Activate `Back to dashboard`.
   - Assert source balance, total available, remaining limit, and new top transaction all changed without reload.

3. **Dashboard Retry recovers**
   - Override one essential GET with a closure/one-shot behavior: first call fails, next call succeeds.
   - Assert exact dashboard error and Retry.
   - Retry refetches all essential resources and the loaded dashboard appears.
   - Do not use a permanently failing handler, which would make Retry fail again.

Replace the starter health test; health is no longer the application behavior.

### Additional high-value tests

- transaction search by description/category, count, filtered-empty, and clear;
- lazy full-history loading, eight-row page boundaries, older-record search, page reset, and local history-load failure;
- true empty transaction list;
- recipient branch and 8-digit/name/bank validation;
- amount boundaries: blank, 0.99, 1, 2 versus 3 decimals, exact/over balance, exact/over limit;
- note length 50/51;
- credit account absent from sources;
- Back retains values;
- transfer failure preserves Review, announces exact error, and never shows success;
- a post-201 refetch failure preserves the success receipt, retries GET synchronization only, and never issues a second POST;
- delayed response plus double activation produces one POST;
- payee loading/error/empty and Retry/new-recipient fallback;
- Escape/close focus restoration when not submitting;
- stored preferences/root attributes, with localStorage and root cleanup after each test.

### Test mechanics

- Every test gets a fresh QueryClient with query and mutation retries disabled.
- The provided setup resets mock database state before each test and handlers after each test.
- Because jsdom does not fully implement native dialog behavior in every version, install the smallest test-only `showModal()`/`close()` fallback when those methods are missing. Keep real focus containment, inertness, and Escape verification in a browser.
- Use MSW overrides instead of changing canonical handlers or seed data.
- Prefer real deterministic async behavior and `findBy*`/`waitFor`; avoid fake timers unless necessary.
- Compare formatted values with `formatMoney`/`formatShortDate`.
- Test error associations and accessible names, not CSS classes or component internals.

### Required manual acceptance sheet

- Viewports: 360, 390, 640, 1024, and 1280 px; 200% zoom; no page overflow.
- Four theme/segment combinations; visible focus; no wrong-theme flash on hard reload.
- Keyboard-only open, recipient selection, step navigation, validation, Escape, close, and focus return.
- One critical screen-reader smoke path including error and success announcement.
- Normal-path browser console/network contains no application errors or duplicate POST.
- Production build and hosted worker checks in Section 9.

### Optional tooling

Playwright, axe integration, visual regression, coverage provider/thresholds, Lighthouse budgets, and extended dependency/security scanners are not installed. Add them only after P0 is complete and document any new dependency. Manual accessibility checks remain required even if automation is added.

## 8. End-to-end implementation phases

### Phase 0 — baseline and decisions (0.5 h)

- Confirm clean branch/worktree and Node 22.
- Run `npm ci`, `npm run check`, and `npm run build` before edits.
- Record pre-existing failures separately.
- Confirm default host (recommended: Vercel; Netlify/Cloudflare Pages remain valid).
- Keep handlers and seed immutable.

Exit: baseline known, traceability table accepted, host/branch chosen.

### Phase 1 — preferences, data boundary, and shell (1.0 h)

- Add the pre-paint preference script and safe preference adapter.
- Add typed query keys/functions and test render helper.
- Establish page shell, global visible focus, reduced-motion rule, and token-only styling.
- Build primitives only when first needed.
- Add preference/root-attribute tests.

Exit: no-flash preference behavior works, API boundary is typed, shell works at 360 and 1024 px.

### Phase 2 — dashboard vertical slice (1.5–2.0 h)

- Implement concurrent queries and coordinated loading/error/Retry.
- Add header, balance, accounts, daily limit, transactions, signs/status/date/category formatting.
- Add true-empty and filtered-empty search states.
- Implement the required dashboard Retry test and search tests in this phase.
- Check D1–D8 copy, layout, and evidence.

Exit: D1–D8 verified except final deployed/manual checks; required Retry test is green.

### Phase 3 — recipient, amount, and validation (2.0–2.5 h)

- Implement dialog/sheet semantics, state machine, stepper, and focus transitions.
- Implement lazy payees, search, semantic radio selection, empty/error Retry, and new-recipient disclosure.
- Add the single RHF/Zod validation owner, source selection, amount chips, balance/limit, and note counter.
- Implement the required over-balance/no-POST test plus boundary tests.

Exit: T1–T3, T8, and the validation matrix are verified; required validation test is green.

### Phase 4 — review, send, synchronization, and success (1.5–2.0 h)

- Add Review and retained Back behavior.
- Add typed request mapping and guarded non-retrying POST.
- Implement API field/general error mapping.
- Show success immediately after 201, synchronize affected queries in the success panel, and handle sync failure without resending.
- Implement the required success/refresh test and a failure-retention test.

Exit: T4–T7 verified; all three mandatory tests are green.

### Phase 5 — hardening and regression (1.0–1.5 h)

- Close traceability gaps; do not add optional features.
- Perform the required manual accessibility/responsive/theme sheet.
- Run `npm run check` and `npm run build` from the final dependency state.
- Assert `test -s dist/mockServiceWorker.js`.
- Remove unnecessary abstractions and confirm no normal-path console errors.

Exit: all P0 local gates and definition of done pass.

### Phase 6 — deployment, README, and submission (1.0–1.5 h)

- Deploy the reviewed commit using Node 22, lockfile install, `npm run build`, and `dist` output.
- Execute service-worker and transfer smoke checks.
- Replace README and document state demonstrations, trade-offs, tests, AI use, and known gaps.
- Rehearse the architecture/transfer trace and two small edits without AI.
- Implement minimal CI only if P0 is stable and time remains.
- Tag the verified submission commit after hosted verification.

Exit: public URL, repository, README, smoke evidence, and rollback path are ready to submit.

## 9. Source control, CI/CD, and deployment

### Assessment branching

Use one short-lived `feat/meridian-app` branch from a green `main`, with coherent commits for foundation, dashboard, transfer, tests/hardening, and docs. Open one final PR, require the available quality check, then squash or merge according to repository policy. Multiple dependent feature branches add little value for a solo 8–12 hour assessment.

Keep `main` deployable. Use a small `docs/*` or `fix/*` branch for later isolated work. Tag the hosted submission, for example `submission-v1.0.0`.

### Minimal optional GitHub Actions workflow

CI is recommended but not an assessment requirement. If implemented, keep it aligned with installed scripts:

1. Trigger for pull requests and `main`; cancel superseded runs.
2. Use `permissions: contents: read`.
3. Checkout and configure Node from `.nvmrc` with npm caching.
4. Run `npm ci`.
5. Run `npm run check`.
6. Run `npm run build`.
7. Assert `test -s dist/mockServiceWorker.js`.

Do not require coverage because no coverage provider/script is installed. Preview deploys, E2E, report uploads, and security scanners are optional extensions.

### Assessment deployment

Default recommendation: Vercel Git integration with Vite preset, Node 22, install command `npm ci`, build command `npm run build`, and output `dist`. Netlify or Cloudflare Pages are equivalent supported choices. No SPA redirect is needed because there is no routing.

Provider-managed assessment deployment may rebuild the reviewed commit. Record the deployed SHA and ensure the lockfile/Node/build settings match local/CI verification. Exact build-once artifact promotion belongs to the production design below.

### Hosted smoke checklist

- `dist/mockServiceWorker.js` exists and is non-empty.
- Worker startup remains unconditional and awaited before React renders.
- Worker and API URLs remain `BASE_URL` aware.
- Site is HTTPS and the worker is activated with the expected scope.
- A real final-app request such as `/api/customer` is shown as service-worker intercepted; `/api/health` may be fetched manually as an additional check.
- First load, hard reload, and refresh all render successfully.
- A transfer succeeds once and balance, top transaction, and remaining limit update.
- Refresh resets in-memory data to seed; document this as expected.
- Test a normal browser window, not only Safari private mode or an in-app browser where service workers may be restricted.
- No normal-path console errors.

Assessment rollback: point the production alias back to the previous known-good deployment or redeploy the last known-good commit, then rerun the smoke checklist.

### Demonstrating non-happy states

The README must not imply that adding `?scenario=error` to the page URL automatically changes API requests.

- Loading: hard reload and observe the intentional mock delay.
- Search empty: enter a non-matching transaction query.
- Transfer failure: use the documented `#fail` note hook if appropriate for the public demo.
- Dashboard error/payee empty: cite automated MSW tests unless an optional, unobtrusive `?demo=error|empty|slow` adapter is deliberately implemented.
- Do not add a permanent destructive-looking button to the primary UI.

## 10. README, interview, and handoff

Replace the starter README with:

- deployed URL and exact local commands;
- concise folder responsibilities;
- decisions/trade-offs: local search, server/UI/form state, invalidation/refetch, native dialog, preference bootstrap;
- how loading, empty, and error states are handled and honestly demonstrated;
- tests and why the highest-risk cases were selected;
- AI tools used and two or three AI suggestions changed, rejected, or fixed;
- known issues and what would change with more time.

Interview rehearsal:

1. Give a five-minute structure and state-ownership walkthrough.
2. Trace `Confirm transfer -> final validation -> request mapping -> mutation -> POST success/error -> success receipt -> dashboard synchronization -> updated dashboard`.
3. Explain local filtering of eight rows and invalidation/refetch trade-offs.
4. Practice adding one validation rule and showing one additional API field without AI.
5. Remove or simplify any abstraction that cannot be explained comfortably.

## 11. Definition of done

- Every traceability row is `verified` or honestly marked with a known gap.
- Exact required copy, `formatMoney`, `formatShortDate`, and tabular numerals are used.
- Dashboard and transfer required states, validation, failure, retry, and success behavior work.
- No `any`, direct presentation-layer `fetch`, duplicate validation, copied server data, stored derived totals, or component hard-coded colors.
- Confirm produces one POST; mutation retry is off; failure preserves data and never shows success.
- Dashboard is consistent before Back to dashboard reveals it.
- Keyboard, focus, labels, associations, announcements, contrast, reduced motion, target size, zoom, and supported widths have evidence.
- `npm ci`, `npm run check`, and `npm run build` pass on Node 22.
- All three mandated behavioral tests pass deterministically.
- `dist/mockServiceWorker.js` exists; hosted API interception and transfer pass over HTTPS.
- Live 360/390 and desktop layouts have no page overflow or normal-path console errors.
- README, AI disclosure, URLs, known issues, deployed SHA, smoke result, and rollback method are complete.

## 12. Assessment risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Time box is consumed by optional tooling | Freeze P1/P2 around hour 8; finish traceability, required tests, deployment, and README first. |
| Service worker scope/startup fails after hosting | Preserve awaited unconditional startup, use `BASE_URL`, assert built worker, inspect hosted scope/interception. |
| Duplicate transfer | Synchronous guard plus disabled pending UI, mutation retry off, exact request-count test. |
| Dismissal makes POST outcome ambiguous | As an explicit T1 exception, prevent close/Escape only while the POST is in flight; restore non-submitting behavior after 201. |
| Transfer succeeds but dashboard refresh fails | Preserve and announce success, keep the reference visible, retry only GET synchronization, and never resend the POST. |
| Client balance/limit becomes stale | Derive schema from current queries, keep server authoritative, await all affected refetches. |
| Form values/errors disappear between steps | One RHF owner with `shouldUnregister: false`; test Back and rejected submission. |
| Modal is visually correct but keyboard-incomplete | Native dialog/radio semantics plus manual focus, Escape, inertness, and restoration checks. |
| Theme flashes or storage throws | Pre-paint guarded bootstrap with enum validation and system/static fallbacks. |
| Retry test never recovers | Use first-call-fails/next-call-succeeds override and disable test retries. |
| Page query is mistaken for API scenario hook | Document the distinction; implement a demo adapter only as optional, deliberate behavior. |
| Architecture is over-fragmented | Start coarse-grained; extract only after stable reuse; optimize for interview explainability. |
| Assessment mock is presented as production banking | Keep production differences explicit in README and this appendix. |

## 13. Production-system decisions and delivery appendix

This section answers the original real-production/system-design request. It is **not part of the assessment implementation budget**.

### Product and platform decisions

| Area | Required owners and decisions |
| --- | --- |
| Authentication/session | Product/security: OIDC, MFA/step-up for transfers, expiry, refresh/revocation, device trust. |
| Authorization | Backend/security: customer, account, payee, and action entitlements enforced server-side. |
| Transfer safety | Payments/backend: idempotency keys, replay prevention, duplicate detection, confirmation challenge, cooling-off, reconciliation, immutable audit. |
| Money | Backend/platform: integer minor units or decimal type, currency metadata, rounding, fees, FX, locale display. |
| Consistency | Architecture: mutation guarantees, polling/events, pending/posted/reversed states, conflict and ambiguous-timeout reconciliation. |
| Compliance | Legal/risk: KYC/AML, sanctions, confirmation-of-payee, consent, receipts, retention, residency, access/deletion rules. |
| Privacy/security | Security/legal: masking, encryption, CSP/Trusted Types, CSRF/CORS, logging/analytics redaction, third parties, threat model. |
| API contract | Frontend/backend: OpenAPI/GraphQL ownership, versioning, generated clients, runtime validation, rate limits, timeout/retry taxonomy, compatibility. |
| Reliability | SRE/product: SLOs, maintenance/degraded modes, circuit breaking, failover, offline policy, disaster recovery. |
| Accessibility/browser | Product/design: WCAG target, supported browser/device/AT matrix, independent audit, remediation ownership. |
| Observability | SRE/security: correlation, privacy-safe RUM/logs/traces, web vitals, fraud signals, audit versus diagnostics, alerts. |
| Content/localization | Product/content: locales, time zones, RTL, plural rules, currencies, legal copy. |
| Feature delivery | Product/platform: flags, cohorts, kill switch, experiment rules, compatibility, rollout and rollback ownership. |

### Backend collaboration contract for production transfers

This is production guidance for a future real API. It does **not** change the
supplied assessment API, request types, MSW handlers, seed data, or optional
Node mock.

The assessment frontend already prevents rapid duplicate activation in one
mounted dialog, does not automatically retry the mutation, and validates a
cached balance and limit for immediate feedback. The supplied mock also checks
its current in-memory balance and daily limit immediately before mutation.
Those controls are sufficient for the exercise, but they are not a production
financial guarantee: the client is untrusted, the snapshot can become stale,
the mock has no authenticated principal or durable transaction, and its
documented contract deliberately moves money twice when the same request is
submitted twice.

Use the precise production concerns below—atomicity, isolation, idempotency,
authorization, replay prevention, and reconciliation—rather than treating
"thread-safe frontend" as the target.

#### Responsibility boundary

| Owner | Required guarantee |
| --- | --- |
| Frontend | Validate for UX, create one idempotency key per confirmed user intent, reuse it for every retry/status check, prevent accidental repeat activation, preserve an `unknown` outcome after ambiguous failures, and never claim money did or did not move without authoritative evidence. |
| Identity/BFF/security | Terminate HTTPS, authenticate the principal, manage secure sessions/tokens, enforce CSRF/origin/CORS policy, rate limits and step-up challenges, and pass a verified identity—not a client-supplied customer identity—to the transfer service. |
| Transfer/payments service | Authorize account ownership and transfer entitlement, validate recipient/risk/limits against current server data, enforce idempotency, orchestrate the atomic write, own the transfer state machine, and return a stable canonical result. |
| Database/platform | Provide exact money types, uniqueness constraints, isolation/locking or compare-and-swap primitives, all-or-nothing ledger writes, durable audit/outbox records, backup/recovery, and multi-instance correctness. |
| Risk/compliance/SRE | Define step-up thresholds, fraud/AML controls, audit retention, reconciliation, operational limits, observability, incident handling, and safe manual recovery. |
| Frontend/backend contract owners | Maintain the versioned OpenAPI/schema, generated types where useful, error and retry taxonomy, compatibility policy, and consumer/provider contract tests. |

#### Proposed production API semantics

These are contract proposals to resolve jointly before integrating a real
backend, not fields to add unilaterally to the assessment endpoint.

| Concern | Proposed contract |
| --- | --- |
| Authentication | Derive the customer/principal from a verified session or access token. Never accept a customer identity in the transfer body as authority. |
| Authorization | Verify source-account ownership, payee access, product entitlement, currency, transfer capability and risk policy on every request. Return `401` for missing/invalid authentication and the agreed `403` or privacy-preserving `404` for denied resources. Neither response may mutate state. |
| Idempotency | Require an `Idempotency-Key` scoped to the authenticated principal. Persist a unique `(principal_id, key)`, request hash, lifecycle state and canonical response. Same key/same payload returns the existing result; same key/different payload returns `409`. Define key format, TTL and archival policy. |
| Money | Send currency plus integer minor units or a documented exact-decimal representation. Reject floats, unsupported currencies, overflow, invalid scale and non-positive values. Agree rounding and fee semantics. |
| Transfer identity/state | Return a stable transfer ID and explicit state such as `pending`, `completed`, `failed`, `reversed` or `cancelled`. Define which state makes funds movement authoritative and which transitions are legal. |
| Validation/errors | Backend balance, daily limit, account state and risk checks are authoritative. Version stable machine codes and field paths separately from user-facing copy. Define `401`, `403/404`, `409`, `422`, `429` and `5xx` retry behavior. |
| Reconciliation | Provide idempotent replay and/or `GET /transfers/{id}` / lookup-by-idempotency-key. A timeout is `unknown`, not failure; the client reuses the original key and reconciles instead of creating a new intent. |
| Observability | Propagate a privacy-safe correlation ID and record security/audit facts server-side. Never log full account numbers, tokens, credentials or sensitive transfer notes. |

#### Atomic backend processing

For each authenticated transfer intent, the backend should complete the
following within one database transaction (or an equivalently proven ledger
primitive):

1. Validate the request shape and exact money representation.
2. Reserve/read the idempotency record under a unique principal/key constraint;
   return the stored canonical result for a matching completed request and
   reject a mismatched request hash.
3. Lock the source account and daily-limit/risk rows with serializable
   isolation or `SELECT ... FOR UPDATE`, or use atomic conditional updates and
   verify the affected-row count.
4. Re-read the current account state, available balance, limit usage,
   recipient status and authorization inside that transaction. Client values
   are hints only.
5. Reject insufficient funds or limits without any mutation.
6. Write the debit/credit double-entry ledger records, transfer state, limit
   usage, idempotency result, immutable audit event and transactional outbox as
   one all-or-nothing unit.
7. Commit before reporting an authoritative result. Any exception rolls back
   every financial write.
8. Publish external events from the outbox and reconcile downstream/provider
   state. Propagate the same idempotency identity where the provider supports
   it.
9. On response loss or timeout, return the same stored result when the client
   retries with the original key; never debit again.

An atomic conditional debit such as `UPDATE ... WHERE balance_minor >=
amount_minor` is a useful final constraint, but it does not replace the ledger,
idempotency, authorization, daily-limit and audit transaction.

#### Authentication and interaction security

- Require HTTPS/HSTS in every non-local environment.
- Prefer OIDC Authorization Code + PKCE with a BFF and an opaque `Secure`,
  `HttpOnly`, appropriately `SameSite` session cookie for a browser banking
  application. Do not store long-lived banking bearer tokens in
  `localStorage`.
- For cookie sessions, require CSRF protection and strict `Origin`/`Referer`
  validation; use an exact CORS allowlist. For token APIs, validate signature,
  issuer, audience, expiry, scopes and revocation policy server-side.
- Bind step-up authentication or transaction signing to the source, recipient,
  amount, currency, nonce and short expiry where risk policy requires it.
- Apply throttling, replay/fraud detection, device/session risk, secret
  rotation, privacy-safe security telemetry and immutable audit controls.
- Treat XSS prevention and dependency/supply-chain controls as part of session
  protection; authentication headers do not make a compromised browser safe.

#### Joint frontend/backend acceptance tests

| Scenario | Required evidence |
| --- | --- |
| Concurrent unique transfers exceed the available balance | Run requests in parallel against the real database/multiple service instances; allowed requests commit, later contenders see current state, the balance never becomes invalid, and ledger totals reconcile. |
| Concurrent requests exceed the daily limit | The committed total never exceeds the authoritative limit and rejected requests create no ledger movement. |
| Same key and same payload is submitted concurrently or retried | Exactly one financial movement, transfer, audit/outbox record and limit update exist; every caller receives the same canonical transfer result. |
| Same key with a different payload | Return `409`; create no additional state or financial movement. |
| Response is lost after commit | Retrying/reconciling with the original key returns the committed result and never debits twice. |
| Client uses stale balance or limit | The backend rejects authoritatively with the current safe metadata/error code; no partial mutation occurs. |
| Unauthenticated or unauthorized account request | Return the agreed `401`/`403`/`404`; create no transfer, ledger, successful-transfer audit/outbox or limit movement. A denied-attempt security audit may still be required. |
| Failure injected between proposed writes | The database transaction rolls back completely, or a deliberately pending external state is durable and reconcilable; partial ledger/account/limit state is impossible. |
| Money boundaries | Test scale, rounding, minimum/maximum, overflow, currency mismatch and fee/total invariants using exact representations. |
| Multi-instance/restart behavior | Idempotency, locking, state transitions and reconciliation remain correct across service instances, process termination and retry. |
| Audit and outbox | Successful state is recorded exactly once with privacy-safe identity/correlation; failed/denied attempts follow the security retention policy. |

#### Open collaboration decisions

| Decision | Primary owners | Closure evidence | Status |
| --- | --- | --- | --- |
| OIDC/BFF versus direct token model; session, CSRF and step-up policy | Security, identity, frontend, backend | Threat model and approved sequence diagrams | Open before real API implementation |
| Idempotency key scope, request hash, TTL and status lookup | Payments/backend, frontend, data | Versioned API contract and concurrency tests | Open before mutation integration |
| Database isolation/locking/conditional-write strategy | Payments/backend, data/platform | Load/fault tests against production-like database topology | Open before production readiness |
| Money representation, limits, fees and rounding | Payments, finance/domain, backend, frontend | Domain specification and boundary test vectors | Open before contract freeze |
| Transfer states, ambiguous timeout UX and reconciliation | Product, payments/backend, frontend, SRE | State machine, recovery runbook and E2E scenarios | Open before UX/API sign-off |
| Error taxonomy and authorization privacy behavior | Security, backend, frontend, content | OpenAPI examples and consumer/provider tests | Open before contract freeze |
| Audit, outbox, monitoring and incident ownership | Risk/compliance, backend, SRE | Retention policy, dashboards/alerts and recovery exercise | Open before launch |

### Real development environment

- Pin runtime/package-manager versions and enforce the lockfile in local and CI environments.
- Support contract mocks, shared integration APIs, and ephemeral backend environments behind validated configuration where justified.
- Generate types/clients from the authoritative schema and detect contract drift.
- Keep secrets in managed vaults/CI identities; browser bundles receive public configuration only.
- Provide reproducible bootstrap/editor/formatter hooks and a containerized environment if platform drift is material.
- Use synthetic privacy-safe staging data and defined `dev -> test -> staging -> production` promotion.
- Own dependency updates, vulnerability policy, browser matrix, test data, local HTTPS, flaky-test budget, and feature-flag lifecycle.

### Production test portfolio

- Static types/lint/configuration and dependency policy.
- Pure unit tests for domain rules and boundary transformations.
- Component/integration behavior with contract-faithful network simulation.
- Provider/consumer contract tests and schema compatibility checks.
- Production-artifact E2E for critical journeys.
- Automated plus manual accessibility, targeted visual/responsive regression, and representative performance testing.
- Security checks proportionate to threat model.
- Post-deploy smoke, synthetic transactions, and monitored release health.

### Production CI/CD

1. Protected trunk with short-lived branches, required reviews/CODEOWNERS, and required checks.
2. Deterministic locked install; lint, types, unit/integration, contract, security, and production build.
3. Generate one immutable artifact with commit SHA, digest, SBOM/provenance as required.
4. Deploy isolated previews without production secrets and run critical E2E/accessibility checks.
5. Promote the exact verified artifact through protected environments using short-lived/OIDC credentials.
6. Use direct, canary, blue-green, or flag-based rollout based on blast radius.
7. Run post-deploy smoke/synthetic checks and compare error, latency, and experience signals with thresholds.
8. Automatically or manually roll back on agreed failure signals and verify recovery.
9. Record approvals, artifact identity, deployment, metrics, incidents, and rollback in the audit trail.
