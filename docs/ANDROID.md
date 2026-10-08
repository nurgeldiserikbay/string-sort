# Android build

Prerequisites: Node.js 22+, npm, Android SDK (via Android Studio) and JDK 21+.
The script finds the SDK in `%LOCALAPPDATA%\Android\Sdk` and a JDK in `C:\Program Files\Java` when `ANDROID_HOME` / `JAVA_HOME` are not set or broken.

```bash
npm install
npm run android:apk       # debug APK -> android/app/build/outputs/apk/debug/app-debug.apk
npm run android:install   # same, then install and launch on a USB device (USB debugging on)
npm run android:aab       # unsigned release AAB -> android/app/build/outputs/bundle/release/
npm run android:open      # sync and open in Android Studio
npm run assets:android    # regenerate icons and splash from resources/*.svg
```

Every command rebuilds the web app and runs `cap sync`, so the APK always contains the current code.
On the first run the `android/` platform and its icons/splash are created automatically.

The AAB is unsigned: sign it in Android Studio (Build > Generate Signed App Bundle). Do not commit signing secrets.
