# Final release handoff

String Sort is at the point where the remaining production blockers are account-, signing-, or physical-device-dependent rather than ordinary repository implementation work.

## Repository state

The current `main` branch contains:

- a playable 100-level game;
- exactly one empty socket on every level;
- persistent logical knot graphs and physical rope constraints;
- distributed/sliding knot centers with double/triple wraps on dense levels;
- spring-follow rope dragging and invalid-drop feedback;
- deterministic per-level visual variation;
- save/progression systems;
- onboarding, convergence-safe hints, undo and restart;
- Android lifecycle/back-button handling;
- responsive UI, sound and haptics;
- optional accessibility peg markers;
- adaptive graphics/performance profiles;
- automated 100-level quality and dense-physics stress tests;
- Android API 36 lint/build verification;
- Play Store icon/feature-graphic/real-UI screenshot generation;
- manual signed AAB workflow;
- privacy, Play Store, release and physical-device QA documentation.

Normal repository implementation work should continue through reviewed PRs, but no old feature branch is required for release.

## What the owner still needs to provide or verify

### 1. Physical Android device check

Download the latest `string-sort-debug-apk` artifact from a successful **CI** run on `main` and install it on representative Android hardware.

Follow [DEVICE_QA.md](DEVICE_QA.md) and [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

### 2. Release/upload key

Create or reuse the permanent Android upload keystore.

Add these GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

See [RELEASE.md](RELEASE.md).

Never commit the keystore or passwords to git.

### 3. Public Play Store support contact

Provide the final support email required by Play Console and, if desired, a public website/support URL.

The bundled privacy page currently links to the public GitHub repository. Replace or supplement that link later if a dedicated support site is created.

### 4. Monetization decision

No advertising SDK is installed in the current build.

A provider-neutral banner-safe area can be previewed with:

```text
?adPreview=1
```

If ads are added later:

- choose the provider and real app/ad-unit IDs;
- use test ads during development;
- update privacy and Play Data safety declarations;
- review child-directed/Families implications if applicable;
- rerun Android/device QA.

### 5. Google Play submission

Before production:

- ensure the intended release commit is on `main`;
- ensure CI and screenshot workflows are green;
- run the manual **Android Release AAB** workflow;
- increment `version_code`;
- choose the final `version_name`;
- download and inspect the signed AAB;
- download the generated Play Store graphics/screenshot package;
- verify privacy/Data safety against that exact binary;
- upload to an internal testing track first;
- test installation, upgrade behavior and saved progress before promoting further.

## Useful commands

```bash
npm install
npm run verify
```

For local Android development:

```bash
npm run build:android        # test build, opens Android Studio
npm run android:aab          # production AAB for Play (see docs/ANDROID.md)
```

## Release recommendation

Use Google Play internal testing first. Verify startup, saved progress, sound/haptics, pause/resume, Android Back behavior, several easy and hard levels, dense rope dragging, and a full app restart before promoting the same build to a wider track.
