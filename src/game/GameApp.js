import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { RopeBoard } from './RopeBoard.js'
import { AudioManager } from './AudioManager.js'
import { graphicsLabel, nextGraphicsOption } from './PerformanceProfile.js'
import { exitNativeApp, installNativeAppStateHandler, installNativeBackHandler } from './NativeNavigation.js'
import { TOTAL_LEVELS, createLevel, findBestSwap, getCrossingCount } from './levels.js'
import { createBannerSafeSlot } from './MonetizationLayout.js'
import { normalizeProgress, normalizeSettings, safeReadJson, safeWriteJson } from './SaveData.js'
import { APP_VERSION, privacySummary } from './AppInfo.js'
import { uiIcon } from '../ui/icons.js'
import { installMenuPreview } from '../ui/MenuPreview.js'

const SAVE_KEY = 'string-sort-progress-v1'
const SETTINGS_KEY = 'string-sort-settings-v1'

const LEVEL_CHAPTERS = [
  { title: 'First Knots', subtitle: 'Learn the empty-socket rhythm', start: 1, end: 20 },
  { title: 'Twist Lab', subtitle: 'More ropes, tighter turns', start: 21, end: 40 },
  { title: 'Tangle Garden', subtitle: 'Dense colorful bundles', start: 41, end: 60 },
  { title: 'Knot Works', subtitle: 'Double wraps and longer routes', start: 61, end: 80 },
  { title: 'Master Board', subtitle: 'The hardest tangles', start: 81, end: 100 },
]

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
    this.tutorialHintTimer = 0
    this.completionTimer = 0
    this.feedbackTimer = 0
    this.menuPreviewCleanup = null
    this.levelChapter = 0
    this.screen = 'menu'
    this.backButtonHandle = null
    this.appStateHandle = null
    this.pauseOverlay = null
    this.isCompleting = false
    this.onVisibilityChange = () => {
      if (document.hidden && this.screen === 'game') this.showPause()
    }
    this.progress = this.loadProgress()
    this.settings = this.loadSettings()
    this.audio = new AudioManager({ enabled: this.settings.sound })
  }

  loadProgress() {
    const parsed = safeReadJson(localStorage, SAVE_KEY, {})
    return normalizeProgress(parsed, TOTAL_LEVELS)
  }

  saveProgress() {
    this.progress = normalizeProgress(this.progress, TOTAL_LEVELS)
    return safeWriteJson(localStorage, SAVE_KEY, this.progress)
  }

  loadSettings() {
    const parsed = safeReadJson(localStorage, SETTINGS_KEY, {})
    return normalizeSettings(parsed)
  }

  saveSettings() {
    this.settings = normalizeSettings(this.settings)
    const saved = safeWriteJson(localStorage, SETTINGS_KEY, this.settings)
    this.audio.setEnabled(this.settings.sound)
    return saved
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

    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  destroy() {
    this.stopTimer()
    clearTimeout(this.tutorialHintTimer)
    clearTimeout(this.completionTimer)
    clearTimeout(this.feedbackTimer)
    this.board?.destroy()
    this.menuPreviewCleanup?.()
    this.menuPreviewCleanup = null
    this.backButtonHandle?.remove?.()
    this.appStateHandle?.remove?.()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
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
    this.menuPreviewCleanup?.()
    this.menuPreviewCleanup = null
    this.stopTimer()
    clearTimeout(this.tutorialHintTimer)
    clearTimeout(this.completionTimer)
    clearTimeout(this.feedbackTimer)
    this.tutorialHintTimer = 0
    this.completionTimer = 0
    this.feedbackTimer = 0
    this.root.innerHTML = content
  }

  showMenu() {
    this.screen = 'menu'
    const totalStars = Object.values(this.progress.stars).reduce((a, b) => a + b, 0)

    this.shell(`
      <main class="screen menu-screen">
        <div class="topbar">
          <button class="icon-button soft-icon" data-action="settings" aria-label="Settings">
            ${uiIcon('settings')}
          </button>
          <div class="coin-pill">${uiIcon('levels', 'ui-svg coin-star')}<b>${totalStars}</b></div>
        </div>

        <section class="hero-card">
          <div class="logo logo-polished">
            <span>STRING</span>
            <strong>SORT</strong>
          </div>
          <p class="menu-tagline">Untangle · Sort · Feel Good</p>

          <div class="mini-board video-board-preview" aria-hidden="true">
            <canvas class="menu-preview-canvas" data-menu-preview></canvas>
          </div>

          <div class="resume-label">Level ${this.progress.unlocked} of ${TOTAL_LEVELS}</div>
          <button class="primary-button play-button glossy-play" data-action="play">
            ${uiIcon('play', 'ui-svg play-svg')}
            <span>${this.progress.unlocked > 1 ? 'Continue' : 'Play'}</span>
          </button>

          <div class="menu-action-grid">
            <button class="menu-action-card" data-action="levels">
              <span class="menu-action-icon levels-icon">${uiIcon('levels')}</span>
              <b>Levels</b>
            </button>
            <button class="menu-action-card" data-action="settings">
              <span class="menu-action-icon settings-icon">${uiIcon('settings')}</span>
              <b>Settings</b>
            </button>
            <button class="menu-action-card" data-action="how-to-play">
              <span class="menu-action-icon hint-icon">${uiIcon('hint')}</span>
              <b>How to Play</b>
            </button>
          </div>
        </section>

        <footer class="menu-footer">Puzzles for a brighter day</footer>
      </main>
    `)

    this.menuPreviewCleanup = installMenuPreview(
      this.root.querySelector('[data-menu-preview]'),
    )

    this.root.querySelector('[data-action="play"]').onclick = () => this.startLevel(this.progress.unlocked)
    this.root.querySelector('[data-action="levels"]').onclick = () => this.showLevelSelect()
    this.root.querySelectorAll('[data-action="settings"]').forEach((button) => {
      button.onclick = () => this.showSettings()
    })
    this.root.querySelector('[data-action="how-to-play"]').onclick = () => this.showHowToPlay()
  }

  showLevelSelect(chapterIndex = null) {
    this.screen = 'levels'

    const currentChapter = Math.min(
      LEVEL_CHAPTERS.length - 1,
      Math.floor((Math.max(1, this.progress.unlocked) - 1) / 20),
    )
    this.levelChapter = chapterIndex == null
      ? currentChapter
      : Math.min(LEVEL_CHAPTERS.length - 1, Math.max(0, chapterIndex))

    const chapter = LEVEL_CHAPTERS[this.levelChapter]
    const chapterLevels = Array.from(
      { length: chapter.end - chapter.start + 1 },
      (_, index) => chapter.start + index,
    )

    const cards = chapterLevels.map((n) => {
      const unlocked = n <= this.progress.unlocked
      const stars = this.progress.stars[n] || 0
      const level = unlocked ? createLevel(n) : null
      const knots = level ? getCrossingCount(level.order) : 0

      return `
        <button
          class="level-card chapter-tone-${this.levelChapter} ${unlocked ? '' : 'locked'} ${n === this.progress.unlocked ? 'current' : ''}"
          data-level="${n}"
          aria-label="Level ${n}${unlocked ? '' : ', locked'}"
          ${unlocked ? '' : 'disabled'}
        >
          <div class="level-card-top">
            <b>${n}</b>
            ${unlocked
              ? `<small>${knots} knot${knots === 1 ? '' : 's'}</small>`
              : '<small>Locked</small>'}
          </div>
          <span class="level-mini-preview tone-${n % 6} ${unlocked ? '' : 'locked-preview'}" aria-hidden="true">
            <i class="preview-thread thread-a"></i>
            <i class="preview-thread thread-b"></i>
            <i class="preview-dot dot-a"></i>
            <i class="preview-dot dot-b"></i>
            <i class="preview-dot dot-c"></i>
            <i class="preview-dot dot-d"></i>
          </span>
          ${unlocked ? '' : `<span class="level-lock-badge">${uiIcon('lock', 'ui-svg level-lock-svg')}</span>`}
          <span class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span>
        </button>
      `
    }).join('')

    const tabs = LEVEL_CHAPTERS.map((item, index) => {
      const unlocked = item.start <= this.progress.unlocked
      return `
        <button
          class="chapter-tab ${index === this.levelChapter ? 'active' : ''}"
          data-chapter="${index}"
          ${unlocked ? '' : 'disabled'}
          aria-label="${item.title}${unlocked ? '' : ', locked'}"
        >
          <span>${index + 1}</span>
          <b>${item.title}</b>
        </button>
      `
    }).join('')

    this.shell(`
      <main class="screen levels-screen">
        <header class="page-header">
          <button class="icon-button soft-icon" data-action="back" aria-label="Back">${uiIcon('back')}</button>
          <div class="level-page-title">
            <h1>Levels</h1>
            <p>${chapter.subtitle}</p>
          </div>
          <div class="coin-pill">${uiIcon('levels', 'ui-svg coin-star')}<b>${Object.values(this.progress.stars).reduce((a,b)=>a+b,0)}</b></div>
        </header>

        <nav class="chapter-tabs" aria-label="Level chapters">${tabs}</nav>

        <section class="chapter-banner chapter-tone-${this.levelChapter}">
          <span class="chapter-number">Chapter ${this.levelChapter + 1}</span>
          <div>
            <h2>${chapter.title}</h2>
            <p>Levels ${chapter.start}–${chapter.end}</p>
          </div>
          <strong>${Math.min(
            chapter.end - chapter.start + 1,
            Math.max(0, this.progress.unlocked - chapter.start + 1),
          )}/${chapter.end - chapter.start + 1}</strong>
        </section>

        <section class="level-grid chapter-grid">${cards}</section>
      </main>
    `)

    this.root.querySelector('[data-action="back"]').onclick = () => this.showMenu()
    this.root.querySelectorAll('[data-level]').forEach((button) => {
      button.onclick = () => this.startLevel(Number(button.dataset.level))
    })
    this.root.querySelectorAll('[data-chapter]').forEach((button) => {
      button.onclick = () => this.showLevelSelect(Number(button.dataset.chapter))
    })

    requestAnimationFrame(() => {
      this.root
        .querySelector(`[data-level="${this.progress.unlocked}"]`)
        ?.scrollIntoView({ block: 'center' })
    })
  }

  startLevel(levelNumber) {
    const normalizedLevel = Math.min(TOTAL_LEVELS, Math.max(1, levelNumber))
    this.levelNumber = normalizedLevel
    this.level = createLevel(normalizedLevel)
    this.order = [...this.level.order]
    this.history = []
    this.moves = 0
    this.elapsed = 0
    this.isCompleting = false
    this.screen = 'game'

    this.shell(`
      <main class="screen game-screen">
        <header class="game-header">
          <button class="icon-button soft-icon" data-action="pause" aria-label="Pause">${uiIcon('pause')}</button>
          <div class="level-pill">Level ${this.levelNumber}</div>
          <div class="timer-pill compact-timer">${uiIcon('timer')} <strong data-timer>00:00</strong></div>
        </header>

        <div class="game-objective">Untie all the knots</div>
        ${this.level.tutorial ? `<div class="tutorial-chip" data-tutorial>${this.level.tutorial}</div>` : ''}

        <section class="board-wrap board-wrap-video">
          <canvas id="game-board" aria-label="String Sort game board"></canvas>
        </section>

        <div class="status-row video-status">
          <div>
            <span class="status-icon">${uiIcon('moves')}</span>
            <span>Moves</span>
            <strong data-moves>0</strong>
          </div>
          <div data-crossing-card>
            <span class="status-icon">${uiIcon('crossings')}</span>
            <span>Knots</span>
            <strong data-crossings>${getCrossingCount(this.order)}</strong>
          </div>
        </div>

        <nav class="game-actions video-actions">
          <button class="round-action hint" data-action="hint">
            <span>${uiIcon('hint')}</span><b>Hint</b>
          </button>
          <button class="round-action undo" data-action="undo">
            <span>${uiIcon('undo')}</span><b>Undo</b>
          </button>
          <button class="round-action restart" data-action="restart">
            <span>${uiIcon('restart')}</span><b>Restart</b>
          </button>
        </nav>

        ${createBannerSafeSlot()}
      </main>
    `)

    const canvas = this.root.querySelector('#game-board')
    this.board = new RopeBoard(canvas, {
      onSwap: (from, to) => this.handleSwap(from, to),
      onSolved: () => {},
      graphics: this.settings.graphics,
      pegMarkers: this.settings.pegMarkers,
    })
    this.board.setOrder(this.order, { animate: false })
    this.board.start()

    this.root.querySelector('[data-action="pause"]').onclick = () => this.showPause()
    this.root.querySelector('[data-action="hint"]').onclick = () => this.useHint()
    this.root.querySelector('[data-action="undo"]').onclick = () => this.undo()
    this.root.querySelector('[data-action="restart"]').onclick = () => this.startLevel(this.levelNumber)

    this.startTimer()

    if (this.level.initialHint) {
      this.tutorialHintTimer = setTimeout(() => {
        if (this.screen !== 'game' || this.moves !== 0 || !this.board) return
        this.board.flashHint(this.level.initialHint.from, this.level.initialHint.to)
      }, 650)
    }
  }

  handleSwap(from, to) {
    if (
      this.isCompleting
      || this.order[from] == null
      || this.order[to] != null
    ) {
      return
    }

    clearTimeout(this.tutorialHintTimer)
    this.tutorialHintTimer = 0

    const tutorial = this.root.querySelector('[data-tutorial]')
    if (tutorial) {
      tutorial.classList.add('is-dismissed')
      setTimeout(() => tutorial.remove(), 220)
    }

    const previousCrossings = getCrossingCount(this.order)
    this.history.push([...this.order])
    ;[this.order[from], this.order[to]] = [this.order[to], this.order[from]]
    this.moves++
    this.board.setOrder(this.order)
    const currentCrossings = getCrossingCount(this.order)
    this.updateHud()
    this.showCrossingFeedback(previousCrossings, currentCrossings)

    if (currentCrossings < previousCrossings) {
      this.haptic(ImpactStyle.Medium)
      this.audio.knotRelease(previousCrossings - currentCrossings)
    } else {
      this.haptic()
      this.audio.swap()
    }

    if (currentCrossings === 0 && !this.isCompleting) {
      this.isCompleting = true
      this.haptic(ImpactStyle.Medium)
      this.completionTimer = setTimeout(() => {
        if (this.screen === 'game') this.completeLevel()
      }, 650)
    }
  }

  updateHud() {
    const moves = this.root.querySelector('[data-moves]')
    const crossings = this.root.querySelector('[data-crossings]')
    if (moves) moves.textContent = this.moves
    if (crossings) crossings.textContent = getCrossingCount(this.order)
  }

  showCrossingFeedback(previousCrossings, currentCrossings) {
    const card = this.root.querySelector('[data-crossing-card]')
    if (!card || previousCrossings === currentCrossings) return

    clearTimeout(this.feedbackTimer)
    card.classList.remove('stat-improved', 'stat-worse')
    void card.offsetWidth
    card.classList.add(
      currentCrossings < previousCrossings ? 'stat-improved' : 'stat-worse',
    )

    this.feedbackTimer = setTimeout(() => {
      card.classList.remove('stat-improved', 'stat-worse')
      this.feedbackTimer = 0
    }, 520)
  }

  undo() {
    if (this.isCompleting) {
      clearTimeout(this.completionTimer)
      this.completionTimer = 0
      this.isCompleting = false
    }

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
    if (this.isCompleting) return
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
    this.board?.stop()
    clearTimeout(this.completionTimer)
    this.completionTimer = 0

    const overlay = document.createElement('div')
    overlay.className = 'modal-layer'
    overlay.innerHTML = `
      <section class="modal-card">
        <button class="modal-close" data-action="resume">×</button>
        <h2>Paused</h2>
        <button class="primary-button" data-action="resume">${uiIcon('play')} Resume</button>
        <button class="modal-option" data-action="restart">${uiIcon('restart')} Restart</button>
        <button class="modal-option" data-action="menu">${uiIcon('home')} Main menu</button>
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
    this.board?.start()
    this.startTimer()

    if (this.isCompleting && getCrossingCount(this.order) === 0) {
      this.completionTimer = setTimeout(() => {
        if (this.screen === 'game') this.completeLevel()
      }, 160)
    }
  }

  completeLevel() {
    if (this.screen === 'complete') return

    clearTimeout(this.completionTimer)
    this.completionTimer = 0

    if (getCrossingCount(this.order) !== 0) {
      this.isCompleting = false
      return
    }

    this.stopTimer()
    this.board?.stop()
    this.screen = 'complete'

    const timeScore = this.elapsed <= this.level.targetTime ? 1 : 0
    const moveScore = this.moves <= this.level.parMoves ? 1 : 0
    const stars = Math.max(1, 1 + timeScore + moveScore)

    this.progress.stars[this.levelNumber] = Math.max(this.progress.stars[this.levelNumber] || 0, stars)
    const currentBest = this.progress.bestTimes[this.levelNumber]
    if (!currentBest || this.elapsed < currentBest) this.progress.bestTimes[this.levelNumber] = this.elapsed
    this.progress.unlocked = Math.min(
      TOTAL_LEVELS,
      Math.max(this.progress.unlocked, this.levelNumber + 1),
    )
    this.saveProgress()
    this.audio.win()

    const hasNextLevel = this.levelNumber < TOTAL_LEVELS
    const overlay = document.createElement('div')
    overlay.className = 'complete-layer'
    overlay.innerHTML = `
      <div class="confetti" aria-hidden="true"></div>
      <section class="complete-card">
        <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
        <div class="ribbon">Great!</div>
        <h2>Level ${this.levelNumber} Complete!</h2>
        <p>${formatTime(this.elapsed)} · ${this.moves} moves</p>
        <button class="primary-button" data-action="next">
          ${hasNextLevel ? uiIcon('play') : uiIcon('levels')}
          ${hasNextLevel ? 'Next' : 'Levels'}
        </button>
        <button class="secondary-link" data-action="levels">${uiIcon('levels')} Levels</button>
      </section>
    `
    this.root.appendChild(overlay)

    overlay.querySelector('[data-action="next"]').onclick = () => {
      if (hasNextLevel) this.startLevel(this.levelNumber + 1)
      else this.showLevelSelect()
    }
    overlay.querySelector('[data-action="levels"]').onclick = () => this.showLevelSelect()
  }

  showHowToPlay() {
    const overlay = document.createElement('div')
    overlay.className = 'modal-layer'
    overlay.innerHTML = `
      <section class="modal-card how-to-card">
        <button class="modal-close" data-action="close" aria-label="Close">×</button>
        <h2>How to Play</h2>
        <div class="how-to-steps">
          <div>
            <span class="how-step-icon">${uiIcon('moves')}</span>
            <b>Move one peg</b>
            <p>Drag a colored peg into the single empty socket.</p>
          </div>
          <div>
            <span class="how-step-icon">${uiIcon('crossings')}</span>
            <b>Untie the ropes</b>
            <p>The old peg position becomes the next empty socket.</p>
          </div>
          <div>
            <span class="how-step-icon">${uiIcon('levels')}</span>
            <b>Clear every crossing</b>
            <p>Move the free peg until every physical knot releases.</p>
          </div>
        </div>
        <button class="primary-button" data-action="close">${uiIcon('play')} Got it</button>
      </section>
    `
    this.root.appendChild(overlay)
    overlay.querySelectorAll('[data-action="close"]').forEach((button) => {
      button.onclick = () => overlay.remove()
    })
  }

  showSettings() {
    this.shell(`
      <main class="screen settings-screen">
        <header class="page-header">
          <button class="icon-button soft-icon" data-action="back" aria-label="Back">${uiIcon('back')}</button>
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
          <div>
            <span>Peg markers</span>
            <button class="setting-toggle" data-setting="pegMarkers" aria-pressed="${this.settings.pegMarkers}">
              ${this.settings.pegMarkers ? 'On' : 'Off'}
            </button>
          </div>
          <div>
            <span>About</span>
            <button class="setting-toggle neutral-toggle" data-action="about">Open</button>
          </div>
          <div>
            <span>Progress</span>
            <button class="setting-toggle danger-toggle" data-action="reset-progress">Reset</button>
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

    this.root.querySelector('[data-action="about"]').onclick = () => this.showAbout()
    this.root.querySelector('[data-action="reset-progress"]').onclick = () => this.confirmResetProgress()
  }

  showAbout() {
    const overlay = document.createElement('div')
    overlay.className = 'modal-layer'
    overlay.innerHTML = `
      <section class="modal-card about-card">
        <button class="modal-close" data-action="close" aria-label="Close">×</button>
        <h2>String Sort</h2>
        <p class="version-label">Version ${APP_VERSION}</p>
        <div class="privacy-summary">
          ${privacySummary().map((line) => `<p>• ${line}</p>`).join('')}
        </div>
        <button class="modal-option" data-action="privacy">Privacy details</button>
        <button class="primary-button" data-action="close">Done</button>
      </section>
    `

    this.root.appendChild(overlay)

    overlay.querySelectorAll('[data-action="close"]').forEach((button) => {
      button.onclick = () => overlay.remove()
    })

    overlay.querySelector('[data-action="privacy"]').onclick = () => {
      window.open('/privacy.html', '_blank', 'noopener,noreferrer')
    }
  }

  confirmResetProgress() {
    const overlay = document.createElement('div')
    overlay.className = 'modal-layer'
    overlay.innerHTML = `
      <section class="modal-card">
        <h2>Reset progress?</h2>
        <p class="modal-copy">Stars, best times and unlocked levels on this device will be cleared.</p>
        <button class="modal-option danger-option" data-action="confirm">Reset progress</button>
        <button class="primary-button" data-action="cancel">Keep progress</button>
      </section>
    `

    this.root.appendChild(overlay)
    overlay.querySelector('[data-action="cancel"]').onclick = () => overlay.remove()
    overlay.querySelector('[data-action="confirm"]').onclick = () => {
      this.progress = normalizeProgress({}, TOTAL_LEVELS)
      this.saveProgress()
      this.haptic(ImpactStyle.Medium)
      overlay.remove()
      this.showSettings()
    }
  }
}
