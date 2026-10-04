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

  it('uses one physical contact per logical knot for readability', () => {
    const tangle = new RopeTangle(321)
    const logical = tangle.update(
      [0, 1, 2, 3, 4, 0, 1, 2, 3, 4, null],
      geometry,
    )
    const constraints = tangle.buildConstraints(new Map([
      [0, 28],
      [1, 28],
      [2, 28],
      [3, 28],
      [4, 28],
    ]))

    expect(logical.length).toBeGreaterThanOrEqual(10)
    expect(logical.every((knot) => knot.wraps === 1)).toBe(true)
    expect(constraints).toHaveLength(logical.length)

    for (const constraint of constraints) {
      expect(constraint.wrapIndex).toBe(0)
      expect(constraint.parentKey).toBe(constraint.key.replace('#0', ''))
    }
  })

  it('keeps dense knot centers out of a tiny central pile', () => {
    const tangle = new RopeTangle(2468)
    const knots = tangle.update(
      [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, null],
      geometry,
    )

    const radii = knots.map((knot) => Math.hypot(
      knot.x - geometry.cx,
      knot.y - geometry.cy,
    ))

    expect(knots.length).toBeGreaterThan(8)
    expect(Math.max(...radii)).toBeGreaterThan(geometry.boardRadius * 0.34)
    expect(radii.filter((radius) => radius < geometry.boardRadius * 0.12).length)
      .toBeLessThanOrEqual(1)
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

  it('keeps an existing knot stable across repeated topology updates', () => {
    const tangle = new RopeTangle(654)
    const order = [0, 1, 0, 1, null]
    const [first] = tangle.update(order, geometry)
    const before = {
      x: first.x,
      y: first.y,
      aT: first.aT,
      bT: first.bT,
    }

    for (let index = 0; index < 20; index++) {
      tangle.update(order, geometry)
    }

    const [after] = tangle.getKnots()
    expect(after.x).toBeCloseTo(before.x, 8)
    expect(after.y).toBeCloseTo(before.y, 8)
    expect(after.aT).toBeCloseTo(before.aT, 8)
    expect(after.bT).toBeCloseTo(before.bT, 8)
  })

  it('limits knot-center and contact sliding speed in one physics frame', () => {
    const tangle = new RopeTangle(987)
    const [knot] = tangle.update([0, 1, 0, 1, null], geometry)
    const before = {
      x: knot.x,
      y: knot.y,
      aT: knot.aT,
      bT: knot.bT,
    }

    const makePoints = (offset) => Array.from({ length: 25 }, (_, index) => ({
      x: 520 + index * 5 + offset,
      y: 480 + index * 3 + offset,
    }))

    const physics = {
      getPoints(id) {
        return id === 0 ? makePoints(0) : makePoints(4)
      },
    }

    tangle.followPhysics(physics, geometry, { activeRopeId: 0 })

    const centerMove = Math.hypot(
      knot.x - before.x,
      knot.y - before.y,
    )

    expect(centerMove).toBeLessThanOrEqual(
      geometry.boardRadius * 0.0012 + 0.01,
    )
    expect(Math.abs(knot.aT - before.aT)).toBeLessThanOrEqual(0.00071)
    expect(Math.abs(knot.bT - before.bT)).toBeLessThanOrEqual(0.00071)
  })

  it('keeps idle knot centers fixed while rope particles settle', () => {
    const tangle = new RopeTangle(744)
    const [knot] = tangle.update([0, 1, 0, 1, null], geometry)
    const before = { x: knot.x, y: knot.y, aT: knot.aT, bT: knot.bT }

    const physics = {
      getPoints() {
        return Array.from({ length: 15 }, (_, index) => ({
          x: 500 + index * 7,
          y: 500 + index * 4,
        }))
      },
    }

    for (let frame = 0; frame < 60; frame++) {
      tangle.followPhysics(physics, geometry)
    }

    expect(knot.x).toBe(before.x)
    expect(knot.y).toBe(before.y)
    expect(knot.aT).toBe(before.aT)
    expect(knot.bT).toBe(before.bT)
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

    tangle.followPhysics(physics, geometry, { activeRopeId: 0 })

    expect(knot.x).toBeGreaterThan(before.x)
    expect(knot.y).toBeGreaterThan(before.y)
  })

  it('slides a knot contact toward a closer interior rope segment', () => {
    const tangle = new RopeTangle(990)
    const [knot] = tangle.update([0, 1, 0, 1, null], geometry)
    const beforeAT = knot.aT
    const beforeBT = knot.bT

    const makePoints = (offset) => {
      const points = Array.from({ length: 13 }, (_, index) => ({
        x: 430 + index * 12 + offset,
        y: 420 + index * 8,
      }))
      points[2] = {
        x: knot.x + offset,
        y: knot.y + offset,
      }
      return points
    }

    const physics = {
      getPoints(id) {
        return id === 0 ? makePoints(0) : makePoints(1)
      },
    }

    tangle.followPhysics(physics, geometry, { activeRopeId: 0 })

    expect(knot.aT).toBeLessThan(beforeAT)
    expect(knot.bT).toBeLessThan(beforeBT)
    expect(knot.aT).toBeGreaterThanOrEqual(0.12)
    expect(knot.bT).toBeGreaterThanOrEqual(0.12)
  })
})
