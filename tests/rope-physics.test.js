import { describe, expect, it } from 'vitest'
import { RopePhysics } from '../src/game/RopePhysics.js'

describe('RopePhysics', () => {
  it('keeps rope endpoints pinned while simulating interior points', () => {
    const physics = new RopePhysics({ gravity: 30, constraintIterations: 8 })
    physics.syncRope(0, { x: 0, y: 0 }, { x: 120, y: 0 }, {
      segmentCount: 12,
      slack: 1.1,
    })

    physics.update(16)
    physics.update(32)

    const points = physics.getPoints(0)
    expect(points).toHaveLength(13)
    expect(points[0].x).toBeCloseTo(0)
    expect(points[0].y).toBeCloseTo(0)
    expect(points.at(-1).x).toBeCloseTo(120)
    expect(points.at(-1).y).toBeCloseTo(0)
  })

  it('preserves the rope when endpoints move instead of recreating particles', () => {
    const physics = new RopePhysics()
    physics.syncRope(2, { x: 10, y: 10 }, { x: 100, y: 50 }, { segmentCount: 10 })
    const points = physics.getPoints(2)

    physics.syncRope(2, { x: 12, y: 12 }, { x: 104, y: 55 }, { segmentCount: 10 })

    expect(physics.getPoints(2)).toBe(points)
    expect(points[0].x).toBe(12)
    expect(points.at(-1).x).toBe(104)
  })
})
