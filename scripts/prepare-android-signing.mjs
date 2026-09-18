import { readFileSync, writeFileSync } from 'node:fs'

const gradlePath = 'android/app/build.gradle'
const marker = '// STRING_SORT_RELEASE_SIGNING'

let gradle = readFileSync(gradlePath, 'utf8')

if (gradle.includes(marker)) {
  process.exit(0)
}

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
console.log('Configured Android release signing')
