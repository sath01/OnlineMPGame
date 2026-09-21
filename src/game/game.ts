import type { Game } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import { commitAction, createInitialState, undoLastAction } from "./core/round";
import { defaultHooks } from "./core/rules";
import type { Actor, GameCoreState, GameHooks } from "./core/types";

export type GameState = GameCoreState;

// Placeholder roster + spawn behavior until Character Data Model and
// Kreacher Spawning & Basic AI exist. None of this is a design decision —
// it exists only so Core Game Loop is runnable and clickable in the
// browser for Level 3 verification (see TESTING.md). Real Character
// stats/counts and real Spawn behavior replace this wholesale later.
const PLACEHOLDER_CHARACTERS: Actor[] = [
  { id: "char-0", category: "character", actionPool: { max: 3, remaining: 3 } },
  { id: "char-1", category: "character", actionPool: { max: 3, remaining: 3 } },
];

const scaffoldHooks: GameHooks = {
  ...defaultHooks,
  spawnStep: (state) => {
    const alreadySpawned = Object.values(state.actors).some(
      (actor) => actor.category === "kreacher",
    );
    if (alreadySpawned) return state;
    return {
      ...state,
      actors: {
        ...state.actors,
        "kreacher-0": {
          id: "kreacher-0",
          category: "kreacher",
          actionPool: { max: 2, remaining: 2 },
        },
        "kreacher-1": {
          id: "kreacher-1",
          category: "kreacher",
          actionPool: { max: 2, remaining: 2 },
        },
      },
    };
  },
};

export const CoopGame: Game<GameState> = {
  name: "onlinempgame",

  setup: () => createInitialState(PLACEHOLDER_CHARACTERS),

  moves: {
    commitAction: ({ G }, actorId: string, actionType: string, payload?: unknown) => {
      const result = commitAction(G, actorId, actionType, payload, scaffoldHooks);
      if (!result.ok) return INVALID_MOVE;
      return result.state;
    },
    undoLastAction: ({ G }) => {
      const result = undoLastAction(G, scaffoldHooks);
      if (!result.ok) return INVALID_MOVE;
      return result.state;
    },
  },

  turn: {
    // Free-form / staged resolution both mean "any connected client can
    // act whenever it's legal," not boardgame.io's default single-current-
    // player turn order. Our own commitAction validation (Phase, Actor
    // category, pool state, pass progress) is the actual source of truth
    // for legality — this just stops boardgame.io's own turn gate from
    // getting in the way of it.
    activePlayers: ActivePlayers.ALL,
  },

  endIf: ({ G }) => (G.missionResult ? { result: G.missionResult } : undefined),
};
