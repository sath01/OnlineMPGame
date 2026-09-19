# OnlineMPGame

A cooperative, online, turn-based RPG. Players connect and work together
against AI-controlled enemies on a shared game board — inspired by
Zombicide, but looser and more RPG-style. Solo play against the AI is a
future goal, not the current focus.

## Stack

- [boardgame.io](https://boardgame.io/) — game state, turn structure, multiplayer sync
- React — UI layer
- PixiJS — visual rendering (added once core mechanics work)
- TypeScript
- Vite — dev server / bundler
- Node.js + npm

## Getting started

```bash
npm install
npm run dev:all
```

`dev:all` runs two processes together:

- the boardgame.io **server** (`localhost:8000`) — authoritative game state and multiplayer sync
- the **Vite dev server** (`localhost:3000`) — the React UI

Open `http://localhost:3000` in two browser windows/tabs to see two
players sharing the same match (`matchID="default"` is hardcoded for now —
a real lobby/player-join flow comes later).

Run them separately if you prefer:

```bash
npm run server   # boardgame.io server only
npm run dev      # Vite dev server only
```

## Project structure

```
src/
├── main.tsx            # React entry point
├── App.tsx              # boardgame.io Client setup (game + board + transport)
├── game/
│   └── game.ts           # boardgame.io Game definition (state, moves, turn order)
├── components/
│   └── Board.tsx          # placeholder board UI (plain HTML, replaced by PixiJS later)
└── server/
    └── server.ts           # boardgame.io Node server (multiplayer authority)

assets/
├── sprites/
├── tiles/
└── audio/
```

See [CLAUDE.md](CLAUDE.md) for the full project brief and [context.md](context.md)
for the current build state and session log.

## Status

Early scaffold — turn/move sync is wired up with placeholder state
(`Board.tsx` shows a log of "took their turn" entries). No real game
board, combat, or enemy AI yet.
