import type { Game } from "boardgame.io";

// Placeholder game state — proves out player turns + multiplayer sync.
// Real board/combat/enemy-AI design will replace this once a design
// brief for those systems arrives.
export interface GameState {
  log: string[];
}

export const CoopGame: Game<GameState> = {
  name: "onlinempgame",

  setup: () => ({
    log: [],
  }),

  moves: {
    announce: ({ G, playerID }) => {
      G.log.push(`Player ${playerID} took their turn`);
    },
  },

  turn: {
    minMoves: 1,
    maxMoves: 1,
  },
};
