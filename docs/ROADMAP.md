# String Sort production roadmap

## Implemented
- Vite + JavaScript + Capacitor 8 foundation
- Android compile/target SDK 36 verification in CI
- Portrait Android orientation and app lifecycle/back-button handling
- Responsive toy-like mobile UI with safe-area support and no runtime font/CDN dependency
- Canvas 2D board renderer
- Segmented Verlet rope simulation with damping and substeps
- Rope slack/tension, drag follow-through and animated settling
- Peg collision and circular board boundary constraints
- Rope-to-rope crossing contact detection and local friction
- Stable rope depth ordering with explicit over/under crossing bridges
- Layered rope shading/texture for a tactile cord look
- Draggable rope endpoints
- Color-blind-safe peg shape markers and reduced-motion support
- 8 handcrafted onboarding/difficulty-ramp levels
- 100 deterministic launch levels with automated solvability checks
- Crossing counter and crossing-based win condition
- Hint / Undo / Restart
- Timer, moves, stars, best times and local progress
- Defensive save-data normalization and safe localStorage handling
- Continue flow, current-level highlighting and progress reset confirmation
- Main menu, 100-level select, pause, results, settings and About/privacy UI
- Offline synthesized sound effects and persistent sound/haptics toggles
- Haptic feedback
- Adaptive High / Balanced / Battery graphics profiles with automatic device selection
- Sustained-low-FPS automatic quality downgrade in Auto graphics mode
- Opt-in real-device FPS/profile/contact diagnostics overlay
- Provider-neutral banner-safe preview layout with no ad SDK installed
- Automated unit, pointer, gameplay, persistence and UI smoke tests
- Production-dependency security audit in CI
- Release-readiness static verification in CI
- Android lint + debug APK build in CI
- Downloadable debug APK artifact from successful CI runs
- Manual signed AAB GitHub Actions release workflow with explicit versionCode/versionName
- Branded launcher/splash SVG sources wired through @capacitor/assets
- Generated 512×512 Play Store icon and 1024×500 feature graphic pipeline
- Playwright workflow that captures real 1080×1920 menu, levels, gameplay and completion screenshots
- Privacy policy and Play Store listing/data-safety drafts for the current offline build
- Physical-device QA checklist

## Remaining work that requires external/manual validation
1. Install the CI debug APK on representative low/mid/high Android phones and run the DEVICE_QA checklist.
2. Validate the generated adaptive launcher icon and splash appearance on real OEM launchers/light-dark system themes.
3. Tune physics/performance thresholds only if real-device diagnostics show sustained issues.
4. Re-check privacy/Data safety before release if an ads, analytics, crash-reporting or cloud SDK is added.
5. Add an actual advertising integration only after the provider/format is selected.
6. Create the final signing secrets and run the signed AAB release workflow.
7. Supply the final public support email/website required by the Play Store listing.

## Quality target
The final game should feel tactile and readable at approximately 60 FPS on a typical mid-range Android phone. Physics prioritizes pleasant, predictable interaction over scientific rope simulation.
