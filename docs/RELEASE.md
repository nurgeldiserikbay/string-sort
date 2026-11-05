# Android release

The normal CI workflow builds a debug APK on every pull request and publishes it as a downloadable artifact. It also smoke-tests **unsigned and disposable-key-signed production AAB** bundles, but deliberately does not upload either bundle. The throwaway CI key must never be used as the real Play Console upload key. Only the manually signed release workflow can produce a Play Console upload candidate.

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

GitHub → Actions → **Android Release AAB** → Run workflow. Select the **main** branch: the signing job refuses to run from feature branches. Release jobs are serialized rather than cancelling an earlier signing job. The workflow's 90-minute limit guards against an indefinitely hung release.

The workflow asks for:

- `version_code` — integer from 1 through 2,100,000,000. It must increase for every Play Store release.
- `version_name` — human-readable version such as `0.1.0`.

Both values must be entered explicitly and are validated before signing. `version_code` accepts only ordinary decimal digits (no scientific notation, negative values, leading zeros or fallback defaults). The workflow must fail rather than accidentally reuse an old store version.

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
2. restores the upload keystore with restrictive file permissions and checks the selected key alias;
3. runs automated tests and builds the production Vite application;
4. verifies the already-committed Capacitor 8 Android project and compile/target SDK 36;
5. generates Android launcher and splash assets;
6. applies the selected version code/name and injects release signing;
7. runs `bundleRelease`;
8. verifies the resulting AAB has a valid JAR signature before uploading it as an artifact;
9. deletes the temporary keystore even if the job fails.

## 6. Play Store

Upload the generated `app-release.aab` to the desired Play Console track.

Before production release, run through [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) and verify:

- package name is final: `com.nurgeldiserikbay.stringsort`;
- versionCode is greater than the latest version already uploaded to Play;
- launcher icon and splash assets look correct on a real device;
- privacy policy and Data safety answers match the exact production SDK set;
- any future ads/analytics/crash SDKs are reflected in the policy and Play Console declarations;
- phone/tablet screenshots match the actual released UI.

The version/signing preparation rejects missing or duplicate Gradle version fields and refuses to run twice on the same generated Gradle configuration. Use a fresh CI checkout for each signed AAB attempt. An uploaded AAB must still be validated in Play Console before release.

**Important:** CI's signature check confirms the bundle is signed, but it does not prove that Google Play accepts the upload key, the release version is unused, or the app functions correctly on a physical device. Keep Issue #9 open until those external checks pass.
