# Android release

The normal CI workflow builds a debug APK on every pull request and publishes it as a downloadable artifact.

The project now uses Capacitor 8 and CI explicitly verifies:

- `compileSdkVersion = 36`
- `targetSdkVersion = 36`

This matches the Google Play mobile requirement in force from August 31, 2026 for new apps and app updates. Official policy: https://support.google.com/googleplay/android-developer/answer/11926878

For a Play Store AAB, the repository contains a manual **Android Release AAB** workflow. It requires your own signing credentials and never stores the keystore in git.

## 1. Create or reuse a release keystore

Keep the keystore permanently. Google Play updates must continue to use the same upload key unless the Play Console key-reset process is used.

Example local command:

```bash
keytool -genkeypair -v \
  -keystore string-sort-release.jks \
  -alias string-sort \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

## 2. Convert the keystore to base64

Linux/macOS:

```bash
base64 -w 0 string-sort-release.jks
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("string-sort-release.jks"))
```

## 3. Add GitHub Actions secrets

Repository Settings → Secrets and variables → Actions:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit these values or the keystore itself.

## 4. Choose release version

GitHub → Actions → **Android Release AAB** → Run workflow.

The workflow asks for:

- `version_code` — positive integer. It must increase for every Play Store release.
- `version_name` — human-readable version such as `0.1.0`.

Example:

```text
version_code: 1
version_name: 0.1.0
```

Next update:

```text
version_code: 2
version_name: 0.1.1
```

## 5. Build the AAB

The workflow:

1. validates signing secrets;
2. runs automated tests;
3. builds the Vite application;
4. generates the Capacitor 8 Android project;
5. verifies compile/target SDK 36;
6. generates Android launcher and splash assets;
7. applies the selected version code/name;
8. restores the keystore only inside the temporary CI runner;
9. injects release signing;
10. runs `bundleRelease`;
11. uploads the signed AAB as a workflow artifact.

## 6. Play Store

Upload the generated `app-release.aab` to the desired Play Console track.

Before production release, verify:

- package name is final: `com.nurgeldiserikbay.stringsort`;
- versionCode is greater than the latest version already uploaded to Play;
- launcher icon and splash assets look correct on a real device;
- privacy policy and Data safety answers match the exact production SDK set;
- any future ads/analytics/crash SDKs are reflected in the policy and Play Console declarations;
- phone/tablet screenshots match the actual released UI.
