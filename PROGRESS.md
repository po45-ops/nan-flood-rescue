# Zone 3 playable UI update

Continues the existing Next.js + Three.js game and `nan-adventure-save-v1` saves.

- `public/game/adventure-play.js` extends the original game with the redesigned HUD, map and guided navigation, pointer joystick, building collision and reachable interaction distances, pause during dialogs, persistent pickups, mandatory-equipment budget reserve, refund and reclaim actions.
- `public/game/zone3-scene.js` adds rounded terrain, layered roof details, improved characters and rescue truck, trees, grass, bridge decks, nearby labels and an objective marker.
- `public/game/adventure-polish.css` styles the dimensional HUD, dialogs, equipment cards and responsive touch controls.
- `public/game/index.html` loads the extensions before mounting the existing game.
- `npm test` runs 10 regression tests covering preparation, equipment, flood, survey, results, saved progress, navigation and controls. `npm run check` and `npm run build` validate the application.

The scene is a stylized playable educational prototype; it is not a surveyed geographic reconstruction. Classroom synchronization remains demo-only as described in README.md.

Continue from these files; do not rebuild the project. Deployment remains the existing GitHub main branch connected to Vercel.
