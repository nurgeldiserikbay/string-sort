import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/game/NativeNavigation.js', () => ({
  installNativeBackHandler: vi.fn(async () => null),
  installNativeAppStateHandler: vi.fn(async () => null),
  exitNativeApp: vi.fn(async () => true),
}))

import { GameApp } from '../src/game/GameApp.js'
import { exitNativeApp, installNativeBackHandler, installNativeAppStateHandler } from '../src/game/NativeNavigation.js'

function mockApp(screen) {
  return {
    screen,
    resumeFromPause: vi.fn(),
    showPause: vi.fn(),
    showMenu: vi.fn(),
    showLevelSelect: vi.fn(),
  }
}

describe('Android Back navigation contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['pause', 'resumeFromPause'],
    ['game', 'showPause'],
    ['levels', 'showMenu'],
    ['settings', 'showMenu'],
    ['complete', 'showLevelSelect'],
  ])('routes Back from %s to %s without exiting', async (screen, action) => {
    const app = mockApp(screen)
    await GameApp.prototype.handleNativeBack.call(app)

    expect(app[action]).toHaveBeenCalledOnce()
    for (const other of ['resumeFromPause', 'showPause', 'showMenu', 'showLevelSelect']) {
      if (other !== action) expect(app[other]).not.toHaveBeenCalled()
    }
    expect(exitNativeApp).not.toHaveBeenCalled()
  })

  it('exits natively only from menu', async () => {
    const app = mockApp('menu')
    await GameApp.prototype.handleNativeBack.call(app)

    expect(exitNativeApp).toHaveBeenCalledOnce()
    for (const action of ['resumeFromPause', 'showPause', 'showMenu', 'showLevelSelect']) {
      expect(app[action]).not.toHaveBeenCalled()
    }
  })
})

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function bareApp() {
  const app = Object.create(GameApp.prototype)
  app.screen = 'game'
  app.nativeListenerGeneration = 0
  app.showMenu = vi.fn()
  app.showPause = vi.fn()
  app.handleNativeBack = vi.fn()
  app.stopTimer = vi.fn()
  app.menuPreviewCleanup = null
  app.board = null
  app.onVisibilityChange = vi.fn()
  app.backButtonHandle = null
  app.appStateHandle = null
  return app
}

describe('native listener lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('removes native listeners if their installation finishes after destroy', async () => {
    const back = deferred()
    const state = deferred()
    const backRemove = vi.fn()
    const stateRemove = vi.fn()
    installNativeBackHandler.mockReturnValueOnce(back.promise)
    installNativeAppStateHandler.mockReturnValueOnce(state.promise)
    const document = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal('document', document)
    const app = bareApp()

    app.mount()
    expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', app.onVisibilityChange)
    app.destroy()
    expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', app.onVisibilityChange)

    back.resolve({ remove: backRemove })
    state.resolve({ remove: stateRemove })
    await Promise.all([back.promise, state.promise])
    await Promise.resolve()

    expect(backRemove).toHaveBeenCalledOnce()
    expect(stateRemove).toHaveBeenCalledOnce()
    expect(app.backButtonHandle).toBeNull()
    expect(app.appStateHandle).toBeNull()
  })

  it('ignores stale native events after destroy', async () => {
    let onBack
    let onState
    installNativeBackHandler.mockImplementationOnce(async (callback) => {
      onBack = callback
      return { remove: vi.fn() }
    })
    installNativeAppStateHandler.mockImplementationOnce(async (callback) => {
      onState = callback
      return { remove: vi.fn() }
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    const app = bareApp()

    app.mount()
    await Promise.resolve()
    app.destroy()
    onBack()
    onState({ isActive: false })

    expect(app.handleNativeBack).not.toHaveBeenCalled()
    expect(app.showPause).not.toHaveBeenCalled()
  })
})
