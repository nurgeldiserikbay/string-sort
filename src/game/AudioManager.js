export class AudioManager {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled
    this.context = null
    this.master = null
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled)
  }

  ensureContext() {
    if (!this.enabled) return null

    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return null

      this.context = new AudioContextClass()
      this.master = this.context.createGain()
      this.master.gain.value = 0.2
      this.master.connect(this.context.destination)
    }

    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {})
    }

    return this.context
  }

  tone({
    frequency = 440,
    duration = 0.08,
    type = 'sine',
    gain = 0.12,
    slideTo = null,
    delay = 0,
  } = {}) {
    const context = this.ensureContext()
    if (!context || !this.master) return

    const start = context.currentTime + delay
    const end = start + duration

    const oscillator = context.createOscillator()
    const envelope = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), end)
    }

    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + Math.min(0.018, duration * 0.3))
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(envelope)
    envelope.connect(this.master)

    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }

  tap() {
    this.tone({ frequency: 520, duration: 0.045, type: 'triangle', gain: 0.06, slideTo: 610 })
  }

  swap() {
    this.tone({ frequency: 330, duration: 0.08, type: 'sine', gain: 0.075, slideTo: 460 })
    this.tone({ frequency: 510, duration: 0.07, type: 'triangle', gain: 0.045, slideTo: 620, delay: 0.035 })
  }

  hint() {
    this.tone({ frequency: 660, duration: 0.09, type: 'sine', gain: 0.07 })
    this.tone({ frequency: 880, duration: 0.12, type: 'sine', gain: 0.06, delay: 0.08 })
  }

  undo() {
    this.tone({ frequency: 430, duration: 0.08, type: 'triangle', gain: 0.06, slideTo: 300 })
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((frequency, index) => {
      this.tone({
        frequency,
        duration: 0.18,
        type: 'sine',
        gain: 0.08,
        delay: index * 0.09,
      })
    })
  }
}
