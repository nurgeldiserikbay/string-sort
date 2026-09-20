import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

await mkdir('store/generated', { recursive: true })

await sharp('resources/icon-only.svg')
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile('store/generated/app-icon-512.png')

await sharp('store/source/feature-graphic.svg')
  .resize(1024, 500)
  .png({ compressionLevel: 9 })
  .toFile('store/generated/feature-graphic-1024x500.png')

console.log('Generated Play Store icon and feature graphic')
