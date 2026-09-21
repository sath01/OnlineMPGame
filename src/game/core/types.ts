export type ActorCategory = "character" | "kreacher";

export interface ActionPool {
  max: number;
  remaining: number;
}

export interface Actor {
  id: string;
  category: ActorCategory;
  actionPool: ActionPool;
}

export type Phase = "playersPhase" | "kreachersPhase";

export type MissionResult = "won" | "lost" | null;

export interface ActionLogEntry {
  actorId: string;
  actionType: string;
  payload: unknown;
  snapshot: Snapshot;
}

// Everything an undo restores. Deliberately excludes actionLog itself —
// undo pops the log entry as its own explicit step (rule 12) rather than
// relying on it falling out of a self-inclusive snapshot.
export interface Snapshot {
  round: number;
  phase: Phase;
  actors: Record<string, Actor>;
  kreachersActingProgress: Record<string, boolean>;
  missionResult: MissionResult;
}

export interface GameCoreState {
  round: number;
  phase: Phase;
  actors: Record<string, Actor>;
  actionLog: ActionLogEntry[];
  // Which kreachers have already spent their Action in the current staged
  // resolution pass (rule 16). Reset each new pass and at End Phase.
  kreachersActingProgress: Record<string, boolean>;
  missionResult: MissionResult;
  // Not a brief-owned entity — an observability aid for manual (Level 3)
  // verification, so the automatic engine cascade (Phase transitions, the
  // Spawn step firing, win/loss results) is visible, not just committed
  // Actions. Unlike actionLog, it does not reset each Round and is not
  // reverted by undo — it's a historical trace, not part of the rules.
  systemLog: string[];
}

// Consumed from the Mission's already-resolved rule set (Core Ruleset +
// Campaign + Mission overrides). The merge mechanism itself belongs to
// Campaign & Mission Structure — this feature only reads the result.
export interface ResolvedMissionRules {
  undoEnabled: boolean;
}

// Extension points for features this one structurally depends on but does
// not own the behavior of (rules 19, 23-25, and the deferred Action catalog).
export type WinLossCheck = (state: GameCoreState) => MissionResult;
export type SpawnStepHook = (state: GameCoreState) => GameCoreState;
export type ActionEffectResolver = (
  state: GameCoreState,
  actorId: string,
  actionType: string,
  payload: unknown,
) => GameCoreState;

export interface GameHooks {
  resolvedRules: ResolvedMissionRules;
  winLossCheck: WinLossCheck;
  spawnStep: SpawnStepHook;
  applyActionEffect: ActionEffectResolver;
}

export type CommitResult =
  | { ok: true; state: GameCoreState }
  | { ok: false; reason: string };
