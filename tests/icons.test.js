import { describe, expect, it } from 'vitest'
import { hasUiIcon, uiIcon } from '../src/ui/icons.js'

describe('uiIcon', () => {
  it('renders the polished gameplay icon set as accessible decorative SVG', () => {
    for (const name of [
      'play',
      'levels',
      'star',
      'settings',
      'hint',
      'undo',
      'restart',
      'pause',
      'home',
      'back',
      'forward',
      'timer',
      'crossings',
      'moves',
      'sound',
      'haptics',
      'graphics',
      'markers',
      'info',
      'privacy',
      'reset',
      'knot',
      'twist',
      'garden',
      'weave',
      'crown',
      'trophy',
      'close',
    ]) {
      const svg = uiIcon(name)
      expect(svg).toContain('<svg')
      expect(svg).toContain('aria-hidden="true"')
      expect(svg).toContain('stroke="currentColor"')
      expect(svg).not.toContain('emoji')
    }
  })


  it('defines every icon used outside the main menu', () => {
    for (const name of [
      'back',
      'forward',
      'pause',
      'timer',
      'moves',
      'crossings',
      'hint',
      'undo',
      'restart',
      'lock',
      'knot',
      'twist',
      'garden',
      'weave',
      'crown',
      'trophy',
      'home',
      'sound',
      'haptics',
      'graphics',
      'markers',
      'info',
      'privacy',
      'reset',
      'close',
      'check',
    ]) {
      expect(hasUiIcon(name), `${name} should not fall back to help`).toBe(true)
    }
  })

  it('falls back to the help icon for an unknown name', () => {
    expect(uiIcon('missing-icon')).toContain('<circle cx="12" cy="12" r="8.1"/>')
  })
})
