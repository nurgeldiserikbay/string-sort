import { Capacitor } from '@capacitor/core'

export async function installNativeBackHandler(callback) {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const { App } = await import('@capacitor/app')
    return await App.addListener('backButton', callback)
  } catch {
    return null
  }
}

export async function installNativeAppStateHandler(callback) {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const { App } = await import('@capacitor/app')
    return await App.addListener('appStateChange', callback)
  } catch {
    return null
  }
}

export async function exitNativeApp() {
  if (!Capacitor.isNativePlatform()) return false

  try {
    const { App } = await import('@capacitor/app')
    await App.exitApp()
    return true
  } catch {
    return false
  }
}
