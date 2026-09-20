/** @vitest-environment happy-dom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RopeBoard } from '../src/game/RopeBoard.js'

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
  }
}

describe('RopeBoard pointer interaction', () => {
  let canvas
  let board

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="board"></canvas>'
    canvas = document.querySelector('#board')

    vi.spyOn(canvas, 'getContext').mockReturnValue(makeCanvasContext())
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 360,
      bottom: 520,
      width: 360,
      height: 520,
      toJSON() {},
    })
    canvas.setPointerCapture = vi.fn()
  })

  afterEach(() => {
    board?.destroy()
    vi.restoreAllMocks()
  })

  it('swaps two sockets after dragging one peg onto the other', () => {
    const onSwap = vi.fn()
    board = new RopeBoard(canvas, { onSwap, onSolved: vi.fn(), graphics: 'battery' })
    board.setOrder([0, 1, 0, 1])

    const from = board.socketPosition(0)
    const to = board.socketPosition(1)

    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 1 })
    board.onPointerMove({ clientX: to.x, clientY: to.y, pointerId: 1 })
    board.onPointerUp({ clientX: to.x, clientY: to.y, pointerId: 1 })

    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1)
    expect(onSwap).toHaveBeenCalledWith(0, 1)
    expect(board.dragIndex).toBe(-1)
  })

  it('does not swap when a peg is released away from every socket', () => {
    const onSwap = vi.fn()
    board = new RopeBoard(canvas, { onSwap, onSolved: vi.fn(), graphics: 'battery' })
    board.setOrder([0, 1, 0, 1])

    const from = board.socketPosition(0)

    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 2 })
    board.onPointerMove({ clientX: 8, clientY: 510, pointerId: 2 })
    board.onPointerUp({ clientX: 8, clientY: 510, pointerId: 2 })

    expect(onSwap).not.toHaveBeenCalled()
  })

  it('renders each rope only once even when ropes cross', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1])

    vi.spyOn(board, 'syncPhysics').mockImplementation(() => {})
    vi.spyOn(board, 'drawBoard').mockImplementation(() => {})
    vi.spyOn(board, 'drawPeg').mockImplementation(() => {})
    vi.spyOn(board, 'drawCenterHub').mockImplementation(() => {})
    vi.spyOn(board, 'drawDiagnostics').mockImplementation(() => {})
    const drawRope = vi.spyOn(board, 'drawRope').mockImplementation(() => {})

    vi.spyOn(board.physics, 'getContacts').mockReturnValue([
      { aId: 0, bId: 1, x: 180, y: 240, aSegment: 5, bSegment: 7 },
    ])

    board.draw(100)

    expect(drawRope).toHaveBeenCalledTimes(2)
    expect(drawRope.mock.calls.map(([ropeId]) => ropeId).sort()).toEqual([0, 1])
    expect(board.drawCrossingBridge).toBeUndefined()
  })
})
