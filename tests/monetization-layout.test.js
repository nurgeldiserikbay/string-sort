import { describe, expect, it } from 'vitest'
import {
  applyMonetizationLayout,
  createBannerSafeSlot,
  getBannerMode,
} from '../src/game/MonetizationLayout.js'

describe('MonetizationLayout', () => {
  it('keeps banner reservation disabled by default', () => {
    expect(getBannerMode({ search: '' })).toBe('off')
  })

  it('enables only the explicit ad preview mode', () => {
    expect(getBannerMode({ search: '?adPreview=1' })).toBe('preview')
    expect(getBannerMode({ search: '?adPreview=0' })).toBe('off')
  })

  it('applies the mode without loading an advertising SDK', () => {
    const root = { dataset: {} }
    const mode = applyMonetizationLayout(root, { search: '?adPreview=1' })

    expect(mode).toBe('preview')
    expect(root.dataset.bannerMode).toBe('preview')
    expect(createBannerSafeSlot()).toContain('data-ad-slot="banner"')
  })
})
