import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = process.env.STRING_SORT_URL || 'http://127.0.0.1:4173'
const outputDir = 'store/generated/screenshots'

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 540, height: 960 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()

async function capture(name) {
  await page.screenshot({
    path: `${outputDir}/${name}-1080x1920.png`,
    fullPage: false,
  })
}

async function dragSocket(fromIndex, toIndex, socketCount) {
  const canvas = page.locator('#game-board')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Game canvas is not visible')

  const size = Math.min(box.width, box.height)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2 + size * 0.012
  const boardRadius = size * 0.415
  const radius = boardRadius * 0.86

  const position = (index) => {
    const angle = -Math.PI / 2 + (index / socketCount) * Math.PI * 2
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    }
  }

  const from = position(fromIndex)
  const to = position(toIndex)

  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(
    (from.x + to.x) / 2,
    (from.y + to.y) / 2,
    { steps: 10 },
  )
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.waitForTimeout(120)
  await page.mouse.up()
  await page.waitForTimeout(260)
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.menu-screen')
  await page.waitForTimeout(350)
  await capture('01-main-menu')

  await page.click('[data-action="levels"]')
  await page.waitForSelector('.levels-screen')
  await page.waitForTimeout(250)
  await capture('02-levels')

  await page.click('[data-action="back"]')
  await page.click('[data-action="play"]')
  await page.waitForSelector('#game-board')
  await page.waitForTimeout(900)
  await capture('03-gameplay')

  // Handcrafted level 1 starts as:
  // [0, 1, 0, 1, 2, 2]
  // One swap teaches the core mechanic and solves the board.
  await dragSocket(1, 2, 6)

  await page.waitForSelector('.complete-card', { timeout: 5000 })
  await page.waitForTimeout(450)
  await capture('04-level-complete')

  console.log(`Captured Play Store screenshots in ${outputDir}`)
} finally {
  await context.close()
  await browser.close()
}
