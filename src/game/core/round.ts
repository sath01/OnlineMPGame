import { actorsOfCategory, allExhausted, refillCategory, spendAction } from "./actors";
import type {
  Actor,
  CommitResult,
  GameCoreState,
  GameHooks,
  Snapshot,
} from "./types";

// Defensive-only: real Missions always have at least one Character (1-6
// players per primer.md), which makes every phase transition eventually
// require external input. This guards against a misconfigured zero-actor
// setup spinning settle() forever rather than actually protecting against
// anything the brief describes.
const MAX_SETTLE_ITERATIONS = 1000;

// Takes fully-formed Character Actors rather than just IDs, since each
// Character's starting Action pool size is the Character/Skills
// catalog's call, not this feature's — it does not invent a default.
export function createInitialState(characters: Actor[]): GameCoreState {
  const actors: Record<string, Actor> = {};
  for (const actor of characters) {
    actors[actor.id] = actor;
  }
  return {
    round: 1,
    phase: "playersPhase",
    actors,
    actionLog: [],
    kreachersActingProgress: {},
    missionResult: null,
    systemLog: [],
  };
}

// A JSON round-trip rather than structuredClone: G must already be JSON-
// serializable for boardgame.io's multiplayer sync, and boardgame.io may
// hand this function an Immer draft (a Proxy) while applying a move —
// structuredClone can't clone a Proxy, but JSON.stringify happily reads
// through one.
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function takeSnapshot(state: GameCoreState): Snapshot {
  return {
    round: state.round,
    phase: state.phase,
    actors: deepClone(state.actors),
    kreachersActingProgress: deepClone(state.kreachersActingProgress),
    missionResult: state.missionResult,
  };
}

function runWinLossCheck(state: GameCoreState, hooks: GameHooks): GameCoreState {
  const result = hooks.winLossCheck(state);
  if (!result) return state;
  return {
    ...state,
    missionResult: result,
    systemLog: [...state.systemLog, `Mission ${result} (Round ${state.round})`],
  };
}

// Rule 16: within a staged pass, every eligible Actor spends its next
// Action before any spends a following one. Once every Kreacher still
// holding unspent Actions has acted this pass, the pass resets so the
// next one can begin; if none remain, leaves progress alone and lets
// settle() advance to the Spawn step.
function maybeAdvancePass(state: GameCoreState): GameCoreState {
  const stillEligible = actorsOfCategory(state.actors, "kreacher").filter(
    (actor) => actor.actionPool.remaining > 0,
  );
  if (stillEligible.length === 0) return state;
  const passComplete = stillEligible.every(
    (actor) => state.kreachersActingProgress[actor.id],
  );
  return passComplete ? { ...state, kreachersActingProgress: {} } : state;
}

// Cascades automatic Phase transitions (rules 1-3, 18-22) until either the
// Mission halts or the current Phase genuinely needs external input
// (a Character with an unspent Action in Players' Phase, or a Kreacher
// with one in Kreachers' Phase). Spawn step and End Phase have no
// player-facing moment of their own, so they're folded into this cascade
// rather than modeled as states anything external can observe.
function settle(state: GameCoreState, hooks: GameHooks): GameCoreState {
  let current = state;
  for (let i = 0; i < MAX_SETTLE_ITERATIONS; i++) {
    if (current.missionResult) return current;

    if (current.phase === "playersPhase") {
      if (!allExhausted(current.actors, "character")) return current;
      current = {
        ...current,
        phase: "kreachersPhase",
        actors: refillCategory(current.actors, "kreacher"),
        kreachersActingProgress: {},
        systemLog: [
          ...current.systemLog,
          `Round ${current.round}: Players' Phase ended -> Kreachers' Phase begins`,
        ],
      };
      continue;
    }

    // kreachersPhase
    if (!allExhausted(current.actors, "kreacher")) return current;
    // Spawn step (rule 19) — structural only; real behavior is injected.
    // It always runs at this point, even when it's a no-op.
    current = hooks.spawnStep(current);
    current = {
      ...current,
      systemLog: [...current.systemLog, `Round ${current.round}: Spawn step ran`],
    };
    // End Phase (rules 21-22), inlined: it has no observable moment of
    // its own, so there's nothing gained by modeling it as a stored phase.
    const nextRound = current.round + 1;
    current = {
      ...current,
      actionLog: [],
      kreachersActingProgress: {},
      round: nextRound,
      phase: "playersPhase",
      actors: refillCategory(current.actors, "character"),
      systemLog: [...current.systemLog, `Round ${nextRound}: Players' Phase begins`],
    };
  }
  throw new Error(
    "settle() exceeded max iterations — check that the Mission has at least one Character",
  );
}

export function commitAction(
  state: GameCoreState,
  actorId: string,
  actionType: string,
  payload: unknown,
  hooks: GameHooks,
): CommitResult {
  if (state.missionResult) return { ok: false, reason: "mission-resolved" };

  const actor = state.actors[actorId];
  if (!actor) return { ok: false, reason: "unknown-actor" };

  if (state.phase === "playersPhase") {
    if (actor.category !== "character") {
      return { ok: false, reason: "wrong-phase-for-actor-category" };
    }
  } else if (actor.category !== "kreacher") {
    return { ok: false, reason: "wrong-phase-for-actor-category" };
  }

  if (actor.actionPool.remaining <= 0) {
    return { ok: false, reason: "no-unspent-actions" };
  }

  if (state.phase === "kreachersPhase" && state.kreachersActingProgress[actorId]) {
    return { ok: false, reason: "already-acted-this-pass" };
  }

  const undoEnabled = state.phase === "playersPhase" && hooks.resolvedRules.undoEnabled;
  const snapshot = undoEnabled ? takeSnapshot(state) : null;

  let next: GameCoreState = { ...state, actors: spendAction(state.actors, actorId) };
  next = hooks.applyActionEffect(next, actorId, actionType, payload);

  if (state.phase === "kreachersPhase") {
    next = {
      ...next,
      kreachersActingProgress: { ...next.kreachersActingProgress, [actorId]: true },
    };
    next = maybeAdvancePass(next);
  }

  if (undoEnabled && snapshot) {
    next = {
      ...next,
      actionLog: [...next.actionLog, { actorId, actionType, payload, snapshot }],
    };
  }

  next = runWinLossCheck(next, hooks);
  if (next.missionResult) return { ok: true, state: next };

  return { ok: true, state: settle(next, hooks) };
}

export function undoLastAction(state: GameCoreState, hooks: GameHooks): CommitResult {
  if (state.missionResult) return { ok: false, reason: "mission-resolved" };
  if (state.phase !== "playersPhase") return { ok: false, reason: "not-players-phase" };
  if (!hooks.resolvedRules.undoEnabled) return { ok: false, reason: "undo-disabled" };
  if (state.actionLog.length === 0) return { ok: false, reason: "nothing-to-undo" };

  const lastEntry = state.actionLog[state.actionLog.length - 1];
  const restored: GameCoreState = {
    ...state,
    round: lastEntry.snapshot.round,
    phase: lastEntry.snapshot.phase,
    actors: lastEntry.snapshot.actors,
    kreachersActingProgress: lastEntry.snapshot.kreachersActingProgress,
    missionResult: lastEntry.snapshot.missionResult,
    actionLog: state.actionLog.slice(0, -1),
  };
  return { ok: true, state: restored };
}
