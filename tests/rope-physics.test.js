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

  it('couples two ropes around a persistent knot instead of letting them freely pass', () => {
    const physics = new RopePhysics({
      gravity: 0,
      damping: 0.98,
      constraintIterations: 8,
    })

    physics.syncRope(0, { x: 0, y: 0 }, { x: 120, y: 120 }, {
      segmentCount: 12,
      slack: 1.08,
    })
    physics.syncRope(1, { x: 0, y: 120 }, { x: 120, y: 0 }, {
      segmentCount: 12,
      slack: 1.08,
    })

    const knot = {
      aId: 0,
      bId: 1,
      aIndex: 6,
      bIndex: 6,
      x: 60,
      y: 60,
      stiffness: 0.24,
      drag: 0.7,
    }

    for (let frame = 0; frame < 8; frame++) {
      physics.update(16 + frame * 16, { knots: [knot] })
    }

    const a = physics.getPoints(0)[6]
    const b = physics.getPoints(1)[6]

    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(12)
    expect(Math.hypot(a.x - 60, a.y - 60)).toBeLessThan(18)
    expect(Math.hypot(b.x - 60, b.y - 60)).toBeLessThan(18)
  })
})
