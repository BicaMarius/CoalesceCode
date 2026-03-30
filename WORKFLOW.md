# WORKFLOW.md — Detailed Process Guide

> The step-by-step manual for how work gets done in this project.
> CLAUDE.md contains the rules. This file explains the _why_ behind the workflow
> and gives enough detail to handle edge cases and unusual situations.

---

## ◈ THE CORE PRINCIPLE

Every task follows the same pipeline regardless of size.
A two-line bug fix and a multi-day feature both go through the same stages.
The stages scale in depth — a bug fix's "planning" stage takes 30 seconds,
a new feature's takes 15 minutes — but none are skipped.

Why? Because the cost of a skipped stage is always higher than the time saved.
Skipping "verification" adds a bug. Skipping "documentation" adds confusion.
Skipping "user validation" means building the wrong thing confidently.

---

## ◈ PRE-TASK: SESSION START

When a session begins, before any user interaction, the agent does the following silently:

It reads SESSION_LOG.md to understand the current state — what was done last, what was in progress, and what should be the first action. Then it reads SPEC.md to understand the product and confirm the upcoming work aligns with requirements. Then it scans KNOWN_ISSUES.md for anything relevant to the likely work area. Finally, it reads ARCHITECTURE.md if the task is likely to involve structural decisions.

This reading takes no visible time from the user's perspective but ensures the agent starts with full context rather than asking questions that would be answered by these files.

---

## ◈ STAGE 0: ONBOARDING — THE RIGHT QUESTIONS

The onboarding conversation is an art form. Too many questions and the developer feels interrogated. Too few and the agent builds the wrong thing. The goal is to ask only what cannot be inferred from the codebase and context files.

**Questions the agent should NEVER ask** (because it can find out itself):

- "What framework are you using?" (it's in package.json and ARCHITECTURE.md)
- "What database are you on?" (it's in ARCHITECTURE.md)
- "Have you set up auth?" (it's visible in the codebase)
- "What's the current version?" (it's in package.json)

**Questions that are always worth asking:**

- "What do you want to accomplish in this session?" (the agent cannot know intent)
- "Any specific approach you want me to take?" (preferences that override the agent's defaults)
- "Are there constraints I should know about?" (things not visible in code — deadlines, dependencies, "don't touch X")

**The optional questions** are framed as: "I'll decide this myself unless you have a preference." This respects the developer's time while giving them control when they want it.

After receiving answers, the agent writes a Task Brief — a short, concrete statement of what will be built, how, and what the expected outcome is. This brief is confirmed before any code is written. This step prevents the most expensive mistake: building the right code for the wrong interpretation of the task.

---

## ◈ STAGE 1: CONTEXT READ — EFFICIENT, NOT EXHAUSTIVE

Reading context is about finding relevant information, not reading everything.

The agent navigates files by heading structure. For a task involving authentication, it reads the "Auth & Authorization" section of ARCHITECTURE.md, the auth-related entries in KNOWN_ISSUES.md, and the relevant features in SPEC.md. It does not re-read sections it already processed earlier in the same session.

**Token economy principle:** Every token spent reading context that isn't used is a token stolen from writing code. Read precisely. Navigate by heading. Stop when you have what you need.

---

## ◈ STAGE 2: PLANNING — THINK BEFORE TOUCHING FILES

Before editing a single file, the agent builds a mental plan:

First, it decomposes the task into sub-tasks. A "feature" is rarely one thing — it's usually 3-7 smaller things that need to happen in a specific order. Naming these explicitly prevents scope creep and makes progress trackable.

Second, it identifies the "blast radius" — which parts of the existing codebase are affected. Files that will be modified, files that import the modified files (and therefore might need updates), and tests that cover the affected code.

Third, it runs a risk check: Is there anything in KNOWN_ISSUES.md near this area? Is there an existing pattern in LESSONS_LEARNED.md that applies? Is there a decision in DECISIONS.md that constrains the approach?

Finally, it determines what tests need to be written. Not in a "tests will be added at the end" way, but in a "here are the specific test cases that will prove this works" way. Naming tests before writing code forces clarity about what "done" actually means.

---

## ◈ STAGE 3: ARCHITECTURE — ONLY WHEN GENUINELY NEEDED

The Architecture stage is not a bureaucratic hurdle. It activates exactly when:

A new external service or library is being integrated (a new dependency is a long-term commitment — it deserves a moment of deliberate thought). When an API contract is changing (because other things depend on that contract). When a data model is being modified (because data changes are among the hardest things to reverse). When there are genuinely two valid approaches with meaningfully different consequences.

The Architecture stage produces an ADR in DECISIONS.md. The ADR is written before code is written — not as documentation of a decision already made, but as a tool for making the decision well. The act of writing "alternatives considered" and being specific about why each was rejected often reveals that the initial instinct was wrong.

---

## ◈ STAGE 4: IMPLEMENTATION — HOW WORK ACTUALLY HAPPENS

Implementation happens in small, verifiable increments. The agent does not write 500 lines of code and then check if it works. It writes a function, writes its tests, confirms they pass, then moves to the next function.

**The increment cycle:**
Write a small piece of logic. Write the tests for it immediately. Run those tests. If they pass, move on. If they fail, fix the logic before writing more code. Never accumulate untested code.

This approach has a specific benefit beyond code quality: it creates natural checkpoints. If the agent is interrupted or the session ends mid-task, the SESSION_LOG.md can record exactly which increment was completed and where the next one begins. The next session can resume cleanly.

**When the implementation reveals something unexpected:**
If working on a feature uncovers a bug that wasn't in KNOWN_ISSUES.md, add it there immediately. If working near existing code reveals a pattern that belongs in LESSONS_LEARNED.md, add it immediately. These additions are not interruptions to implementation — they are part of it.

---

## ◈ STAGE 5: VERIFICATION — THE NON-NEGOTIABLE GATE

The verification stage is a gate, not a suggestion. Code does not move forward if the gate is not fully open.

The full checklist is in CLAUDE.md. The key principle is: the agent does not tell the user it's done and then run verification — it runs verification, confirms everything passes, and then presents the work. The user's validation is of tested, typed, linted code, not of raw output.

When verification fails, the agent fixes the issues before presenting work. The developer should never see failing tests or type errors in a "review this" message.

---

## ◈ STAGE 6: DOCUMENTATION — CLOSE THE LOOP

Documentation is not "notes you write after work is done." It is the act of leaving the codebase in a better state than you found it, for the next session — whether that next session is tomorrow or six months from now.

The SESSION_LOG.md entry is the most important one. It is written at the end of every session, and it is written to be read by someone who has no memory of the session at all. The "Next session starts at:" field should be specific enough that the next session can begin coding within 60 seconds of reading it.

If intentional shortcuts were made during implementation (something that was done in a simple way because of time constraints, even though a better way exists), they go in KNOWN_ISSUES.md as intentional limitations. Future sessions need to know these exist so they don't accidentally "improve" them in ways that break the workaround.

---

## ◈ STAGE 7: USER VALIDATION — THE HONEST SUMMARY

The user validation message serves three purposes. It tells the developer what was built (so they can verify it's what they asked for). It surfaces any decisions that were made autonomously (so they can override if the decision was wrong). And it flags any known limitations of the implementation (so there are no surprises after pushing).

A good validation message is honest about what's complete, what's incomplete, and what tradeoffs were made. It is not a sales pitch for the work — it is a clear statement of what exists.

---

## ◈ STAGE 8: BLUEPRINT AUTO-COMPLETE

The Blueprint 02 template is the push document. The agent auto-completes everything it knows from the session: the files it added, modified, and deleted; the bugs it fixed; the known issues that remain; the difficulty estimate; the breaking changes if any; the updated run instructions if setup changed.

The agent asks the user for only four things: the pull and push times (because only the user knows when they started and when they're finishing), the version bump type (because version decisions are product decisions), any team notes to add, and the total time worked if the user tracked it.

The Blueprint is never skipped. Even if the push is a tiny bug fix. The paper trail is the point.

---

## ◈ STAGE 9: PUSH — THE CEREMONIAL FINAL STEP

The push only happens after three explicit conditions are met: the user has seen the validation summary and approved it, the Blueprint is complete, and the user has explicitly said to push. "Looks good" is approval. "Yes push" is approval. "Push it" is approval. Anything ambiguous, the agent asks for explicit confirmation.

The commit message format is `type: description (vX.Y.Z)` — this makes the git log useful at a glance.

---

## ◈ INTER-SESSION CONTINUITY

The biggest enemy of long-running AI-assisted projects is context loss. When a session ends and a new one begins, the agent has no memory of what happened. This is a fundamental limitation of how large language models work.

SESSION_LOG.md is the solution. It is the shared memory between sessions. It works only if it's written at the end of every session — not "mostly at the end of most sessions." Every session. Every time.

The habit to build: before typing the goodbye message to end a session, update SESSION_LOG.md first. Make it specific. The five minutes spent writing a good session log saves thirty minutes of "where were we?" at the start of the next session.
