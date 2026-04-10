# TESTING.md — Smart Testing Strategy

> The agent reads this before writing any test.
> Tests are not a checkbox — they are executable proof that the feature works.
> The agent suggests the right test type for each feature, implements what it can,
> and explicitly flags what requires manual verification with a ⚠️ disclaimer.

---

## ◈ CORE PRINCIPLE — TEST THE RIGHT THING

Before writing a single test, the agent asks:

1. What type of feature is this? (see Feature Type Matrix below)
2. What are the failure modes that matter to the user?
3. Which tests can be automated, and which need a human?

One test, one reason to fail. Tests that can fail for multiple reasons are two tests in a disguise.

---

## ◈ TEST PYRAMID

```
         ┌─────────────────┐
         │   E2E Tests     │   Few · Slow · Critical user paths only
         │   (Playwright)  │
         └────────┬────────┘
                  │
        ┌─────────┴──────────┐
        │  Integration Tests  │   Moderate · How modules work together
        │  (Vitest + MSW)     │
        └─────────┬───────────┘
                  │
      ┌───────────┴────────────┐
      │      Unit Tests         │   Many · Fast · Pure logic + utilities
      │      (Vitest)           │
      └─────────────────────────┘
```

Rule of thumb: 70% unit · 20% integration · 10% E2E

---

## ◈ FEATURE TYPE TEST MATRIX

> The agent uses this to decide what tests to write and suggest for each task.
> Match the feature to a type, then apply the corresponding checklist.

---

### TYPE: Authentication & Authorization

**What to test:**

- Login with valid credentials → success + correct session
- Login with invalid credentials → correct error, no session created
- Login attempt after account lockout → rejected
- Token expiry → session invalidated, redirect to login
- Refresh token rotation → new token issued, old one revoked
- Route access with insufficient permissions → 403, not 404
- Route access with expired session → redirect to login, not crash
- CSRF protection on auth endpoints (manual ⚠️)
- Brute force protection — rate limiting (integration test with mocked rate limiter)
- Password reset flow end-to-end (E2E)
- "Remember me" vs session-only cookie behavior

**Automation level:** Unit (token logic) + Integration (endpoint behavior) + E2E (full login flow)

**⚠️ Manual verification required:**

- OAuth provider flows (Google, GitHub etc.) — can't be automated without real credentials
- Email delivery for magic links / reset codes
- Physical MFA device (TOTP can be simulated, hardware keys cannot)

---

### TYPE: REST API Endpoints

**What to test:**

- Happy path: correct input → correct response + status code
- Validation errors: missing required fields → 400 with descriptive message
- Type mismatches: string where number expected → 400
- Authorization: unauthenticated request → 401
- Authorization: insufficient permissions → 403
- Resource not found → 404 (not 500)
- Duplicate creation (unique constraint) → 409
- Large payload → 413 or graceful truncation
- Pagination: page 1, page 2, last page, beyond last page
- Sorting and filtering: all combinations of query params
- Rate limiting behavior (integration test)

**Test implementation pattern:**

```typescript
describe("POST /api/items", () => {
  it("returns 201 with created item on valid input");
  it("returns 400 when required field 'name' is missing");
  it("returns 400 when 'price' is a negative number");
  it("returns 401 when Authorization header is missing");
  it("returns 403 when user does not own the parent resource");
  it("returns 409 when item with same name already exists for this user");
});
```

**⚠️ Manual verification required:**

- Actual network timeout behavior under load
- Third-party webhook delivery and retry logic

---

### TYPE: Database / Data Model

**What to test:**

- Correct data is written and readable after a write
- Constraints enforced: unique, not-null, check constraints
- Cascading deletes work as intended (or don't, if not intended)
- Migrations run cleanly on a fresh database
- Migrations are reversible (if reversibility is required)
- Indexes exist on columns used in frequent queries (explain analyze)
- Soft delete: deleted records excluded from queries, accessible via admin

**Implementation note:** Test against a real test database (not mocked), using transactions that roll back after each test. Never test DB logic against a mock — mocks can't catch constraint violations.

**⚠️ Manual verification required:**

- Performance of queries at realistic data volume (10k+ rows)
- DB connection pool behavior under concurrent load
- Backup and restore procedures

---

### TYPE: AI / LLM Integration

**What to test:**

This feature type requires a specific testing strategy. Automated tests can verify structural correctness, but AI output quality requires human evaluation and dedicated test sets.

**Automated tests (always implement):**

- The request reaches the LLM provider and returns a response (integration test with real API in CI, or mocked response for unit tests)
- The response is parsed correctly (structure, expected fields present)
- Rate limit handling — correct retry behavior when 429 is received
- Timeout handling — fallback or error message when LLM takes too long
- Error handling — graceful degradation when LLM API is down
- Cost guardrails — token limits enforced (if applicable)

**Evaluation sets (generate these):**
The agent will generate these when implementing an AI feature:

```
TRAINING SET (examples the model should handle well):
- [5-10 representative "happy path" inputs with expected output characteristics]

TEST SET (held out — not used during prompt tuning):
- [5-10 varied inputs including edge cases — used to measure quality]

ADVERSARIAL SET (inputs designed to break the feature):
- Empty input
- Extremely long input (>4000 tokens)
- Input in a different language
- Input with special characters, code, or injection attempts
- Input that is semantically valid but logically contradictory
```

**Quality metrics to track (manual or semi-automated):**

- Output relevance score (human rating 1-5)
- Hallucination rate (factual claims that are wrong)
- Format compliance (does output match expected structure)
- Latency (p50, p95, p99)

**⚠️ Manual verification required:**

- Output quality assessment — automated tests can verify structure but not quality
- Prompt injection resistance — verify the model doesn't follow instructions embedded in user input
- Bias and safety evaluation — especially if user content is passed to the model
- Cost per feature activation (track early, not after launch)

---

### TYPE: Frontend Components

**What to test:**

- Renders correctly with valid props (visual snapshot optional, targeted assertions preferred)
- Renders correctly with empty/null/undefined props (graceful empty state)
- Interactive elements respond correctly: buttons, inputs, selects
- Form submission: correct data sent, correct feedback shown
- Loading state: skeleton / spinner shown during async operations
- Error state: error message shown, retry available if applicable
- Accessibility: keyboard navigation works, ARIA labels present
- Mobile viewport: no overflow, no broken layout (see UI_UX.md for breakpoints)

**Specific UI checks (always run before Stage 7):**

- No text overflow (cut-off labels, overflowing containers)
- No broken flex/grid alignment
- Minimum touch target 44x44px for interactive elements
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text
- Focus visible on all interactive elements
- Form inputs have associated labels (not just placeholders)

**Test implementation pattern:**

```typescript
describe("UserCard", () => {
  it("renders user name and email");
  it("shows 'Unknown user' when name is null");
  it("triggers onDelete when delete button is clicked");
  it("disables delete button when isDeleting is true");
  it("shows loading skeleton when isLoading is true");
});
```

**⚠️ Manual verification required:**

- Visual design accuracy (automated tests verify behavior, not aesthetics)
- Animations and transitions
- Cross-browser rendering (Chrome, Safari, Firefox — especially Safari on iOS)
- Screen reader experience (automated axe checks catch structure, not full UX)

---

### TYPE: Real-time Features (WebSocket / SSE)

**What to test:**

- Connection establishes correctly
- Messages are received and displayed in the correct order
- Reconnection logic: connection drops and recovers
- Multiple clients: message sent by client A appears on client B
- Stale data: client that reconnects after absence receives missed messages (if applicable)
- Graceful degradation: feature doesn't break if WebSocket is unavailable

**⚠️ Manual verification required:**

- Behavior under high message volume (stress test)
- Memory leaks from unclosed connections
- Battery drain on mobile devices

---

### TYPE: File Upload / Storage

**What to test:**

- Valid file type → upload succeeds, URL returned
- Invalid file type → rejected with descriptive error
- File size at limit → accepted
- File size over limit → rejected before upload starts (client-side) and at upload (server-side)
- File with malicious name (path traversal: `../../etc/passwd`) → sanitized
- Upload progress: progress indicator updates correctly
- Upload cancellation: partial upload cleaned up
- Storage availability: graceful error when storage is unavailable

**⚠️ Manual verification required:**

- File type validation by content (magic bytes), not just extension
- Virus/malware scanning (if applicable)
- Large file upload behavior on slow connections

---

### TYPE: Payment / Billing

**What to test (always use Stripe test mode / sandbox):**

- Successful payment → order created, confirmation shown
- Declined card → clear error, no order created, user can retry
- Insufficient funds → specific error message
- 3DS / additional auth required → handled correctly
- Webhook: payment succeeded → order status updated
- Webhook: payment failed → user notified, access not granted
- Idempotency: duplicate webhook events don't create duplicate records
- Refund flow (if applicable)

**⚠️ Manual verification required:**

- Real payment in production (one test transaction before launch)
- Stripe dashboard matches application state
- Tax calculation accuracy (if applicable)
- Invoice PDF generation

---

### TYPE: Email / Notifications

**What to test:**

- Email is sent when expected trigger fires
- Email is NOT sent when conditions aren't met
- Email content contains correct personalized data
- Email is not sent twice for the same event (idempotency)
- Unsubscribe/notification preferences respected
- Retry behavior when email provider is temporarily down

**⚠️ Manual verification required:**

- Actual email rendering in Gmail, Outlook, Apple Mail
- Spam score (run through mail-tester.com before launch)
- Plain-text version renders correctly
- Links in email work correctly

---

## ◈ ADVERSARIAL MATRIX — APPLIES TO ALL FEATURE TYPES

For every feature, these attack vectors are checked before marking "tested":

**Input attacks:**
Every input field is tested with: empty value · whitespace only · minimum valid value · maximum valid value · value exceeding maximum by 1 · `<script>alert(1)</script>` · `'; DROP TABLE users; --` · `null` · `undefined` · `0` · `-1` · extremely long string (10× max) · unicode (emoji, RTL, zero-width) · path traversal (`../../etc/passwd`)

**State attacks:**
Double submit (click twice rapidly) · network interruption mid-request · unauthenticated user · insufficient permissions · deleted resource · resource owned by another user · expired session mid-workflow

**Concurrency attacks:**
Two users same resource simultaneously · same user two tabs simultaneously · rapid sequential mutations

**Data boundary attacks:**
Empty list · exactly 1 item · page 2 when only 1 page exists · filter to zero results · sort on nullable column

---

## ◈ TEST NAMING CONVENTION

```typescript
// Format: "[unit] [action] when [condition]"
describe("formatCurrency", () => {
  it("returns '€0.00' when given 0");
  it("returns '€1,234.56' when given 1234.56");
  it("throws RangeError when given Infinity");
});

describe("POST /api/items", () => {
  it("returns 201 with item when input is valid");
  it("returns 400 with validation error when name is missing");
  it("returns 401 when user is not authenticated");
});
```

---

## ◈ WHAT THE AGENT GENERATES VS WHAT NEEDS A HUMAN

| What                    | Agent generates                    | Human verifies                    |
| ----------------------- | ---------------------------------- | --------------------------------- |
| Unit test cases         | ✅ Automatically                   | ✅ Code review                    |
| Integration test cases  | ✅ Automatically                   | ✅ Code review                    |
| E2E test scripts        | ✅ Automatically                   | ✅ Runs locally to confirm        |
| LLM eval sets           | ✅ Agent generates examples        | ✅ Human rates output quality     |
| Visual design accuracy  | ❌ Agent can't see                 | ✅ Human reviews in browser       |
| Email rendering         | ❌ Agent can't see                 | ✅ Human checks in email clients  |
| OAuth flows             | ❌ Needs real provider             | ✅ Human tests with real account  |
| Performance under load  | ❌ Needs load test env             | ✅ Human runs k6 / Artillery      |
| Accessibility (full)    | ⚠️ Partial (axe catches structure) | ✅ Human tests with screen reader |
| Cross-browser rendering | ❌ Needs real browsers             | ✅ Human checks Safari/Firefox    |

---

## ◈ COVERAGE TARGETS

```
src/lib/**            90%+ line coverage (pure utilities)
src/services/**       80%+ line coverage (business logic)
src/app/api/**        75%+ line coverage (API routes)
src/components/**     Key interactions covered — not percentage targets
E2E                   All critical user flows covered
```

Coverage is a signal, not a target. 90% coverage with bad tests is worse than 60% with precise tests.

---

## ◈ COMMANDS

```bash
pnpm test                  # Watch mode
pnpm test:run              # CI mode (once, no watch)
pnpm test:coverage         # Generate coverage report
pnpm test:e2e              # E2E (needs dev server)
pnpm test:e2e --headed     # E2E with visible browser (debugging)
```
