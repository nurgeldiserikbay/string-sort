# Android build

Prerequisites: Node.js 22+, npm, Android Studio and a configured Android SDK.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

After Android Studio opens, let Gradle sync and run on a physical device first.

For later web changes:

```bash
npm run build
npx cap sync android
```

Do not commit production signing secrets. Configure the release keystore locally or through CI secrets before producing the Play Store AAB.
