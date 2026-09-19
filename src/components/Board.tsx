import type { BoardProps } from "boardgame.io/react";
import type { GameState } from "../game/game";

// Plain-HTML placeholder board. Will be replaced by a PixiJS canvas
// once turn logic and multiplayer sync are confirmed working.
export function Board({ G, ctx, moves, playerID }: BoardProps<GameState>) {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>OnlineMPGame</h1>
      <p>You are player: {playerID ?? "spectator"}</p>
      <p>Current turn: player {ctx.currentPlayer}</p>
      <button onClick={() => moves.announce()} disabled={playerID !== ctx.currentPlayer}>
        Take turn
      </button>
      <h2>Log</h2>
      <ul>
        {G.log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
