# Meridian Banking Agent Guide

This file applies to the entire repository. It is the portable entry point for
an agent working from a fresh clone or another machine.

## Project posture and authority

This is a time-boxed frontend assessment: a single-page banking dashboard and a
three-step transfer dialog for one synthetic customer. Development and the
static deployment use an in-browser MSW worker. Tests use the MSW Node server;
both runtimes reuse the supplied handlers and seed data. Do not describe this
as production banking infrastructure.

Use these sources according to the task:

- `README.md`: current human handoff, setup, implemented decisions, evidence,
  AI disclosure, and known gaps.
- `brief/candidate-brief.md`: authoritative product scope, exact copy,
  responsive behavior, accessibility, and acceptance IDs.
- `wireframes/wireframe.md`: authoritative interaction and layout shape.
- `brief/api-contract.md`: authoritative endpoints, payloads, validation,
  errors, mock behavior, and test hooks.
- `brief/design-tokens.css`: authoritative visual tokens and theme/segment
  values.
- Current source and behavioral tests: implemented behavior and executable
  evidence.
- `DEPLOYMENT.md`: build, hosting, runtime-asset, smoke, and rollback guidance.
- `DEVELOPMENT_PLAN.md` and `PROGRESS.md`: planning rationale and dated history,
  not live specifications or portable setup instructions.

If sources conflict, the candidate brief and API contract take precedence over
planning or historical documents. Report material drift instead of silently
choosing or changing the supplied contract.

## Start work proportionately

1. Always run `git status --short --branch` and preserve existing user changes.
2. Read the README section and authoritative assets relevant to the requested
   task; an isolated typo or test does not require rereading every document.
3. Inspect the affected source and adjacent behavioral tests before proposing
   or implementing a change.
4. For broad frontend analysis or delivery work, read
   `.agents/skills/modern-frontend-delivery/SKILL.md` and load only the
   reference it routes to:
   - `references/frontend-system-design.md` for architecture, state, API,
     accessibility, testing, deployment, or production-readiness decisions;
   - `references/templates.md` for plans, inventories, decision records,
     matrices, or handoff reports.

## Portable execution setup

When the task requires local execution and permits machine setup, use Node 22
from `.nvmrc`. `package.json` currently allows Node 20 or newer, but that broad
range has not been verified; Node 22 is locally verified and configured in CI.

Activate Node 22 with the machine's normal version manager or official
distribution, then check it before installing or running project commands:

```bash
node --version  # must report v22.x
npm --version
npm ci
```

Do not copy user-specific `/Users/...` Node paths from `PROGRESS.md`. npm ships
with Node. No environment file or separate backend is required for normal use;
`src/main.tsx` starts MSW before React renders.

```bash
npm run dev         # Vite development server
npm run test:watch  # focused development loop
npm run check       # ESLint + strict TypeScript + Vitest
npm run build       # production artifact in dist/
npm run preview     # serve the production artifact
npm run mock        # optional Node mock server for curl/debugging only
```

The production artifact must include `dist/mockServiceWorker.js`.

## Architecture and state ownership

- `src/main.tsx`: browser MSW startup, QueryClient configuration, and React
  root.
- `src/App.tsx`: dashboard/dialog composition and dialog-open state.
- `src/api/`: API types, typed transport/error boundary, query keys/functions,
  and transfer mutation.
- `src/features/`: feature UI, styles, validation, and behavior.
- `src/lib/format.ts`: canonical SGD and Singapore-time formatting.
- `src/test/setup.ts`: MSW Node server lifecycle, mock database reset, DOM
  cleanup, and handler cleanup.
- `mock-api/`: supplied in-memory assessment backend and seed data.

Keep one owner for each kind of state:

- Customer, accounts, transactions, and payees: TanStack Query.
- Transfer values and field errors: one React Hook Form instance.
- Transfer POST lifecycle: TanStack Query mutation plus the synchronous
  duplicate-submit guard.
- Dialog step, searches, alerts, and transient view state: nearest feature
  component.
- Theme and segment: root data attributes plus guarded `localStorage`.
- Totals, limits, selected records, signed amounts, and filtered rows: derived
  from authoritative inputs, never synchronized duplicate state.

There is intentionally no router or global client-state store. Add one only
when a real navigation or cross-feature state requirement justifies it.

## Repository invariants

- Keep HTTP mechanics behind `src/api/`; components should not call raw
  `fetch` or copy query responses into local presentation state.
- Forward TanStack Query cancellation signals for reads and keep retry behavior
  explicit.
- Never automatically retry the non-idempotent transfer POST without an
  idempotency and reconciliation contract.
- Acquire duplicate-submit protection before the first asynchronous validation
  boundary.
- Treat HTTP 201 as authoritative transfer success. Dashboard synchronization
  is a separate recoverable state: refresh customer, accounts, and every active
  transaction-query variant. Never turn a refresh failure into a transfer
  failure.
- Use the contextual Zod schema as the single frontend validation source for
  blur, step continuation, and confirmation. The API remains authoritative;
  returned field errors must stay visible and linked.
- Preserve `apiFetch` invalid-response handling. Vite can return HTML with HTTP
  200 for an unhandled API path; that is not valid API data.
- Keep API and worker paths base-aware and await worker startup before the first
  query.
- Do not modify `mock-api/handlers.ts` or `mock-api/db.json` to make UI or tests
  pass. Use scoped MSW overrides inside tests. Do not hand-edit
  `public/mockServiceWorker.js` during ordinary feature work.
- Reuse the existing API boundary, query keys, formatters, MSW adapters, test
  setup, semantic controls, and supplied design tokens before adding
  dependencies or abstractions.
- Preserve exact required copy, linked errors, focus/keyboard behavior,
  responsive/mobile behavior, and all theme/segment combinations.
- Keep optional features and excluded pages out of scope unless explicitly
  requested.
- Mock state is in memory and resets on reload. It is not persistence, an
  authorization boundary, or a real ledger.

## Testing and handoff

Tests should assert observable behavior through roles, labels, content, focus,
enabled state, network effects, and visible results. Prefer Testing Library
user interactions and scoped MSW overrides over component internals. The
shared setup resets mutable server and DOM state between tests.

During implementation, run the narrowest relevant test first. Before handing
off implementation changes, run:

```bash
npm run check
npm run build
test -s dist/mockServiceWorker.js
git diff --check
```

For relevant UI or deployment changes, also check the production artifact in a
normal browser: supported responsive widths and zoom, keyboard/focus flow,
theme combinations, service-worker interception, transfer refresh, duplicate
POST prevention, console errors, and page overflow. Do not infer those results
from JSDOM tests.

State which checks actually ran and which remain unverified. A read-only review
does not authorize machine setup, dependency installation, build output,
deployment, or other external changes merely because these commands exist.

## Documentation and current status

- Read `README.md`, `DEPLOYMENT.md`, `PROGRESS.md`, current Git state, CI, and
  the live site before repeating a branch, commit, test count, deployment, or
  pending-work claim. Those are point-in-time facts.
- Treat absolute paths and former environment failures in `PROGRESS.md` as
  historical evidence, not instructions for another machine.
- Update `README.md` when user-facing behavior, portable setup, material
  architecture decisions, AI disclosure, deployment, or known issues change.
- Update `DEPLOYMENT.md` when artifact, host, runtime asset, smoke, or rollback
  guidance changes.
- Update `PROGRESS.md` only for requested planning work, delivery milestones,
  new blockers, or decisions/evidence that materially change its record.
- Update this file if the reading order, setup contract, architecture boundary,
  or non-negotiable repository rules change.

Do not deploy, change hosting, merge branches, alter credentials/DNS, or mutate
other external systems without explicit user authority.

## Production boundary

Do not present this prototype as production-ready banking software. A real
system additionally needs authenticated and authorized durable APIs, exact
minor-unit or decimal money, server-enforced idempotency and reconciliation,
atomic ledger writes, explicit transfer states, audit/privacy/fraud controls,
observability, cursor pagination, protected rollout, and rollback.
`DEVELOPMENT_PLAN.md` section 13 records the fuller production collaboration
boundary without expanding this assessment's implementation scope.
