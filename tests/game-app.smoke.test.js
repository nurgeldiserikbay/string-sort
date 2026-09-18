/** @vitest-environment happy-dom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameApp } from '../src/game/GameApp.js'

function makeGradient() {
  return { addColorStop: vi.fn() }
}

function makeCanvasContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    strokeRect: vi.fn(),
    createRadialGradient: vi.fn(makeGradient),
    setLineDash: vi.fn(),
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'round',
    lineJoin: 'round',
    lineDashOffset: 0,
  }
}

describe('GameApp interaction smoke tests', () => {
  let app
  let root

  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = '<div id="app"></div>'
    root = document.querySelector('#app')

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => makeCanvasContext())
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 360,
      bottom: 520,
      width: 360,
      height: 520,
      toJSON() {},
    }))

    app = new GameApp(root)
    app.mount()
  })

  afterEach(() => {
    app?.destroy()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens the first playable level from the menu', () => {
    root.querySelector('[data-action="play"]').click()

    expect(root.querySelector('#game-board')).not.toBeNull()
    expect(root.querySelector('.level-pill').textContent).toContain('Level 1')
    expect(root.querySelector('.tutorial-chip').textContent).toContain('Drag')
  })

  it('can pause and resume a running level', () => {
    root.querySelector('[data-action="play"]').click()
    root.querySelector('[data-action="pause"]').click()

    expect(root.querySelector('.modal-card')).not.toBeNull()
    expect(root.textContent).toContain('Paused')

    root.querySelector('.modal-card [data-action="resume"]').click()
    expect(root.querySelector('.modal-card')).toBeNull()
    expect(app.screen).toBe('game')
  })

  it('persists the sound setting', () => {
    root.querySelector('[data-action="settings"]').click()
    const soundButton = root.querySelector('[data-setting="sound"]')

    expect(soundButton.textContent.trim()).toBe('On')
    soundButton.click()
    expect(soundButton.textContent.trim()).toBe('Off')

    app.showMenu()
    app.showSettings()

    expect(root.querySelector('[data-setting="sound"]').textContent.trim()).toBe('Off')
  })

  it('cycles graphics quality without leaving settings', () => {
    root.querySelector('[data-action="settings"]').click()
    const graphicsButton = root.querySelector('[data-setting="graphics"]')
    const before = graphicsButton.textContent.trim()

    graphicsButton.click()

    expect(graphicsButton.textContent.trim()).not.toBe(before)
    expect(app.settings.graphics).toBe('high')
  })

  it('completes a solved board, unlocks the next level and persists progress', () => {
    vi.useFakeTimers()
    root.querySelector('[data-action="play"]').click()

    app.order = [0, 1, 0, 1]
    app.board.setOrder(app.order)
    app.elapsed = 12

    app.handleSwap(1, 2)
    vi.advanceTimersByTime(400)

    expect(root.querySelector('.complete-card')).not.toBeNull()
    expect(root.textContent).toContain('Level 1 Complete!')
    expect(app.progress.unlocked).toBeGreaterThanOrEqual(2)

    const saved = JSON.parse(localStorage.getItem('string-sort-progress-v1'))
    expect(saved.unlocked).toBeGreaterThanOrEqual(2)
    expect(saved.stars['1']).toBeGreaterThanOrEqual(1)
  })
})
