# String Sort production roadmap

## Implemented
- Vite + JavaScript + Capacitor foundation
- Responsive toy-like mobile UI with no runtime font/CDN dependency
- Canvas 2D board renderer
- Segmented Verlet rope simulation with damping and substeps
- Rope slack/tension, drag follow-through and animated settling
- Peg collision and circular board boundary constraints
- Rope-to-rope crossing contact detection and local friction
- Stable rope depth ordering with explicit over/under crossing bridges
- Layered rope shading/texture for a tactile cord look
- Draggable rope endpoints
- Color-blind-safe peg shape markers in addition to color
- Handcrafted onboarding levels followed by deterministic procedural levels
- Crossing counter and crossing-based win condition
- Hint / Undo / Restart
- Timer, moves, stars and local progress
- Main menu, level select, pause, results and settings
- Offline synthesized sound effects and persistent sound/haptics toggles
- Haptic feedback
- Automated unit tests and GitHub Actions build/test workflow
- Capacitor Android smoke build in CI
- Downloadable debug APK artifact from successful CI runs
- Adaptive High / Balanced / Battery graphics profiles with automatic device selection
- Interaction smoke tests for menu, level start, pause/resume and settings persistence
- Manual signed AAB GitHub Actions release workflow with secret-based keystore handling

## Next production phases
1. Validate and tune the adaptive performance profiles on real low/mid Android hardware.
2. Expand interaction smoke tests to pointer drag/drop and level completion.
3. Generate and wire final Android launcher icon and splash assets.
4. Add ad-safe layout zones without interrupting the puzzle board.
5. Tune handcrafted onboarding and procedural difficulty from playtesting.
6. Prepare Play Store icon, screenshots, feature graphic and data-safety/privacy docs.
7. Final device QA and real-device performance profiling.

## Quality target
The final game should feel tactile and readable at 60 FPS on a mid-range Android phone. Physics prioritizes pleasant, predictable interaction over scientific rope simulation.
