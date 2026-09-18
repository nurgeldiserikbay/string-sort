import { describe, expect, it } from 'vitest'
import { FrameGovernor } from '../src/game/FrameGovernor.js'

describe('FrameGovernor', () => {
  it('keeps high quality when measured FPS is healthy', () => {
    const governor = new FrameGovernor({
      profileId: 'high',
      sampleSize: 12,
      cooldownMs: 0,
      lowFpsThreshold: 48,
    })

    let recommendation = null
    for (let i = 0; i < 20; i++) {
      recommendation = governor.pushFrame(i * 16.67) ?? recommendation
    }

    expect(recommendation).toBeNull()
    expect(governor.profileId).toBe('high')
  })

  it('steps down one profile when sustained FPS is low', () => {
    const governor = new FrameGovernor({
      profileId: 'high',
      sampleSize: 10,
      cooldownMs: 0,
      lowFpsThreshold: 48,
    })

    let recommendation = null
    for (let i = 0; i < 14; i++) {
      recommendation = governor.pushFrame(i * 30) ?? recommendation
    }

    expect(recommendation?.id).toBe('balanced')
    expect(governor.profileId).toBe('balanced')
  })

  it('never steps below battery mode', () => {
    const governor = new FrameGovernor({
      profileId: 'battery',
      sampleSize: 8,
      cooldownMs: 0,
      lowFpsThreshold: 55,
    })

    let recommendation = null
    for (let i = 0; i < 12; i++) {
      recommendation = governor.pushFrame(i * 40) ?? recommendation
    }

    expect(recommendation).toBeNull()
    expect(governor.profileId).toBe('battery')
  })
})
