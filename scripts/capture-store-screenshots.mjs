import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = process.env.STRING_SORT_URL || 'http://127.0.0.1:4173'
const outputDir = 'store/generated/screenshots'

const DEVICE_PROFILES = [
  {
    id: 'phone',
    viewport: { width: 540, height: 960 },
    deviceScaleFactor: 2,
    pixelLabel: '1080x1920',
  },
  {
    id: 'tablet-7',
    viewport: { width: 600, height: 960 },
    deviceScaleFactor: 2,
    pixelLabel: '1200x1920',
  },
  {
    id: 'tablet-10',
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    pixelLabel: '1600x2560',
  },
]

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })

function depthSeedFor(socketCount, visualSeed) {
  return (
    0x51f15e
    ^ Math.imul(socketCount + 1, 0x9e3779b1)
    ^ Math.imul(visualSeed + 1, 0x85ebca6b)
  ) >>> 0
}

function seedRotation(socketCount, visualSeed) {
  const depthSeed = depthSeedFor(socketCount, visualSeed)
  return ((((depthSeed >>> 9) & 1023) / 1023) - 0.5) * 0.08
}

async function captureProfile(profile) {
  const profileDir = `${outputDir}/${profile.id}`
  await mkdir(profileDir, { recursive: true })

  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()

  async function capture(name) {
    await page.screenshot({
      path: `${profileDir}/${name}-${profile.pixelLabel}.png`,
      fullPage: false,
    })
  }

  async function dragSocket(
    fromIndex,
    toIndex,
    socketCount,
    visualSeed,
  ) {
    const canvas = page.locator('#game-board')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Game canvas is not visible')

    const size = Math.min(box.width, box.height)
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2 + size * 0.012
    const boardRadius = size * 0.445
    const radius = boardRadius * 0.89
    const rotation = seedRotation(socketCount, visualSeed)

    const position = (index) => {
      const angle = (
        -Math.PI / 2
        + rotation
        + (index / socketCount) * Math.PI * 2
      )
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
    await page.waitForSelector('.menu-screen')
    await page.click('[data-action="settings"]')
    await page.waitForSelector('.settings-screen')
    await page.waitForTimeout(250)
    await capture('03-settings')

    await page.click('[data-action="about"]')
    await page.waitForSelector('.about-card')
    await page.waitForTimeout(180)
    await capture('04-about')
    await page.click('.about-card [data-action="close"]')
    await page.click('[data-action="back"]')
    await page.waitForSelector('.menu-screen')

    await page.click('[data-action="how-to-play"]')
    await page.waitForSelector('.how-to-card')
    await page.waitForTimeout(180)
    await capture('05-how-to-play')
    await page.click('.how-to-card [data-action="close"]')

    await page.click('[data-action="play"]')
    await page.waitForSelector('#game-board')
    await page.waitForTimeout(900)
    await capture('06-gameplay')

    await page.click('[data-action="pause"]')
    await page.waitForSelector('.modal-card')
    await page.waitForTimeout(180)
    await capture('07-pause')
    await page.click('.modal-card .primary-button[data-action="resume"]')
    await page.waitForSelector('#game-board')
    await page.waitForTimeout(160)

    // Handcrafted level 1 starts as:
    // [0, 1, 0, 1, 2, 2, null]
    // Move the crossing peg into the one empty socket.
    await dragSocket(1, 6, 7, 1)

    await page.waitForSelector('.complete-card', { timeout: 5000 })
    await page.waitForTimeout(450)
    await capture('08-level-complete')

    // Internal/store preview of a readable dense late-game tangle.
    await page.evaluate(() => {
      localStorage.setItem('string-sort-progress-v1', JSON.stringify({
        unlocked: 100,
        stars: {},
        bestTimes: {},
      }))
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page.click('[data-action="levels"]')
    await page.waitForSelector('[data-chapter="3"]')
    await page.click('[data-chapter="3"]')
    await page.waitForSelector('[data-level="80"]')
    await page.locator('[data-level="80"]').scrollIntoViewIfNeeded()
    await page.click('[data-level="80"]')
    await page.waitForSelector('#game-board')
    await page.waitForTimeout(1200)
    await capture('09-hard-tangle')

    console.log(
      `Captured ${profile.id} screenshots at ${profile.pixelLabel}`,
    )
  } finally {
    await context.close()
  }
}

try {
  for (const profile of DEVICE_PROFILES) {
    await captureProfile(profile)
  }

  console.log(`Captured Play Store screenshots in ${outputDir}`)
} finally {
  await browser.close()
}
