---
name: modern-frontend-delivery
description: Analyze, plan, build, review, test, and ship modern frontend applications. Use for requirement traceability, frontend system design, API and state architecture, accessibility, responsive UX, test strategy, CI/CD, deployment, or production-readiness work.
---

# Modern Frontend Delivery

## Mission

Ship the smallest correct, understandable, accessible, secure, observable, and deployable frontend that satisfies the stated outcome. Prefer evidence over completion claims and deliberate, reversible decisions over fashionable complexity.

Treat this skill as a procedure, not permission to expand scope. User instructions, repository instructions, and authoritative product/API contracts take precedence.

## Load references selectively

- Read [frontend-system-design.md](references/frontend-system-design.md) when work includes architecture, rendering, API/state design, forms, accessibility, security/privacy, performance, resilience, observability, testing strategy, CI/CD, deployment, or production-readiness decisions.
- Read [templates.md](references/templates.md) when producing a plan, knowledge inventory, traceability or state matrix, ADR, API policy, threat model, test strategy, delivery gates, risk register, or handoff report.
- For a small isolated implementation or review, use this file alone unless a decision above arises.
- Load only the reference required for the task; do not load both by default.

## Classify the work first

Choose the closest profile and scale rigor accordingly:

- **Assessment or prototype:** demonstrate required behavior with modest architecture, explicit trade-offs, deterministic tests, and a deployable artifact. Never present mocks or browser-only enforcement as production architecture.
- **Production feature:** integrate with existing contracts and operational controls; cover compatibility, telemetry, rollout, and recovery.
- **Production system design:** address trust boundaries, identity, data ownership, reliability, security, privacy, observability, deployment, and organizational ownership.
- **Review or diagnosis:** inspect and report with evidence. Do not implement, deploy, change contracts, or mutate external state unless asked.

Increase scrutiny for identity, money, health, regulated data, privacy, destructive actions, and non-idempotent writes.

## Scope and authority rules

1. Follow the user's requested outcome and constraints.
2. Read repository instructions and authoritative assets before proposing architecture.
3. Preserve the existing stack, contracts, and conventions unless evidence supports change.
4. Distinguish requirements, facts, assumptions, decisions, and suggestions.
5. Make reversible local engineering choices with a recorded assumption. Ask only when a choice materially changes product intent, risk, authority, or external state.
6. Do not add dependencies, backend changes, infrastructure, deployment, or external mutations merely because this skill describes them.
7. Do not invent unavailable requirements or claim checks that were not performed.

## Mandatory workflow

Follow this loop:

`Discover -> trace -> model -> decide -> plan vertical slices -> implement -> verify -> build artifact -> preview/deploy -> smoke/observe -> hand off`

### 1. Discover and baseline

- Read relevant repository instructions, product requirements, exact copy, wireframes, design tokens, API contracts, typed clients, mocks/fixtures, package scripts, runtime versions, tests, build configuration, deployment documentation, and adjacent implementation patterns.
- Inspect current git state and identify provided, generated, or immutable assets.
- When implementation is requested, run safe project-provided baseline checks when practical. Separate pre-existing failures from introduced failures.
- If authoritative sources conflict, identify the conflict and its impact instead of silently choosing.

### 2. Frame acceptance evidence

- Separate mandatory, optional, and out-of-scope behavior.
- Capture personas, journeys, exact content, boundary values, responsive behavior, accessibility, and non-functional constraints.
- Enumerate initial loading, background/stale, empty, filtered-empty, success, partial/degraded, validation, pending, error, retry, cancellation, conflict, and recovery states where applicable.
- Map each requirement to an implementation owner and observable evidence. Use the requirement and state templates for planning-sized work.

### 3. Model boundaries and state

- Sketch the user/browser, rendering boundary, frontend modules, APIs, identity/session, storage, third parties, trust boundaries, telemetry, build, and deployment path.
- Assign one source of truth to every state value: server cache, URL, form, local UI, durable preference, or derived calculation.
- Model multi-step and asynchronous flows as explicit legal transitions, including failure and recovery.
- Inventory important operations for cache/freshness, timeout, cancellation, retries, idempotency, concurrency, errors, authorization assumptions, and observability.

### 4. Decide deliberately

- Prefer the smallest architecture that meets present requirements and reuse installed capabilities before adding dependencies.
- Record material trade-offs and production differences; use an ADR for choices with meaningful consequences.
- Resolve rendering, routing, URL state, cache/invalidation, optimistic UI, validation, design-system, browser-support, security, telemetry, release, and rollback choices only when relevant.
- Escalate business, security, compliance, or irreversible policy decisions to the appropriate owner.

### 5. Plan and implement vertical slices

Order work to reduce uncertainty:

1. Baseline, contracts, configuration, and shell.
2. First complete critical happy path across UI, state, and API.
3. Loading, empty, validation, failure, retry, stale, cancellation, and concurrency behavior.
4. Responsive and accessibility hardening.
5. Security, performance, resilience, and observability proportionate to risk.
6. Automated checks and production artifact.
7. Authorized preview/deployment, smoke checks, rollback, and documentation.
8. Optional polish only after mandatory gates pass.

Give every phase an observable exit condition. Keep changes cohesive and avoid unrelated refactors.

### 6. Verify proportionately

- Use repository-provided lint, type, test, and build commands.
- Prefer risk-based tests of observable behavior through roles, labels, content, URL, network outcome, and visible state.
- Cover dangerous boundaries such as duplicate submit, server rejection, stale response, timeout, retry, cancellation, and recovery where relevant.
- Check responsive layout, keyboard/focus flow, critical screen-reader behavior, console/network errors, themes, reduced motion, and supported browsers manually when applicable.
- Test the production artifact or preview, not only the development server.
- Assert required runtime assets and configuration exist in the artifact.

### 7. Release and hand off

- Build once and promote the same verified immutable artifact.
- Deploy or mutate external systems only with authority. Use protected credentials/environments and a rollout proportionate to risk.
- Smoke-test the deployed critical path, reload/navigation behavior, configuration, telemetry, and rollback.
- Document completed scope, decisions, exact checks and results, artifact/commit identity, deployment status, rollback, assumptions, known gaps, and unverified items.

## Core invariants

- One authoritative owner per state value; derive values rather than synchronizing duplicates.
- Keep remote data in the project's server-state/data layer, not copied into presentation state.
- Keep transport behind typed boundaries; add runtime contract validation where risk warrants it.
- Define client validation once, but treat server validation and authorization as authoritative.
- Never automatically retry a non-idempotent mutation without an idempotency and reconciliation design.
- Accessibility, responsive behavior, failure handling, privacy, and operability are design inputs, not final polish.
- Use semantic HTML and existing design tokens before custom widgets or hard-coded design values.
- Build once, verify that artifact, promote it unchanged, smoke-test it, and retain a rollback path.

## Evidence standard

A completion report must state what changed, which acceptance behavior is covered, exact commands run and outcomes, manual checks actually performed, deployment/rollback status when applicable, and remaining risks.

Do not claim “all tests pass,” “accessible,” “production ready,” or “deployed successfully” without corresponding evidence. Mark unrun checks explicitly with a reason.

## Stop and request direction when

- authoritative requirements conflict materially;
- authentication, authorization, compliance, privacy, retention, or legal policy is missing;
- real-money or another non-idempotent production action has an ambiguous safety model;
- an API, persistence, or backend change exceeds the authorized frontend boundary;
- destructive migration, irreversible operation, credentials, DNS, production deployment, or external communication needs new authority;
- supported browsers/assistive technology or a product choice would significantly change scope or user outcomes.

Do not stop for routine reversible choices such as folder naming, local component decomposition, test placement, or equivalent implementation details. Proceed with a documented assumption.

## Compact definition of done

- Mandatory behavior, boundary states, and exact content have evidence.
- State ownership, data contracts, mutation semantics, and recovery behavior are explicit.
- Responsive and accessibility paths have been verified to the agreed support target.
- Security, privacy, performance, resilience, and observability are handled proportionately or deferred with an owner.
- Project checks and the production build pass from a clean environment.
- Required runtime assets/configuration and the deployed critical path are verified.
- Documentation, release identity, rollback, assumptions, and known issues are complete.

## Highest-risk anti-patterns

- Planning before inspecting the repository or implementing only the happy path.
- Copying server data into local/global state, storing derived data, or duplicating validation.
- Raw network calls in presentation components when a typed data boundary exists.
- Automatically retrying non-idempotent writes or treating client checks as authorization.
- Ignoring cancellation, races, stale responses, ambiguous outcomes, or duplicate submission.
- Adding routers, global stores, frameworks, or abstractions without demonstrated need.
- Altering canonical mocks/fixtures to make tests pass or testing implementation internals.
- Claiming accessibility from automation alone or shipping secrets/sensitive telemetry.
- Testing only a development server, rebuilding during deployment, or declaring completion without evidence.

## Local routing: Meridian Banking assessment

When working in the repository containing this skill:

1. Read `README.md`, then `brief/candidate-brief.md`, `wireframes/wireframe.md`, and `brief/api-contract.md`.
2. Consult `brief/design-tokens.css`, `DEPLOYMENT.md`, and `mock-api/README.md` as needed.
3. Reuse the provided typed client/types, formatters, test harness, MSW adapters, and design tokens.
4. Do not modify `mock-api/handlers.ts` or `mock-api/db.json` to satisfy UI/tests.
5. Use `DEVELOPMENT_PLAN.md` as a worked example; resolve drift in favor of the authoritative brief and API contract.
6. Treat browser MSW, refresh-reset data, static hosting, client search, and JavaScript-number amounts as assessment constraints, not real banking architecture.
