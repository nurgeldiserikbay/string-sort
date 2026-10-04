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
})
