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

A manual GitHub Actions workflow named **Play Store Screenshots** can also build the real app UI and capture a 1080 × 1920 phone set automatically. It currently captures:
- main menu;
- level selection;
- live gameplay;
- real level-complete state after solving onboarding level 1 through pointer drags.

The workflow packages those screenshots together with the generated 512 × 512 icon and 1024 × 500 feature graphic as `string-sort-play-store-package`.

Still optional depending on the final Play Console device support:
- 7-inch tablet screenshots;
- 10-inch tablet screenshots.

All phone screenshots are taken from the actual app UI rather than concept art.
