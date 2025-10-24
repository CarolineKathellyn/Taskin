# EAS Build & OTA Updates Setup Guide

## Overview
Your app is now configured to use EAS (Expo Application Services) for local builds and OTA (Over-The-Air) updates. This allows you to:
- Build production APKs locally without uploading to EAS servers
- Push instant updates to your app without rebuilding the APK
- Manage different build profiles (development, preview, production)

## Initial Setup (One-time) ✅ COMPLETED

Your EAS project has been configured and linked:
- **Project ID**: `2907b53c-ea91-48e6-b950-5a3156092fdb`
- **Keystore**: Generated and managed by EAS
- All dependencies are now up to date with Expo SDK 54

### Login to EAS (if needed)
If you need to log in or switch accounts:
```bash
npx eas login
```

## Building Your App Locally

### Production Build (APK)
Build a production APK on your local machine:

```bash
npm run build:android:local
```

Or:
```bash
npx eas build --platform android --profile production --local
```

**Build Configuration:**
- Build type: APK (easier to install for testing)
- Channel: production (for OTA updates)
- Auto-increment: enabled (version codes auto-increment)
- Node version: 20.17.0

The APK will be saved in your project directory after the build completes.

### Preview Build (APK)
For testing builds before production:

```bash
npm run build:preview:local
```

**Note:** Preview builds do NOT include OTA update channel configuration.

## Publishing OTA Updates

After you've distributed your production APK to users, you can push updates instantly without rebuilding:

### Push an Update
```bash
npm run update:production "Your update message here"
```

Or:
```bash
npx eas update --branch production --message "Your update message here"
```

**What gets updated via OTA:**
- JavaScript code changes
- React components
- Assets (images, fonts, etc.)
- App logic and UI updates

**What DOES NOT get updated via OTA:**
- Native code changes (requires new build)
- `app.json` configuration changes
- New native dependencies
- Expo SDK version upgrades

### Update Behavior
- Updates are checked when the app launches (`checkAutomatically: "ON_LOAD"`)
- Updates download in the background
- New version is applied on the NEXT app restart
- Users see updates immediately after restarting the app

## Build Profiles Explained

### Development Profile
```json
"development": {
  "developmentClient": true,
  "distribution": "internal",
  "node": "20.17.0"
}
```
- For development builds with dev client
- Internal distribution only
- Not for OTA updates

### Preview Profile
```json
"preview": {
  "node": "20.17.0",
  "android": {
    "buildType": "apk"
  }
}
```
- For testing builds before production
- Builds as APK for easy installation
- No OTA channel configured

### Production Profile
```json
"production": {
  "channel": "production",
  "autoIncrement": true,
  "node": "20.17.0",
  "android": {
    "buildType": "apk"
  }
}
```
- For production releases
- Connected to "production" OTA channel
- Auto-increments version codes
- Builds as APK

## Runtime Version

The `runtimeVersion` in `app.json` is set to `"1.0.0"`. This ensures:
- Only compatible updates are delivered to users
- Mismatched runtime versions won't break your app
- When you change native code, increment this version and rebuild

**When to increment runtimeVersion:**
- Adding/removing native dependencies
- Upgrading Expo SDK
- Modifying native Android/iOS code
- Making breaking changes to the native layer

## Workflow Example

### 1. Initial Release
```bash
# Build and distribute the APK
npm run build:android:local

# Install the APK on devices or distribute to users
```

### 2. Push JS/UI Updates
```bash
# Make your code changes, then:
npm run update:production "Fixed login bug and improved UI"

# Users get the update on next app restart
```

### 3. Native Changes (requires rebuild)
```bash
# After adding native dependencies or changing native code:
# 1. Update runtimeVersion in app.json (e.g., "1.0.0" -> "1.1.0")
# 2. Rebuild the APK
npm run build:android:local

# 3. Distribute the new APK to users
```

## Useful Commands

### Check Update Status
```bash
npx eas update:list --branch production
```

### View Build History
```bash
npx eas build:list
```

### Create a New Branch
```bash
npx eas update --branch staging --message "Staging test"
```

### Republish an Update
```bash
npx eas update:republish --branch production --update-id <update-id>
```

## Troubleshooting

### Build Fails Locally
- Ensure you have Android SDK installed
- Check that Node 20.17.0 is available (use nvm if needed)
- Make sure you have enough disk space

### Updates Not Showing
- Verify the app was built with the production profile
- Check that runtimeVersion matches between build and update
- Ensure the app is connected to the internet
- Updates apply on NEXT restart, not immediately

### Check App Configuration
```bash
npx expo config --type public
```

## Fixed Issues

During setup, the following issues were resolved:
- ✅ Removed `eas-cli` from local dependencies (should only be used via npx)
- ✅ Installed missing peer dependencies: `expo-font`, `react-native-gesture-handler`
- ✅ Fixed duplicate `react-native-safe-area-context` dependency using npm overrides
- ✅ Updated all packages to Expo SDK 54 compatible versions:
  - expo: 54.0.10 → 54.0.19
  - react-native: 0.81.4 → 0.81.5
  - @expo/vector-icons: 15.0.2 → 15.0.3
  - expo-constants: 18.0.9 → 18.0.10
  - expo-device: 8.0.8 → 8.0.9
  - expo-notifications: 0.32.11 → 0.32.12
- ✅ Updated all npm scripts to use `npx eas` instead of relying on local installation

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions Guide](https://docs.expo.dev/eas-update/runtime-versions/)
