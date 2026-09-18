import { ROPE_COLORS, getCrossingCount } from './levels.js'

const TAU = Math.PI * 2

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export class RopeBoard {
  constructor(canvas, { onSwap, onSolved }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })
    this.onSwap = onSwap
    this.onSolved = onSolved
    this.order = []
    this.dragIndex = -1
    this.dragPoint = null
    this.hoverIndex = -1
    this.hint = null
    this.hintUntil = 0
    this.animations = new Map()
    this.running = false
    this.raf = 0

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.resize = this.resize.bind(this)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  setOrder(order, { animate = true } = {}) {
    const previous = this.order
    this.order = [...order]

    if (animate && previous.length === order.length) {
      order.forEach((ropeId, index) => {
        const oldIndex = previous.indexOf(ropeId)
        if (oldIndex !== -1 && oldIndex !== index) {
          this.animations.set(index, { started: performance.now(), fromIndex: oldIndex })
        }
      })
    }
  }

  flashHint(from, to) {
    this.hint = { from, to }
    this.hintUntil = performance.now() + 2200
  }

  start() {
    if (this.running) return
    this.running = true
    const tick = (time) => {
      if (!this.running) return
      this.draw(time)
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  destroy() {
    this.stop()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointercancel', this.onPointerUp)
    window.removeEventListener('resize', this.resize)
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  geometry() {
    const rect = this.canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const size = Math.min(width, height)
    const cx = width / 2
    const cy = height / 2 + size * 0.015
    const boardRadius = size * 0.41
    const socketRadius = clamp(size * 0.035, 14, 24)
    return { width, height, size, cx, cy, boardRadius, socketRadius }
  }

  socketPosition(index) {
    const g = this.geometry()
    const count = this.order.length || 1
    const angle = -Math.PI / 2 + (index / count) * TAU
    const radius = g.boardRadius * 0.86
    return {
      x: g.cx + Math.cos(angle) * radius,
      y: g.cy + Math.sin(angle) * radius,
      angle,
    }
  }

  findSocket(x, y, multiplier = 1.65) {
    const g = this.geometry()
    let nearest = -1
    let nearestDistance = Infinity

    for (let i = 0; i < this.order.length; i++) {
      const p = this.socketPosition(i)
      const distance = Math.hypot(x - p.x, y - p.y)
      if (distance < g.socketRadius * multiplier && distance < nearestDistance) {
        nearest = i
        nearestDistance = distance
      }
    }

    return nearest
  }

  eventPoint(event) {
    const rect = this.canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  onPointerDown(event) {
    const point = this.eventPoint(event)
    const index = this.findSocket(point.x, point.y)
    if (index < 0) return

    this.dragIndex = index
    this.dragPoint = point
    this.hoverIndex = index
    this.canvas.setPointerCapture(event.pointerId)
  }

  onPointerMove(event) {
    if (this.dragIndex < 0) return
    const point = this.eventPoint(event)
    this.dragPoint = point
    this.hoverIndex = this.findSocket(point.x, point.y, 2)
  }

  onPointerUp(event) {
    if (this.dragIndex < 0) return

    const from = this.dragIndex
    const point = this.eventPoint(event)
    const to = this.findSocket(point.x, point.y, 2.15)

    this.dragIndex = -1
    this.dragPoint = null
    this.hoverIndex = -1

    if (to >= 0 && to !== from) {
      this.onSwap?.(from, to)
      if (getCrossingCount(this.order) === 0) this.onSolved?.()
    }
  }

  roundedPath(points, radius = 22) {
    const ctx = this.ctx
    if (points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      ctx.arcTo(current.x, current.y, next.x, next.y, radius)
    }
    const last = points[points.length - 1]
    ctx.lineTo(last.x, last.y)
  }

  ropeEndpoints(ropeId) {
    const indexes = []
    this.order.forEach((id, index) => {
      if (id === ropeId) indexes.push(index)
    })
    if (indexes.length !== 2) return null

    return indexes.map((index) => {
      if (index === this.dragIndex && this.dragPoint) return this.dragPoint
      return this.socketPosition(index)
    })
  }

  drawBoard(g) {
    const ctx = this.ctx

    ctx.save()
    ctx.shadowColor = 'rgba(52, 35, 23, 0.26)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 12

    const boardGradient = ctx.createRadialGradient(
      g.cx - g.boardRadius * 0.28,
      g.cy - g.boardRadius * 0.34,
      g.boardRadius * 0.12,
      g.cx,
      g.cy,
      g.boardRadius,
    )
    boardGradient.addColorStop(0, '#424955')
    boardGradient.addColorStop(0.58, '#2d323b')
    boardGradient.addColorStop(1, '#20242c')

    ctx.fillStyle = boardGradient
    ctx.beginPath()

    const teeth = 24
    for (let i = 0; i <= teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * TAU
      const radius = g.boardRadius * (i % 2 === 0 ? 1 : 0.965)
      const x = g.cx + Math.cos(angle) * radius
      const y = g.cy + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,.06)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, g.boardRadius * 0.92, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }

  drawRope(ropeId, time) {
    const endpoints = this.ropeEndpoints(ropeId)
    if (!endpoints) return

    const [a, b] = endpoints
    const g = this.geometry()
    const ctx = this.ctx
    const color = ROPE_COLORS[ropeId % ROPE_COLORS.length]

    const dx = b.x - a.x
    const dy = b.y - a.y
    const length = Math.hypot(dx, dy)
    const nx = length ? -dy / length : 0
    const ny = length ? dx / length : 0
    const sway = Math.sin(time * 0.0025 + ropeId * 1.7) * Math.min(5, length * 0.012)

    const knotBias = (ropeId - (this.order.length / 2)) * 0.7
    const center = {
      x: g.cx + nx * (sway + knotBias),
      y: g.cy + ny * (sway + knotBias),
    }

    const points = [
      a,
      { x: lerp(a.x, center.x, 0.58), y: lerp(a.y, center.y, 0.58) },
      center,
      { x: lerp(center.x, b.x, 0.58), y: lerp(center.y, b.y, 0.58) },
      b,
    ]

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    this.roundedPath(points, 26)
    ctx.strokeStyle = 'rgba(0,0,0,.32)'
    ctx.lineWidth = clamp(g.size * 0.022, 8, 14)
    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 4
    ctx.stroke()

    ctx.shadowColor = 'transparent'
    this.roundedPath(points, 26)
    ctx.strokeStyle = color
    ctx.lineWidth = clamp(g.size * 0.017, 6, 11)
    ctx.stroke()

    this.roundedPath(points, 26)
    ctx.strokeStyle = 'rgba(255,255,255,.36)'
    ctx.lineWidth = clamp(g.size * 0.004, 1.5, 3)
    ctx.setLineDash([3, 7])
    ctx.lineDashOffset = -time * 0.015
    ctx.stroke()
    ctx.restore()
  }

  drawPeg(index, time) {
    const g = this.geometry()
    const ctx = this.ctx
    const position = index === this.dragIndex && this.dragPoint
      ? this.dragPoint
      : this.socketPosition(index)
    const ropeId = this.order[index]
    const color = ROPE_COLORS[ropeId % ROPE_COLORS.length]

    let scale = index === this.dragIndex ? 1.16 : 1
    if (this.hint && performance.now() < this.hintUntil) {
      if (index === this.hint.from || index === this.hint.to) {
        scale += 0.09 + Math.sin(time * 0.012) * 0.06
      }
    }

    if (index === this.hoverIndex && this.dragIndex >= 0) scale += 0.08

    const r = g.socketRadius * scale
    ctx.save()

    ctx.fillStyle = 'rgba(0,0,0,.45)'
    ctx.beginPath()
    ctx.arc(position.x, position.y + r * 0.15, r * 1.15, 0, TAU)
    ctx.fill()

    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 5

    const grad = ctx.createRadialGradient(
      position.x - r * 0.35,
      position.y - r * 0.45,
      r * 0.12,
      position.x,
      position.y,
      r,
    )
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.06, color)
    grad.addColorStop(0.7, color)
    grad.addColorStop(1, '#14181d')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(position.x, position.y, r, 0, TAU)
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = 'rgba(255,255,255,.32)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(position.x - r * 0.08, position.y - r * 0.12, r * 0.67, Math.PI * 1.1, Math.PI * 1.8)
    ctx.stroke()

    ctx.fillStyle = 'rgba(24,26,31,.72)'
    ctx.beginPath()
    ctx.arc(position.x, position.y, r * 0.26, 0, TAU)
    ctx.fill()

    ctx.restore()
  }

  drawCenterKnot(g, time) {
    const ctx = this.ctx
    const crossings = getCrossingCount(this.order)
    const pulse = crossings === 0 ? 1 + Math.sin(time * 0.01) * 0.05 : 1
    const r = g.socketRadius * 1.08 * pulse

    ctx.save()
    ctx.shadowColor = crossings === 0 ? 'rgba(98, 233, 111, .65)' : 'rgba(0,0,0,.4)'
    ctx.shadowBlur = crossings === 0 ? 20 : 8
    ctx.fillStyle = crossings === 0 ? '#7ee36c' : '#f7f3e8'
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, r, 0, TAU)
    ctx.fill()

    ctx.fillStyle = '#353941'
    ctx.beginPath()
    ctx.moveTo(g.cx, g.cy - r * 0.48)
    ctx.lineTo(g.cx + r * 0.48, g.cy + r * 0.38)
    ctx.lineTo(g.cx - r * 0.48, g.cy + r * 0.38)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  draw(time = 0) {
    const ctx = this.ctx
    const g = this.geometry()
    ctx.clearRect(0, 0, g.width, g.height)

    this.drawBoard(g)

    const ropeIds = [...new Set(this.order)]
    ropeIds.forEach((ropeId) => this.drawRope(ropeId, time))
    this.order.forEach((_, index) => this.drawPeg(index, time))
    this.drawCenterKnot(g, time)

    if (this.hint && performance.now() > this.hintUntil) this.hint = null
  }
}
