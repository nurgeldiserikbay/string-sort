import { describe, expect, it } from 'vitest'
import { uiIcon } from '../src/ui/icons.js'

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
      'chevronRight',
      'chapterStart',
      'chapterTwist',
      'chapterGarden',
      'chapterKnot',
      'chapterMaster',
      'timer',
      'crossings',
      'moves',
      'sound',
      'haptics',
      'graphics',
      'markers',
      'info',
      'reset',
      'close',
    ]) {
      const svg = uiIcon(name)
      expect(svg).toContain('<svg')
      expect(svg).toContain('aria-hidden="true"')
      expect(svg).toContain('stroke="currentColor"')
      expect(svg).not.toContain('emoji')
    }
  })

  it('falls back to the help icon for an unknown name', () => {
    expect(uiIcon('missing-icon')).toContain('<circle cx="12" cy="12" r="8.1"/>')
  })
})
