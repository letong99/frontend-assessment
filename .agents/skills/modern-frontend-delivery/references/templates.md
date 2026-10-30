# Frontend Delivery Templates

Use only the templates needed for the current task. Remove irrelevant columns instead of creating documentation for its own sake. Replace placeholder text with repository evidence and mark unknowns explicitly.

## 1. Knowledge-asset inventory

Use during discovery for a new codebase or broad feature.

```text
Asset class | Path/owner | What it defines | Authority level | Constraints/reuse | Conflicts/gaps
Product requirements | | | | |
Interaction/wireframes | | | | |
Design system/tokens | | | | |
API/schema/contracts | | | | |
Runtime utilities | | | | |
Mocks/fixtures | | | | |
Test harness | | | | |
Build/deployment | | | | |
Current implementation | | | | |
```

## 2. Scope framing

Use before planning a feature or assessment.

```text
Outcome:
Primary users/journeys:
Required:
Optional:
Out of scope:
Exact content/business rules:
Non-functional requirements:
Constraints and immutable assets:
Assumptions:
Open decisions and owners:
```

## 3. Requirement traceability

Map each acceptance statement to implementation and observable proof.

```text
ID | Source | Expected behavior | States/boundaries | Implementation owner/module | Test/evidence | Status
```

Suggested status values: `unplanned`, `planned`, `implemented`, `verified`, `deferred`, `blocked`.

## 4. UI state matrix

Use for each asynchronous or interactive area. Omit states that genuinely cannot occur.

```text
Area | Initial loading | Background/stale | Empty | Filtered empty | Success | Partial/degraded | Validation | Pending | Error | Retry/recovery | Accessibility
```

## 5. System-context and data-flow checklist

Use for new applications, broad features, or production-readiness review.

```text
Actors:
Browser/native shell and rendering model:
Frontend modules and dependency direction:
APIs/BFF and contract owners:
Identity/session boundary:
Storage/cache locations:
Third parties:
Sensitive data and trust-boundary crossings:
Critical read flow:
Critical mutation flow:
Failure propagation and recovery:
Telemetry/correlation:
Build-time configuration:
Runtime configuration:
Artifact, deployment, promotion, rollback:
```

## 6. State ownership inventory

Use when state could be duplicated or placed in multiple stores.

```text
State | Source of truth | Owner/layer | Lifetime | Persistence | Derivation | Invalidation/update event | Consumers
```

Common owners: server cache, URL, form, nearest UI component, persistent preference adapter, derived calculation.

## 7. Lightweight decision record

Use for a material, non-obvious, or difficult-to-reverse choice.

```text
Title:
Status/date/owner:
Context:
Decision drivers:
Options considered:
Decision:
Rationale:
Consequences and trade-offs:
Production difference (if prototype/assessment):
Reversal signal/migration path:
Verification:
```

## 8. API operation policy

Use for important reads and every consequential mutation.

```text
Operation and owner:
Request/response contract:
Authentication/authorization assumption:
Cache key and freshness:
Invalidation/update behavior:
Timeout owner:
Cancellation/race behavior:
Retry policy:
Idempotent? Idempotency mechanism:
Concurrency/conflict policy:
Optimistic behavior/rollback:
Ambiguous-outcome reconciliation:
Field/general errors and UI mapping:
Privacy-safe observability:
Contract-test evidence:
```

## 9. Lightweight threat model

Use for production work involving identity, sensitive data, privileged actions, payments, uploads, or third parties.

```text
Asset/data | Actor/threat | Entry point/trust boundary | Misuse/failure | Existing control | Required mitigation | Residual risk | Owner/evidence
```

Prompt areas:

```text
XSS/injection | unsafe URLs | CSRF | CORS/credentials | clickjacking | open redirects
session/token storage | authorization | secrets/config | PII in telemetry/URLs
dependency/supply chain | service worker/cache | replay/duplicate actions
```

## 10. Vertical-slice delivery plan

Use for work spanning more than one implementation step.

```text
Phase | User-visible outcome | Included requirements | Key changes | Verification | Exit condition | Risks/dependencies
```

Recommended sequence:

```text
0 Baseline/contracts
1 First end-to-end happy path
2 Loading/empty/error/retry/concurrency states
3 Responsive/accessibility hardening
4 Security/performance/observability
5 Automated checks and production artifact
6 Preview/deploy/smoke/rollback
7 Documentation/handoff
```

## 11. Risk-based test matrix

Use to select tests by failure impact, not arbitrary counts.

```text
Risk/requirement | Layer | Scenario/boundary | Observable assertion | Fixture/mock/data | Environment | Evidence/status
```

Potential layers: static, unit, component/integration, contract, E2E, accessibility, visual/responsive, performance/security, post-deploy smoke.

## 12. Pull-request quality gate

Adapt to repository scripts and risk.

```text
[ ] Scope and acceptance IDs are clear
[ ] Locked clean install succeeds
[ ] Lint/type/static checks pass
[ ] Unit/component/integration tests pass
[ ] Contract/security/dependency checks pass where required
[ ] Production build succeeds
[ ] Required runtime assets/configuration are asserted
[ ] Preview uses no production secrets
[ ] Critical E2E/accessibility checks pass where required
[ ] Decisions, screenshots/evidence, and known risks are documented
[ ] Change is cohesive and rollback/flag behavior is understood
```

## 13. Release and deployment gate

Use before production or public assessment deployment.

```text
Artifact ID/digest:
Commit SHA/tag:
Environment/URL:
Verified checks:
Preview/E2E result:
Configuration/runtime-asset validation:
Approval:
Rollout strategy:
Post-deploy smoke result:
Release metrics/thresholds:
Rollback method and verification:
Deployment record/owner:
```

Compact status row:

```text
Artifact | checks | preview/E2E | approval | deploy | smoke | metrics | rollback | docs
```

## 14. Definition of done

Tailor this list; do not mark items without evidence.

```text
[ ] Mandatory acceptance behavior and exact content are verified
[ ] Applicable loading/empty/success/degraded/error/retry/stale/concurrent states work
[ ] One source of truth exists for each state value; derived/remote data are not duplicated
[ ] API/cache/timeout/cancellation/retry/idempotency/error policies are explicit
[ ] Responsive viewports and supported browsers have been checked
[ ] Keyboard/focus/labels/errors/announcements/contrast/reflow/motion checks pass
[ ] Security/privacy review is proportionate; no client secrets or sensitive telemetry ship
[ ] Performance and observability targets pass or have documented owners
[ ] Clean lint/type/test/build commands pass
[ ] Required runtime assets/configuration exist in the immutable artifact
[ ] Preview/deployed critical path and reload behavior pass
[ ] Release identity, rollback, documentation, assumptions, and known issues are complete
```

## 15. Handoff and evidence report

Use at the end of implementation, review, or deployment work.

```text
Outcome:
Scope/acceptance IDs completed:
Changed files/areas:
Key decisions and trade-offs:
Commands run and exact results:
Automated behavior covered:
Manual browser/responsive/keyboard/AT/console/network checks:
Artifact ID and commit SHA:
Deployment URL/status and smoke result:
Rollback method/result:
Assumptions:
Known gaps/risks:
Not run or unverified (with reason):
Recommended next action:
```

## 16. Risk register

Use when a risk needs ownership or mitigation across phases.

```text
Risk | Likelihood | Impact | Detection signal | Prevention/mitigation | Contingency/rollback | Owner | Status
```
