# Device QA checklist

This checklist is for the final physical-device pass before publishing String Sort.

## Recommended device coverage

Test at least:

- one lower-end Android device with 4 CPU cores / 3–4 GB RAM;
- one typical mid-range Android device;
- one higher-end Android device;
- one device with a tall/narrow screen;
- one tablet if tablet distribution stays enabled.

## Performance diagnostics

The game contains an opt-in Canvas diagnostics overlay.

In a browser preview:

```text
?debug=1
```

To preview the reserved banner-safe layout at the same time:

```text
?debug=1&adPreview=1
```

The overlay reports:

- approximate FPS;
- active graphics profile;
- rope count;
- active rope crossing contacts;
- current DPR cap.

The overlay is disabled in normal gameplay.

## Performance acceptance target

For a typical mid-range Android phone:

- target: approximately 60 FPS during normal play;
- short dips during a complex drag are acceptable;
- no sustained input lag;
- no visible rope explosions/jitter;
- no peg drag desynchronization;
- Auto mode should step down quality if FPS stays low.

If Auto selects too high a profile for a device, record the reported profile, FPS and device model and tune `PerformanceProfile.js`.

## Physics checks

For levels with 4–8 ropes:

1. drag a peg slowly across the board;
2. drag it quickly across multiple ropes;
3. circle around another peg;
4. release directly on a target peg;
5. release away from every peg;
6. repeatedly undo and restart;
7. solve the level after several aggressive drags.

Verify:

- rope endpoints remain attached;
- rope segments do not visibly stretch apart;
- ropes do not escape the circular board;
- over/under rendering remains stable enough to read;
- peg collision does not trap the rope permanently;
- no NaN/exploding geometry appears.

## Android navigation

Verify:

- Back from gameplay opens Pause;
- Back from Pause resumes;
- Back from Levels returns to Menu;
- Back from Settings returns to Menu;
- Back from completion returns to Levels;
- Back from Menu exits the app.

## Layout / edge-to-edge

On Android 16 / API 36 devices verify:

- top buttons are not under the status bar/camera cutout;
- bottom controls are not under the gesture-navigation area;
- gameplay remains usable in both short and tall phone aspect ratios;
- launcher icon is centered in adaptive masks;
- splash screen is centered in light and dark system appearance.

## Banner-safe preview

No advertising SDK is currently installed.

The query flag:

```text
?adPreview=1
```

enables a non-interactive placeholder that reserves bottom space. Use this to verify that a future banner does not overlap Hint / Undo / Restart or the puzzle board.

Do not ship a placeholder as an actual advertisement.

## Regression pass

Run locally:

```bash
npm test
npm run build
```

The pull-request CI additionally:

- generates Play Store static graphics;
- generates the Capacitor Android project;
- verifies target/compile SDK 36;
- generates launcher/splash resources;
- assembles a debug APK;
- uploads the APK as an artifact.

## Release blockers

Do not publish if any of these remain:

- repeated physics instability;
- level that cannot be solved;
- Android Back behavior broken;
- persistent sub-40 FPS on a representative mid-range device;
- controls hidden by system bars;
- wrong package name/versionCode;
- signing key not backed up;
- privacy/Data safety text does not match the production SDK set.
