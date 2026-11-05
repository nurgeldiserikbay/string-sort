# String Sort — physical Android QA evidence

Complete this report for each physical device tested. Copy it into an issue comment or attach it to a release QA ticket. **Do not mark a test as passed based on CI, emulation, screenshots, or assumptions.**

## Build and environment

| Field | Value |
| --- | --- |
| Test date (local and time zone) | |
| Tester | |
| Device manufacturer / model | |
| Android version / API | |
| RAM / screen dimensions | |
| Navigation mode (gestures/buttons) | |
| System appearance (light/dark) | |
| Installation source (CI debug APK / Play Internal testing) | |
| CI run URL / commit SHA | |
| Installed versionCode / versionName | |
| Graphics setting (Auto/other) | |

## Test results

Write **Pass / Fail / Not tested** for every row. For failures, include a reproduction sequence and evidence file/link.

| Test | Result | Evidence / notes |
| --- | --- | --- |
| Launch, adaptive icon and light/dark splash | | |
| First-level one-empty-socket rule | | |
| Simple tap does not count as a move or give invalid feedback | | |
| Valid drop moves peg into single empty socket | | |
| Occupied-socket drag is rejected without move | | |
| Off-board drag is rejected without move | | |
| Backgrounding/cancelled pointer cannot complete a move | | |
| Second finger cannot take over drag | | |
| Undo and Restart after aggressive dragging | | |
| Dense Level 80–100 dragging: no rope explosion/teleport | | |
| Level 80–100 responsive; no sustained sub-40 FPS | | |
| Back: Game → Pause → Resume | | |
| Back: Levels/Settings → Menu | | |
| Back: Complete → Levels; Menu → Exit | | |
| System bars, cutout, safe areas, gesture navigation | | |
| Progress and preferences survive restart | | |
| Clearing app data resets progress (only after backup/consent) | | |
| Progress and settings remain correct after force-close/relaunch | | |
| Offline launch and play | | |
| Banner-safe preview does not cover controls (if tested) | | |

## Defects

For each failure record: level, precise steps, expected/actual behavior, device/Android version, visual evidence, app logcat snippet if useful, and whether it reproduces. Never paste private information or keys.

## Release decision

- [ ] All required rows passed on a representative mid-range phone.
- [ ] Any blocking defects are fixed and retested.
- [ ] Play-delivered Internal testing install and persistence verified separately.
- [ ] Reviewer approved the physical-device release gate.

**Decision:** PASS / BLOCKED / NOT TESTED

**Reviewer and date:** 

References: [Device QA checklist](DEVICE_QA.md), [Release checklist](RELEASE_CHECKLIST.md), and [Issue #9](https://github.com/nurgeldiserikbay/string-sort/issues/9).
