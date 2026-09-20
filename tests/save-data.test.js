import { describe, expect, it, vi } from 'vitest'
import {
  normalizeProgress,
  normalizeSettings,
  safeReadJson,
  safeWriteJson,
} from '../src/game/SaveData.js'

describe('SaveData', () => {
  it('sanitizes corrupted progress without throwing', () => {
    const progress = normalizeProgress({
      unlocked: 999,
      stars: {
        1: 7,
        2: 2,
        nope: 3,
        200: 3,
      },
      bestTimes: {
        1: 12.5,
        2: -3,
        3: '42',
        4: Infinity,
      },
    }, 100)

    expect(progress.unlocked).toBe(100)
    expect(progress.stars).toEqual({ 1: 3, 2: 2 })
    expect(progress.bestTimes).toEqual({ 1: 12.5, 3: 42 })
  })

  it('falls back to supported settings', () => {
    expect(normalizeSettings({
      sound: false,
      haptics: 'yes',
      graphics: 'ultra',
    })).toEqual({
      sound: false,
      haptics: true,
      graphics: 'auto',
    })
  })

  it('reads malformed JSON safely', () => {
    const storage = {
      getItem: vi.fn(() => '{bad-json'),
    }

    expect(safeReadJson(storage, 'key', { ok: true })).toEqual({ ok: true })
  })

  it('returns false instead of crashing when storage writes fail', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('quota exceeded')
      }),
    }

    expect(safeWriteJson(storage, 'key', { value: 1 })).toBe(false)
  })
})
