# Meridian Banking — Frontend Assessment

- Deployed: pending hosting setup and merge to `main`
- Active implementation branch: `feat/meridian-app`
- Run locally: `npm ci && npm run dev`

Meridian is a responsive, accessible banking dashboard for Ava Chen. It shows
her accounts and eight newest transactions, supports local transaction search,
light/dark and Retail/Premium preferences, and a complete three-step transfer
flow backed by the supplied in-browser mock API.

## Run locally

Node 22 is recommended (the project requires Node 20 or newer).

```bash
npm ci
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. The app starts the
MSW worker before rendering, so no separate backend is required.

Useful commands:

```bash
npm run check       # ESLint + strict TypeScript + Vitest
npm run build       # production output in dist/
npm run preview     # serve the production build locally
npm run test:watch  # Vitest watch mode
```

The production artifact must include `dist/mockServiceWorker.js`; see
[DEPLOYMENT.md](DEPLOYMENT.md) for hosting settings and the release checklist.

## Requirement coverage

| Area | Implemented behaviour |
| --- | --- |
| Dashboard (D1–D8) | Concurrent loading skeletons, exact greeting and totals, three accounts, eight newest transactions, local description/category search with result and empty states, retryable dashboard failure, and a one-column 360–390 px layout with a fixed transfer action. |
| Transfer (T1–T8) | Native modal dialog, saved-payee search or new-recipient entry, amount/account/note step, review and editing, guarded POST, truthful success/failure states, dashboard refresh, linked errors, announcements, radio-keyboard semantics, and step/focus restoration. |
| Validation | One contextual Zod schema covers recipient, account, amount, balance, daily-limit and note rules for blur and Continue/submit validation. |
| Themes (TH1–TH3) | System-aware pre-paint theme, persistent light/dark and Retail/Premium controls, root data attributes, semantic supplied tokens, and visible focus states. |
| Engineering (E1–E5) | Strict typed API boundary, TanStack Query server state, React Hook Form + Zod, 23 behavioural tests, passing checks, and a verified production build. |
| Deployment (E6) | The static artifact and production MSW worker are build-ready; a public URL is still pending. |

## Project structure

```text
src/
  api/                    typed API client, query functions and mutation
  features/dashboard/     dashboard UI, responsive styles and tests
  features/preferences/   theme/segment state, controls, styles and tests
  features/transfer/      dialog, schema, request mapper, styles and tests
  lib/                    supplied money/date formatters and tests
  mocks/                  browser MSW wiring to the supplied handlers
  test/                   shared Vitest/MSW setup and cleanup
  App.tsx                 dashboard/transfer composition and local open state
  main.tsx                query client, mock-worker startup and React root
brief/                    authoritative product and API requirements
mock-api/                 supplied stateful mock backend (unchanged)
```

Planning and implementation evidence is kept in
[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) and [PROGRESS.md](PROGRESS.md).

## Decisions and trade-offs

- **Server state:** TanStack Query owns customer, account, transaction and
  payee data. Components do not copy responses into UI state. Query functions
  accept cancellation signals, reads use explicit retry policies, and transfer
  mutations never retry automatically.
- **Search:** D6 filters the eight records returned by
  `GET /api/transactions?limit=8` in the browser. The list is deliberately
  bounded, so local filtering is immediate and avoids refetching on each
  keystroke. A larger production ledger would use debounced server search and
  pagination.
- **Transfer consistency:** one React Hook Form instance retains values across
  Recipient, Amount and Review. A single contextual Zod schema is the rule
  source. The duplicate-submit lock is acquired before the first asynchronous
  validation boundary.
- **After a transfer:** HTTP 201 makes the success message authoritative. The
  app then explicitly refetches customer, accounts and `transactions(8)` and
  enables return only after synchronization succeeds. A refresh failure does
  not misreport the completed transfer as failed; it presents a separate retry.
  Refetching was preferred over hand-patching three caches because the supplied
  API is small and remains the source of truth.
- **Dialog:** the platform `<dialog>` provides modal focus containment, Escape
  handling and a backdrop without adding a component dependency. Explicit
  heading focus and opener restoration make step transitions predictable.
- **Preferences:** an explicit stored choice wins; otherwise theme follows the
  system and segment reconciles to the customer response. A guarded inline
  script applies the theme before React starts to avoid a wrong-theme flash.
- **Scope:** no extra runtime packages or optional product features were added.
  The existing stack covers the assessment and keeps the result explainable.

## Loading, empty and error states

- Dashboard reads start concurrently. A skeleton mirrors the final desktop
  columns so content does not materially jump when data arrives.
- Dashboard request failure shows `We couldn't load your dashboard.` and Retry
  refetches all three resources. This recovery is covered by a behavioural
  test.
- No accounts, no transactions, no saved payees, no transaction-search matches
  and no payee-search matches each have a distinct empty state. A new recipient
  remains available when saved payees are empty.
- Transfer preparation and payee loading have progress states. Payee failure
  has its own Retry action. Backend field messages remain visible in the review
  alert and known paths are also linked to their fields.
- A failed transfer stays on Review with all entered data, never shows success,
  and can be edited and retried. The exact required general failure copy is
  used.

The normal mock delay makes loading visible on reload. Search for an impossible
term to see the search-empty state. Deliberate failures are exercised with
per-test MSW overrides rather than a permanent "break the app" control. The
accounts, transaction, and saved-payee empty branches are covered with scoped
MSW response overrides; no permanent debug control ships in the main UI.

## Tests

Latest verified result: **23 tests in 5 files pass**, together with ESLint,
strict TypeScript and the production build.

The suite includes the three mandatory E4 behaviours:

1. an over-balance amount shows its linked error, focuses the field and sends
   no request;
2. a successful transfer shows success and refreshes account balance, total,
   daily limit and newest transaction;
3. a failed dashboard request shows the required error and Retry recovers.

Additional high-risk coverage includes failed-send retention and retry, rapid
double activation producing one POST, saved-payee recovery, new-recipient
masking/request shape, transaction search/no-match behaviour, preferences,
validation rules, backend field mapping, dialog close/focus restoration,
keyboard radio selection, empty API results, post-success refresh recovery,
and money/date formatting.

```bash
npm run check
npm run build
test -s dist/mockServiceWorker.js
```

## AI use

Codex was used to analyze the brief and starter assets, draft implementation
and test changes, review requirement coverage, and maintain the plan/progress
documentation. All generated work was checked against the supplied brief, API
contract and executable quality gates.

Examples where generated work was corrected rather than accepted as-is:

- The first transfer draft set the duplicate-submit lock after asynchronous
  validation. Review identified the same-tick race; the lock was moved before
  the first `await` and a delayed double-activation regression test was added.
- Testing Library cleanup was initially assumed to be automatic. Vitest globals
  are disabled here, so two rendered apps leaked between tests; shared teardown
  now calls `cleanup()` explicitly.
- Early preference code assumed `window.matchMedia` existed. It is absent in
  JSDOM and can be unavailable in restricted contexts, so both pre-paint and
  runtime paths are guarded.
- A broad React Hook Form `watch()` subscription triggered the React compiler
  lint rule and subscribed to more than necessary. It was replaced with
  `useWatch({ control })`, with the complete default-value invariant documented.

## Not done / known issues

- A public deployment URL is not configured yet. The build and browser MSW
  artifact are ready, but this feature branch has intentionally not been merged
  to `main` or attached to a hosting project.
- The automated interactive desktop/mobile browser pass could not run in the
  development host because Chrome was denied macOS Mach-port access. HTTP smoke
  checks confirmed the built HTML and worker load; desktop, 390 px/mobile,
  keyboard, focus, console and overflow checks still need one pass in a normal
  browser or at the deployed URL.
- Optional progress bar, discard confirmation, debug menu, balance hiding,
  deep link and end-to-end test were deliberately omitted.
- Mock data is in memory and resets on page reload by design. A real banking
  product would additionally require authentication/authorization, integer
  minor-unit money, idempotency keys, audit trails, observability, security
  review and controlled rollout.
