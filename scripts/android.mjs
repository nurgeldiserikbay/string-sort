// Android build helper: same commands for test and production builds.
//
//   npm run build:android        test web build -> sync -> open Android Studio
//   npm run build:android:prod   production web build -> sync -> open Android Studio
//   npm run android:apk[:prod]       debug APK -> build-output/string-sort-<mode>.apk
//   npm run android:install[:prod]   same APK, installed and launched on a USB device
//   npm run android:aab          production release AAB -> build-output/ (unsigned)
//   npm run assets               icons and splash from resources/*.svg
//
// Test = vite --mode development, prod = vite --mode production (.env.* files).
// The android/ platform and its icons/splash are created on first run.

import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const ANDROID = join(ROOT, 'android')
const IS_WIN = process.platform === 'win32'
const APP_ID = JSON.parse(readFileSync(join(ROOT, 'capacitor.config.json'), 'utf8')).appId

const ASSET_ARGS = [
  '@capacitor/assets', 'generate', '--android', '--assetPath', 'resources',
  '--iconBackgroundColor', '#f7dfb9', '--iconBackgroundColorDark', '#242932',
  '--splashBackgroundColor', '#f7dfb9', '--splashBackgroundColorDark', '#242932',
]

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  // shell is needed on Windows for npx/gradlew.bat; quote args so '#' survives cmd.
  const quoted = IS_WIN ? args.map((a) => (/[\s#&|<>^]/.test(a) ? `"${a}"` : a)) : args
  const res = spawnSync(cmd, quoted, { stdio: 'inherit', shell: IS_WIN, cwd: ROOT, ...opts })
  if (res.status !== 0) {
    console.error(`\nFailed: ${cmd} ${args.join(' ')}`)
    process.exit(res.status ?? 1)
  }
}

// Android Studio's bundled JBR is often broken here; fall back to an installed JDK.
function ensureJava() {
  const ok = (dir) => dir && existsSync(join(dir, 'lib', 'jvm.cfg')) && existsSync(join(dir, 'bin', IS_WIN ? 'java.exe' : 'java'))
  if (ok(process.env.JAVA_HOME)) return
  const candidates = []
  for (const base of ['C:/Program Files/Java', 'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Microsoft']) {
    if (existsSync(base)) for (const d of readdirSync(base).filter((n) => /jdk/i.test(n)).sort().reverse()) candidates.push(join(base, d))
  }
  candidates.push('C:/Program Files/Android/Android Studio/jbr')
  const jdk = candidates.find(ok)
  if (!jdk) {
    console.error('No working JDK found. Install JDK 21+ or set JAVA_HOME.')
    process.exit(1)
  }
  process.env.JAVA_HOME = jdk
  console.log(`JAVA_HOME=${jdk}`)
}

function sdkDir() {
  const dir = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    || (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'))
  if (!dir || !existsSync(dir)) {
    console.error('Android SDK not found. Install it via Android Studio or set ANDROID_HOME.')
    process.exit(1)
  }
  return dir
}

// Capacitor only looks in the default install dir; here Studio may live in "Android Studio1".
function ensureStudioPath() {
  if (!IS_WIN || process.env.CAPACITOR_ANDROID_STUDIO_PATH) return
  const base = 'C:/Program Files/Android'
  if (!existsSync(base)) return
  const exe = readdirSync(base)
    .filter((d) => /^Android Studio/i.test(d))
    .map((d) => join(base, d, 'bin', 'studio64.exe'))
    .find((p) => existsSync(p))
  if (exe) process.env.CAPACITOR_ANDROID_STUDIO_PATH = exe
}

function ensureLocalProperties() {
  const file = join(ANDROID, 'local.properties')
  if (!existsSync(file)) writeFileSync(file, `sdk.dir=${sdkDir().replace(/\\/g, '/')}\n`)
}

function prepare(mode) {
  console.log(`\n=== ${mode === 'production' ? 'PROD' : 'TEST'} build (vite --mode ${mode}) ===`)
  run('npx', ['vite', 'build', '--mode', mode])
  if (!existsSync(ANDROID)) {
    run('npx', ['cap', 'add', 'android'])
    run('npx', ASSET_ARGS)
  }
  run('npx', ['cap', 'sync', 'android'])
  ensureLocalProperties()
}

function gradle(task) {
  ensureJava()
  // Full path: cmd may not search the current directory for gradlew.bat.
  const gradlew = IS_WIN ? `"${join(ANDROID, 'gradlew.bat')}"` : join(ANDROID, 'gradlew')
  run(gradlew, [task], { cwd: ANDROID })
}

const DEBUG_APK = join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
const RELEASE_AAB = join(ANDROID, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')

const OUTPUT = join(ROOT, 'build-output')

function keep(file, name) {
  mkdirSync(OUTPUT, { recursive: true })
  const target = join(OUTPUT, name)
  copyFileSync(file, target)
  return target
}

function installOnDevice(apk) {
  const adb = join(sdkDir(), 'platform-tools', IS_WIN ? 'adb.exe' : 'adb')
  run(adb, ['install', '-r', apk])
  run(adb, ['shell', 'monkey', '-p', APP_ID, '-c', 'android.intent.category.LAUNCHER', '1'])
  console.log(`\nInstalled and launched ${APP_ID}`)
}

const [command, ...flags] = process.argv.slice(2)
const mode = flags.includes('--prod') ? 'production' : 'development'
const tag = mode === 'production' ? 'prod' : 'test'

switch (command) {
  case 'apk':
  case 'install': {
    prepare(mode)
    gradle('assembleDebug')
    const apk = keep(DEBUG_APK, `string-sort-${tag}.apk`)
    console.log(`\nAPK (${tag}): ${apk}`)
    if (command === 'install') installOnDevice(apk)
    break
  }
  case 'aab': {
    // Play only ever gets production web code.
    prepare('production')
    gradle('bundleRelease')
    const aab = keep(RELEASE_AAB, 'string-sort-prod.aab')
    console.log(`\nUnsigned AAB: ${aab}\nSign it in Android Studio: Build > Generate Signed App Bundle.`)
    break
  }
  case 'assets':
    if (!existsSync(ANDROID)) run('npx', ['cap', 'add', 'android'])
    run('npx', ASSET_ARGS)
    break
  case 'open':
    prepare(mode)
    ensureStudioPath()
    run('npx', ['cap', 'open', 'android'])
    break
  default:
    console.log('Usage: node scripts/android.mjs <apk|install|aab|assets|open> [--prod]')
    process.exit(command ? 1 : 0)
}
