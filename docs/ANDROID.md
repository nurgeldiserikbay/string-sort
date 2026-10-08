# Android build

Prerequisites: Node.js 22+, npm, Android SDK (via Android Studio) and JDK 21+.
The script finds the SDK in `%LOCALAPPDATA%\Android\Sdk`, a JDK in `C:\Program Files\Java` and Android Studio in `C:\Program Files\Android\Android Studio*` when `ANDROID_HOME` / `JAVA_HOME` / `CAPACITOR_ANDROID_STUDIO_PATH` are not set or broken.

Every command has a test and a production variant, same as the other games:
test = `vite --mode development` (`.env.development`), prod = `vite --mode production` (`.env.production`).

| Test | Production | What it does |
|---|---|---|
| `npm run dev` | `npm run dev:prod` | local dev server |
| `npm run build` | `npm run build:prod` | web build into `dist/` |
| `npm run build:android` | `npm run build:android:prod` | web build, `cap sync`, open Android Studio |
| `npm run android:apk` | `npm run android:apk:prod` | debug APK into `build-output/string-sort-<test\|prod>.apk` |
| `npm run android:install` | `npm run android:install:prod` | same APK, installed and launched on a USB device |
| — | `npm run android:aab` | unsigned release AAB into `build-output/string-sort-prod.aab` |

`npm run assets` regenerates icons and splash from `resources/*.svg`.

Every command rebuilds the web app and runs `cap sync`, so the build always contains the current code.
On the first run the `android/` platform and its icons/splash are created automatically.

The AAB is unsigned: sign it in Android Studio (Build > Generate Signed App Bundle). Do not commit signing secrets.
