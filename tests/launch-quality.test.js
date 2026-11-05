import { describe, expect, it } from 'vitest'
import {
  TOTAL_LEVELS,
  createLevel,
  findBestSwap,
  getCrossingCount,
  getKnotGraphStats,
} from '../src/game/levels.js'
import { RopeTangle } from '../src/game/RopeTangle.js'

function applyMove(order, move) {
  const next = [...order]
  ;[next[move.from], next[move.to]] = [next[move.to], next[move.from]]
  return next
}

describe('launch level quality gate', () => {
  it('keeps exactly one empty socket and two endpoints per rope on all 100 levels', () => {
    for (let levelNumber = 1; levelNumber <= TOTAL_LEVELS; levelNumber++) {
      const level = createLevel(levelNumber)

      expect(level.order.filter((value) => value == null)).toHaveLength(1)
      expect(level.order).toHaveLength(level.ropeCount * 2 + 1)

      for (let ropeId = 0; ropeId < level.ropeCount; ropeId++) {
        expect(level.order.filter((value) => value === ropeId)).toHaveLength(2)
      }
    }
  })

  it('can solve every launch level by repeatedly following legal hints', () => {
    for (let levelNumber = 1; levelNumber <= TOTAL_LEVELS; levelNumber++) {
      let order = [...createLevel(levelNumber).order]
      const maxMoves = order.length * order.length * 2
      let moves = 0

      while (getCrossingCount(order) > 0 && moves < maxMoves) {
        const emptyIndex = order.indexOf(null)
        const hint = findBestSwap(order)

        expect(hint, `level ${levelNumber} should have a hint`).not.toBeNull()
        expect(hint.to, `level ${levelNumber} hint must target the empty socket`)
          .toBe(emptyIndex)
        expect(order[hint.from], `level ${levelNumber} hint source must be occupied`)
          .not.toBeNull()

        order = applyMove(order, hint)
        moves++
      }

      expect(
        getCrossingCount(order),
        `level ${levelNumber} should solve within ${maxMoves} hinted moves`,
      ).toBe(0)
    }
  })

  it('keeps later levels as one connected physical tangle', () => {
    for (let levelNumber = 25; levelNumber <= TOTAL_LEVELS; levelNumber++) {
      const level = createLevel(levelNumber)
      const stats = getKnotGraphStats(level.order)

      expect(stats.connected, `level ${levelNumber} knot graph`).toBe(true)
      expect(stats.involvedRopes, `level ${levelNumber} involved ropes`)
        .toBe(level.ropeCount)
    }
  })

  it('keeps the visual rope count readable and reference-like', () => {
    const ropeCounts = Array.from(
      { length: TOTAL_LEVELS },
      (_, index) => createLevel(index + 1).ropeCount,
    )

    expect(Math.max(...ropeCounts)).toBeLessThanOrEqual(9)
    expect(ropeCounts[0]).toBeLessThanOrEqual(3)
    expect(ropeCounts.at(-1)).toBeGreaterThanOrEqual(8)
  })

  it('produces finite physical knot constraints for every launch level', () => {
    const geometry = {
      cx: 240,
      cy: 240,
      boardRadius: 200,
    }

    for (let levelNumber = 1; levelNumber <= TOTAL_LEVELS; levelNumber++) {
      const level = createLevel(levelNumber)
      const tangle = new RopeTangle(0x51f15e + levelNumber)
      tangle.update(level.order, geometry)

      const segmentCounts = new Map(
        Array.from({ length: level.ropeCount }, (_, ropeId) => [ropeId, 28]),
      )
      const constraints = tangle.buildConstraints(segmentCounts)

      for (const knot of constraints) {
        expect(Number.isFinite(knot.x)).toBe(true)
        expect(Number.isFinite(knot.y)).toBe(true)
        expect(knot.aIndex).toBeGreaterThanOrEqual(2)
        expect(knot.aIndex).toBeLessThanOrEqual(26)
        expect(knot.bIndex).toBeGreaterThanOrEqual(2)
        expect(knot.bIndex).toBeLessThanOrEqual(26)
      }
    }
  })
})
