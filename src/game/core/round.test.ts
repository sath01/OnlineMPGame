import { describe, expect, it } from "vitest";
import { commitAction, createInitialState, undoLastAction } from "./round";
import type { Actor, GameCoreState, GameHooks } from "./types";

function character(id: string, actions: number): Actor {
  return { id, category: "character", actionPool: { max: actions, remaining: actions } };
}

function kreacher(id: string, actions: number): Actor {
  return { id, category: "kreacher", actionPool: { max: actions, remaining: actions } };
}

function hooks(overrides: Partial<GameHooks> = {}): GameHooks {
  return {
    resolvedRules: { undoEnabled: true },
    winLossCheck: () => null,
    spawnStep: (state) => state,
    applyActionEffect: (state) => state,
    ...overrides,
  };
}

// A spawnStep that spawns two Kreachers the first time it's asked to,
// mirroring how the real Spawn step will eventually create the roster.
function spawnTwoKreachersOnce() {
  return (state: GameCoreState): GameCoreState => {
    const alreadySpawned = Object.values(state.actors).some((a) => a.category === "kreacher");
    if (alreadySpawned) return state;
    return {
      ...state,
      actors: { ...state.actors, ...toRecord([kreacher("kr-0", 2), kreacher("kr-1", 2)]) },
    };
  };
}

function toRecord(actors: Actor[]): Record<string, Actor> {
  return Object.fromEntries(actors.map((a) => [a.id, a]));
}

function expectOk(result: ReturnType<typeof commitAction>): GameCoreState {
  if (!result.ok) throw new Error(`expected ok, got reason: ${result.reason}`);
  return result.state;
}

describe("Round and Phase sequencing (rules 1-3)", () => {
  it("begins in Round 1, Players' Phase", () => {
    const state = createInitialState([character("c0", 1)]);
    expect(state.round).toBe(1);
    expect(state.phase).toBe("playersPhase");
  });

  it("cycles Players' -> Kreachers' -> Players' (Round 2) in fixed order", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });

    // Round 1: only Character to act, no Kreachers spawned yet.
    state = expectOk(commitAction(state, "c0", "test", undefined, h));
    expect(state.round).toBe(2);
    expect(state.phase).toBe("playersPhase");

    // Round 2: Kreachers spawned during Round 1 are now present and act.
    state = expectOk(commitAction(state, "c0", "test", undefined, h));
    expect(state.phase).toBe("kreachersPhase");
    state = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-1", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-0", "test", undefined, h)); // kr-0's 2nd action
    state = expectOk(commitAction(state, "kr-1", "test", undefined, h)); // kr-1's 2nd action
    expect(state.round).toBe(3);
    expect(state.phase).toBe("playersPhase");
  });
});

describe("Action pool refill (rules 4-5)", () => {
  it("refills Characters to full at Players' Phase and does not carry over", () => {
    let state = createInitialState([character("c0", 2)]);
    const h = hooks();
    state = expectOk(commitAction(state, "c0", "test", undefined, h));
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // exhausts, cascades to R2
    expect(state.actors["c0"].actionPool.remaining).toBe(2);
    expect(state.actors["c0"].actionPool.max).toBe(2);
  });

  it("refills Kreachers to full at Kreachers' Phase start", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // R1 -> spawns -> R2 players
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // enters kreachersPhase
    expect(state.phase).toBe("kreachersPhase");
    expect(state.actors["kr-0"].actionPool.remaining).toBe(2);
    expect(state.actors["kr-1"].actionPool.remaining).toBe(2);
  });
});

describe("Players' Phase (rules 6-10)", () => {
  it("allows free-form, any-order commits across multiple Characters", () => {
    let state = createInitialState([character("c0", 2), character("c1", 2)]);
    const h = hooks();
    state = expectOk(commitAction(state, "c1", "test", undefined, h));
    state = expectOk(commitAction(state, "c0", "test", undefined, h));
    state = expectOk(commitAction(state, "c1", "test", undefined, h));
    expect(state.actors["c0"].actionPool.remaining).toBe(1);
    expect(state.actors["c1"].actionPool.remaining).toBe(0);
    expect(state.phase).toBe("playersPhase"); // c0 still has an unspent Action
  });

  it("logs and snapshots a commit when undo is enabled", () => {
    const state = createInitialState([character("c0", 2)]);
    const next = expectOk(commitAction(state, "c0", "swing", { power: 3 }, hooks()));
    expect(next.actionLog).toHaveLength(1);
    expect(next.actionLog[0]).toMatchObject({ actorId: "c0", actionType: "swing" });
  });

  it("does not log or snapshot when undo is disabled, but still applies the Action", () => {
    const state = createInitialState([character("c0", 2)]);
    const h = hooks({ resolvedRules: { undoEnabled: false } });
    const next = expectOk(commitAction(state, "c0", "swing", undefined, h));
    expect(next.actionLog).toHaveLength(0);
    expect(next.actors["c0"].actionPool.remaining).toBe(1);
  });

  it("ends only once every Character has no unspent Actions, not just one", () => {
    let state = createInitialState([character("c0", 1), character("c1", 1)]);
    const h = hooks();
    state = expectOk(commitAction(state, "c0", "test", undefined, h));
    expect(state.phase).toBe("playersPhase");
    expect(state.round).toBe(1);
    state = expectOk(commitAction(state, "c1", "test", undefined, h));
    expect(state.round).toBe(2); // now both exhausted, cascades
  });

  it("rejects a commit for an unknown Actor", () => {
    const state = createInitialState([character("c0", 1)]);
    const result = commitAction(state, "ghost", "test", undefined, hooks());
    expect(result).toEqual({ ok: false, reason: "unknown-actor" });
  });

  it("rejects a commit for an Actor with no unspent Actions", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks();
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // R1->R2, refills
    // c0 is refilled in R2, so exhaust it again to test the guard directly:
    const exhausted: GameCoreState = {
      ...state,
      actors: { ...state.actors, c0: { ...state.actors["c0"], actionPool: { max: 1, remaining: 0 } } },
    };
    const result = commitAction(exhausted, "c0", "test", undefined, h);
    expect(result).toEqual({ ok: false, reason: "no-unspent-actions" });
  });

  it("rejects a Kreacher acting during Players' Phase", () => {
    const state: GameCoreState = {
      ...createInitialState([character("c0", 1)]),
      actors: toRecord([character("c0", 1), kreacher("kr-0", 1)]),
    };
    const result = commitAction(state, "kr-0", "test", undefined, hooks());
    expect(result).toEqual({ ok: false, reason: "wrong-phase-for-actor-category" });
  });
});

describe("Undo (rules 11-14)", () => {
  it("restores the pre-Action state and removes the log entry", () => {
    const state = createInitialState([character("c0", 2)]);
    const afterCommit = expectOk(commitAction(state, "c0", "swing", undefined, hooks()));
    const afterUndo = expectOk(undoLastAction(afterCommit, hooks()));
    expect(afterUndo.actors["c0"].actionPool.remaining).toBe(2);
    expect(afterUndo.actionLog).toHaveLength(0);
  });

  it("discards effects entirely rather than reversing them piecemeal", () => {
    const state = createInitialState([character("c0", 2)]);
    const h = hooks({
      applyActionEffect: (s, actorId) => ({
        ...s,
        actors: { ...s.actors, [actorId]: { ...s.actors[actorId], tag: "hit" } as Actor },
      }),
    });
    const afterCommit = expectOk(commitAction(state, "c0", "swing", undefined, h));
    expect((afterCommit.actors["c0"] as Actor & { tag?: string }).tag).toBe("hit");
    const afterUndo = expectOk(undoLastAction(afterCommit, h));
    expect((afterUndo.actors["c0"] as Actor & { tag?: string }).tag).toBeUndefined();
  });

  it("has no redo — a re-committed Action after undo is independent", () => {
    const state = createInitialState([character("c0", 2)]);
    const h = hooks();
    const afterFirst = expectOk(commitAction(state, "c0", "swing", undefined, h));
    const afterUndo = expectOk(undoLastAction(afterFirst, h));
    const afterSecond = expectOk(commitAction(afterUndo, "c0", "block", undefined, h));
    expect(afterSecond.actionLog).toHaveLength(1);
    expect(afterSecond.actionLog[0].actionType).toBe("block");
  });

  it("is unavailable outside Players' Phase", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // -> R2 players
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // -> kreachersPhase
    const result = undoLastAction(state, h);
    expect(result).toEqual({ ok: false, reason: "not-players-phase" });
  });

  it("is unavailable when undo is disabled for the Mission", () => {
    const state = createInitialState([character("c0", 2)]);
    const h = hooks({ resolvedRules: { undoEnabled: false } });
    const result = undoLastAction(state, h);
    expect(result).toEqual({ ok: false, reason: "undo-disabled" });
  });

  it("is unavailable when the log is empty", () => {
    const state = createInitialState([character("c0", 2)]);
    const result = undoLastAction(state, hooks());
    expect(result).toEqual({ ok: false, reason: "nothing-to-undo" });
  });

  it("resets the log at the End Phase boundary — nothing from a prior Round is undoable", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks();
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // exhausts -> cascades to R2
    expect(state.actionLog).toHaveLength(0);
    const result = undoLastAction(state, h);
    expect(result).toEqual({ ok: false, reason: "nothing-to-undo" });
  });
});

describe("Kreachers' Phase staged multi-pass resolution (rules 15-18)", () => {
  function twoRoundState() {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // spawns kreachers, -> R2
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // -> kreachersPhase, R2
    return { state, h };
  }

  it("rejects a Kreacher acting twice before every eligible Kreacher has acted once", () => {
    const { state, h } = twoRoundState();
    const afterFirst = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    const result = commitAction(afterFirst, "kr-0", "test", undefined, h);
    expect(result).toEqual({ ok: false, reason: "already-acted-this-pass" });
  });

  it("allows a Kreacher to act again once every eligible Kreacher has acted once (next pass)", () => {
    const { state, h } = twoRoundState();
    let s = expectOk(commitAction(state, "kr-0", "test", undefined, h)); // pass 1: kr-0
    s = expectOk(commitAction(s, "kr-1", "test", undefined, h)); // pass 1 complete
    s = expectOk(commitAction(s, "kr-0", "test", undefined, h)); // pass 2: kr-0 allowed again
    expect(s.actors["kr-0"].actionPool.remaining).toBe(0);
  });

  it("cascades to Spawn + End Phase once every Kreacher is exhausted", () => {
    const { state, h } = twoRoundState();
    let s = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    s = expectOk(commitAction(s, "kr-1", "test", undefined, h));
    s = expectOk(commitAction(s, "kr-0", "test", undefined, h));
    s = expectOk(commitAction(s, "kr-1", "test", undefined, h)); // both exhausted now
    expect(s.round).toBe(3);
    expect(s.phase).toBe("playersPhase");
  });

  it("never logs or exposes Kreachers' Phase Actions to the Players' Phase action log", () => {
    let state = createInitialState([character("c0", 2)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    // Round 1: exhaust c0 (2 commits) so Kreachers get spawned and Round 2 begins.
    state = expectOk(commitAction(state, "c0", "r1-a", undefined, h));
    state = expectOk(commitAction(state, "c0", "r1-b", undefined, h));
    expect(state.round).toBe(2);
    // Round 2: one commit logged but not exhausting, then one that cascades
    // into Kreachers' Phase — this Round's log should now hold both.
    state = expectOk(commitAction(state, "c0", "keep-me", undefined, h));
    state = expectOk(commitAction(state, "c0", "exhaust", undefined, h)); // -> kreachersPhase
    expect(state.phase).toBe("kreachersPhase");
    const logBefore = state.actionLog;
    expect(logBefore).toHaveLength(2);
    const afterKreacher = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    expect(afterKreacher.actionLog).toEqual(logBefore);
  });
});

describe("End Phase (rules 21-22)", () => {
  it("increments the Round and resets acting-step progress", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // R1 -> R2
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // -> kreachersPhase
    state = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-1", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-1", "test", undefined, h)); // -> R3
    expect(state.round).toBe(3);
    expect(state.kreachersActingProgress).toEqual({});
  });
});

describe("Win/loss check (rules 23-25)", () => {
  it("runs after every committed Action in either Phase", () => {
    let calls = 0;
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({
      spawnStep: spawnTwoKreachersOnce(),
      winLossCheck: () => {
        calls++;
        return null;
      },
    });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // players phase action
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // players phase action
    expect(calls).toBe(2);
    expectOk(commitAction(state, "kr-0", "test", undefined, h)); // kreachers phase action
    expect(calls).toBe(3);
  });

  it("halts the Phase loop immediately, even if the same Action would also end the Phase", () => {
    const state = createInitialState([character("c0", 1)]);
    const h = hooks({ winLossCheck: () => "lost" });
    const next = expectOk(commitAction(state, "c0", "test", undefined, h));
    expect(next.missionResult).toBe("lost");
    expect(next.phase).toBe("playersPhase"); // never cascaded, despite c0 now being exhausted
    expect(next.round).toBe(1);
  });

  it("blocks further Actions and undo once the Mission is resolved", () => {
    const state = createInitialState([character("c0", 2)]);
    const h = hooks({ winLossCheck: () => "won" });
    const resolved = expectOk(commitAction(state, "c0", "test", undefined, h));
    expect(commitAction(resolved, "c0", "test", undefined, h)).toEqual({
      ok: false,
      reason: "mission-resolved",
    });
    expect(undoLastAction(resolved, h)).toEqual({ ok: false, reason: "mission-resolved" });
  });

  it("does not re-run after the Spawn step independently of a committed Action", () => {
    let state = createInitialState([character("c0", 1)]);
    // Would report a win once Round reaches 2 — Round only becomes 2 as a
    // side effect of this same commit's cascade through Spawn/End Phase.
    const h = hooks({ winLossCheck: (s) => (s.round >= 2 ? "won" : null) });
    state = expectOk(commitAction(state, "c0", "test", undefined, h));
    expect(state.round).toBe(2);
    expect(state.missionResult).toBeNull();
  });
});

describe("Undo snapshot isolation", () => {
  it("does not let a later mutation retroactively corrupt an earlier snapshot", () => {
    const state = createInitialState([character("c0", 3)]);
    const h = hooks();
    const afterFirst = expectOk(commitAction(state, "c0", "first", undefined, h));
    const firstSnapshotPool = afterFirst.actionLog[0].snapshot.actors["c0"].actionPool.remaining;
    expectOk(commitAction(afterFirst, "c0", "second", undefined, h));
    // Re-read the original entry's snapshot after further mutation — must be unchanged.
    expect(afterFirst.actionLog[0].snapshot.actors["c0"].actionPool.remaining).toBe(
      firstSnapshotPool,
    );
  });
});

describe("System log (observability, not a brief-owned entity)", () => {
  it("logs Phase transitions, the Spawn step, and Round advances", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // R1 -> R2
    expect(state.systemLog).toEqual([
      "Round 1: Players' Phase ended -> Kreachers' Phase begins",
      "Round 1: Spawn step ran",
      "Round 2: Players' Phase begins",
    ]);
  });

  it("logs a win/loss result, but not a routine null check", () => {
    let calls = 0;
    const state = createInitialState([character("c0", 2)]);
    const h = hooks({
      winLossCheck: () => {
        calls++;
        return calls === 2 ? "won" : null;
      },
    });
    let s = expectOk(commitAction(state, "c0", "test", undefined, h)); // check #1: null
    expect(s.systemLog).toEqual([]);
    s = expectOk(commitAction(s, "c0", "test", undefined, h)); // check #2: won
    expect(s.systemLog).toEqual(["Mission won (Round 1)"]);
  });

  it("is not reset at the End Phase boundary, unlike the action log", () => {
    let state = createInitialState([character("c0", 1)]);
    const h = hooks({ spawnStep: spawnTwoKreachersOnce() });
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // R1 -> R2
    const afterRound1 = state.systemLog.length;
    state = expectOk(commitAction(state, "c0", "test", undefined, h)); // -> kreachersPhase R2
    state = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-1", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-0", "test", undefined, h));
    state = expectOk(commitAction(state, "kr-1", "test", undefined, h)); // R2 -> R3
    expect(state.actionLog).toEqual([]); // this one does reset
    expect(state.systemLog.length).toBeGreaterThan(afterRound1); // this one keeps growing
  });

  it("is not reverted by undo", () => {
    // Pre-existing entries (as if an earlier Phase transition already
    // happened) plus one undoable commit — undo must revert the pool but
    // leave every systemLog entry, including the pre-existing ones, intact.
    const base = createInitialState([character("c0", 2)]);
    const state = { ...base, systemLog: ["Round 1: Players' Phase ended -> ..."] };
    const h = hooks();
    const afterCommit = expectOk(commitAction(state, "c0", "test", undefined, h));
    const afterUndo = expectOk(undoLastAction(afterCommit, h));
    expect(afterUndo.actors["c0"].actionPool.remaining).toBe(2); // game state did revert
    expect(afterUndo.systemLog).toEqual(afterCommit.systemLog); // the trace did not
    expect(afterUndo.systemLog).toEqual(["Round 1: Players' Phase ended -> ..."]);
  });
});
