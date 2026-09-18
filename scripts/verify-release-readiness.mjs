import { access, readFile } from 'node:fs/promises'

const REQUIRED_FILES = [
  'capacitor.config.json',
  'resources/icon-only.svg',
  'resources/icon-foreground.svg',
  'resources/icon-background.svg',
  'resources/splash.svg',
  'resources/splash-dark.svg',
  'public/privacy.html',
  'docs/PLAY_STORE.md',
  'docs/PRIVACY.md',
  'docs/RELEASE.md',
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

console.log('Release readiness static checks passed')
