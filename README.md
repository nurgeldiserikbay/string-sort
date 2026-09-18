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
- Handcrafted onboarding levels followed by deterministic procedural levels
- Crossing-based win condition
- Hint, Undo and Restart
- Timer, move counter and 1–3 star result
- Saved progression and saved sound/haptics settings
- Offline synthesized sound effects
- Capacitor haptic feedback
- Main menu, level select, pause, result and settings screens
- Fully offline runtime UI (no font/CDN dependency)
- Vitest coverage for level/crossing logic and rope endpoint stability
- GitHub Actions test + production build verification

## Android

See [docs/ANDROID.md](docs/ANDROID.md).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the remaining production work, including stable rope-over-rope tangle constraints, Android device tuning, release assets and final QA.
