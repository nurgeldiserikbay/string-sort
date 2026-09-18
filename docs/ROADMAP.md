# String Sort production roadmap

## Current playable foundation
- Vite + JavaScript
- Canvas 2D board renderer
- Draggable rope endpoints
- Deterministic puzzle generation
- Crossing counter
- Hint / Undo / Restart
- Timer, moves, stars, local progress
- Main menu, level select, pause, results, settings
- Capacitor config and haptic feedback
- Responsive toy-like UI

## Next production phases
1. Replace simplified center-crossing ropes with segmented Verlet ropes.
2. Add peg collision, rope slack/tension, drag inertia and friction.
3. Add rope-over-rope visual ordering and stable tangle constraints.
4. Add native/local audio assets and sound settings.
5. Add handcrafted onboarding levels, then tune generator difficulty.
6. Add accessibility and color-blind-safe secondary rope markers.
7. Add Android project, launcher/splash assets, release signing guide.
8. Add automated tests for generator, crossing detection and save data.
9. Profile on low/mid Android hardware and tune DPR/segment count.
10. Prepare Play Store screenshots, feature graphic, privacy/data-safety docs.

## Quality target
The final game should feel tactile and readable at 60 FPS on a mid-range Android phone. Physics should prioritize pleasant, predictable interactions over scientific rope simulation.
