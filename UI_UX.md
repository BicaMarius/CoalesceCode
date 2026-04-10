# UI_UX.md — Design Standards, Patterns & Wireframes
> Read before writing any UI component.
> This file defines how the product looks and feels — consistency is a feature.
> Wireframes live in `docs/wireframes/`.

---

## ◈ DESIGN DIRECTION

> Filled during onboarding. Updated only on major visual redesigns.

```
Style:          [modern / minimalist / aesthetic / cyber / retro / futuristic / custom]
Primary color:  [hex — e.g. #6366F1]
Accent color:   [hex]
Background:     [hex — light mode]
Background DK:  [hex — dark mode]
Font (display): [e.g. Inter / Geist / Syne]
Font (body):    [e.g. Inter / DM Sans]
Font (mono):    [e.g. JetBrains Mono / Fira Code]
Corner radius:  [sharp / subtle (4px) / rounded (8px) / very rounded (16px)]
Density:        [compact / comfortable / spacious]
Dark mode:      [Yes — default / Yes — optional / No]
Design reference: [Figma link / screenshot path / "none — agent decides"]
```

---

## ◈ ONBOARDING QUESTIONS (asked at first UI task)

When the first UI task begins, the agent asks these questions before any design decisions:

```
🎨 UI/UX setup — quick questions:

1. Do you have a wireframe or reference design I should follow?
   (Figma link, screenshot, or describe it)

2. What design direction fits your vision?
   Pick one (or describe your own):
   — Modern clean (lots of whitespace, minimal decoration)
   — Minimalist (brutally simple, nothing extra)
   — Aesthetic (soft gradients, glass effects, refined details)
   — Cyber / Tech (dark backgrounds, neon accents, grid patterns)
   — Retro (vintage colors, classic typography, nostalgic feel)
   — Futuristic (geometric, bold, forward-looking)
   — Playful (rounded everything, bright colors, fun)
   — Custom → describe it

3. Any specific color preferences? (brand colors, avoid certain colors?)

4. Dark mode: required / optional / not needed?

If you skip this, I'll apply professional defaults that work well for [product type].
```

---

## ◈ DESIGN PRINCIPLES (always applied)

These principles apply regardless of design direction. They are non-negotiable.

### Visual Hierarchy
Every screen has a clear primary action. The user's eye should naturally flow from most important to least important. Use size, weight, color, and spacing — not decoration — to create hierarchy.

Never compete for attention. If everything is emphasized, nothing is.

### Spacing & Proportion
Use a consistent spacing scale. Recommended: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px). Never use arbitrary spacing values like 11px or 23px.

Elements that are related should be close. Elements that are separate should have clear breathing room (Gestalt proximity principle).

### Typography
Body text minimum: 16px / 1rem.
Line height: 1.5–1.7 for body, 1.2–1.3 for headings.
Line length: 60–80 characters for body text (prevents eye fatigue).
Maximum 3 font sizes per screen. Maximum 2 font weights in a single block.

Never use `font-weight: 300` for body text — it fails contrast on most screens.

### Color & Contrast
WCAG AA minimum — non-negotiable:
- Body text on background: ≥ 4.5:1 contrast ratio
- Large text (18px+ regular or 14px+ bold): ≥ 3:1
- Interactive element states (focus, hover): clearly distinguishable
- Never use color alone to convey information (add icon, text, or pattern)

Semantic color usage:
- 🔴 Red → errors, destructive actions, danger
- 🟡 Amber/Yellow → warnings, caution
- 🟢 Green → success, confirmation, positive
- 🔵 Blue → information, primary actions, links
- Gray → secondary text, disabled states, borders

### Alignment
Left-align text in most cases. Center only for short headings, CTAs, or empty states.
Right-align numbers in tables (makes comparison easier).
Everything aligns to a grid. No floating elements.

### Touch Targets
Minimum 44×44px for all interactive elements (iOS HIG / WCAG 2.5.5).
Buttons should feel easy to tap, not precise to click.
Spacing between adjacent targets: minimum 8px.

### Loading States
Every async operation needs a loading state. Never leave the user wondering if something is happening.
- Short operations (< 500ms): delay showing loader to avoid flicker
- Long operations (> 1s): show progress or spinner
- Page-level loads: skeleton screens (not spinners) to preserve layout

### Empty States
Every list, table, or feed must have an empty state.
Empty states should: explain why it's empty + suggest what to do next (call to action).
Never show a blank white area.

### Error States
Errors must be: specific (what went wrong), helpful (what to do about it), non-blaming (not the user's fault unless it is).
Inline validation: show errors after blur, not while typing.
Form submission errors: show at field level AND summarize at form level for long forms.

---

## ◈ COMPONENT PATTERNS

> Standard patterns the agent follows when building UI.

### Buttons
```
Primary:    Filled background, white text — one per view
Secondary:  Outlined, matches primary color
Ghost:      No border, subtle hover
Danger:     Red — only for destructive actions (always confirm first)
Disabled:   50% opacity, cursor not-allowed, no pointer events
Loading:    Replace label with spinner + "Loading..." — prevent double submit
```

Size scale:
- Small: 32px height, 12px text, 12px padding horizontal
- Medium (default): 40px height, 14px text, 16px padding
- Large: 48px height, 16px text, 20px padding

### Forms
- Labels above inputs (not inside as placeholder-only)
- Placeholder text for hints, never as labels
- Error message below the input, in red, 12px, with icon
- Required fields marked with * and explained at form start
- Submit button at the bottom, aligned to the input column
- Disable submit while submitting (prevent double POST)

### Cards
Border radius matches design direction.
Consistent padding (16px for compact, 24px for comfortable).
Cards in a grid: equal height via flexbox `align-items: stretch`.
Interactive cards: hover state with slight lift (subtle box-shadow or border change).

### Tables
- Header: slightly darker background, sticky on scroll for long tables
- Row hover: subtle background highlight
- Right-align numbers
- Left-align text
- Sortable columns: clear sort indicator (↑↓)
- Responsive: horizontal scroll on mobile, or collapse to cards

### Modals & Dialogs
- Overlay: semi-transparent dark backdrop
- Close: X button top-right + Esc key + click outside
- Width: max 560px for forms, max 480px for confirmations
- Scroll: modal height max 80vh, internal scroll if content overflows
- Stacking: max 2 modals deep — if you need 3, rethink the UX

### Navigation
- Active state: visually distinct (not just bold)
- Mobile: hamburger menu or bottom tabs (never tiny desktop nav on mobile)
- Breadcrumbs: for 3+ level deep pages
- Back button: always available on mobile

---

## ◈ RESPONSIVE BREAKPOINTS

```
Mobile (default):   0–767px
Tablet:             768px–1023px
Desktop:            1024px–1279px
Wide:               1280px+
```

Design mobile-first. Every component starts with the mobile layout, then expands.

Critical mobile rules:
- No horizontal scroll on any mobile viewport
- All text readable without zooming
- No hover-dependent functionality (touch has no hover state)
- Forms: input type="email" on email fields, type="tel" on phone fields (triggers correct keyboard)

---

## ◈ ANIMATION & MOTION

Use motion purposefully, not decoratively.

**Appropriate uses:** page transitions (subtle fade), loading feedback, success confirmation, attention to errors.

**Duration scale:**
- Micro (button press, checkbox): 100–150ms
- Component (modal open, dropdown): 200–300ms
- Page (route transition): 300–400ms
- Never animate longer than 400ms for UI transitions

**Easing:** `ease-out` for elements entering · `ease-in` for elements leaving · `ease-in-out` for transformations

**Accessibility:** Always wrap in `@media (prefers-reduced-motion: no-preference)`. Users who need reduced motion get instant transitions.

---

## ◈ ACCESSIBILITY CHECKLIST

Run before every Stage 7 sign-off on UI work:

- [ ] All images have descriptive alt text (or `alt=""` if decorative)
- [ ] All interactive elements are keyboard reachable (Tab order is logical)
- [ ] Focus state is visible on all interactive elements
- [ ] Form inputs have associated `<label>` (not just placeholder)
- [ ] Error messages are associated with inputs via `aria-describedby`
- [ ] Color contrast ≥ 4.5:1 for body text (check with browser DevTools)
- [ ] No content depends on color alone
- [ ] Loading states announced to screen readers (`aria-live="polite"`)
- [ ] Modal closes on Esc, returns focus to trigger element
- [ ] Touch targets ≥ 44×44px on mobile

**Tools to use:**
- Browser DevTools → Accessibility panel (Chrome / Firefox)
- axe DevTools extension (free browser extension)
- WCAG Color Contrast Checker: https://webaim.org/resources/contrastchecker/

---

## ◈ WIREFRAME PROTOCOL

Wireframes are generated after the design direction is established.
They live in `docs/wireframes/` as Mermaid diagrams or markdown descriptions.
They are updated only when major UI changes occur.

**What the agent generates:**
- Low-fidelity wireframes in Mermaid (structural layout, not visual detail)
- Component inventory (what components exist on each screen)
- Interaction notes (what happens when X is clicked)

**Format for wireframes:**

```
Screen: [Screen Name]
Route:  /[path]

Layout:
┌─────────────────────────────────┐
│  HEADER — Logo · Nav · User     │
├─────────────────────────────────┤
│  PAGE TITLE                     │
│  Subtitle / description         │
├─────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐    │
│  │  Card 1   │ │  Card 2   │    │
│  │  [title]  │ │  [title]  │    │
│  │  [body]   │ │  [body]   │    │
│  └───────────┘ └───────────┘    │
├─────────────────────────────────┤
│  [CTA BUTTON]  [Secondary]      │
└─────────────────────────────────┘

Components needed:
- PageHeader
- CardGrid
- Card (reuse existing or create new?)
- ButtonGroup

Interactions:
- Click Card 1 → navigate to /detail/:id
- Click CTA → open modal
- Click Secondary → navigate back
```

---

## ◈ DESIGN REVIEW CHECKLIST

Before presenting UI work for Stage 7 approval, the agent confirms:

**Layout:**
- [ ] No overflow at 320px, 768px, 1024px viewports
- [ ] All grid items equal height in the same row
- [ ] Nothing extends outside its container
- [ ] No unexpected horizontal scrollbar

**Typography:**
- [ ] Body text ≥ 16px
- [ ] Heading hierarchy makes sense (h1 → h2 → h3, no skipping)
- [ ] No orphaned words (single word on its own line) in key headings
- [ ] Numbers right-aligned in tables

**Interaction:**
- [ ] All buttons have hover, focus, active, and disabled states
- [ ] Form fields have focus rings
- [ ] Loading states shown for all async operations
- [ ] Empty states shown for all list views

**Accessibility:**
- [ ] Contrast ≥ 4.5:1 for body text
- [ ] All interactive elements keyboard reachable
- [ ] Focus visible

**⚠️ Needs manual visual check:**
- Actual visual appearance (agent generates code, human verifies look)
- Animation smoothness
- Font rendering (especially on Windows ClearType vs macOS)
- Print stylesheet (if applicable)
