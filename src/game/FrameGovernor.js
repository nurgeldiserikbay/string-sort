import { PERFORMANCE_PROFILES } from './PerformanceProfile.js'

const ORDER = ['high', 'balanced', 'battery']

export class FrameGovernor {
  constructor({
    profileId = 'high',
    lowFpsThreshold = 48,
    sampleSize = 90,
    cooldownMs = 4500,
  } = {}) {
    this.profileId = ORDER.includes(profileId) ? profileId : 'balanced'
    this.lowFpsThreshold = lowFpsThreshold
    this.sampleSize = sampleSize
    this.cooldownMs = cooldownMs
    this.samples = []
    this.lastTime = 0
    this.lastChangeAt = 0
  }

  reset(time = 0) {
    this.samples = []
    this.lastTime = time
  }

  pushFrame(time) {
    if (!Number.isFinite(time)) return null

    if (!this.lastTime) {
      this.lastTime = time
      return null
    }

    const delta = time - this.lastTime
    this.lastTime = time

    if (delta <= 0 || delta > 250) {
      this.samples = []
      return null
    }

    this.samples.push(delta)
    if (this.samples.length > this.sampleSize) this.samples.shift()

    if (this.samples.length < this.sampleSize) return null
    if (time - this.lastChangeAt < this.cooldownMs) return null

    const averageDelta = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length
    const fps = 1000 / averageDelta

    if (fps >= this.lowFpsThreshold) return null

    const currentIndex = ORDER.indexOf(this.profileId)
    if (currentIndex >= ORDER.length - 1) return null

    this.profileId = ORDER[currentIndex + 1]
    this.lastChangeAt = time
    this.samples = []

    return PERFORMANCE_PROFILES[this.profileId]
  }
}
