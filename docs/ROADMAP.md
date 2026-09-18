# String Sort production roadmap

## Implemented
- Vite + JavaScript + Capacitor foundation
- Responsive toy-like mobile UI with no runtime font/CDN dependency
- Canvas 2D board renderer
- Segmented Verlet rope simulation with damping and substeps
- Rope slack/tension, drag follow-through and animated settling
- Peg collision and circular board boundary constraints
- Layered rope shading/texture for a tactile cord look
- Draggable rope endpoints
- Deterministic puzzle generation
- Crossing counter and crossing-based win condition
- Hint / Undo / Restart
- Timer, moves, stars and local progress
- Main menu, level select, pause, results and settings
- Haptic feedback
- Automated unit tests and GitHub Actions build/test workflow

## Next production phases
1. Add explicit rope-over-rope crossing constraints so visual over/under state stays stable during aggressive dragging.
2. Tune rope physics on real low/mid Android hardware (segment count, iterations, DPR).
3. Add local sound effects, music ambience and real settings toggles.
4. Add handcrafted onboarding levels before procedural difficulty takes over.
5. Add accessibility and color-blind-safe secondary rope markers.
6. Generate Android project, launcher/splash assets and release configuration.
7. Add save-data migration tests and interaction smoke tests.
8. Add ad-safe layout zones without interrupting the puzzle board.
9. Prepare Play Store icon, screenshots, feature graphic and data-safety/privacy docs.
10. Final device QA, performance profiling and release build instructions.

## Quality target
The final game should feel tactile and readable at 60 FPS on a mid-range Android phone. Physics prioritizes pleasant, predictable interaction over scientific rope simulation.
