# Modern Frontend System Design Reference

Read this reference when a task requires architecture, state/data/API decisions, cross-cutting quality, testing strategy, CI/CD, deployment, or production-readiness analysis. Scale every recommendation to the task's risk and existing repository conventions.

## Knowledge assets and authority

Inspect evidence before prescribing a stack or architecture.

| Asset class | Extract |
| --- | --- |
| Product requirements | Required, optional, prohibited, exact copy, actors, journeys, success measures |
| Interaction specification | Layout, responsive behavior, transitions, focus/keyboard behavior, empty/error/recovery states |
| Design system | Tokens, themes, type, spacing, breakpoints, primitives, contrast, motion constraints |
| Data contract | Operations, schemas, errors, pagination, freshness, idempotency, authorization assumptions |
| Runtime resources | Typed transport, formatters, configuration, feature flags, mocks/server adapters |
| Test resources | Harness, deterministic fixtures, network mocks, reset lifecycle, browser targets |
| Delivery resources | Scripts, runtime versions, CI, artifact shape, host settings, smoke checks, rollback |
| Current implementation | Established boundaries, reusable components, known debt, compatibility constraints |

Treat explicit product requirements and owned API contracts as authoritative within their domains. Generated code, mocks, and tests are evidence but may drift. If sources disagree, surface the conflict, identify the affected behavior, and ask the responsible owner when the outcome is material.

## Scale the design to risk

| Profile | Appropriate emphasis |
| --- | --- |
| Assessment/prototype | Required behavior, explainable structure, deterministic tests, deployment, explicit production gaps |
| Ordinary production feature | Compatibility, telemetry, failure recovery, rollout, ownership, maintainability |
| High-risk/regulated system | Threat model, formal controls, idempotency/reconciliation, auditability, SLOs, approvals, provenance |

Do not cargo-cult production controls into a time-boxed assessment. Do not portray assessment mocks, browser-only rules, floating-point money, or static hosting as a secure production banking system.

## System context and boundaries

Create a compact context/data-flow model covering:

- actors, browser/native shell, and rendering boundary;
- CDN/edge, frontend server, APIs/BFF, identity/session provider, storage, and third parties;
- sensitive data and trust-boundary crossings;
- module dependency direction and contract ownership;
- build-time versus runtime configuration;
- failure propagation, telemetry, release, and rollback paths.

Prefer feature-oriented vertical slices. A useful default dependency direction is:

`UI -> feature/application/domain -> infrastructure adapters`

Keep domain decisions out of presentation widgets and transport details out of domain logic. Avoid feature-to-feature cycles. Promote code to a shared layer only after repeated, stable use.

## State architecture

Assign a single source of truth based on lifetime and behavior:

| State kind | Default owner | Examples |
| --- | --- | --- |
| Server state | Query/cache or framework data layer | Account, profile, catalog, permission data |
| URL state | Router/search parameters | Shareable filters, pagination, navigable tabs |
| Form state | Form boundary | Raw inputs, dirty/touched state, field errors |
| Ephemeral UI state | Nearest feature/component | Dialog visibility, local step, disclosure |
| Persistent preference | Explicit persistence adapter | Theme, density, dismissed education |
| Derived state | Calculation from authoritative inputs | Totals, filtered results, remaining values |

Do not copy server responses into component/global state without a real synchronization requirement. Do not store a value that can be reliably derived.

Model asynchronous flows as explicit states and legal transitions. Consider initial loading, background refresh/stale, success, true empty, filtered empty, partial/degraded, validation failure, authorization failure, mutation pending, cancellation, timeout, conflict, failure, retry, and success acknowledgement. Choose intentionally whether one failed dependency fails a whole view or permits partial degradation.

## Rendering and navigation

Choose CSR, SSG, SSR, streaming, server components, islands, or a hybrid based on:

- SEO and social previews;
- personalization and authentication;
- first-byte/content latency and hydration cost;
- data cacheability and freshness;
- hosting/edge capabilities;
- interaction density and offline needs;
- operational complexity and team expertise.

Do not choose a rendering model by trend. A static authenticated tool may need only CSR; public content may benefit from static/server rendering.

Add routing when users need distinct navigation, history, deep links, or independently loaded areas. Put state in the URL when it should survive reload, support back/forward, or be shareable. Choose code-splitting at meaningful route/feature boundaries and define error boundaries and partial-render recovery.

## API and data design

### Contract boundary

- Keep HTTP/RPC/GraphQL mechanics behind typed service/query functions.
- Generate clients from an owned schema when practical.
- Remember that static types do not validate network input. Add runtime validation at trust boundaries when impact justifies it.
- Detect schema drift with contract tests and compatibility checks.
- Define error taxonomy, request correlation, versioning, pagination, rate limits, and deprecation ownership.

### Cache and concurrency

- Define stable keys, freshness, background refetch, deduplication, invalidation, and garbage-collection policies.
- Cancel superseded work with an abort mechanism or ignore obsolete responses deliberately.
- Prevent slow stale responses from overwriting newer state.
- Decide timeout ownership across browser, edge, and service layers.
- Use invalidation/refetch for simple correctness; patch cache when the mutation response is complete and instant consistency warrants extra logic.
- Use optimistic UI only when rollback is safe, conflicts are understood, and temporary false success is acceptable.
- Specify offline/degraded behavior and whether cached data may be displayed as stale.

### Mutations and ambiguous outcomes

Retry safe reads selectively with bounded exponential backoff and jitter. Do not automatically retry a non-idempotent write unless the system supplies an idempotency key and reconciliation semantics.

For important writes define:

- duplicate-submit protection;
- idempotency/replay behavior;
- concurrency/conflict handling;
- pending/confirmed/reversed states;
- what happens when the client times out after the server may have committed;
- how the client reconciles status safely;
- audit and diagnostic events without sensitive payloads.

Authorization and critical business rules remain server responsibilities even when the UI mirrors them for fast feedback.

## Forms and domain values

- Preserve raw input until parsing so blank, malformed, and valid values remain distinguishable.
- Define each client rule once and reuse it for blur/change and submit validation.
- Treat client validation as UX, never security.
- Map server field and form errors to controls and a recoverable alert/summary.
- Preserve user input across steps and recoverable failures.
- Focus or summarize the first invalid control; associate errors programmatically.
- Separate display formatting from domain representation.

For production money, agree on currency metadata, integer minor units or a decimal representation, rounding, fees, and conversion rules. JavaScript floating point is not an authoritative ledger type. Apply similar care to time zones, calendar rules, identifiers, and locale-sensitive values.

## Component, styling, and responsive architecture

- Use semantic HTML and native behavior before custom widgets.
- Use a proven accessible primitive when browser support or interaction complexity makes a custom implementation risky.
- Keep feature components close to their data and behavior; keep shared primitives small and stable.
- Use tokens for color, typography, spacing, shape, motion, layers, and layout.
- Avoid hard-coded values that duplicate the design system.
- Design from content and supported devices. Use media/container queries, logical properties, resilient wrapping, safe areas, and intrinsic sizing appropriately.
- Verify zoom/reflow, long content, localization expansion, reduced motion, forced colors, touch targets, and page-level overflow.
- Apply theme/preferences before first paint when a flash is visible; define persistence and system-default precedence.

## Accessibility

Use the project's declared target. For general production planning, discuss WCAG 2.2 AA and an explicit browser/assistive-technology matrix.

Verify:

- landmarks, heading hierarchy, semantic controls, names, descriptions, and state;
- complete keyboard operation, logical focus order, visible focus, modal containment, and focus restoration;
- visible labels, `aria-invalid`, stable error associations, error summary, and async announcements;
- contrast, non-color cues, target size, zoom/reflow, text spacing, reduced motion, and forced colors;
- screen-reader behavior through critical journeys;
- skeleton/loading behavior does not cause excessive announcements or layout shift.

Automated scans are necessary but insufficient. Include manual keyboard and assistive-technology smoke checks.

## Security and privacy

Perform a lightweight threat model: assets, actors, entry points, trust boundaries, misuse cases, controls, residual risk, and owner.

Assess when relevant:

- XSS/HTML injection, unsafe URL handling, CSP, and Trusted Types;
- CSRF for cookie-authenticated writes, CORS/credentials, clickjacking, and open redirects;
- authentication, session expiry/revocation, step-up authentication, and backend authorization;
- storage of tokens and sensitive data; never put secrets in browser bundles;
- service-worker scope, update, cache invalidation, offline behavior, and rollback;
- configuration validation and separation of public versus secret values;
- PII/sensitive-data redaction from URLs, logs, analytics, errors, replay tools, fixtures, and source maps;
- dependency provenance, lockfile enforcement, vulnerability policy, pinned CI actions, least-privilege/OIDC credentials, SBOM and provenance for higher-risk delivery;
- idempotency, replay prevention, duplicate detection, and reconciliation for sensitive actions.

Hidden controls, private routes, client validation, and obfuscation are not authorization.

## Performance

Set budgets appropriate to the product: shipped JavaScript/CSS, image/font weight, critical requests, and Core Web Vitals such as LCP, INP, and CLS under representative devices/networks.

- Measure production builds rather than assuming framework defaults are sufficient.
- Split code at meaningful boundaries and avoid unnecessary third-party code.
- Optimize images/fonts and prioritize truly critical resources.
- Deduplicate and schedule data requests intentionally.
- Preserve layout during loading and avoid unnecessary hydration/render work.
- Add memoization, virtualization, workers, or preloading only when measurement supports them.

## Resilience and observability

- Place error boundaries where they permit meaningful recovery.
- Define cancellation, timeout, retry, stale/degraded, offline, and maintenance behavior.
- Capture global errors and unhandled rejections with release/version identity.
- Use request correlation and privacy-safe structured events for critical journeys.
- Measure success/error/latency, abandonment, and web vitals using appropriate sampling.
- Establish dashboards, alert thresholds, ownership, synthetic checks, and rollback triggers for production.
- Keep diagnostic telemetry separate from immutable security/business audit records.
- Ensure source-map access and retention do not leak sensitive source or data.

## Testing strategy

Choose a risk-based portfolio rather than a rigid pyramid:

| Layer | Best use |
| --- | --- |
| Static checks | Types, lint, configuration, dependency mistakes |
| Unit | Pure rules, transformations, boundaries, request mapping, derivations |
| Component/integration | User-observable states/interactions with realistic network boundaries |
| Contract | Client/schema compatibility, errors, generated-client drift |
| E2E | Critical journeys against the production artifact/configuration |
| Accessibility | Automated scan plus manual keyboard/assistive-technology checks |
| Visual/responsive | High-value states, viewports, themes, zoom/reflow |
| Performance/security | Budgets, policies, dependency scanning, representative measurements |
| Post-deploy smoke/synthetic | Hosting, config, runtime assets, critical path, release health |

Assert through roles, labels, text, URL, visible state, and network outcome rather than component internals. Test boundaries and transitions: double submit, cancellation, retry, stale response, timeout, server rejection, and recovery. Count requests for dangerous writes. Keep fixtures deterministic and reset mutable mocks. Test the built/deployed artifact, not only development mode.

Use coverage as feedback, not a substitute for risk analysis. In teams, define flaky-test ownership, quarantine limits, and test-data lifecycle.

## Branching and collaboration

Prefer trunk-based development:

- protect `main` and keep it releasable;
- use short-lived branches and small cohesive pull requests;
- require relevant checks and reviewers/CODEOWNERS for sensitive areas;
- merge frequently using the agreed history policy;
- manage incomplete risky behavior with lifecycle-owned feature flags;
- tag releases and merge hotfixes back immediately.

Use release branches only for multiple supported versions or controlled release trains. Avoid GitFlow by default.

## CI/CD and release architecture

### Pull requests

1. Use the pinned runtime and lockfile with a deterministic clean install.
2. Cancel superseded runs and cache only reproducible inputs.
3. Run lint, type checks, unit/integration tests, and production build; parallelize independent work.
4. Validate environment configuration, public base paths, generated/runtime assets, and contract compatibility.
5. Run accessibility, security, dependency, and artifact-integrity checks proportional to risk.
6. Publish useful reports and one immutable artifact with commit SHA and digest metadata.
7. Create an isolated preview without production secrets and clean it up later.
8. Run critical E2E and smoke checks against that artifact.

### Deployment

1. Promote the exact verified artifact; do not rebuild downstream.
2. Use protected environments and short-lived/OIDC credentials.
3. Choose direct, canary, blue-green, or flag-based rollout based on blast radius and reversibility.
4. Smoke-test page load, configuration, runtime assets, critical reads/writes, and reload/navigation.
5. Compare error, latency, and experience signals with release thresholds.
6. Record commit, digest, environment, URL, approvals, and result.
7. Roll back or disable the feature when thresholds fail, then verify recovery.

Never expose production secrets to untrusted pull requests.

## Production decision ownership

Do not silently infer these choices from a frontend brief:

| Area | Questions requiring product/platform/security ownership |
| --- | --- |
| Identity/session | Provider, MFA/step-up, timeout, refresh/revocation, device trust |
| Authorization | Object/action entitlements and backend enforcement |
| Sensitive writes | Idempotency, replay protection, duplicate detection, reconciliation, audit |
| Money/domain precision | Representation, rounding, fees, currency/time/locale policy |
| API contract | Ownership, versioning, generated clients, compatibility, error taxonomy, rate limits |
| Reliability | SLOs, degraded behavior, failover, maintenance, ambiguous outcomes |
| Privacy/compliance | Consent, retention, residency, redaction, regulatory evidence |
| Browser/accessibility | Supported browser/device/AT matrix and WCAG target |
| Observability | Signals, privacy, retention, alert owners, release thresholds |
| Delivery | Environments, flags, approvals, rollout, rollback, incident process |

## Expanded anti-patterns

- Generic architecture written before repository inspection.
- A global store, router, framework, or component library added by default.
- Remote and derived data duplicated across stores.
- Validation repeated in schemas, handlers, and submit callbacks.
- Presentation components coupled directly to transport.
- Automatic retry of non-idempotent operations.
- UI visibility treated as authorization.
- Async races, cancellation, stale data, or ambiguous timeouts ignored.
- Hard-coded design values where tokens exist.
- Canonical fixtures changed to force tests to pass.
- Tests coupled to implementation selectors or private component state.
- Accessibility declared from automation alone.
- Client bundles containing secrets or PII-rich telemetry.
- Floating point used as the authoritative production money representation.
- Optional polish started before required states and recovery paths.
- Long-lived branches or permanent feature flags without necessity.
- Deployment rebuilt from different inputs than the tested artifact.

## Meridian assessment as a worked example

For the repository containing this skill, use this source order:

1. `README.md`
2. `brief/candidate-brief.md`
3. `wireframes/wireframe.md`
4. `brief/api-contract.md`
5. `brief/design-tokens.css`, `DEPLOYMENT.md`, and `mock-api/README.md` as needed

Reuse `src/api/client.ts`, `src/api/types.ts`, `src/lib/format.ts`, `src/test/setup.ts`, the mock adapters, and tokens. Do not edit `mock-api/handlers.ts` or `mock-api/db.json` to satisfy implementation/tests. `DEVELOPMENT_PLAN.md` is a synthesized example, while the brief and API contract remain authoritative.

The project's in-browser mock API, refresh-reset state, static hosting, client filtering, and JavaScript-number values are acceptable assessment constraints. A real banking design still requires authentication/authorization, precise monetary representation, server-side enforcement, idempotency/reconciliation, privacy/compliance controls, auditability, observability, resilient rollout, and rollback.
