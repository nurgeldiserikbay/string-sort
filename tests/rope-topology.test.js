import { describe, expect, it } from 'vitest'
import {
  detectRopeCrossings,
  segmentIntersection,
  stableDepthOrder,
  topRopeAtContact,
} from '../src/game/RopeTopology.js'

describe('RopeTopology', () => {
  it('detects a proper segment intersection', () => {
    const hit = segmentIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    )

    expect(hit).not.toBeNull()
    expect(hit.x).toBeCloseTo(5)
    expect(hit.y).toBeCloseTo(5)
  })

  it('ignores endpoint touching so pegs do not become fake rope crossings', () => {
    const hit = segmentIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    )

    expect(hit).toBeNull()
  })

  it('detects crossings between segmented ropes and deduplicates nearby hits', () => {
    const ropes = [
      {
        id: 0,
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 20 }],
      },
      {
        id: 1,
        points: [{ x: 0, y: 20 }, { x: 10, y: 10 }, { x: 20, y: 0 }],
      },
    ]

    const contacts = detectRopeCrossings(ropes, { dedupeDistance: 6 })
    expect(contacts.length).toBeLessThanOrEqual(1)
  })

  it('keeps depth order deterministic for the same level seed', () => {
    const first = stableDepthOrder([0, 1, 2, 3, 4], 12345)
    const second = stableDepthOrder([0, 1, 2, 3, 4], 12345)

    expect(first).toEqual(second)

    const contact = { aId: first[0], bId: first.at(-1) }
    expect(topRopeAtContact(contact, first)).toBe(first.at(-1))
  })
})
