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

### Next steps
- First commit + push to GitHub (pending commit message approval).
- Real game design brief (board layout, player stats, combat, enemy
  AI) — arrives from a separate design session per CLAUDE.md.
- Replace hardcoded `playerID`/`matchID` in `App.tsx` with an actual
  lobby/player-join flow.
- Start building real `GameState` once a design brief exists.
