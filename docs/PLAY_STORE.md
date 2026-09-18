# Google Play store draft

## App name

**String Sort**

## Short description

Untangle colorful strings, relax your mind, and master satisfying rope puzzles.

## Full description

Untangle, sort and relax.

String Sort is a tactile puzzle game where colorful cords cross around a circular board. Move the pegs, reduce the crossings and finish each level with a clean, satisfying layout.

### Features

- Simple drag-and-drop controls
- Smooth rope movement and tactile haptic feedback
- Relaxing bite-sized puzzle levels
- Helpful hints, undo and restart
- Star ratings based on time and moves
- Increasing difficulty with deterministic puzzle generation
- Color plus shape markers for better accessibility
- Offline gameplay
- Adjustable sound, haptics and graphics quality

There is no account required in the current version.

## Suggested tags

Puzzle, Casual, Brain game, Relaxing, Offline

## Content-rating notes

Current gameplay contains no violence, gambling, user-generated content, chat or social features.

## Data safety checklist for the current build

Before Play Console submission, verify the final binary. For the current repository state:
- no account system;
- no backend API;
- no analytics SDK;
- no advertising SDK;
- no location permission;
- no contacts permission;
- no camera/gallery permission;
- progress is stored locally on-device.

If ads, analytics, crash reporting or cloud saving are added later, reassess the Data safety form and privacy policy against the exact production build.

## Store graphics

Vector sources are committed for the launcher identity and feature graphic.

Run:

```bash
npm run assets:store
```

This generates:
- `store/generated/app-icon-512.png`
- `store/generated/feature-graphic-1024x500.png`

CI also publishes these two files as the `string-sort-store-static-assets` artifact.

Still required before the final Play Store submission:
- phone screenshots captured from the real build;
- 7-inch tablet screenshots if tablet support is enabled;
- 10-inch tablet screenshots if tablet support is enabled.

Use the real in-game UI for screenshots so the listing accurately represents gameplay.
