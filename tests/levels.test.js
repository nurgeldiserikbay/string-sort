import { describe, expect, it } from 'vitest'
import { createLevel, findBestSwap, getCrossingCount, getGuaranteedSolveMoves } from '../src/game/levels.js'

describe('level geometry', () => {
  it('counts alternating chord endpoints as a crossing', () => {
    expect(getCrossingCount([0, 1, 0, 1])).toBe(1)
    expect(getCrossingCount([0, 0, 1, 1])).toBe(0)
  })

  it('creates deterministic valid levels', () => {
    const first = createLevel(8)
    const second = createLevel(8)

    expect(first.order).toEqual(second.order)
    expect(first.order).toHaveLength(first.ropeCount * 2)

    for (let ropeId = 0; ropeId < first.ropeCount; ropeId++) {
      expect(first.order.filter((id) => id === ropeId)).toHaveLength(2)
    }
  })

  it('finds a swap that reduces crossings when one is available', () => {
    const order = [0, 1, 0, 1]
    const hint = findBestSwap(order)

    expect(hint).not.toBeNull()
    expect(hint.crossings).toBeLessThan(getCrossingCount(order))
  })

  it('always provides a finite adjacent-pair solution path', () => {
    const order = createLevel(24).order
    const working = [...order]
    const moves = getGuaranteedSolveMoves(working)

    for (const move of moves) {
      ;[working[move.from], working[move.to]] = [working[move.to], working[move.from]]
    }

    expect(getCrossingCount(working)).toBe(0)
    expect(moves.length).toBeLessThanOrEqual(createLevel(24).ropeCount - 1)
  })

  it('uses a guaranteed fallback hint when no strictly better swap is selected', () => {
    const solved = [0, 0, 1, 1]
    expect(findBestSwap(solved)).toBeNull()

    const unsolved = createLevel(12).order
    expect(findBestSwap(unsolved)).not.toBeNull()
  })
})
