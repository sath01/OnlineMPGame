Last updated: 2026-09-21

# Roles & Demarcation

This is the single source of truth for who decides what on this project, across the Design chat, the Admin chat, and Claude Code (CC). Other documents reference this one rather than restating it — if you find a role or altitude description elsewhere that conflicts with this document, this document wins. The one exception: a dated Decision History Log entry that postdates this document's "Last updated" line is the more recent settled decision — that means this document is stale on that point, not that the Log entry is wrong, and this document should be updated to match rather than treated as still governing.

## Document map

"Owned by," below, means direct edit rights over that document's own content — not just decision-making authority over the topic. Structural changes (splitting a document, creating a new one, changing how documents relate to each other) always route through Admin chat, regardless of who owns the content inside.

- **This document** — who decides what, the altitude line, what to do when unsure. Owned by Admin chat, since it's a process document; content affecting Design chat's own role is checked with Design chat before it ships. Read by all three: Design chat, Admin chat, CC.
- **primer.md** — game content: what the game is, terminology, the four-tier ruleset system, roadmap. Owned and edited directly by Design chat, for content and terminology changes, via its own artifact tools — no Admin transcription step required. Read by CC and Design chat.
- **Implementation Brief Template** — how a brief gets drafted and delivered. Owned by Admin chat. Used by Design chat.
- **Decision History Logs** — one per chat, the settled-decision record for that chat's domain. Each chat edits its own.

## The three roles

- **Design chat** decides game design: mechanics, rules, numeric values, terminology, entity relationships, ownership boundaries between features, and behavior/sequencing. This is the conceptual "what must be true and why" layer.
- **Admin chat** decides workflow, tooling, and infrastructure: how work moves between chats and CC, file/document structure, Airtable schema and process, hosting, and the documents that govern all of this.
- **Claude Code** decides implementation: code architecture, variable/field/type naming, data shape, file and module structure, and algorithm/library choice within the agreed stack (boardgame.io, React, TypeScript, Node.js). This is the "how it's built" layer.

Each role can and should flag into another's territory when something genuinely needs it — see below — but does not decide on the other's behalf.

## The altitude line

Between Design chat and CC specifically: Design chat specifies what must be true, and why — entities, relationships, ownership boundaries, rules, sequencing, and exact numeric or logical values. CC decides how it's represented in code — variable, field, or property names, types, file or module structure, or algorithm/library choices.

Rule of thumb: if you're naming a variable or field, that's CC's call. If you're stating a fact the system must uphold, or a number, sequence, or condition the game must follow, that's Design's call, and it should be stated precisely — precision belongs in the rules and numbers, not in the data shape.

The Implementation Brief Template applies this line to the specific job of writing a brief, with a worked example. This document is the canonical statement of the principle itself.

## What to do when unsure

This applies to any chat or to CC, whenever you're about to make a call that might belong to someone else's role.

**Flag rather than guess when:**

- A brief, or the primer, is ambiguous about what the game should actually do — not just underspecified in code shape, which is expected and fine for CC to resolve itself
- Two things you've been told seem to contradict each other — within one brief, between a new brief and an already-built feature, or between a brief and primer.md
- You're being asked, implicitly or explicitly, to decide something that determines player-facing behavior or a rule/numeric value that wasn't actually specified — that's a design call even if it looks small and easy to just pick
- You're not sure whether something is genuinely undecided yet, or deliberately left open for a later tier (per the four-tier ruleset system) or a later stage of the project. When it's unclear which, ask rather than assume either way.

**Don't flag — just proceed — when:**

- It's a genuine implementation choice: naming, data shape, file structure, or algorithm/library choice within stated behavior. Deciding these is the job, not a risk.
- It's a workflow or tooling detail already settled in this document or the Admin chat's Decision History Log.

**How to flag it:**

- CC raises it with Steve directly in the coding session — state specifically what's unclear or contradictory, not just that something "seems off." Steve either answers directly if it's simple, or relays it to the Design chat if it needs that chat's involvement.
- Design chat or Admin chat, if either notices it's about to make a call outside its own role (Design chat drifting into workflow/tooling, or Admin drifting into game mechanics), raises it with Steve the same way rather than deciding and moving on.
- In all cases: don't guess, don't quietly implement a workaround, and don't pick the "most reasonable" interpretation and proceed. A wrong guess compounds, because later work gets built assuming it was right.
