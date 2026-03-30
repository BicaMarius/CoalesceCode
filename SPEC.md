# SPEC.md — Product Specification

> Single source of truth for what this product does.
> No feature exists unless it's in this file. No code is written without a spec entry.
> Updated when requirements change — never delete, only deprecate.

---

## ◈ PRODUCT OVERVIEW

```
Product name:    CoalesceCode
Tagline:         Save developer weeks — understand any codebase in seconds
Problem solved:  Juniors and new team members waste days/weeks learning codebases file-by-file.
                 No AI has context large enough to explain the entire system clearly and usefully.
                 Companies lose time and money during onboarding periods.
Target user:     Developers (junior to senior), Engineering teams, Tech companies (B2B + B2C)
Core value prop: All critical aspects of a project (architecture, dependencies, flows, decisions)
                 in one place — visual, clear, and instantly understandable.
```

---

## ◈ USER PERSONAS

### Primary User: New Developer on Project

```
Who:         Junior/Mid-level developer joining an existing project
Goal:        Understand the codebase architecture, dependencies, and flows quickly
Frustration: Spends days reading scattered docs, outdated wikis, and digging through code
Tech level:  Intermediate (knows how to code, needs architectural context)
Context:     Desktop — first week onboarding, frequent reference after
```

### Secondary User: Engineering Manager / Tech Lead

```
Who:         Team lead responsible for onboarding and code knowledge transfer
Goal:        Reduce onboarding time, maintain up-to-date architectural documentation
Frustration: Constantly answering the same architecture questions, docs get outdated
Tech level:  Advanced
Context:     Desktop — team setup, documentation maintenance, new hire onboarding
```

---

## ◈ FEATURES — MVP SCOPE

> Status legend: ✅ Done | 🔨 In Progress | 📋 Planned | 🔜 Post-MVP | ❌ Excluded

### Feature: F01 — Architecture Diagram Visualization

**Status:** 🔨 In Progress
**Priority:** 🔴 Must Have

**Description:**
Generates and displays a visual architecture diagram for a GitHub repository, based on package files, source imports, and config file hints. Current version supports automatic node/edge generation and interactive node inspection in UI.

**User stories:**

- As a new developer, I want to see the system architecture at a glance so that I understand the overall structure without reading hundreds of files.
- As a tech lead, I want an auto-generated architecture diagram so that I don't have to manually maintain documentation.

**Acceptance criteria:**

- [x] Displays architecture diagram with modules, services, and connections
- [x] Node click opens details / editor context
- [ ] Diagram interaction includes zoom/pan
- [ ] Auto-refresh on repository structure changes (manual re-run exists)
- [ ] Exports diagram as PNG/SVG
- [x] Error state shown when analysis fails (invalid URL, GitHub errors)

**Out of scope for this feature:**

- Real-time collaborative editing of diagrams
- Manual diagram customization (MVP is auto-generated only)
- Historical diagram versions (coming in v2)

---

### Feature: F02 — Dependency Graph

**Status:** 🔨 In Progress
**Priority:** 🔴 Must Have

**Description:**
Dependency inventory for detected npm packages, with current/latest version comparison and risk categorization. Current implementation focuses on package-level insight and outdated dependency visibility.

**User stories:**

- As a developer, I want to see what depends on a specific module so that I know the impact of changing it.
- As a tech lead, I want to identify unused dependencies so that I can reduce technical debt.

**Acceptance criteria:**

- [x] Displays package dependency list with runtime/dev/security categories
- [ ] Shows internal module-to-module dependency graph
- [ ] Highlights circular dependencies
- [x] Click on a dependency to view details and upgrade command
- [x] Filter dependencies by category and outdated status
- [x] Handles package parse/network errors in analysis flow

**Out of scope for this feature:**

- Automated refactoring suggestions
- Dependency version upgrade recommendations (Post-MVP)

---

### Feature: F03 — User Flow Diagrams

**Status:** 📋 Planned
**Priority:** 🟡 Should Have

**Description:**
Generates flowcharts showing how users move through the application. Maps routes, authentication flows, and major user journeys. Helps developers understand the UX logic and where specific features fit in the user experience.

**User stories:**

- As a developer, I want to see user flows so that I understand the intended UX without reading product specs.
- As a product manager, I want to verify that user flows match requirements.

**Acceptance criteria:**

- [ ] Displays main user flows inferred from real routes/components
- [ ] Shows decision points and alternate paths
- [ ] Click on a step to see related real code files
- [ ] Export flows as image or PDF
- [ ] Fallback message when flow inference confidence is low

**Out of scope for this feature:**

- User analytics integration (which paths are actually used)
- A/B test flow variations

---

## ◈ NON-FUNCTIONAL REQUIREMENTS

### Performance

```
Page load (first contentful paint): < 2000ms on 4G connection
Diagram generation time:            < 5s for projects up to 1000 files
API response time (p95):            < 800ms
Concurrent users (initial target):  100
Data volume (initial):              Up to 10,000 files per project
```

### Security

```
Authentication:    None in current prototype (public repos only)
Authorization:     Not applicable in current stage
Data storage:      No persistent user/project storage yet
Sensitive input:   Optional GitHub token handled client-side only (ephemeral)
Rate limiting:     Inherited from external providers (GitHub/jsDelivr)
```

### Accessibility

```
Target standard:   WCAG 2.1 AA
Screen reader:     Yes — semantic HTML + ARIA labels
Keyboard nav:      Full support — diagrams navigable via keyboard
Color contrast:    Minimum 4.5:1 for text
```

### Browser / Device support

```
Browsers:  Chrome 110+, Firefox 115+, Safari 16+, Edge 110+
Mobile:    Desktop-first (mobile responsive planned for v2)
Viewport:  1280px minimum width recommended
```

### Availability & Reliability

```
Target uptime:     Prototype stage (no production SLA yet)
Data backup:       Not applicable (no persistence yet)
Error monitoring:  In-app analysis logs + manual debugging
Alerting:          Not configured in current stage
```

---

## ◈ DATA MODEL (high-level)

> Technical details in ARCHITECTURE.md. This section defines the _business entities_.

### Entity: RepositoryAnalysis (client-side, ephemeral)

```
Fields:        owner, repo, branch, detectedStack, nodes, edges, deps, debugLog
Relationships: Produced from one GitHub repository URL and kept in UI state only
Rules:         Must have valid owner/repo; if analysis fails, no partial persisted state
```

### Entity: DiagramNode

```
Fields:        id, label, type, color, x, y, w, h
Relationships: Referenced by DiagramEdge via from/to
Rules:         Node ids must be unique inside one analysis result
```

### Entity: DependencyItem

```
Fields:        name, cur, lat, old, type, risk
Relationships: Attached to one RepositoryAnalysis result
Rules:         cur is required; lat may fallback to cur when lookup fails
```

---

## ◈ USER FLOWS

### Flow: Analyze Public GitHub Repository

```
1. User opens app and pastes GitHub URL
2. User optionally adds GitHub token for higher rate limit
3. User clicks Analyze
4. App fetches repo metadata + tree + package/config/source hints
5. App builds architecture graph + dependency list
6. App opens Dashboard with tabs (architecture, dependencies, logs, etc.)

Error paths:
- Invalid URL: inline error under input
- GitHub API error/rate limit/private repo: analysis stops and error shown
```

### Flow: Explore Diagram

```
1. User opens Architecture tab
2. User clicks a node in the SVG graph
3. App navigates to Diagram Editor
4. User inspects node metrics or simulated swaps (DB/AI/microservice)

Error paths:
- No nodes detected: dashboard displays "No nodes detected" message
```

---

## ◈ OUT OF SCOPE (MVP)

> These are explicitly excluded from the current scope. Agreed and documented.

```
- Real-time collaboration (multiple users editing diagrams simultaneously)
- AI-powered code explanations (coming in v2)
- Historical version tracking of diagrams
- Mobile app (web responsive only)
- IDE plugins / extensions
- Integration with CI/CD pipelines
- Automated code quality metrics
- Custom diagram templates
- White-label / self-hosted version
```

---

## ◈ OPEN QUESTIONS

> Questions that need an answer before the related feature can be built.

| #   | Question                                                                       | Blocking which feature              | Owner                 | Due        |
| --- | ------------------------------------------------------------------------------ | ----------------------------------- | --------------------- | ---------- |
| Q01 | Keep analyzer fully client-side or add backend proxy in v0.x?                  | F01, F02 reliability and API limits | Product + Engineering | 2026-04-05 |
| Q02 | Prioritize real AST-based insights vs better diagram interaction/export first? | F01/F02 milestone ordering          | Product               | 2026-04-05 |
| Q03 | Define first paid feature boundary (free vs Pro)                               | Monetization and roadmap            | Product               | 2026-04-12 |

---

## ◈ CHANGE LOG

> Every time this spec changes, add an entry here.

| Date       | Change                                                                                | Reason                                         | Author            |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------- |
| 2026-03-29 | Updated feature statuses and acceptance criteria to match implemented prototype state | Documentation was ahead of real implementation | GitHub Copilot    |
| 2026-03-28 | Initial product definition populated (F01-F03, personas, NFRs)                        | Project initialization                         | Claude Sonnet 4.5 |
