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
      pegMarkers: false,
      graphics: 'auto',
    })
  })

  it('enables accessibility peg markers only when explicitly requested', () => {
    expect(normalizeSettings({ pegMarkers: true }).pegMarkers).toBe(true)
    expect(normalizeSettings({ pegMarkers: 'yes' }).pegMarkers).toBe(false)
  })

  it('reads malformed JSON safely', () => {
    const storage = {
      getItem: vi.fn(() => '{bad-json'),
    }

    expect(safeReadJson(storage, 'key', { ok: true })).toEqual({ ok: true })
  })

  it('does not claim persistence when storage is unavailable or read-only', () => {
    expect(safeWriteJson(null, 'progress', { unlocked: 4 })).toBe(false)
    expect(safeWriteJson({}, 'progress', { unlocked: 4 })).toBe(false)
    expect(safeWriteJson({ setItem: null }, 'progress', { unlocked: 4 })).toBe(false)
  })

  it('round-trips real progress and settings across simulated restarts', () => {
    const data = new Map()
    const storage = {
      getItem(key) { return data.get(key) ?? null },
      setItem(key, value) { data.set(key, value) },
    }
    const progress = normalizeProgress({
      unlocked: 83,
      stars: { 1: 3, 42: 2, 83: 1 },
      bestTimes: { 1: 10.5, 42: 57, 83: 112.25 },
    }, 100)
    const settings = normalizeSettings({
      sound: false,
      haptics: false,
      graphics: 'auto',
      pegMarkers: true,
    })

    expect(safeWriteJson(storage, 'string-sort-progress-v1', progress)).toBe(true)
    expect(safeWriteJson(storage, 'string-sort-settings-v1', settings)).toBe(true)

    const reloadedProgress = normalizeProgress(
      safeReadJson(storage, 'string-sort-progress-v1', {}), 100,
    )
    const reloadedSettings = normalizeSettings(
      safeReadJson(storage, 'string-sort-settings-v1', {}),
    )
    expect(reloadedProgress).toEqual(progress)
    expect(reloadedSettings).toEqual(settings)
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
