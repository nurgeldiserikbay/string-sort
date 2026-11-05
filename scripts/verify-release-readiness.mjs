import { access, readFile } from 'node:fs/promises'

const REQUIRED_FILES = [
  'capacitor.config.json',
  'CHANGELOG.md',
  'resources/icon-only.svg',
  'resources/icon-foreground.svg',
  'resources/icon-background.svg',
  'resources/splash.svg',
  'resources/splash-dark.svg',
  'public/privacy.html',
  'docs/PLAY_STORE.md',
  'docs/PRIVACY.md',
  'docs/RELEASE.md',
  'docs/RELEASE_CHECKLIST.md',
  '.github/workflows/android-release.yml',
]

for (const path of REQUIRED_FILES) {
  await access(path)
}

const capacitor = JSON.parse(await readFile('capacitor.config.json', 'utf8'))
if (capacitor.appId !== 'com.nurgeldiserikbay.stringsort') {
  throw new Error(`Unexpected appId: ${capacitor.appId}`)
}
if (capacitor.appName !== 'String Sort') {
  throw new Error(`Unexpected appName: ${capacitor.appName}`)
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const capacitorMajor = Number(String(packageJson.dependencies?.['@capacitor/core'] || '').match(/\d+/)?.[0])
if (!Number.isFinite(capacitorMajor) || capacitorMajor < 8) {
  throw new Error('Capacitor 8+ is required for the Android API 36 release setup')
}

const gitignore = await readFile('.gitignore', 'utf8')
for (const requiredIgnore of [
  '*.jks',
  '*.keystore',
  'keystore.properties',
  'android/key.properties',
]) {
  if (!gitignore.includes(requiredIgnore)) {
    throw new Error(`Signing secret is not protected by .gitignore: ${requiredIgnore}`)
  }
}

// Local game progress is not a cloud-save feature. Fail if Android's default
// app-data backup is re-enabled without a deliberate privacy review.
const androidManifest = await readFile('android/app/src/main/AndroidManifest.xml', 'utf8')
if (!/<application\b[^>]*\bandroid:allowBackup=["']false["']/s.test(androidManifest)) {
  throw new Error('Android application must explicitly disable automatic backup of local progress')
}

const privacy = await readFile('public/privacy.html', 'utf8')
for (const forbidden of ['TODO', 'YOUR_EMAIL', 'example@example.com']) {
  if (privacy.includes(forbidden)) {
    throw new Error(`Privacy page still contains placeholder: ${forbidden}`)
  }
}

const release = await readFile('.github/workflows/android-release.yml', 'utf8')
for (const required of [
  'ANDROID_KEYSTORE_BASE64',
  'version_code',
  'version_name',
  'verify-android-target.mjs',
  'bundleRelease',
]) {
  if (!release.includes(required)) {
    throw new Error(`Release workflow is missing: ${required}`)
  }
}

// Keep both Android workflows aligned with the committed Capacitor project.
// A successful web build alone does not validate Android-specific steps.
for (const workflowPath of [
  '.github/workflows/ci.yml',
  '.github/workflows/android-release.yml',
]) {
  const workflow = await readFile(workflowPath, 'utf8')
  if (workflow.includes('npx cap add android')) {
    throw new Error(`Android workflow must reuse tracked android/: ${workflowPath}`)
  }
  if (!workflow.includes('test -f android/app/build.gradle') ||
      !workflow.includes('run: npm run assets') ||
      workflow.includes('run: npm run assets:android') ||
      !workflow.includes('run: npx cap sync android')) {
    throw new Error(`Android workflow asset/sync configuration has drifted: ${workflowPath}`)
  }
}

// Smoke-test the production AAB Gradle task on every pull request without
// requiring keystore secrets or distributing an unsigned release bundle.
const ciWorkflow = await readFile('.github/workflows/ci.yml', 'utf8')
for (const required of [
  'Record debug APK checksum and source commit',
  'sha256sum app-debug.apk > app-debug.apk.sha256',
  'git rev-parse HEAD',
  'app-debug.apk.sha256',
  'build-info.txt',
]) {
  if (!ciWorkflow.includes(required)) {
    throw new Error(`APK QA traceability gate missing: ${required}`)
  }
}

for (const required of [
  'Build production web payload for AAB smoke test',
  'run: npm run build:prod',
  'Assemble unsigned production AAB',
  './gradlew bundleRelease --no-daemon',
  'test -s app/build/outputs/bundle/release/app-release.aab',
  'Verify signed AAB with disposable CI key',
  'keytool -genkeypair -noprompt',
  'node scripts/prepare-android-signing.mjs',
  "grep -Fq 'jar verified.' <<<",
]) {
  if (!ciWorkflow.includes(required)) {
    throw new Error(`Unsigned production AAB smoke gate missing: ${required}`)
  }
}

const releaseWorkflow = await readFile('.github/workflows/android-release.yml', 'utf8')
if (!releaseWorkflow.includes('run: npm run build:prod')) {
  throw new Error('Signed AAB must package production-mode web assets')
}

// Manual signing is restricted to the protected release source branch.
// The concurrency group must not cancel an already-running signing job.
for (const required of [
  "if: github.ref == 'refs/heads/main'",
  'group: string-sort-android-release',
  'cancel-in-progress: false',
  'timeout-minutes: 90',
]) {
  if (!releaseWorkflow.includes(required)) {
    throw new Error(`Release branch/concurrency guard is missing: ${required}`)
  }
}

for (const required of [
  'keytool -list -keystore',
  'jarsigner -verify',
  "grep -Fq 'jar verified.'",
  'if: always()',
  'rm -f "$ANDROID_KEYSTORE_FILE"',
]) {
  if (!releaseWorkflow.includes(required)) {
    throw new Error(`AAB verification/keystore cleanup gate is missing: ${required}`)
  }
}

console.log('Release readiness static checks passed')
