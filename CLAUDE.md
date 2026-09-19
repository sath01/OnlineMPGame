## Game Project

### What We're Building
A cooperative online turn-based RPG game. Multiple players connect online 
and cooperate against AI-controlled enemies on a shared game board. 
Turn-based — players take actions in sequence, then enemies act. 
Inspired by Zombicide but more open and RPG-style in nature.
Solo play against the machine is a future goal, not the immediate focus.

### Tech Stack Decided
- boardgame.io — game state management, turn structure, multiplayer networking
- React — UI layer
- PixiJS — visual rendering (to be added once mechanics are working)
- TypeScript throughout
- Node.js + npm
- DigitalOcean VPS for hosting (when ready to deploy)
- Project files in Dropbox for cross-machine sync

### Project Folder Structure
GameProject/
├── CLAUDE.md        (this file)
├── context.md       (current build state — update at end of each session)
├── assets/
│   ├── sprites/
│   ├── tiles/
│   └── audio/
└── src/             (all game code)

### Working Approach
- Rapid iterative development — build small, test, adjust
- Game design decisions arrive as implementation briefs from separate 
  Claude.ai design sessions
- Update context.md at the end of each session with what was built, 
  key decisions made, and what's next
- Commit to git after each working feature

### Version Control
- Git with GitHub remote
- Commit after each working feature or meaningful milestone
- Claude Code should suggest commits at appropriate points or commit 
  when asked
- Always propose the commit message for approval before committing
- Push to remote when asked or when approving a suggested push