const PREVIEW_PARAM = 'adPreview'

export function getBannerMode(locationLike = globalThis.location) {
  try {
    const params = new URLSearchParams(locationLike?.search || '')
    return params.get(PREVIEW_PARAM) === '1' ? 'preview' : 'off'
  } catch {
    return 'off'
  }
}

export function applyMonetizationLayout(root = document.documentElement, locationLike) {
  const mode = getBannerMode(locationLike)
  root.dataset.bannerMode = mode
  return mode
}

export function createBannerSafeSlot() {
  return '<div class="banner-safe-zone" data-ad-slot="banner" aria-hidden="true"><span>Banner safe area</span></div>'
}
