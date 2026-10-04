import { describe, expect, it } from 'vitest'
import { createLevel } from '../src/game/levels.js'
import { RopePhysics } from '../src/game/RopePhysics.js'
import { RopeTangle } from '../src/game/RopeTangle.js'

const TAU = Math.PI * 2

function socketPosition(index, count, geometry) {
  const angle = -Math.PI / 2 + (index / count) * TAU
  const radius = geometry.boardRadius * 0.89
  return {
    x: geometry.cx + Math.cos(angle) * radius,
    y: geometry.cy + Math.sin(angle) * radius,
  }
}

describe('dense tangle physics stress gate', () => {
  it('keeps a late-game 9-rope board finite through an aggressive drag', () => {
    const level = createLevel(100)
    const geometry = {
      cx: 240,
      cy: 240,
      boardRadius: 205,
      socketRadius: 13,
      size: 460,
    }
    const physics = new RopePhysics({
      gravity: 0,
      damping: 0.982,
      constraintIterations: 6,
    })
    const tangle = new RopeTangle(0x51f15e)
    const segmentCounts = new Map()

    const endpointEntries = (ropeId, movingPoint = null) => {
      const entries = []
      level.order.forEach((id, index) => {
        if (id !== ropeId) return
        entries.push({
          index,
          position: movingPoint && entries.length === 0
            ? movingPoint
            : socketPosition(index, level.order.length, geometry),
        })
      })
      return entries
    }

    const sync = (movingPoint = null) => {
      for (let ropeId = 0; ropeId < level.ropeCount; ropeId++) {
        const endpoints = endpointEntries(
          ropeId,
          ropeId === 0 ? movingPoint : null,
        )
        segmentCounts.set(ropeId, 22)
        physics.syncRope(
          ropeId,
          endpoints[0].position,
          endpoints[1].position,
          {
            segmentCount: 22,
            slack: 1.12,
            retargetLength: ropeId !== 0,
          },
        )
      }
    }

    sync()
    tangle.update(level.order, geometry)
    let knots = tangle.buildConstraints(segmentCounts)
    physics.primeKnotLayout(knots)

    for (let frame = 0; frame < 180; frame++) {
      const angle = frame * 0.11
      const dragRadius = geometry.boardRadius * (0.2 + (frame % 35) / 55)
      const movingPoint = {
        x: geometry.cx + Math.cos(angle) * dragRadius,
        y: geometry.cy + Math.sin(angle * 1.17) * dragRadius,
      }

      sync(movingPoint)
      tangle.followPhysics(physics, geometry)
      knots = tangle.buildConstraints(segmentCounts)

      physics.update(frame * 16.67, {
        knots,
        boundary: {
          x: geometry.cx,
          y: geometry.cy,
          radius: geometry.boardRadius * 0.91,
        },
      })
    }

    for (let ropeId = 0; ropeId < level.ropeCount; ropeId++) {
      const points = physics.getPoints(ropeId)
      expect(points.length).toBeGreaterThan(10)

      for (const point of points) {
        expect(Number.isFinite(point.x)).toBe(true)
        expect(Number.isFinite(point.y)).toBe(true)
        expect(Math.abs(point.x)).toBeLessThan(2000)
        expect(Math.abs(point.y)).toBeLessThan(2000)
      }
    }
  })
})
