import { Client } from "boardgame.io/client";
import { afterEach, describe, expect, it } from "vitest";
import { CoopGame } from "./game";
import type { GameState } from "./game";

// Level 2 (see TESTING.md): a small number of tests proving the
// boardgame.io moves are wired to the core logic correctly — not a
// re-run of round.test.ts's coverage, just the seams a pure-logic
// unit test structurally can't see (INVALID_MOVE, endIf, G replacement
// actually reaching the client).

function makeClient() {
  const client = Client<GameState>({ game: CoopGame, playerID: "0" });
  client.start();
  return client;
}

let activeClient: ReturnType<typeof makeClient> | undefined;

afterEach(() => {
  activeClient?.stop();
  activeClient = undefined;
});

describe("boardgame.io move wiring", () => {
  it("starts with the placeholder roster from setup()", () => {
    activeClient = makeClient();
    const G = activeClient.getState()!.G;
    expect(Object.keys(G.actors).sort()).toEqual(["char-0", "char-1"]);
    expect(G.round).toBe(1);
    expect(G.phase).toBe("playersPhase");
  });

  it("commitAction reaches the core logic and replaces G", () => {
    activeClient = makeClient();
    activeClient.moves.commitAction("char-0", "test-action");
    const G = activeClient.getState()!.G;
    expect(G.actors["char-0"].actionPool.remaining).toBe(2);
    expect(G.actionLog).toHaveLength(1);
  });

  it("rejects an illegal move via INVALID_MOVE rather than corrupting G", () => {
    activeClient = makeClient();
    const before = activeClient.getState()!.G;
    activeClient.moves.commitAction("no-such-actor", "test-action");
    const after = activeClient.getState()!.G;
    expect(after).toEqual(before);
  });

  it("undoLastAction reaches the core logic and restores G", () => {
    activeClient = makeClient();
    activeClient.moves.commitAction("char-0", "test-action");
    activeClient.moves.undoLastAction();
    const G = activeClient.getState()!.G;
    expect(G.actors["char-0"].actionPool.remaining).toBe(3);
    expect(G.actionLog).toHaveLength(0);
  });

  it("any connected client can act for any Actor — activePlayers isn't gating moves", () => {
    // playerID "1" acting for char-0, which player "0" nominally owns —
    // legal here because Character Data Model, not this feature, owns
    // that authorization check (see the brief's deferred scope).
    activeClient = Client<GameState>({ game: CoopGame, playerID: "1" });
    activeClient.start();
    activeClient.moves.commitAction("char-0", "test-action");
    expect(activeClient.getState()!.G.actors["char-0"].actionPool.remaining).toBe(2);
  });

  it("wires G.missionResult through to boardgame.io's own gameover via endIf", () => {
    // Win/loss conditions are deferred (winLossCheck is a no-op in the
    // scaffold), so there's no real move sequence that reaches a resolved
    // Mission yet. Calling the hook directly proves the seam is wired
    // without waiting on a feature this one doesn't own.
    const unresolved = CoopGame.endIf!({ G: { missionResult: null } } as never);
    expect(unresolved).toBeUndefined();
    const resolved = CoopGame.endIf!({ G: { missionResult: "won" } } as never);
    expect(resolved).toEqual({ result: "won" });
  });
});
