import { access, stat } from 'node:fs/promises'
import sharp from 'sharp'

const profiles = [
  { id: 'phone', width: 1080, height: 1920 },
  { id: 'tablet-7', width: 1200, height: 1920 },
  { id: 'tablet-10', width: 1600, height: 2560 },
]

const captures = [
  '01-main-menu',
  '02-levels',
  '03-settings',
  '04-about',
  '05-how-to-play',
  '06-gameplay',
  '07-pause',
  '08-level-complete',
  '09-hard-tangle',
]

for (const profile of profiles) {
  for (const capture of captures) {
    const path = (
      `store/generated/screenshots/${profile.id}/`
      + `${capture}-${profile.width}x${profile.height}.png`
    )

    await access(path)

    const info = await sharp(path).metadata()
    if (info.width !== profile.width || info.height !== profile.height) {
      throw new Error(
        `Unexpected screenshot size for ${path}: `
        + `${info.width}x${info.height}`,
      )
    }

    const file = await stat(path)
    if (file.size < 10_000) {
      throw new Error(`Screenshot looks unexpectedly small: ${path}`)
    }
  }
}

console.log('Phone and tablet Play Store screenshot sets verified')
