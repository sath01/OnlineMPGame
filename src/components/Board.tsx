import type { BoardProps } from "boardgame.io/react";
import type { GameState } from "../game/game";

// Plain-HTML placeholder board, enough to drive and observe the Round/
// Phase loop for Level 3 verification. Will be replaced by a PixiJS
// canvas once real Actor content (Characters, Kreachers) exists.
export function Board({ G, moves }: BoardProps<GameState>) {
  const missionOver = G.missionResult !== null;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>OnlineMPGame</h1>
      <p>
        Round {G.round} — {G.phase}
      </p>
      {missionOver && (
        <p>
          <strong>Mission {G.missionResult}</strong>
        </p>
      )}

      <h2>Actors</h2>
      <ul>
        {Object.values(G.actors).map((actor) => (
          <li key={actor.id}>
            {actor.id} ({actor.category}) — {actor.actionPool.remaining}/{actor.actionPool.max}{" "}
            actions{" "}
            <button
              onClick={() => moves.commitAction(actor.id, "test-action")}
              disabled={missionOver || actor.actionPool.remaining <= 0}
            >
              Commit action
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => moves.undoLastAction()}
        disabled={missionOver || G.actionLog.length === 0}
      >
        Undo last action
      </button>

      <h2>Action log ({G.actionLog.length})</h2>
      <ul>
        {G.actionLog.map((entry, i) => (
          <li key={i}>
            {entry.actorId} — {entry.actionType}
          </li>
        ))}
      </ul>

      <h2>System log</h2>
      <p style={{ fontSize: "0.85em", color: "#666" }}>
        Automatic engine events — Phase transitions, the Spawn step, win/loss results. Not part
        of the game's own rules; kept for verification only.
      </p>
      <ul>
        {G.systemLog.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
