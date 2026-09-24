# NAN FLOOD RESCUE

Playable MVP for grade 5 learners. Run `npm install` then `npm run dev`, and open http://localhost:3000.

This repository contains a Next.js application and the currently playable browser game at `public/game/`. Historical records live in `public/game/data/historical.js`; simulation logic lives in `public/game/engine.js`. `schema.sql` is the PostgreSQL/Supabase schema for the online classroom release.

The demo stores progress locally in the browser. Teacher authentication and classroom sync are demo-only until a Supabase project is connected. Do not represent the demo room code as secure authentication.

The map is derived from OpenStreetMap. Historical extent comes from GISTDA's report for ICEYE imagery dated 25 July 2025: 22,032 rai in Mueang Nan, Phu Phiang, and Wiang Sa. The game does not include a verified georeferenced flood polygon, and simulated blue overlays are clearly identified as such.
