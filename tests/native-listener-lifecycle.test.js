import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { back, appState } = vi.hoisted(() => ({
  back: { resolve: null, install: vi.fn() },
  appState: { resolve: null, install: vi.fn() },
}))

vi.mock('../src/game/NativeNavigation.js', () => ({
  installNativeBackHandler: (...args) => back.install(...args),
  installNativeAppStateHandler: (...args) => appState.install(...args),
  exitNativeApp: vi.fn(async () => true),
}))

import { GameApp } from '../src/game/GameApp.js'

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function mockApp() {
  return {
    nativeListenerGeneration: 0,
    backButtonHandle: null,
    appStateHandle: null,
    showMenu: vi.fn(),
    showPause: vi.fn(),
    handleNativeBack: vi.fn(),
    stopTimer: vi.fn(),
    board: null,
    menuPreviewCleanup: null,
    tutorialHintTimer: 0,
    completionTimer: 0,
    feedbackTimer: 0,
    onVisibilityChange: vi.fn(),
    screen: 'game',
  }
}

describe('native listener lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals())

  beforeEach(() => {
    vi.clearAllMocks()
    const backPending = deferred()
    const statePending = deferred()
    back.install.mockReturnValue(backPending.promise)
    appState.install.mockReturnValue(statePending.promise)
    back.resolve = backPending.resolve
    appState.resolve = statePending.resolve
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('removes delayed listener handles when unmounted before registration finishes', async () => {
    const app = mockApp()
    GameApp.prototype.mount.call(app)
    GameApp.prototype.destroy.call(app)

    const removeBack = vi.fn()
    const removeState = vi.fn()
    back.resolve({ remove: removeBack })
    appState.resolve({ remove: removeState })
    await Promise.resolve()
    await Promise.resolve()

    expect(removeBack).toHaveBeenCalledOnce()
    expect(removeState).toHaveBeenCalledOnce()
    expect(app.backButtonHandle).toBeNull()
    expect(app.appStateHandle).toBeNull()
    back.install.mock.calls[0][0]()
    appState.install.mock.calls[0][0]({ isActive: false })
    expect(app.handleNativeBack).not.toHaveBeenCalled()
    expect(app.showPause).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('uses listener handles until teardown, then removes them exactly once', async () => {
    const app = mockApp()
    GameApp.prototype.mount.call(app)
    const removeBack = vi.fn()
    const removeState = vi.fn()
    back.resolve({ remove: removeBack })
    appState.resolve({ remove: removeState })
    await Promise.resolve()
    expect(app.backButtonHandle).toBeTruthy()
    back.install.mock.calls[0][0]()
    expect(app.handleNativeBack).toHaveBeenCalledOnce()

    GameApp.prototype.destroy.call(app)
    expect(removeBack).toHaveBeenCalledOnce()
    expect(removeState).toHaveBeenCalledOnce()
    appState.install.mock.calls[0][0]({ isActive: false })
    expect(app.showPause).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
