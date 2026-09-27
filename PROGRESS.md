# ZONE 3 field-test readiness

Continues the existing Next.js + Three.js game and `nan-adventure-save-v1` saves.

- Added `public/game/assets/nan-river-panorama.png` as an illustrative Nan-river panorama composited behind the transparent 3D scene, with a CSS gradient fallback. Added procedural ground, water, plaster, and roof-tile textures, denser instanced tree crowns, softer lighting and shadows, and adjusted the camera so the landscape reads at a lower, more game-like angle. The scene remains a stylized prototype rather than a production character/model pack.
- Moved the toolkit and sandbag pickups outside the equipment depot collision area. Moved the school teacher and damage marker outside the school building collision area. The objective route now includes the free repair kit, and the flood cannot start until it has been collected.
- Tested the browser route to the water station and opened its information interaction. Automated path checks cover the complete ordered route from station and depot through supplies, build area, school, and all survey points, plus the river bridges. `npm test` now runs 13 checks; `npm run check` and `npm run build` passed for the current scene update.
- Prepared `PILOT-ZONE3.md` for two pairs of learners, including tasks, an observation sheet, curriculum links, and criteria to meet before expanding the map. A teacher still needs to arrange and conduct the learner session; no student pilot has been conducted yet.

The scene remains a stylized educational prototype and is not a surveyed geographic reconstruction. The pilot is intended to identify usability problems before extending the playable area; the school should follow its own consent policy and record no student names. Classroom synchronization remains demo-only as described in README.md.

Continue from these files; do not rebuild the project. Deployment remains the existing GitHub main branch connected to Vercel.
