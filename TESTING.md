Last updated: 2026-09-21

# Testing Strategy

This document is Claude Code's own working strategy for how features get
tested, revised as we learn what works. Unlike `primer.md` and
`roles-and-demarcation.md`, this one CC owns and edits — it's an
implementation-practice document, not a design/admin reference.

## Why three levels, not two

Passing unit and integration tests only proves the code does what the
brief says. It doesn't prove the brief's logic is actually correct — a
design brief can be perfectly precise and internally consistent while
still describing game behavior that isn't what was actually intended.
Only a human watching the feature run catches that class of problem.
So the third level (manual verification) isn't a nice-to-have polish
step — it's the only level that checks the *design*, not just the
implementation. It stays mandatory for every feature with observable
behavior, even when levels 1 and 2 are green.

## The three levels

**Level 1 — Unit tests on core logic.** For features whose scope is
primarily rules, a state machine, or calculation (Engine Capability /
Core Ruleset tier things, in the four-tier system's terms). Tests are
written against the *behavior the brief states*, not internal data
shapes — a later refactor of how something is represented internally
shouldn't break these as long as the behavior is unchanged. This is
where most of the testing effort goes for logic-heavy features.

**Level 2 — Thin integration tests through the actual multiplayer
adapter.** A small number of tests (not a re-run of every level-1 case)
exercising the real boardgame.io moves headlessly, to prove the wiring
between the pure logic and the multiplayer layer is correct — the kind
of bug level 1 structurally can't see. If level 2 starts duplicating
level 1's coverage, that's a sign it's grown past its purpose and
should be trimmed back to just the seams.

**Level 3 — Manual verification in the browser.** Run the feature for
real (debug panel today; real UI once one exists) and confirm it looks
and behaves as intended. Mandatory, not optional, for any feature with
player-facing behavior — this is what lets Steve confirm the design
itself is right, independent of whether the code matches the brief.

## Applying this selectively (the point is not "more tests")

Not every feature is logic-shaped, and forcing unit tests onto code
that fundamentally isn't is exactly the "tests for the sake of tests"
failure mode to avoid.

- **Rules/logic/state-machine features** (turn structure, combat
  resolution, spawn scaling, win/loss conditions, XP/Danger Level
  math, Kreacher AI decisions): all three levels, level 1 is the
  primary investment.
- **UI/rendering/infra-heavy features** (PixiJS visuals, lobby/
  reconnect flow, asset pipeline): levels 1/2 likely don't fit
  naturally. Substitute something proportionate — targeted checks on
  whatever logic *is* embedded in them, otherwise lean on level 3 and
  say so explicitly rather than skipping testing silently.
- **Content-only additions** (a genre pack, a Mission data file):
  schema/data validation rather than behavior tests, if anything.

When in doubt, default to *less* automated testing and note the gap,
rather than writing a test whose only justification is "we should have
tests here."

## Discipline rules (how these stay useful instead of becoming overhead)

1. **Test the contract, not the implementation.** Assert on what the
   brief says must be true, never on internal object shapes or private
   helpers. This is what makes tests survive refactors instead of
   requiring a rewrite every time something moves.
2. **No duplicate coverage across levels.** Level 2 proves the seam
   works; it is not a second copy of level 1.
3. **Every test should earn its place.** Before adding one, it should
   be answering "what would silently break, and go unnoticed, without
   this test" — not "does this line of the brief have a test yet."
4. **When a brief gets revised, its tests get revised with it.** A
   stale test asserting a superseded rule is worse than no test — it
   actively lies about current behavior.
5. **Test file structure mirrors source structure** — predictable to
   find, nothing more elaborate than that.

## Visibility

At the end of each session, `context.md` notes which level(s) a
feature got and why (including "level 1/2 skipped, UI-only feature" —
an explicit skip, not a silent one). This is how we notice if the
practice is drifting rather than finding out much later.

## Tooling

Vitest for levels 1 and 2. Level 3 is manual — the boardgame.io debug
panel and/or the browser pane, no automation for this yet. Worth
revisiting (e.g. Playwright) once there's a stable enough UI to be
worth automating against — premature right now.
