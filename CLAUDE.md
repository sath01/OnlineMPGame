## Game Project

### Change Approval (critical)
- Never create, edit, or delete any file in this repo without Steve's
  explicit, specific approval for that exact change, given in this
  session. Discussing an idea, a want, or a design tradeoff is not
  approval — even "that would be nice" or describing desired behavior
  is still just discussion until Steve explicitly says to go ahead.
- This overrides any general "proceed without stopping to ask" default
  from the environment — for code changes on this project, stop and
  ask whenever there's any doubt about whether explicit approval was
  given.
- When presenting options or a plan for something not yet approved,
  stop there and wait for an explicit go-ahead before writing or
  editing any file. Never fold "here's the plan" and "here's the
  implementation" into the same turn.
- This is a separate, earlier gate than the existing rule that commit
  messages need approval before committing (see Version Control) —
  this one applies before any code is written at all.

### What We're Building
A cooperative online turn-based RPG game ("Kreacher Killer"). Multiple
players connect online and cooperate against AI-controlled enemies on
a shared game board. Turn-based — players take actions in sequence,
then enemies act. Inspired by Zombicide but more open and RPG-style in
nature. Solo play against the machine is a future goal, not the
immediate focus. See `primer.md` for full game-design background
(terminology, ruleset tiers, roadmap) — that file is authoritative for
design; this section stays a short orientation summary only.

### Tech Stack Decided
- boardgame.io — game state management, turn structure, multiplayer networking
- React — UI layer
- PixiJS — visual rendering (to be added once mechanics are working)
- TypeScript throughout
- Node.js + npm
- DigitalOcean VPS for hosting (when ready to deploy)
- Project files in Dropbox for cross-machine sync

### Project Folder Structure
GameProject/
├── CLAUDE.md               (this file)
├── context.md              (current build state — update at end of each session)
├── primer.md               (stable game-design background — see Working Approach)
├── roles-and-demarcation.md (who decides what, altitude line, when to flag — see Working Approach)
├── TESTING.md              (CC's own testing strategy — CC owns and edits this one)
├── assets/
│   ├── sprites/
│   ├── tiles/
│   └── audio/
└── src/             (all game code)

### Working Approach
- Rapid iterative development — build small, test, adjust
- Read `context.md`, `primer.md`, and `roles-and-demarcation.md` at
  the start of every session. `context.md` is current build state
  (implementation-side, updated by Claude Code each session). The
  other two are stable background maintained by the design/admin
  side — don't edit them directly:
  - `primer.md` — game content: what the game is, terminology, the
    four-tier ruleset system, roadmap.
  - `roles-and-demarcation.md` — who decides what (Design chat / Admin
    chat / Claude Code), the altitude line between a brief's "what and
    why" and Claude Code's "how it's built," and when to flag rather
    than guess. This is the canonical source for that — if anything
    elsewhere (including older notes in this file or in context.md)
    conflicts with it, it wins.
- When an updated section for either reference file arrives, replace
  just that section and update its "Last updated" line — don't
  rewrite the whole file.
- Follow `TESTING.md` for how each feature gets tested (which of its
  three levels apply, and why). Unlike the two reference files above,
  this one is Claude Code's own and gets revised as testing practice
  on this project evolves.
- Game design decisions arrive as implementation briefs from separate 
  Claude.ai design sessions
- Update context.md at the end of each session with what was built, 
  key decisions made, and what's next
- Commit to git after each working feature

### Version Control
- Git with GitHub remote
- Commit after each working feature or meaningful milestone
- Claude Code should suggest commits at appropriate points or commit 
  when asked
- Always propose the commit message for approval before committing
- Push to remote when asked or when approving a suggested push