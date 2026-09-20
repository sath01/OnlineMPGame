Last updated: 2026-09-20

# Kreacher Killer — Background Primer

This document is background context only, not a task list. It exists so you understand the shared vocabulary, overall shape, and direction of the project — enough to make sensible, consistent implementation decisions (naming, structure, organization) without guessing at game design. It is not a substitute for the specific Implementation Briefs you'll receive per feature — those are the actual instructions for what to build, when. For who decides what, and what to do if you're unsure, see roles-and-demarcation.md.

## What the game is

Kreacher Killer is a cooperative, online, turn-based RPG for 1–6 players, inspired by the Zombicide board game series but more open and RPG-style. Players control Characters cooperating against Kreachers (enemies controlled by the game itself) across Missions, with an eventual solo mode where the game controls a full team. The base ruleset is a merged, house-ruled version of Zombicide's Invader, Dark Side, and Black Ops rulesets. The game is designed to support multiple genres (sci-fi, fantasy, western, etc.), each bringing its own Kreacher types, weapons, and equipment as a self-contained content pack.

## Terminology

- **Character** — a player-controlled unit (replaces the term "Survivor" from the source material). Generic and genre-neutral.
- **Kreacher** — an enemy unit controlled by the game (replaces "Zombie"/"Xeno").
- **Actor** — the generic term covering Character, Kreacher, and Machine — anything that can activate and spend Actions.
- **Action** — the atomic, loggable unit of activity an Actor spends from its Action pool during an activation (a Move, an Attack, a Search, etc.).
- **Player** — a human controlling one or more Characters. The number of Characters per Player is a configurable setting, not fixed.
- **Zone** — the basic unit of space on the board (a room, a corridor section, an exterior area, etc.).
- **Mission** — a single scenario: its tiles, spawn zones, objectives, and win/loss conditions.
- **Campaign** — a sequence of Missions played by the same set of Characters, who carry XP, Skills, and Equipment between Missions. A standalone Mission is the degenerate case of a Campaign with one Mission and no carry-over.
- **Session** — one real-world sitting (login to logout). A Mission may span one Session or several.
- **Players' Phase / Kreachers' Phase / End Phase** — the three-phase Round structure. Players' Phase allows any Player to act with any of their Characters in any order; Kreachers' Phase covers Kreacher activation then spawning; End Phase resets per-round state.
- **Danger Level** — the mechanism tying Kreacher spawn scaling to Character progression. Likely to diverge from the original Zombicide model once Campaigns are supported — this is a known open design question, not yet finalized.
- **Genre pack** — a data-driven content bundle (Kreacher types, weapons, equipment, flavor) for a specific setting, designed to plug into the same engine.

## The four-tier ruleset system

Every rule or mechanic in the game sits at one of four levels, and understanding which level something belongs to matters for how it should be implemented (hardcoded vs. config-driven):

1. **Engine Capability** — what the code is structurally built to support (e.g., "an Actor has an Action pool," "Actions are loggable/undoable," "a Kreachers' Phase always includes a Spawn step"). Invisible to players; these are code-level facts, and only truly immutable invariants (e.g., "0 Armor means eliminated") live here as hard-coded truth.
2. **Core Ruleset** — the default rules that apply unless overridden (e.g., standard Kreacher spawn counts by Danger Level, standard Action counts per Character). This is where most of the "Zombicide rules" content lives.
3. **Campaign/Session Options** — dials set once for a Campaign or standalone game (undo enabled or not, max Characters per Player, difficulty tuning), which cascade as defaults to every Mission within that Campaign.
4. **Mission Definition** — a specific Mission's own content and any rule overrides specific to it (its tiles, objectives, spawn behavior, special rules).

Settings cascade: Core Ruleset defaults → Campaign-level overrides → Mission-level overrides, with each layer only needing to specify what it changes. This should be implemented as a straightforward merge, not a rigid inheritance hierarchy.

Not every existing Zombicide rule has been classified into this system yet — that happens feature by feature, as each is designed, not all at once up front. Don't assume a rule is immutable just because it isn't listed under a tier yet.

## Roadmap (orientation only — not authoritative)

This is a snapshot for context. The Airtable Features table is the actual source of truth and will drift from this list over time.

- **Foundation** — Core Game Loop & Turn Structure, Board & Zone Model, Character Data Model, Campaign & Mission Structure, Minimal Combat Resolution, Kreacher Spawning & Basic AI, Win/Loss Framework, Minimal Multiplayer Wiring
- **Core Loop** — Full Combat System, Equipment & Inventory, Multiple Kreacher Types & Behaviors, XP/Danger Level & Skills, Mission/Objective Framework, Noise/Aggro System
- **Content & Genre** — Genre/Content Abstraction Layer, First Genre Content Pack, Mission/Map Data Format
- **Multiplayer & Sessions** — Lobby/Game Creation & Joining, Reconnect/Resume Handling
- **Later** — Solo Play vs AI, PixiJS Visual Upgrade, Sprite/Asset Pipeline, Audio Integration, Cross-Session Persistence, 7+ Character Scaling Rules
