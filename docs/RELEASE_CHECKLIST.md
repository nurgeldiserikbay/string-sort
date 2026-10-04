# String Sort release-candidate checklist

Use this list after automated CI is green and before uploading a production AAB.

## Automated gates

These should all be green on the release commit:

- unit/UI tests;
- 100-level launch quality gate;
- dense Level 100 physics stress gate;
- Vite production build;
- production dependency audit;
- release-readiness static checks;
- Play Store static asset generation;
- real-UI phone + 7-inch tablet + 10-inch tablet screenshot capture;
- screenshot dimension/package verification;
- Android API 36 verification;
- Android lint;
- debug APK build.

## Real-device blockers

Install the latest debug APK and verify:

- one-empty-socket rule is obvious within the first level;
- simple peg taps do not shake or trigger invalid feedback;
- valid drops snap to the empty socket and move the empty position;
- occupied-socket and off-board drops do not count as moves;
- backgrounding/cancelled touches never finish an accidental move;
- second-finger input cannot steal the active drag;
- knots pull/slip without visible teleporting;
- over/under rope rendering remains readable on dense levels;
- Level 80–100 remains responsive during aggressive dragging;
- Auto graphics mode does not sustain sub-40 FPS on the representative mid-range test device;
- status/navigation bars do not cover controls;
- launcher icon and light/dark splash look correct on the chosen OEM devices.

## Signing / Play Console

Before the first production upload:

- generate or choose the permanent upload keystore;
- store the keystore in a backed-up secure location;
- add the four Android signing secrets documented in `docs/RELEASE.md`;
- choose a monotonically increasing `versionCode`;
- choose the final public `versionName`;
- run **Android Release AAB** and download the signed artifact;
- confirm package name `com.nurgeldiserikbay.stringsort`;
- provide the public support email in Play Console;
- verify the public privacy page;
- answer Data safety against the exact AAB being uploaded;
- verify content rating and target audience selections;
- inspect and upload the final phone/tablet screenshots, icon and feature graphic.

## Current network/privacy assumption

The present repository contains no advertising, analytics, tracking, crash-reporting, account, cloud-save or backend SDK.

If any such SDK is added, stop and re-review:
- `docs/PRIVACY.md`;
- `public/privacy.html`;
- Play Console Data safety answers;
- child-directed / Families implications;
- consent requirements where applicable.
