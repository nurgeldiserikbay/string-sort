import { readFileSync, writeFileSync } from 'node:fs'

const gradlePath = 'android/app/build.gradle'
const marker = '// STRING_SORT_RELEASE_SIGNING'
const versionCode = Number(process.env.RELEASE_VERSION_CODE || '1')
const versionName = process.env.RELEASE_VERSION_NAME || '0.1.0'

if (!Number.isInteger(versionCode) || versionCode < 1) {
  throw new Error('RELEASE_VERSION_CODE must be a positive integer')
}

if (!/^[0-9]+(?:\.[0-9]+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(versionName)) {
  throw new Error('RELEASE_VERSION_NAME must look like 1.2.3')
}

let gradle = readFileSync(gradlePath, 'utf8')

if (gradle.includes(marker)) {
  process.exit(0)
}

gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+["'][^"']+["']/, `versionName "${versionName}"`)

if (!gradle.includes('android {')) {
  throw new Error('Could not find android block in generated Gradle file')
}

const signingConfig = `android {
    ${marker}
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }`

gradle = gradle.replace('android {', signingConfig)

const releasePattern = /buildTypes\s*\{([\s\S]*?)release\s*\{/
if (!releasePattern.test(gradle)) {
  throw new Error('Could not find release buildType in generated Gradle file')
}

gradle = gradle.replace(
  releasePattern,
  (match) => `${match}\n            signingConfig signingConfigs.release`,
)

writeFileSync(gradlePath, gradle)
console.log(`Configured Android release signing for ${versionName} (${versionCode})`)
