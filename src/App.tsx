import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { CoopGame } from "./game/game";
import { Board } from "./components/Board";

// Hardcoded playerID/matchID for now — replace with a real lobby/login
// flow once we're past the "does multiplayer sync work" stage.
const GameClient = Client({
  game: CoopGame,
  board: Board,
  multiplayer: SocketIO({ server: "localhost:8000" }),
});

export function App() {
  return <GameClient playerID="0" matchID="default" />;
}
