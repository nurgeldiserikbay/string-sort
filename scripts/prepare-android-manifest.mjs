import { readFileSync, writeFileSync } from 'node:fs'

const manifestPath = 'android/app/src/main/AndroidManifest.xml'
const marker = 'android:screenOrientation="portrait"'
let manifest = readFileSync(manifestPath, 'utf8')

if (manifest.includes(marker)) {
  console.log('Android MainActivity is already portrait-locked')
  process.exit(0)
}

const activityPattern = /<activity\b([^>]*android:name=["']\.MainActivity["'][^>]*)>/

if (!activityPattern.test(manifest)) {
  throw new Error('Could not find MainActivity in AndroidManifest.xml')
}

manifest = manifest.replace(
  activityPattern,
  (match, attributes) => `<activity${attributes}\n            android:screenOrientation="portrait">`,
)

writeFileSync(manifestPath, manifest)
console.log('Configured MainActivity for portrait orientation')
