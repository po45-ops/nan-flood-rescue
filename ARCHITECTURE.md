# Technical architecture and MVP plan

## Goal

A browser game for grade 5 learners and the public. The map and historical record are grounded in Nan province; every generated result is labelled as a learning simulation.

## MVP layers

1. **Next.js/React shell:** serves the game at `/`, supplies document metadata, and is ready for route expansion. The interactive game currently runs as an isolated browser application in `public/game/`. This keeps the existing playable mission intact while the game UI is migrated into React components.
2. **MapLibre map:** raster basemap from OpenStreetMap/OpenTopoMap, OpenStreetMap district boundaries and Nan River geometry, real geographic context, clickable learning locations, selectable layers. Training locations without verified coordinates are explicitly marked as examples. No invented river or flood polygon is displayed as historical geography.
3. **Phaser animation:** lightweight transparent scene for rain, movement, and water cues during the simulation. The learning model is in `engine.js`, separate from visual animation.
4. **Historical dataset:** immutable sourced records in `public/game/data/historical.js`. Unsupported values are null and shown as unconfirmed. Mission 2568 is the only playable verified mission in MVP.
5. **Simulation/assessment:** game-only choices, budget, risk indices, reflection, two runs, and skill scores. Stored in localStorage in the prototype; no historical record is mutated by play.
6. **Supabase design:** `schema.sql` defines historical missions/sources/records, classrooms, students, and simulation runs. Production classroom sync requires a Supabase project, migrations, RLS policies, and real teacher authentication; no keys are embedded in the prototype.
7. **Deployment/source:** Next.js targets Vercel and GitHub. The game can be deployed once those accounts/projects are connected. The demo does not require a database to be playable.

## Folder structure

- `app/` — Next.js shell
- `public/game/` — playable game UI and static assets
- `public/game/data/` — cited historical mission records
- `public/game/engine.js` — educational simulation model
- `schema.sql` — Supabase/PostgreSQL schema
- `ARCHITECTURE.md` — architecture and delivery plan

## Game state

`screen`, `stage`, `player`, `role`, `room`, `budget`, `inventory`, `actions`, `visited`, `surveyed`, `recovery`, `round`, `results`, `reflection`, `preScore`, `postScore`, and `performanceTask` are stored by the client. Results include model version, district risk indices, safety, schools, roads, environment, actions, and remaining game budget. Historical mission records are read-only and never copied into result fields as if calculated by the game.

## Mission data contract

A mission contains `mission_id`, `year`, `event_name`, dates, cause/storm, record arrays, affected administrative areas, satellite extent (value and optional geometry), warning/response records, and source records with URL, date, and confidence. Every factual value must identify its source. New events enter the database as pending until verified. Missing numeric fields remain null.

## Current limitations and next implementation slices

1. Convert the browser game from a single UI module into React components and typed state/actions.
2. Connect a Supabase project with Row Level Security. Replace demo teacher gate with proper authentication and classroom-scoped queries.
3. Add verified station time series and georeferenced historical flood extent after dataset licensing/source checks.
4. Add multiplayer team coordination, room join, and role-specific information exchange.
5. Review risk rules with a Nan flood/domain specialist and test classroom usability.
6. Connect GitHub and Vercel, publish, then verify desktop/tablet/mobile and source attribution.

The above are development tasks, not capabilities claimed by the present MVP.
