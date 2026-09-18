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
- 8 handcrafted onboarding levels followed by 100 deterministic launch levels with solvability checks
- Crossing-based win condition
- Hint, Undo and Restart
- Timer, move counter and 1–3 star result
- Saved progression and saved sound/haptics settings
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

See [docs/ROADMAP.md](docs/ROADMAP.md) for the remaining manual/external release validation, mainly physical Android device QA, final signing secrets and any future monetization SDK selection.
