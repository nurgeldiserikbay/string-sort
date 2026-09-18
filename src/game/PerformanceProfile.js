export const PERFORMANCE_PROFILES = {
  high: {
    id: 'high',
    label: 'High',
    dprCap: 2,
    smallSegments: 24,
    largeSegments: 30,
    constraintIterations: 8,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    dprCap: 1.6,
    smallSegments: 20,
    largeSegments: 25,
    constraintIterations: 7,
  },
  battery: {
    id: 'battery',
    label: 'Battery',
    dprCap: 1.25,
    smallSegments: 18,
    largeSegments: 22,
    constraintIterations: 5,
  },
}

export function chooseAutomaticProfile({
  hardwareConcurrency = globalThis.navigator?.hardwareConcurrency,
  deviceMemory = globalThis.navigator?.deviceMemory,
} = {}) {
  if ((deviceMemory && deviceMemory <= 3) || (hardwareConcurrency && hardwareConcurrency <= 4)) {
    return PERFORMANCE_PROFILES.battery
  }

  if ((deviceMemory && deviceMemory <= 6) || (hardwareConcurrency && hardwareConcurrency <= 6)) {
    return PERFORMANCE_PROFILES.balanced
  }

  return PERFORMANCE_PROFILES.high
}

export function resolvePerformanceProfile(preference = 'auto', capabilities) {
  if (preference === 'auto') return chooseAutomaticProfile(capabilities)
  return PERFORMANCE_PROFILES[preference] ?? PERFORMANCE_PROFILES.balanced
}

export const GRAPHICS_OPTIONS = ['auto', 'high', 'balanced', 'battery']

export function nextGraphicsOption(current) {
  const index = GRAPHICS_OPTIONS.indexOf(current)
  return GRAPHICS_OPTIONS[(index + 1 + GRAPHICS_OPTIONS.length) % GRAPHICS_OPTIONS.length]
}

export function graphicsLabel(preference, capabilities) {
  if (preference !== 'auto') return PERFORMANCE_PROFILES[preference]?.label ?? 'Balanced'
  return `Auto · ${chooseAutomaticProfile(capabilities).label}`
}
