# Android release

The normal CI workflow builds a debug APK on every pull request and publishes it as a downloadable artifact.

For a Play Store AAB, the repository also contains a manual **Android Release AAB** workflow. It intentionally requires your own signing credentials and never stores the keystore in git.

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

## 4. Build the AAB

GitHub → Actions → **Android Release AAB** → Run workflow.

The workflow:
1. runs tests;
2. builds the Vite application;
3. generates and syncs the Capacitor Android project;
4. restores the keystore only inside the temporary CI runner;
5. injects signing into the generated Gradle project;
6. runs `bundleRelease`;
7. uploads `string-sort-release-aab` as a workflow artifact.

## 5. Play Store

Upload the generated `app-release.aab` to the desired Play Console track.

Before production release, verify:
- package name is final: `com.nurgeldiserikbay.stringsort`;
- version code/version name are updated;
- launcher icon and splash assets are final;
- privacy policy and Data safety answers match the actual SDKs in the build;
- any future ads/analytics SDKs are reflected in the policy and Play Console declarations.
