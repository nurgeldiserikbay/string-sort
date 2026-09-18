import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { RopeBoard } from './RopeBoard.js'
import { AudioManager } from './AudioManager.js'
import { graphicsLabel, nextGraphicsOption } from './PerformanceProfile.js'
import { exitNativeApp, installNativeAppStateHandler, installNativeBackHandler } from './NativeNavigation.js'
import { createLevel, findBestSwap, getCrossingCount } from './levels.js'
import { createBannerSafeSlot } from './MonetizationLayout.js'

const SAVE_KEY = 'string-sort-progress-v1'
const SETTINGS_KEY = 'string-sort-settings-v1'

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60).toString().padStart(2, '0')
  const secs = (whole % 60).toString().padStart(2, '0')
  return `${minutes}:${secs}`
}

function safeHaptic(enabled, style = ImpactStyle.Light) {
  if (!enabled) return
  Haptics.impact({ style }).catch(() => {})
}

export class GameApp {
  constructor(root) {
    this.root = root
    this.board = null
    this.levelNumber = 1
    this.level = null
    this.order = []
    this.history = []
    this.moves = 0
    this.elapsed = 0
    this.timerStartedAt = 0
    this.timerRaf = 0
    this.screen = 'menu'
    this.backButtonHandle = null
    this.appStateHandle = null
    this.pauseOverlay = null
    this.isCompleting = false
    this.progress = this.loadProgress()
    this.settings = this.loadSettings()
    this.audio = new AudioManager({ enabled: this.settings.sound })
  }

  loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')
      return {
        unlocked: Math.max(1, parsed.unlocked || 1),
        stars: parsed.stars || {},
        bestTimes: parsed.bestTimes || {},
      }
    } catch {
      return { unlocked: 1, stars: {}, bestTimes: {} }
    }
  }

  saveProgress() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress))
  }

  loadSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      return {
        sound: parsed.sound ?? true,
        haptics: parsed.haptics ?? true,
        graphics: parsed.graphics ?? 'auto',
      }
    } catch {
      return { sound: true, haptics: true, graphics: 'auto' }
    }
  }

  saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    this.audio.setEnabled(this.settings.sound)
  }

  haptic(style = ImpactStyle.Light) {
    safeHaptic(this.settings.haptics, style)
  }

  mount() {
    this.showMenu()
    installNativeBackHandler(() => this.handleNativeBack()).then((handle) => {
      this.backButtonHandle = handle
    })

    installNativeAppStateHandler(({ isActive }) => {
      if (!isActive && this.screen === 'game') this.showPause()
    }).then((handle) => {
      this.appStateHandle = handle
    })
  }

  destroy() {
    this.stopTimer()
    this.board?.destroy()
    this.backButtonHandle?.remove?.()
    this.appStateHandle?.remove?.()
    this.backButtonHandle = null
    this.appStateHandle = null
  }

  async handleNativeBack() {
    if (this.screen === 'pause') {
      this.resumeFromPause()
      return
    }

    if (this.screen === 'game') {
      this.showPause()
      return
    }

    if (this.screen === 'levels' || this.screen === 'settings') {
      this.showMenu()
      return
    }

    if (this.screen === 'complete') {
      this.showLevelSelect()
      return
    }

    await exitNativeApp()
  }

  shell(content) {
    this.board?.destroy()
    this.board = null
    this.stopTimer()
    this.root.innerHTML = content
  }

  showMenu() {
    this.screen = 'menu'
    this.shell(`
      <main class="screen menu-screen">
        <div class="topbar">
          <button class="icon-button" data-action="settings" aria-label="Settings">⚙</button>
          <div class="coin-pill"><span>★</span><b>${Object.values(this.progress.stars).reduce((a,b)=>a+b,0)}</b></div>
        </div>

        <section class="hero-card">
          <div class="logo">
            <span>STRING</span>
            <strong>SORT</strong>
          </div>
          <p>Untangle · Relax · Solve</p>

          <div class="mini-board" aria-hidden="true">
            <div class="mini-board-disc"></div>
            <span class="mini-rope r1"></span>
            <span class="mini-rope r2"></span>
            <span class="mini-rope r3"></span>
            <span class="mini-rope r4"></span>
          </div>

          <button class="primary-button play-button" data-action="play"><span>▶</span> Play</button>
          <button class="secondary-link" data-action="levels">Level select</button>
        </section>

        <footer class="menu-footer">A little puzzle. A brighter you.</footer>
      </main>
    `)

    this.root.querySelector('[data-action="play"]').onclick = () => this.startLevel(this.progress.unlocked)
    this.root.querySelector('[data-action="levels"]').onclick = () => this.showLevelSelect()
    this.root.querySelector('[data-action="settings"]').onclick = () => this.showSettings()
  }

  showLevelSelect() {
    this.screen = 'levels'
    const cards = Array.from({ length: 30 }, (_, index) => {
      const n = index + 1
      const unlocked = n <= this.progress.unlocked
      const stars = this.progress.stars[n] || 0
      return `
        <button class="level-card ${unlocked ? '' : 'locked'}" data-level="${n}" ${unlocked ? '' : 'disabled'}>
          <b>${unlocked ? n : '🔒'}</b>
          <span>${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span>
        </button>
      `
    }).join('')

    this.shell(`
      <main class="screen levels-screen">
        <header class="page-header">
          <button class="icon-button" data-action="back">‹</button>
          <h1>Levels</h1>
          <div class="coin-pill"><span>★</span><b>${Object.values(this.progress.stars).reduce((a,b)=>a+b,0)}</b></div>
        </header>
        <section class="level-grid">${cards}</section>
      </main>
    `)

    this.root.querySelector('[data-action="back"]').onclick = () => this.showMenu()
    this.root.querySelectorAll('[data-level]').forEach((button) => {
      button.onclick = () => this.startLevel(Number(button.dataset.level))
    })
  }

  startLevel(levelNumber) {
    this.levelNumber = levelNumber
    this.level = createLevel(levelNumber)
    this.order = [...this.level.order]
    this.history = []
    this.moves = 0
    this.elapsed = 0
    this.isCompleting = false
    this.screen = 'game'

    this.shell(`
      <main class="screen game-screen">
        <header class="game-header">
          <button class="icon-button" data-action="pause">Ⅱ</button>
          <div class="level-pill">Level ${levelNumber}</div>
          <div class="coin-pill compact"><span>★</span><b>${this.progress.stars[levelNumber] || 0}</b></div>
        </header>

        <div class="timer-pill">⏱ <strong data-timer>00:00</strong></div>
        ${this.level.tutorial ? `<div class="tutorial-chip">${this.level.tutorial}</div>` : ''}

        <section class="board-wrap">
          <canvas id="game-board" aria-label="String Sort game board"></canvas>
        </section>

        <div class="status-row">
          <div><span>Moves</span><strong data-moves>0</strong></div>
          <div><span>Crossings</span><strong data-crossings>${getCrossingCount(this.order)}</strong></div>
        </div>

        <nav class="game-actions">
          <button class="round-action hint" data-action="hint"><span>💡</span><b>Hint</b></button>
          <button class="round-action undo" data-action="undo"><span>↶</span><b>Undo</b></button>
          <button class="round-action restart" data-action="restart"><span>↻</span><b>Restart</b></button>
        </nav>

        ${createBannerSafeSlot()}
      </main>
    `)

    const canvas = this.root.querySelector('#game-board')
    this.board = new RopeBoard(canvas, {
      onSwap: (from, to) => this.handleSwap(from, to),
      onSolved: () => {},
      graphics: this.settings.graphics,
    })
    this.board.setOrder(this.order, { animate: false })
    this.board.start()

    this.root.querySelector('[data-action="pause"]').onclick = () => this.showPause()
    this.root.querySelector('[data-action="hint"]').onclick = () => this.useHint()
    this.root.querySelector('[data-action="undo"]').onclick = () => this.undo()
    this.root.querySelector('[data-action="restart"]').onclick = () => this.startLevel(this.levelNumber)

    this.startTimer()
  }

  handleSwap(from, to) {
    this.history.push([...this.order])
    ;[this.order[from], this.order[to]] = [this.order[to], this.order[from]]
    this.moves++
    this.board.setOrder(this.order)
    this.updateHud()
    this.haptic()
    this.audio.swap()

    if (getCrossingCount(this.order) === 0 && !this.isCompleting) {
      this.isCompleting = true
      this.haptic(ImpactStyle.Medium)
      setTimeout(() => this.completeLevel(), 380)
    }
  }

  updateHud() {
    const moves = this.root.querySelector('[data-moves]')
    const crossings = this.root.querySelector('[data-crossings]')
    if (moves) moves.textContent = this.moves
    if (crossings) crossings.textContent = getCrossingCount(this.order)
  }

  undo() {
    const previous = this.history.pop()
    if (!previous) return
    this.order = previous
    this.moves = Math.max(0, this.moves - 1)
    this.board.setOrder(this.order)
    this.updateHud()
    this.haptic()
    this.audio.undo()
  }

  useHint() {
    const best = findBestSwap(this.order)
    if (!best) return
    this.board.flashHint(best.from, best.to)
    this.haptic(ImpactStyle.Medium)
    this.audio.hint()
  }

  startTimer() {
    this.timerStartedAt = performance.now() - this.elapsed * 1000
    const tick = () => {
      if (this.screen !== 'game') return
      this.elapsed = (performance.now() - this.timerStartedAt) / 1000
      const el = this.root.querySelector('[data-timer]')
      if (el) el.textContent = formatTime(this.elapsed)
      this.timerRaf = requestAnimationFrame(tick)
    }
    this.timerRaf = requestAnimationFrame(tick)
  }

  stopTimer() {
    cancelAnimationFrame(this.timerRaf)
  }

  showPause() {
    if (this.screen !== 'game') return
    this.screen = 'pause'
    this.stopTimer()

    const overlay = document.createElement('div')
    overlay.className = 'modal-layer'
    overlay.innerHTML = `
      <section class="modal-card">
        <button class="modal-close" data-action="resume">×</button>
        <h2>Paused</h2>
        <button class="primary-button" data-action="resume">▶ Resume</button>
        <button class="modal-option" data-action="restart">↻ Restart</button>
        <button class="modal-option" data-action="menu">⌂ Main menu</button>
      </section>
    `
    this.pauseOverlay = overlay
    this.root.appendChild(overlay)

    overlay.querySelectorAll('[data-action="resume"]').forEach(btn => {
      btn.onclick = () => this.resumeFromPause()
    })
    overlay.querySelector('[data-action="restart"]').onclick = () => this.startLevel(this.levelNumber)
    overlay.querySelector('[data-action="menu"]').onclick = () => this.showMenu()
  }

  resumeFromPause() {
    if (this.screen !== 'pause') return
    this.pauseOverlay?.remove()
    this.pauseOverlay = null
    this.screen = 'game'
    this.startTimer()
  }

  completeLevel() {
    if (this.screen === 'complete') return
    this.stopTimer()
    this.screen = 'complete'

    const timeScore = this.elapsed <= this.level.targetTime ? 1 : 0
    const moveScore = this.moves <= this.level.parMoves ? 1 : 0
    const stars = Math.max(1, 1 + timeScore + moveScore)

    this.progress.stars[this.levelNumber] = Math.max(this.progress.stars[this.levelNumber] || 0, stars)
    const currentBest = this.progress.bestTimes[this.levelNumber]
    if (!currentBest || this.elapsed < currentBest) this.progress.bestTimes[this.levelNumber] = this.elapsed
    this.progress.unlocked = Math.max(this.progress.unlocked, this.levelNumber + 1)
    this.saveProgress()
    this.audio.win()

    const overlay = document.createElement('div')
    overlay.className = 'complete-layer'
    overlay.innerHTML = `
      <div class="confetti" aria-hidden="true"></div>
      <section class="complete-card">
        <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
        <div class="ribbon">Great!</div>
        <h2>Level ${this.levelNumber} Complete!</h2>
        <p>${formatTime(this.elapsed)} · ${this.moves} moves</p>
        <button class="primary-button" data-action="next">▶ Next</button>
        <button class="secondary-link" data-action="levels">Levels</button>
      </section>
    `
    this.root.appendChild(overlay)

    overlay.querySelector('[data-action="next"]').onclick = () => this.startLevel(this.levelNumber + 1)
    overlay.querySelector('[data-action="levels"]').onclick = () => this.showLevelSelect()
  }

  showSettings() {
    this.shell(`
      <main class="screen settings-screen">
        <header class="page-header">
          <button class="icon-button" data-action="back">‹</button>
          <h1>Settings</h1>
          <span></span>
        </header>
        <section class="settings-card">
          <div>
            <span>Haptics</span>
            <button class="setting-toggle" data-setting="haptics" aria-pressed="${this.settings.haptics}">
              ${this.settings.haptics ? 'On' : 'Off'}
            </button>
          </div>
          <div>
            <span>Sound</span>
            <button class="setting-toggle" data-setting="sound" aria-pressed="${this.settings.sound}">
              ${this.settings.sound ? 'On' : 'Off'}
            </button>
          </div>
          <div>
            <span>Graphics</span>
            <button class="setting-toggle graphics-toggle" data-setting="graphics">
              ${graphicsLabel(this.settings.graphics)}
            </button>
          </div>
        </section>
      </main>
    `)

    this.root.querySelector('[data-action="back"]').onclick = () => {
      this.audio.tap()
      this.showMenu()
    }

    this.root.querySelectorAll('[data-setting]').forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.setting

        if (key === 'graphics') {
          this.settings.graphics = nextGraphicsOption(this.settings.graphics)
          this.saveSettings()
          button.textContent = graphicsLabel(this.settings.graphics)
          this.audio.tap()
          return
        }

        this.settings[key] = !this.settings[key]
        this.saveSettings()
        button.textContent = this.settings[key] ? 'On' : 'Off'
        button.setAttribute('aria-pressed', String(this.settings[key]))
        if (key === 'sound' && this.settings.sound) this.audio.tap()
        if (key === 'haptics' && this.settings.haptics) this.haptic()
      }
    })
  }
}
