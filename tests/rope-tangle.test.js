import { describe, expect, it } from 'vitest'
import { RopeTangle } from '../src/game/RopeTangle.js'

const geometry = {
  cx: 200,
  cy: 200,
  boardRadius: 160,
}

describe('RopeTangle', () => {
  it('creates one persistent knot for one alternating rope pair', () => {
    const tangle = new RopeTangle(123)
    const knots = tangle.update([0, 1, 0, 1, null], geometry)

    expect(knots).toHaveLength(1)
    expect(new Set([knots[0].aId, knots[0].bId])).toEqual(new Set([0, 1]))
  })

  it('releases a knot when the endpoint move removes the crossing', () => {
    const tangle = new RopeTangle(123)

    tangle.update([0, 1, 0, 1, null], geometry)
    expect(tangle.getKnots()).toHaveLength(1)

    tangle.update([0, null, 0, 1, 1], geometry)
    expect(tangle.getKnots()).toHaveLength(0)

    const released = tangle.consumeReleased()
    expect(released).toHaveLength(1)
    expect(released[0]).toMatchObject({ aId: 0, bId: 1 })
    expect(tangle.consumeReleased()).toHaveLength(0)
  })

  it('maps knots onto interior rope particles', () => {
    const tangle = new RopeTangle(777)
    tangle.update([0, 1, 2, 0, 1, 2, null], geometry)

    const constraints = tangle.buildConstraints(new Map([
      [0, 24],
      [1, 24],
      [2, 24],
    ]))

    expect(constraints.length).toBeGreaterThan(0)

    for (const knot of constraints) {
      expect(knot.aIndex).toBeGreaterThanOrEqual(2)
      expect(knot.aIndex).toBeLessThanOrEqual(22)
      expect(knot.bIndex).toBeGreaterThanOrEqual(2)
      expect(knot.bIndex).toBeLessThanOrEqual(22)
    }
  })

  it('creates alternating double wraps in a dense tangle', () => {
    const tangle = new RopeTangle(321)
    const logical = tangle.update(
      [0, 1, 2, 3, 0, 1, 2, 3, null],
      geometry,
    )
    const constraints = tangle.buildConstraints(new Map([
      [0, 28],
      [1, 28],
      [2, 28],
      [3, 28],
    ]))

    expect(logical.length).toBeGreaterThanOrEqual(4)
    expect(constraints.length).toBeGreaterThan(logical.length)

    const wrappedPair = constraints.filter(
      (constraint) => constraint.parentKey === constraints[0].parentKey,
    )

    if (wrappedPair.length === 2) {
      expect(wrappedPair[0].topId).not.toBe(wrappedPair[1].topId)
      expect(wrappedPair[0].aIndex).not.toBe(wrappedPair[1].aIndex)
    }
  })

  it('spreads dense knot centers instead of stacking every knot at the exact middle', () => {
    const tangle = new RopeTangle(456)
    const knots = tangle.update(
      [0, 1, 2, 3, 4, 0, 1, 2, 3, 4, null],
      geometry,
    )

    const distinct = new Set(
      knots.map((knot) => `${Math.round(knot.x / 8)}:${Math.round(knot.y / 8)}`),
    )

    expect(knots.length).toBeGreaterThan(5)
    expect(distinct.size).toBeGreaterThan(3)
  })

  it('lets persistent knot centers follow the physical rope bundle', () => {
    const tangle = new RopeTangle(789)
    const [knot] = tangle.update([0, 1, 0, 1, null], geometry)
    const before = { x: knot.x, y: knot.y }

    const makePoints = (x, y) => Array.from({ length: 13 }, (_, index) => ({
      x: x + index,
      y: y + index * 0.5,
    }))

    const physics = {
      getPoints(id) {
        return id === 0
          ? makePoints(260, 230)
          : makePoints(250, 220)
      },
    }

    tangle.followPhysics(physics, geometry)

    expect(knot.x).toBeGreaterThan(before.x)
    expect(knot.y).toBeGreaterThan(before.y)
  })
})
