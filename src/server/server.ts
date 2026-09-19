import { Server, Origins } from "boardgame.io/server";
import { CoopGame } from "../game/game";

const server = Server({
  games: [CoopGame],
  origins: [Origins.LOCALHOST],
});

const PORT = 8000;
server.run(PORT, () => {
  console.log(`boardgame.io server listening on http://localhost:${PORT}`);
});
