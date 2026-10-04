export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0'

export function privacySummary() {
  return [
    'String Sort works offline.',
    'No account is required.',
    'The current build has no ads, analytics, tracking or backend.',
    'Progress and preferences are stored only on this device.',
  ]
}
