# Google Play store draft

## App name

**String Sort**

## Short description

Untangle colorful ropes by moving pegs through one empty socket.

## Full description

Untangle, sort and relax.

String Sort is a tactile rope puzzle built around one simple rule: there is always exactly one empty socket. Move a colored peg into that free spot, shift the empty socket around the board, and gradually release every knot.

The ropes do more than draw straight lines. They bend, pull, slide and react to the tangle, giving each move a soft physical feel while keeping the puzzle readable.

### Features

- One-empty-socket puzzle mechanic
- Smooth rope movement with physical knot interactions
- 100 deterministic launch levels across five chapters
- Increasingly dense connected tangles
- Helpful hints that always move toward a known solution
- Undo and restart
- Star ratings based on time and moves
- Sound and haptic feedback
- Auto / High / Balanced / Battery graphics profiles
- Optional peg-shape markers for color accessibility
- Offline gameplay
- No account required

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
- progress and preferences are stored locally on-device.

If ads, analytics, crash reporting or cloud saving are added later, reassess the Data safety form and privacy policy against the exact production build.

## Store graphics

Run:

```bash
npm run assets:store
```

This generates:
- `store/generated/app-icon-512.png`
- `store/generated/feature-graphic-1024x500.png`

CI publishes these as the `string-sort-store-static-assets` artifact.

The **Play Store Screenshots** workflow captures the real application UI for three portrait device profiles:

- phone: 1080 × 1920;
- 7-inch tablet set: 1200 × 1920;
- 10-inch tablet set: 1600 × 2560.

Each profile includes:
- main menu;
- level selection;
- live gameplay;
- solved/completion state;
- a dense late-game tangle.

The workflow verifies that all 15 screenshots exist at the expected pixel dimensions, then packages them together with the generated app icon and feature graphic.

All screenshots are captured from the actual app UI, not concept art.

## Manual Play Console values still required

Before publishing, provide:
- the final public support email;
- optional public website/support URL;
- final app category and tags;
- final content-rating questionnaire answers;
- final Data safety answers after confirming the exact production binary.
