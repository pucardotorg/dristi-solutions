Act as a Senior Frontend Engineer reviewing a GitHub Pull Request.

Use GitHub MCP to read:
- PR title
- PR description
- Commits
- Full diff
- Changed files

Do NOT assume intent unless visible in code.

Your goal:
Help me deeply understand this PR before I decide to approve or request changes.

----------------------------------------

PHASE 1 — Orientation

1. Read the PR title and description.
2. Summarize the goal of the PR in 2–3 lines.

3. List all changed files grouped by concern:
   - UI components
   - Hooks
   - Utils
   - State management
   - API layer
   - Styling
   - Config
   - Tests

4. Identify PR type:
   - Feature
   - Refactor
   - Bug fix
   - Performance
   - Tech debt
   - Mixed

----------------------------------------

PHASE 2 — Chunk-by-Chunk Deep Walkthrough (Show Diff + Explain)

For EACH changed file (in reading order):

1) State:
   - File name
   - Its role in the system (1–2 lines)

2) Process the diff sequentially.

IMPORTANT:
- Do NOT skip any chunk.
- Even small changes must be shown and explained.
- Show the diff first, then explain it.

For EACH diff chunk:

-----------------------------------
CHUNK <number>

SHOW the exact diff snippet first.
(Paste the added/removed lines exactly as seen in the PR)

Then explain:

1) WHAT changed
   - Describe the code change in plain terms.

2) WHAT was happening BEFORE
   - Infer prior behavior from removed lines.

3) WHAT is happening NOW
   - Explain the new logic clearly.

4) WHY this change likely exists
   - Bug fix / feature / refactor / safety / cleanup.

5) IMPACT
   - Behavior change
   - UI/UX change (if any)
   - State flow
   - API/data flow
   - Performance

6) RISKS
   - Edge cases
   - Regression potential
   - Hidden side effects
   - Backward compatibility issues

Tag each risk:
- 🔴 High
- 🟡 Medium
- 🟢 Low

7) REGRESSION CHECK
Answer briefly:
"Could this break any existing flow?"
Explain why or why not.

8) CONFIDENCE LEVEL
- High: clear intent from code
- Medium: inferred intent
- Low: ambiguous change

-----------------------------------

Repeat until all chunks in the file are covered.

----------------------------------------

PHASE 3 — Cross-File Reasoning

1. Explain how changes across files connect.
2. Identify any implicit coupling introduced.
3. Identify missing updates:
   - Tests
   - Types
   - Loading/error states
   - Documentation
   - Analytics/events (if relevant)

4. Detect regression-prone zones:
   - Shared components
   - Core hooks
   - Global state
   - Routing logic

----------------------------------------

PHASE 4 — Frontend Quality Assessment

Evaluate against:

React correctness:
- Hook usage safety
- Dependency arrays
- Memoization misuse
- Render risks

Architecture:
- State ownership clarity
- Prop drilling
- Separation of concerns

UX:
- Loading states
- Empty states
- Error handling
- Accessibility risks

Code quality:
- Naming clarity
- Readability
- Consistency with existing patterns

Performance:
- Unnecessary re-renders
- Expensive computations
- Large prop objects
- Inline function creation

----------------------------------------

PHASE 5 — Summary

1. High-level summary:
   What this PR actually changes in the system.

2. Strengths:
   - Good patterns used
   - Clean improvements
   - Smart decisions

3. Concerns:
   - List clearly
   - Prioritize by severity

4. Final recommendation:
   - Approve
   - Approve with comments
   - Request changes

----------------------------------------

Rules:

- Do NOT write GitHub review comments yet.
- Do NOT suggest refactors unless they prevent bugs.
- Prefer explanation over judgment.
- Be precise and calm, like mentoring a teammate.
- Focus on correctness > style.
- Prioritize logic-impacting changes over cosmetic edits.