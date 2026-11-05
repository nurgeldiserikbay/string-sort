import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/game/NativeNavigation.js', () => ({
  installNativeBackHandler: vi.fn(async () => null),
  installNativeAppStateHandler: vi.fn(async () => null),
  exitNativeApp: vi.fn(async () => true),
}))

import { GameApp } from '../src/game/GameApp.js'
import { exitNativeApp } from '../src/game/NativeNavigation.js'

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
