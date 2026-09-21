# Context

Current build state, key decisions, and next steps. Updated at the end
of each session per CLAUDE.md.

## Session 1 — 2026-09-19

### Built
- Git repo initialized locally; remote wired up to
  `https://github.com/sath01/OnlineMPGame.git` (not yet pushed).
- npm project scaffold: TypeScript + Vite + React 19 + boardgame.io 0.50.2.
- `.gitignore`, `tsconfig.json`, `vite.config.ts`, `index.html`.
- ESLint (flat config, `eslint.config.js`) + Prettier (`.prettierrc`).
- Source layout:
  - `src/game/game.ts` — placeholder boardgame.io `Game` definition
    (`CoopGame`): a `log` array and one `announce` move, just enough to
    prove turn order and multiplayer sync work.
  - `src/components/Board.tsx` — plain-HTML board UI (no PixiJS yet,
    per the plan to add it once mechanics work).
  - `src/App.tsx` — boardgame.io `Client` wired to `SocketIO` transport,
    hardcoded to `playerID="0"` / `matchID="default"` (no lobby yet).
  - `src/server/server.ts` — boardgame.io Node server on port 8000,
    with `origins: [Origins.LOCALHOST]` set explicitly (required since
    boardgame.io 0.45 — CORS is not open by default).
  - `src/main.tsx` — React entry point.
- npm scripts: `dev` (Vite on :3000), `server` (tsx watch on :8000),
  `dev:all` (both together via `concurrently`), `build`, `lint`.
- README.md with setup instructions and project structure overview.

### Verified working
- `npx tsc -b --noEmit` — no type errors.
- `npm run lint` — no ESLint errors.
- `npm run dev:all` — both processes start cleanly, no CORS warnings.
- Loaded `http://localhost:3000` in the built-in browser: boardgame.io
  debug panel confirmed client/server sync (2 players, turn tracking).
  Clicked "Take turn" as player 0 — move round-tripped through the
  server, log updated, turn advanced to player 1. No console errors.

### Key decisions
- **Server from day one**, not local-only — matches the multiplayer
  goal directly, avoids reworking the client/transport layer later.
- **Plain-HTML board before PixiJS** — lets turn logic and multiplayer
  sync get verified independently of rendering, per CLAUDE.md's own
  phasing ("PixiJS to be added once mechanics are working").
- **npm** over pnpm/yarn — already installed, matches CLAUDE.md's
  stated stack, no reason to add tooling.
- Game state (`CoopGame`) intentionally minimal/placeholder — real
  board/combat/enemy-AI design will come from a separate design-brief
  session and replace this.

### Known issues to revisit before deploying
- `npm audit` reports several high-severity vulnerabilities, all in
  transitive dependencies bundled inside `boardgame.io` itself
  (`koa-socket-2` → old `socket.io`/`engine.io`/`ws`, `@koa/cors`, and
  an unrelated `svelte` devtool dependency). No fix available without
  downgrading boardgame.io to 0.22.x (a breaking change). Not a
  concern for local dev; **must be reassessed before the DigitalOcean
  VPS deploy** — check for a boardgame.io patch release, or evaluate
  whether the affected surface (CORS defaults, socket.io transport) is
  actually reachable in production.

- First commit made and pushed to `origin/main` on GitHub.

### Dropbox + node_modules gotcha (fixed, worth knowing)
Running `npm run dev:all` from a fresh clone/install produced a blank
page at `localhost:3000` with `EBUSY: resource busy or locked` errors
in the Vite log, and repeated `EADDRINUSE :::8000` crashes on the
boardgame.io server. Two compounding causes:

1. **Dropbox was actively syncing `node_modules`.** Vite's dependency
   pre-bundler does atomic renames inside `node_modules/.vite` on
   startup; Dropbox's sync daemon holds file locks on the same files,
   so the rename fails. Fixed by marking `node_modules` as ignored via
   Dropbox's own exclusion mechanism (an NTFS alternate-data-stream
   attribute, not a `.gitignore` — that only affects git):
   ```powershell
   Set-Content -Path "node_modules" -Stream com.dropbox.ignored -Value 1
   ```
   **Do this once per machine** after `npm install` on any fresh clone
   in this Dropbox folder — `node_modules` isn't committed to git, so
   the attribute has to be re-applied per machine/per fresh install.
2. **Zombie dev-server processes.** Repeated test runs left several
   orphaned `tsx watch` (server) and `vite` processes running in the
   background, fighting each other for ports 3000/8000. If `dev:all`
   throws `EADDRINUSE`, check for and kill leftover Node processes
   before retrying rather than just re-running the command.

If a stale dep-cache error recurs, clear it and restart:
```bash
rm -rf node_modules/.vite
npm run dev:all
```

### Next steps
- Real game design brief (board layout, player stats, combat, enemy
  AI) — arrives from a separate design session per CLAUDE.md.
- Replace hardcoded `playerID`/`matchID` in `App.tsx` with an actual
  lobby/player-join flow.
- Start building real `GameState` once a design brief exists.

## Session 2 — 2026-09-20

No code changes — this session was walkthrough/explanation only, working
against the scaffold built in Session 1.

- Explained the dev-time topology (Vite on :3000 serving the React app,
  boardgame.io server on :8000 holding game state, browser talking to
  both) versus the eventual production topology (one always-on VPS
  process is the sole source of truth; every player's machine runs
  nothing but a browser).
- Clarified what `Client({...})` from `boardgame.io/react` actually is:
  a function that returns a pre-wired React component (bakes in the
  game rules, the `Board` renderer, and the transport config), not a
  literal factory pattern.
- Demoed two-player turn-taking in one browser tab using boardgame.io's
  built-in debug panel: switching the `PLAYERS` selector changes the
  `playerID` our single `GameClient` is using (confirmed live — it's
  not a second parallel connection, it visibly changed our own "You
  are player: X" text too). A move is only accepted by the server when
  the client's current `playerID` matches `ctx.currentPlayer`, which is
  exactly what production turn-taking relies on — real players just
  don't need a selector because each browser is permanently locked to
  one `playerID`.
- Match state (`log`, `turn` counter) has been accumulating in the
  server's memory across the whole session — confirmed it survives
  page reloads, since it only resets on server restart or the debug
  panel's `reset` button.

## Session 3 — 2026-09-20

No code changes — reference-document reorg from the design/admin side.

- `primer.md` and a new `roles-and-demarcation.md` replace the
  previous single `primer.md` (which had a "Role boundary" paragraph
  inline). `primer.md` is now game-content only; the role/escalation
  material moved to `roles-and-demarcation.md`, which is now the
  canonical source for who decides what and when to flag vs. proceed.
  No `collaboration.md` existed in this project to delete.
- Updated `CLAUDE.md`'s Working Approach and folder-structure sections
  to read all three of `context.md`, `primer.md`, and
  `roles-and-demarcation.md` at the start of every session, and to
  point at `roles-and-demarcation.md` rather than restating its
  content inline — avoids the same duplication-drift problem this
  reorg was fixing.

## Session 4 — 2026-09-21

Added `TESTING.md` (CC-owned testing strategy: unit / integration /
mandatory manual-verification levels, with discipline rules against
test-for-test's-sake bloat — see that file for the full reasoning) and
implemented the first real feature: **Core Game Loop & Turn Structure**.

### Built
- `src/game/core/types.ts` — `Actor`, `ActionPool`, `Phase`,
  `GameCoreState`, `ResolvedMissionRules`, and the three hook types
  (`WinLossCheck`, `SpawnStepHook`, `ActionEffectResolver`) this
  feature structurally depends on but doesn't own the behavior of.
- `src/game/core/actors.ts` — pool refill/spend/exhaustion helpers.
- `src/game/core/round.ts` — the actual state machine: `createInitialState`,
  `commitAction`, `undoLastAction`, and an internal `settle()` that
  cascades automatic Phase transitions (Players' → Kreachers' → End →
  next Players', rules 1-3/18-22) until either the Mission halts or a
  Phase genuinely needs external input. Framework-free — no
  boardgame.io import in this module at all.
- `src/game/core/rules.ts` — placeholder `defaultHooks` (all no-ops;
  `undoEnabled: true` is a scaffold default, not a design decision —
  Campaign & Mission Structure owns the real value).
- `src/game/game.ts` — thin boardgame.io adapter: two moves
  (`commitAction`, `undoLastAction`) that call the core functions and
  return the new `G` or `INVALID_MOVE`. Uses `turn.activePlayers:
  ActivePlayers.ALL` so boardgame.io's own single-current-player turn
  gate stays out of the way — all legality now lives in `core/round.ts`.
  Also carries a scaffold-only `spawnStep` (spawns 2 placeholder
  Kreachers the first time it runs) purely so the Kreachers' Phase is
  observable in the browser; real Spawn behavior is Kreacher Spawning
  & Basic AI's job.
- `src/components/Board.tsx` — minimal plain-HTML view (Round, Phase,
  each Actor's pool, commit/undo buttons, the log) — enough to drive
  Level 3 verification without waiting on PixiJS.

### Architecture decisions
- Round/Phase/Actor/ActionPool logic lives entirely in framework-free
  `core/` modules, independent of boardgame.io. boardgame.io's own
  `phases`/`stages`/turn-order system is unused — it's built around
  single-seat turn order, which doesn't fit free-form (any Player, any
  Character, any time) or staged (Kreachers aren't players at all)
  resolution. boardgame.io is transport/sync only.
- Snapshot deep-cloning uses a JSON round-trip, not `structuredClone` —
  caught by the Level 2 integration tests: boardgame.io hands moves an
  Immer draft (a Proxy), which `structuredClone` cannot clone but
  `JSON.stringify` reads through fine. This is exactly the class of bug
  TESTING.md's Level 2 exists to catch and Level 1 structurally can't.
- Undo restores `{round, phase, actors, kreachersActingProgress,
  missionResult}` from a snapshot taken *before* the log entry itself
  is appended, and separately pops the log entry — rather than
  snapshotting the log too and letting removal fall out "for free."
  Simpler to reason about and avoids O(n²) nested-snapshot growth
  across a long Players' Phase.

### Verified (see TESTING.md's three levels)
- **Level 1** — 28 unit tests in `core/round.test.ts`, mapped to the
  brief's 25 numbered rules plus a snapshot-isolation edge case.
- **Level 2** — 6 integration tests in `game.test.ts` against a headless
  boardgame.io `Client` (no React/browser). Caught the Immer-draft/
  `structuredClone` bug above — level 1 alone could not have found it.
- **Level 3** — full manual pass in the browser: Round/Phase cycling,
  refill timing (Kreachers only refill entering their own Phase, not at
  Round start), free-form multi-Character commits, undo restoring state
  live, and the staged multi-pass constraint (a Kreacher blocked from
  acting twice until every other eligible Kreacher has gone once,
  confirmed both ways — rejected then allowed next pass). Win/loss halt
  wasn't exercised live since it needs a real condition, which is
  correctly out of scope here (Win/Loss Framework's job) — covered by
  levels 1 and 2 instead.
- `npm test`, `npm run lint`, `npx tsc -b --noEmit` all clean.

### Resolved — terminology folded into primer.md
The brief's Terminology section asked for four new terms (Round, Action
pool, Action log, free-form/staged multi-pass resolution) to be folded
into `primer.md`. CC doesn't edit that file directly, so this was
flagged rather than done here — Design chat has since updated it
directly. `primer.md` and `roles-and-demarcation.md` were both
refreshed (2026-09-21): the four terms are in, `Actor`/`Action`'s
wording was corrected to match what was actually built (Actor covers
only Character and Kreacher — no Machine — matching this feature's
implementation already), and `roles-and-demarcation.md` now states
Design chat has direct edit rights on `primer.md` content going
forward, no Admin transcription step needed. No implementation impact —
the corrected wording already matched what this feature built.

### Steve's own Level 3 pass, and a follow-up: System log
Steve ran the Level 3 walkthrough himself in the browser (not just CC
driving it) and confirmed Round/Phase cycling, refill timing, free-form
and staged resolution, and undo all behave as specified. He asked for
one addition: visibility into the automatic engine cascade (Phase
transitions, the Spawn step firing, win/loss results) that his own
committed Actions don't surface, so he can sanity-check the engine is
running correctly, not just that his own clicks work.

Added `systemLog: string[]` to `GameCoreState` — not a brief-owned
entity, an observability aid only. Logs Phase transitions, "Spawn step
ran" (every time it structurally fires, even as a no-op), Round
advances, and win/loss results (not routine null checks, which run
after every Action and would flood it). Deliberately does *not* reset
each Round (unlike `actionLog`) and is *not* reverted by undo — it's a
historical trace of what actually happened, not part of the rules.
Rendered in `Board.tsx` under a new "System log" section. 4 new unit
tests cover it. Also fixed `game.ts`'s `setup()` to call
`createInitialState()` instead of hand-duplicating `GameCoreState`'s
shape — the duplication was a latent bug waiting to drift out of sync,
caught while wiring the new field through.

### Process correction — Change Approval rule added to CLAUDE.md
Mid-session, CC proposed the `systemLog` design and began implementing
it in the same turn, without waiting for explicit approval — discussion
of a want ("it would be nice to see...") is not approval to build it.
Steve corrected this directly. Added a new `### Change Approval`
section to CLAUDE.md (now the first thing in the file) making this
explicit and durable: no file create/edit/delete without Steve's
explicit, specific approval for that exact change, overriding any
general "just proceed" default. This is a separate, earlier gate than
the pre-existing commit-message-approval rule.

### Next steps
- Relay the terminology addition above to Design chat.
- Propose a commit for the Core Game Loop feature + System log work
  (pending, this note is part of preparing that commit).
- Next brief, whenever it arrives, will be the first feature to plug
  into the `applyActionEffect`/`spawnStep`/`winLossCheck` hooks this
  feature deliberately left as no-ops.
