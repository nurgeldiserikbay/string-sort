# String Sort production roadmap

## Implemented
- Vite + JavaScript + Capacitor 8 foundation
- Android compile/target SDK 36 verification in CI
- Portrait Android orientation and native lifecycle/back-button handling
- Responsive toy-like mobile UI with safe-area support
- Canvas 2D dark circular puzzle board with exactly one empty socket
- Segmented Verlet rope simulation with damping, adaptive slack and spring-follow dragging
- Persistent logical knot graph instead of purely visual line intersections
- Physical knot constraints that couple bound ropes together
- Distributed knot centers that move with the rope bundle under tension
- Sliding knot contacts along rope interiors
- Double-wrap and occasional triple-wrap tangles on denser boards
- Stable local over/under rendering without the old crossing capsule artifact
- Knot-specific friction only between logically bound ropes
- Peg collision and board-boundary constraints
- Subtle knot-release burst, haptic feedback and positive sound cue
- Clean colored rope terminals by default
- Optional accessibility peg markers in Settings
- Reduced-motion support
- One-empty-socket move rule enforced in UI, board input, hints and tests
- 8 handcrafted onboarding levels
- 100 deterministic launch levels
- Later procedural levels require every rope to participate in the tangle
- Level 25+ procedural boards require one connected knot graph
- Late-game rope count capped at 9 for readability
- Automated 100-level quality gate: structure, hint solvability, connectivity and finite knot constraints
- Knots counter, Hint / Undo / Restart
- Animated Hint guide to the current empty socket
- Timer, moves, stars, best times and local progress
- Defensive save-data normalization and safe localStorage handling
- Main menu with real Canvas tangle preview
- Five visual level chapters across 100 levels
- Pause, results, Settings, About and bundled privacy page
- Offline synthesized sound effects and haptics
- Adaptive Auto / High / Balanced / Battery graphics profiles
- Sustained-low-FPS automatic quality downgrade
- Opt-in FPS/profile/knot diagnostics overlay
- Provider-neutral banner-safe preview with no advertising SDK installed
- Production dependency audit and release-readiness checks in CI
- Android lint + debug APK build in CI
- Play Store icon, adaptive launcher icon, light/dark splash and feature graphic sources
- Automated real-UI 1080×1920 screenshots, including a dense late-game tangle
- Manual signed/versioned AAB release workflow
- Privacy, Play Store, release and physical-device QA documentation

## Remaining work that requires external/manual validation

Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the final pre-publish pass.
1. Install the latest CI debug APK on representative low/mid/high Android phones.
2. Run the physical interaction checks in [DEVICE_QA.md](DEVICE_QA.md), especially rapid dragging through dense levels.
3. Use the diagnostics overlay only if a real device shows sustained frame-rate/input issues, then tune thresholds from those measurements.
4. Validate adaptive launcher icon and splash appearance on real OEM launchers and light/dark system themes.
5. Create/back up the final Android upload key and add release signing secrets.
6. Supply the final public support email/website for the Play Store listing.
7. If ads, analytics, crash reporting or cloud saves are later added, re-review the privacy policy and Play Data safety answers before publishing that build.

## Quality target
The game should feel like a tactile physical untangling puzzle rather than colored straight lines. On a typical mid-range Android phone, normal gameplay should target approximately 60 FPS with predictable touch response. The simulation intentionally prioritizes readable, satisfying game feel over scientific rope accuracy.
