import type { GameHooks } from "./types";

// Placeholder hooks. Real implementations arrive with the features that
// own this behavior — Win/Loss Framework, Kreacher Spawning & Basic AI,
// and the Character/Kreacher Action catalogs respectively. Core Game
// Loop only needs the extension points to exist and be called at the
// right structural moments (rules 19, 23-25).
export const defaultHooks: GameHooks = {
  // Not a real design decision — Campaign & Mission Structure owns the
  // actual resolved value. True here only so the feature is runnable/
  // testable before that feature exists.
  resolvedRules: { undoEnabled: true },
  winLossCheck: () => null,
  spawnStep: (state) => state,
  applyActionEffect: (state) => state,
};
