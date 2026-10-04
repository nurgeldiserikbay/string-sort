# String Sort

A mobile rope-untangling puzzle built with JavaScript, Canvas 2D, Vite and Capacitor.

## Run

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test
npm run build
```

## Implemented

- Responsive toy-like mobile UI
- Canvas 2D game board
- Segmented Verlet rope physics with damping, slack/tension and settling
- Peg collision and circular board constraints
- Layered cord rendering with highlights, shadows and moving fiber detail
- Draggable rope endpoints with tactile follow-through
- 100 deterministic launch levels, including 8 handcrafted onboarding levels, with automated solvability checks
- Persistent knot-graph win condition with one stable physical contact per logical knot
- Hint, Undo and Restart
- Timer, move counter and 1–3 star result
- Saved progression plus sound, haptics, graphics and accessibility settings
- Offline synthesized sound effects
- Capacitor haptic feedback
- Main menu, 100-level select, pause, result, settings and About/privacy screens
- Fully offline runtime UI (no font/CDN dependency)
- Vitest coverage for level/crossing logic, rope endpoint stability, topology, adaptive performance, pointer drag/drop, level completion and basic UI interactions
- GitHub Actions test + web build + generated Android debug APK verification
- Manual signed Android AAB release workflow using repository secrets
- Branded launcher/splash asset sources and automated Play Store icon/feature-graphic generation
- Manual real-build Playwright screenshot workflow for Play Store phone screenshots

## Android

See [docs/ANDROID.md](docs/ANDROID.md) for local Android builds and [docs/RELEASE.md](docs/RELEASE.md) for signed Play Store AAB builds. Store/privacy drafts are in [docs/PLAY_STORE.md](docs/PLAY_STORE.md) and [docs/PRIVACY.md](docs/PRIVACY.md).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for remaining manual/external validation. Use [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) for the final pre-publish pass and [docs/FINAL_RELEASE_HANDOFF.md](docs/FINAL_RELEASE_HANDOFF.md) for owner-only steps.
