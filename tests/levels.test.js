import { describe, expect, it } from 'vitest'
import { createLevel, findBestSwap, getCrossingCount } from '../src/game/levels.js'

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
})
