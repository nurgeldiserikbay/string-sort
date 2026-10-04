# Final release handoff

String Sort is now at the point where the remaining blockers are account- or physical-device-dependent rather than ordinary repository implementation work.

## Repository state

The `gpt/initial-game` branch contains:

- playable 100-level game;
- rope physics and crossing logic;
- save/progression systems;
- onboarding, hints, undo and restart;
- Android lifecycle/back-button handling;
- responsive UI, sound and haptics;
- adaptive graphics/performance profiles;
- automated tests and Android lint/build checks;
- Play Store icon/feature-graphic/screenshot generation;
- API 36 verification;
- signed AAB workflow;
- privacy/store/release documentation.

Use PR #1 to review/merge the branch into `main`.

## What the owner still needs to provide or verify

### 1. Physical Android device check

Download the latest `string-sort-debug-apk` artifact from GitHub Actions and install it on at least one representative Android phone.

Follow [DEVICE_QA.md](DEVICE_QA.md).

For performance diagnostics, use a debug URL/query context with `?debug=1` when testing the web build. Auto graphics mode already falls back if sustained FPS is low.

### 2. Release/upload key

Create or reuse the permanent Android upload keystore.

Add these GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

See [RELEASE.md](RELEASE.md).

Never send the keystore or passwords in chat and never commit them to git.

### 3. Public Play Store support contact

Provide the final support email and/or public website used in the Play Console listing.

The in-app privacy page currently points to the public GitHub repository for project support. Replace or supplement that with the final support contact if desired.

### 4. Monetization decision

No advertising SDK is installed in the current build.

A provider-neutral banner-safe area can be previewed with:

```text
?adPreview=1
```

If ads are added, choose the provider and create the real app/ad-unit IDs first. After that:

- integrate the SDK;
- use test ads during development;
- update privacy/Data safety declarations;
- rerun Android/device QA.

Do not put production ad IDs directly into source code if the provider recommends environment/config separation.

### 5. Google Play submission

Before uploading:

- merge the release branch;
- ensure CI is green;
- create the release AAB through **Android Release AAB**;
- increment `version_code`;
- set the desired `version_name`;
- download the generated Play Store graphics/screenshot package;
- verify the exact production SDK/data-safety declarations;
- upload the signed AAB to an internal/closed test track first.

## Useful commands

```bash
npm install
npm test
npm run build
npm run verify:release
```

For local Android development:

```bash
npm run build
npx cap add android
npm run assets:android
npx cap sync android
npx cap open android
```

## Release recommendation

Use Google Play internal testing first. Verify installation, startup, saved progress, sound/haptics, pause/resume, Android Back behavior, several easy and hard levels, and a full app restart before promoting the same build to a wider track.
