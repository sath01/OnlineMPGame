import type { Actor, ActorCategory } from "./types";

export function actorsOfCategory(
  actors: Record<string, Actor>,
  category: ActorCategory,
): Actor[] {
  return Object.values(actors).filter((actor) => actor.category === category);
}

// Rule 4: refilling a category's pools to full happens at the start of
// the Phase in which that category acts.
export function refillCategory(
  actors: Record<string, Actor>,
  category: ActorCategory,
): Record<string, Actor> {
  const next: Record<string, Actor> = { ...actors };
  for (const actor of actorsOfCategory(actors, category)) {
    next[actor.id] = {
      ...actor,
      actionPool: { max: actor.actionPool.max, remaining: actor.actionPool.max },
    };
  }
  return next;
}

// Vacuously true when the category has no actors at all — this is what
// lets a Kreachers' Phase with zero Kreachers fall straight through to
// the Spawn step instead of stalling.
export function allExhausted(
  actors: Record<string, Actor>,
  category: ActorCategory,
): boolean {
  return actorsOfCategory(actors, category).every(
    (actor) => actor.actionPool.remaining <= 0,
  );
}

export function spendAction(
  actors: Record<string, Actor>,
  actorId: string,
): Record<string, Actor> {
  const actor = actors[actorId];
  return {
    ...actors,
    [actorId]: {
      ...actor,
      actionPool: { max: actor.actionPool.max, remaining: actor.actionPool.remaining - 1 },
    },
  };
}
