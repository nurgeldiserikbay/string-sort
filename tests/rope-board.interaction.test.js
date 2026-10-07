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
    createLinearGradient: vi.fn(makeGradient),
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
    canvas.releasePointerCapture = vi.fn()
  })

  afterEach(() => {
    board?.destroy()
    vi.restoreAllMocks()
  })

  it('moves a peg into the one empty socket', () => {
    const onSwap = vi.fn()
    board = new RopeBoard(canvas, { onSwap, onSolved: vi.fn(), graphics: 'battery' })
    board.setOrder([0, 1, 0, 1, null])

    const from = board.socketPosition(1)
    const to = board.socketPosition(4)

    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 1 })
    board.onPointerMove({ clientX: to.x, clientY: to.y, pointerId: 1 })
    board.onPointerUp({ clientX: to.x, clientY: to.y, pointerId: 1 })

    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1)
    expect(onSwap).toHaveBeenCalledWith(1, 4)
    expect(board.dragIndex).toBe(-1)
  })

  it('eases a moved rope endpoint into the empty socket', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })

    const now = vi.spyOn(performance, 'now')
    now.mockReturnValue(1000)
    board.setOrder([0, 1, 0, 1, null], { animate: false })

    const from = board.socketPosition(1)
    const target = board.socketPosition(4)

    board.setOrder([0, null, 0, 1, 1])
    const start = board.transitionedSocketPosition(4, 1, 1000)

    expect(start.x).toBeCloseTo(from.x, 5)
    expect(start.y).toBeCloseTo(from.y, 5)

    const middle = board.transitionedSocketPosition(4, 1, 1120)
    expect(Math.hypot(middle.x - target.x, middle.y - target.y))
      .toBeLessThan(Math.hypot(from.x - target.x, from.y - target.y))

    const end = board.transitionedSocketPosition(4, 1, 1240)
    expect(end.x).toBeCloseTo(target.x, 5)
    expect(end.y).toBeCloseTo(target.y, 5)
  })

  it('replaces stale endpoint transitions on a quick second move', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })

    const now = vi.spyOn(performance, 'now')
    now.mockReturnValue(1000)
    board.setOrder([0, 1, 0, 1, null], { animate: false })
    board.setOrder([0, null, 0, 1, 1])

    expect(board.endpointTransitions.has('1:4')).toBe(true)

    now.mockReturnValue(1080)
    board.setOrder([0, 1, 0, null, 1])

    expect(board.endpointTransitions.has('1:4')).toBe(false)
    expect(board.endpointTransitions.has('1:1')).toBe(true)
  })

  it('cancels a pointer-cancel gesture without moving a peg', () => {
    const onSwap = vi.fn()
    board = new RopeBoard(canvas, {
      onSwap,
      onSolved: vi.fn(),
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

    const from = board.socketPosition(1)
    const to = board.socketPosition(4)

    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 7 })
    board.onPointerMove({ clientX: to.x, clientY: to.y, pointerId: 7 })
    board.onPointerCancel({ pointerId: 7 })

    expect(onSwap).not.toHaveBeenCalled()
    expect(board.dragIndex).toBe(-1)
    expect(board.activePointerId).toBeNull()
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(7)
  })

  it('releases pointer capture when the board is destroyed mid-drag', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

    const from = board.socketPosition(0)
    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 31 })
    board.destroy()

    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(31)
    expect(board.activePointerId).toBeNull()
  })

  it('ignores a second pointer while one peg is already being dragged', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

    const first = board.socketPosition(0)
    const second = board.socketPosition(1)

    board.onPointerDown({ clientX: first.x, clientY: first.y, pointerId: 10 })
    board.onPointerDown({ clientX: second.x, clientY: second.y, pointerId: 11 })

    expect(board.activePointerId).toBe(10)
    expect(board.dragIndex).toBe(0)
  })

  it('varies deterministic board geometry between level visual seeds', () => {
    const first = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
      visualSeed: 12,
    })
    first.setOrder([0, 1, 0, 1, null])
    const firstPosition = first.socketPosition(0)
    const firstSeed = first.depthSeed
    first.destroy()

    const second = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
      visualSeed: 13,
    })
    second.setOrder([0, 1, 0, 1, null])
    board = second

    const secondPosition = second.socketPosition(0)

    expect(second.depthSeed).not.toBe(firstSeed)
    expect(secondPosition.x).not.toBe(firstPosition.x)
  })

  it('keeps the dragged peg inside the physical board boundary', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

    const g = board.geometry()
    const point = board.constrainDragPoint({ x: 2000, y: 2000 })
    const distance = Math.hypot(point.x - g.cx, point.y - g.cy)

    expect(distance).toBeLessThanOrEqual(g.boardRadius * 0.985 + 0.001)
  })

  it('keeps a simple peg tap neutral', () => {
    const onSwap = vi.fn()
    const onInvalidDrop = vi.fn()
    board = new RopeBoard(canvas, {
      onSwap,
      onSolved: vi.fn(),
      onInvalidDrop,
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

    const from = board.socketPosition(0)

    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 21 })
    board.onPointerUp({ clientX: from.x + 1, clientY: from.y + 1, pointerId: 21 })

    expect(onSwap).not.toHaveBeenCalled()
    expect(onInvalidDrop).not.toHaveBeenCalled()
    expect(board.invalidDropIndex).toBe(-1)
  })

  it('does not swap when a peg is released away from every socket', () => {
    const onSwap = vi.fn()
    const onInvalidDrop = vi.fn()
    board = new RopeBoard(canvas, {
      onSwap,
      onSolved: vi.fn(),
      onInvalidDrop,
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

    const from = board.socketPosition(0)

    board.onPointerDown({ clientX: from.x, clientY: from.y, pointerId: 2 })
    board.onPointerMove({ clientX: 8, clientY: 510, pointerId: 2 })
    board.onPointerUp({ clientX: 8, clientY: 510, pointerId: 2 })

    expect(onSwap).not.toHaveBeenCalled()
    expect(onInvalidDrop).toHaveBeenCalledWith(0)
    expect(board.invalidDropIndex).toBe(0)
  })

  it('renders each rope only once even when ropes cross', () => {
    board = new RopeBoard(canvas, {
      onSwap: vi.fn(),
      onSolved: vi.fn(),
      graphics: 'battery',
    })
    board.setOrder([0, 1, 0, 1, null])

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
