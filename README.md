# String Sort

A mobile rope-untangling puzzle built with JavaScript, Canvas 2D, Vite and Capacitor.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## What is implemented

- Responsive toy-like mobile UI
- Canvas 2D game board
- Draggable rope endpoints
- Procedurally generated deterministic levels
- Crossing-based win condition
- Hint, Undo and Restart
- Timer, move counter and 1–3 star result
- Saved progression via localStorage
- Main menu, level select, pause, result and settings screens
- Capacitor config and haptic feedback

The current renderer intentionally uses a lightweight visual rope model so gameplay can be validated first. The production roadmap upgrades it to segmented Verlet rope physics with peg collision, slack/tension, friction and tangle constraints.

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ANDROID.md](docs/ANDROID.md).
