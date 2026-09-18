import { describe, expect, it } from 'vitest'
import {
  chooseAutomaticProfile,
  graphicsLabel,
  nextGraphicsOption,
  resolvePerformanceProfile,
} from '../src/game/PerformanceProfile.js'

describe('performance profiles', () => {
  it('selects battery mode for constrained devices', () => {
    expect(chooseAutomaticProfile({ hardwareConcurrency: 4, deviceMemory: 3 }).id).toBe('battery')
  })

  it('selects balanced mode for mid-range devices', () => {
    expect(chooseAutomaticProfile({ hardwareConcurrency: 6, deviceMemory: 6 }).id).toBe('balanced')
  })

  it('selects high mode for stronger devices', () => {
    expect(chooseAutomaticProfile({ hardwareConcurrency: 8, deviceMemory: 8 }).id).toBe('high')
  })

  it('cycles graphics preferences predictably', () => {
    expect(nextGraphicsOption('auto')).toBe('high')
    expect(nextGraphicsOption('battery')).toBe('auto')
  })

  it('labels automatic mode with its resolved profile', () => {
    expect(graphicsLabel('auto', { hardwareConcurrency: 4, deviceMemory: 3 })).toBe('Auto · Battery')
    expect(resolvePerformanceProfile('high').id).toBe('high')
  })
})
