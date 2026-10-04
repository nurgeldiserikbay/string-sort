# Changelog

## 0.1.0 — release candidate

Initial public release candidate of String Sort.

### Gameplay
- one-empty-socket rope untangling mechanic;
- 100 deterministic levels across five chapters;
- persistent logical knot graph with connected late-game tangles;
- Verlet rope simulation with slack, tension, peg collision and board boundaries;
- sliding knot centers plus double/triple-wrap presentation on dense levels;
- local over/under rope rendering;
- Hint, Undo and Restart;
- convergence-safe hints that always progress toward a known solution;
- timer, moves, stars and best times.

### Interaction
- spring-follow peg dragging;
- single-pointer touch handling;
- pointer-cancel/background safety;
- invalid-drop shake/haptic/audio feedback;
- neutral simple peg taps;
- optional accessibility peg markers;
- sound and haptics settings.

### Performance
- Auto / High / Balanced / Battery graphics profiles;
- adaptive DPR/rope segment/constraint quality;
- sustained-low-FPS fallback;
- optional diagnostics overlay;
- dense Level 100 physics stress test.

### Android / release
- Capacitor 8;
- Android compile/target SDK 36 verification;
- portrait lifecycle/back-button behavior;
- adaptive launcher icon and light/dark splash generation;
- debug APK CI artifact;
- signed AAB workflow;
- Play Store icon, feature graphic and real-UI screenshot generation;
- privacy, store-listing and release documentation.
