import { GRAPHICS_OPTIONS } from './PerformanceProfile.js'

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.floor(number)))
}

export function normalizeProgress(raw, totalLevels) {
  const source = asObject(raw)
  const maxLevel = Math.max(1, Number(totalLevels) || 1)
  const stars = {}
  const bestTimes = {}

  for (const [key, value] of Object.entries(asObject(source.stars))) {
    const level = clampInteger(key, 1, maxLevel, 0)
    if (!level) continue
    const score = clampInteger(value, 0, 3, 0)
    if (score > 0) stars[level] = score
  }

  for (const [key, value] of Object.entries(asObject(source.bestTimes))) {
    const level = clampInteger(key, 1, maxLevel, 0)
    const seconds = Number(value)
    if (!level || !Number.isFinite(seconds) || seconds <= 0 || seconds > 86400) continue
    bestTimes[level] = seconds
  }

  return {
    unlocked: clampInteger(source.unlocked, 1, maxLevel, 1),
    stars,
    bestTimes,
  }
}

export function normalizeSettings(raw) {
  const source = asObject(raw)
  const graphics = GRAPHICS_OPTIONS.includes(source.graphics)
    ? source.graphics
    : 'auto'

  return {
    sound: source.sound !== false,
    haptics: source.haptics !== false,
    graphics,
  }
}

export function safeReadJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeWriteJson(storage, key, value) {
  try {
    storage?.setItem?.(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
