export const PERFORMANCE_PROFILES = {
  high: {
    id: 'high',
    label: 'High',
    dprCap: 2,
    smallSegments: 23,
    largeSegments: 28,
    constraintIterations: 7,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    dprCap: 1.5,
    smallSegments: 19,
    largeSegments: 23,
    constraintIterations: 6,
  },
  battery: {
    id: 'battery',
    label: 'Battery',
    dprCap: 1.2,
    smallSegments: 16,
    largeSegments: 20,
    constraintIterations: 4,
  },
}

export function chooseAutomaticProfile(capabilities = {}) {
  const hasHardwareConcurrency = Object.prototype.hasOwnProperty.call(
    capabilities,
    'hardwareConcurrency',
  )
  const hasDeviceMemory = Object.prototype.hasOwnProperty.call(
    capabilities,
    'deviceMemory',
  )

  const hardwareConcurrency = hasHardwareConcurrency
    ? capabilities.hardwareConcurrency
    : globalThis.navigator?.hardwareConcurrency
  const deviceMemory = hasDeviceMemory
    ? capabilities.deviceMemory
    : globalThis.navigator?.deviceMemory

  if (!hardwareConcurrency && !deviceMemory) {
    return PERFORMANCE_PROFILES.balanced
  }

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
