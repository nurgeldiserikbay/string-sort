import { ROPE_COLORS, getCrossingCount } from './levels.js'
import { RopePhysics } from './RopePhysics.js'
import { stableDepthOrder, topRopeAtContact } from './RopeTopology.js'
import { resolvePerformanceProfile } from './PerformanceProfile.js'

const TAU = Math.PI * 2

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export class RopeBoard {
  constructor(canvas, { onSwap, onSolved, graphics = 'auto' }) {
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
    this.running = false
    this.raf = 0
    this.depthSeed = 0x51f15e
    this.performanceProfile = resolvePerformanceProfile(graphics)
    this.physics = new RopePhysics({
      damping: 0.982,
      gravity: 24,
      constraintIterations: this.performanceProfile.constraintIterations,
    })

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

  setOrder(order) {
    const topologyChanged = this.order.length !== order.length
    this.order = [...order]

    if (topologyChanged) {
      this.depthSeed = (0x51f15e ^ Math.imul(order.length + 1, 0x9e3779b1)) >>> 0
      this.physics.clear()
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
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      this.performanceProfile.dprCap,
    )
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.physics.clear()
  }

  geometry() {
    const rect = this.canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const size = Math.min(width, height)
    const cx = width / 2
    const cy = height / 2 + size * 0.012
    const boardRadius = size * 0.415
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

    for (let index = 0; index < this.order.length; index++) {
      const position = this.socketPosition(index)
      const currentDistance = Math.hypot(x - position.x, y - position.y)
      if (
        currentDistance < g.socketRadius * multiplier
        && currentDistance < nearestDistance
      ) {
        nearest = index
        nearestDistance = currentDistance
      }
    }

    return nearest
  }

  eventPoint(event) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  onPointerDown(event) {
    const point = this.eventPoint(event)
    const index = this.findSocket(point.x, point.y)
    if (index < 0) return

    this.dragIndex = index
    this.dragPoint = point
    this.hoverIndex = index
    this.canvas.setPointerCapture?.(event.pointerId)
  }

  onPointerMove(event) {
    if (this.dragIndex < 0) return

    this.dragPoint = this.eventPoint(event)
    this.hoverIndex = this.findSocket(this.dragPoint.x, this.dragPoint.y, 2)
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

  endpointEntries(ropeId) {
    const entries = []

    this.order.forEach((id, index) => {
      if (id !== ropeId) return
      const position = index === this.dragIndex && this.dragPoint
        ? this.dragPoint
        : this.socketPosition(index)
      entries.push({ index, position })
    })

    return entries.length === 2 ? entries : null
  }

  syncPhysics(time, g) {
    const ropeIds = [...new Set(this.order)]
    const draggedRopeId = this.dragIndex >= 0 ? this.order[this.dragIndex] : null

    this.physics.removeMissing(ropeIds)

    for (const ropeId of ropeIds) {
      const endpoints = this.endpointEntries(ropeId)
      if (!endpoints) continue

      this.physics.syncRope(
        ropeId,
        endpoints[0].position,
        endpoints[1].position,
        {
          segmentCount: g.size < 360
            ? this.performanceProfile.smallSegments
            : this.performanceProfile.largeSegments,
          slack: 1.115,
          retargetLength: draggedRopeId !== ropeId,
        },
      )
    }

    const pegs = this.order.map((ropeId, index) => {
      const position = this.socketPosition(index)
      return {
        x: position.x,
        y: position.y,
        radius: g.socketRadius * 1.08,
        ropeId,
      }
    })

    this.physics.update(time, {
      pegs,
      boundary: {
        x: g.cx,
        y: g.cy,
        radius: g.boardRadius * 0.91,
      },
    })
  }

  smoothPath(points) {
    const ctx = this.ctx
    if (points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let index = 1; index < points.length - 1; index++) {
      const current = points[index]
      const next = points[index + 1]
      const midX = (current.x + next.x) / 2
      const midY = (current.y + next.y) / 2
      ctx.quadraticCurveTo(current.x, current.y, midX, midY)
    }

    const last = points[points.length - 1]
    ctx.lineTo(last.x, last.y)
  }

  drawBoard(g) {
    const ctx = this.ctx

    ctx.save()
    ctx.shadowColor = 'rgba(52, 35, 23, .28)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 12

    const boardGradient = ctx.createRadialGradient(
      g.cx - g.boardRadius * 0.28,
      g.cy - g.boardRadius * 0.34,
      g.boardRadius * 0.1,
      g.cx,
      g.cy,
      g.boardRadius,
    )
    boardGradient.addColorStop(0, '#4b525d')
    boardGradient.addColorStop(0.48, '#313741')
    boardGradient.addColorStop(1, '#1d222a')

    ctx.fillStyle = boardGradient
    ctx.beginPath()

    const teeth = 28
    for (let index = 0; index <= teeth * 2; index++) {
      const angle = (index / (teeth * 2)) * TAU
      const radius = g.boardRadius * (index % 2 === 0 ? 1 : 0.968)
      const x = g.cx + Math.cos(angle) * radius
      const y = g.cy + Math.sin(angle) * radius
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,.065)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, g.boardRadius * 0.92, 0, TAU)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0,0,0,.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, g.boardRadius * 0.885, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }

  drawRope(ropeId, time) {
    const points = this.physics.getPoints(ropeId)
    if (points.length < 2) return

    const g = this.geometry()
    const ctx = this.ctx
    const color = ROPE_COLORS[ropeId % ROPE_COLORS.length]
    const tension = clamp(this.physics.getTension(ropeId), 0, 0.32)
    const baseWidth = clamp(g.size * 0.0175, 6.4, 11.5) * (1 - tension * 0.18)

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    this.smoothPath(points)
    ctx.strokeStyle = 'rgba(0,0,0,.38)'
    ctx.lineWidth = baseWidth + 5
    ctx.shadowColor = 'rgba(0,0,0,.42)'
    ctx.shadowBlur = 7
    ctx.shadowOffsetY = 4
    ctx.stroke()

    ctx.shadowColor = 'transparent'
    this.smoothPath(points)
    ctx.strokeStyle = color
    ctx.lineWidth = baseWidth
    ctx.stroke()

    this.smoothPath(points)
    ctx.strokeStyle = 'rgba(255,255,255,.35)'
    ctx.lineWidth = Math.max(1.3, baseWidth * 0.22)
    ctx.setLineDash([3, 6])
    ctx.lineDashOffset = -time * 0.012
    ctx.stroke()

    this.smoothPath(points)
    ctx.strokeStyle = 'rgba(28,24,20,.13)'
    ctx.lineWidth = Math.max(1, baseWidth * 0.1)
    ctx.setLineDash([1, 4])
    ctx.lineDashOffset = time * 0.008 + ropeId * 3
    ctx.stroke()

    ctx.restore()
  }

  drawCrossingBridge(contact, depthOrder, time) {
    const topRopeId = topRopeAtContact(contact, depthOrder)
    const segmentIndex = topRopeId === contact.aId
      ? contact.aSegment
      : contact.bSegment
    const points = this.physics.getPoints(topRopeId)
    const start = points[segmentIndex]
    const end = points[segmentIndex + 1]
    if (!start || !end) return

    const g = this.geometry()
    const ctx = this.ctx
    const color = ROPE_COLORS[topRopeId % ROPE_COLORS.length]
    const tension = clamp(this.physics.getTension(topRopeId), 0, 0.32)
    const baseWidth = clamp(g.size * 0.0175, 6.4, 11.5) * (1 - tension * 0.18)

    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.max(0.001, Math.hypot(dx, dy))
    const ux = dx / length
    const uy = dy / length
    const halfBridge = Math.max(10, baseWidth * 1.6)
    const ax = contact.x - ux * halfBridge
    const ay = contact.y - uy * halfBridge
    const bx = contact.x + ux * halfBridge
    const by = contact.y + uy * halfBridge

    ctx.save()
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.strokeStyle = 'rgba(0,0,0,.42)'
    ctx.lineWidth = baseWidth + 5
    ctx.shadowColor = 'rgba(0,0,0,.4)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3
    ctx.stroke()

    ctx.shadowColor = 'transparent'
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.strokeStyle = color
    ctx.lineWidth = baseWidth
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(
      contact.x - ux * halfBridge * 0.75,
      contact.y - uy * halfBridge * 0.75,
    )
    ctx.lineTo(
      contact.x + ux * halfBridge * 0.75,
      contact.y + uy * halfBridge * 0.75,
    )
    ctx.strokeStyle = 'rgba(255,255,255,.34)'
    ctx.lineWidth = Math.max(1.2, baseWidth * 0.21)
    ctx.setLineDash([3, 5])
    ctx.lineDashOffset = -time * 0.012
    ctx.stroke()

    ctx.restore()
  }

  drawPegMarker(x, y, radius, ropeId) {
    const ctx = this.ctx
    const size = radius * 0.38
    const variant = ropeId % 8

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,.9)'
    ctx.fillStyle = 'rgba(255,255,255,.9)'
    ctx.lineWidth = Math.max(1.5, radius * 0.11)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (variant === 0) {
      ctx.beginPath()
      ctx.arc(x, y, size * 0.33, 0, TAU)
      ctx.fill()
    } else if (variant === 1) {
      ctx.beginPath()
      ctx.moveTo(x - size, y)
      ctx.lineTo(x + size, y)
      ctx.stroke()
    } else if (variant === 2) {
      ctx.beginPath()
      ctx.moveTo(x - size * 0.72, y - size * 0.72)
      ctx.lineTo(x + size * 0.72, y + size * 0.72)
      ctx.moveTo(x + size * 0.72, y - size * 0.72)
      ctx.lineTo(x - size * 0.72, y + size * 0.72)
      ctx.stroke()
    } else if (variant === 3) {
      ctx.beginPath()
      ctx.moveTo(x - size, y)
      ctx.lineTo(x + size, y)
      ctx.moveTo(x, y - size)
      ctx.lineTo(x, y + size)
      ctx.stroke()
    } else if (variant === 4) {
      ctx.beginPath()
      ctx.arc(x, y, size * 0.72, 0, TAU)
      ctx.stroke()
    } else if (variant === 5) {
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x + size * 0.9, y + size * 0.72)
      ctx.lineTo(x - size * 0.9, y + size * 0.72)
      ctx.closePath()
      ctx.stroke()
    } else if (variant === 6) {
      ctx.strokeRect(x - size * 0.72, y - size * 0.72, size * 1.44, size * 1.44)
    } else {
      ctx.beginPath()
      ctx.arc(x - size * 0.48, y, size * 0.25, 0, TAU)
      ctx.arc(x + size * 0.48, y, size * 0.25, 0, TAU)
      ctx.fill()
    }

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

    let scale = index === this.dragIndex ? 1.15 : 1

    if (this.hint && performance.now() < this.hintUntil) {
      if (index === this.hint.from || index === this.hint.to) {
        scale += 0.09 + Math.sin(time * 0.012) * 0.06
      }
    }

    if (index === this.hoverIndex && this.dragIndex >= 0) scale += 0.08

    const radius = g.socketRadius * scale

    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,.42)'
    ctx.beginPath()
    ctx.arc(position.x, position.y + radius * 0.16, radius * 1.16, 0, TAU)
    ctx.fill()

    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 5

    const gradient = ctx.createRadialGradient(
      position.x - radius * 0.34,
      position.y - radius * 0.44,
      radius * 0.1,
      position.x,
      position.y,
      radius,
    )
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.07, color)
    gradient.addColorStop(0.7, color)
    gradient.addColorStop(1, '#16191e')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, TAU)
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = 'rgba(255,255,255,.38)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(
      position.x - radius * 0.08,
      position.y - radius * 0.12,
      radius * 0.68,
      Math.PI * 1.08,
      Math.PI * 1.82,
    )
    ctx.stroke()

    ctx.fillStyle = 'rgba(24,26,31,.76)'
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 0.31, 0, TAU)
    ctx.fill()
    this.drawPegMarker(position.x, position.y, radius, ropeId)
    ctx.restore()
  }

  drawCenterHub(g, time) {
    const ctx = this.ctx
    const crossings = getCrossingCount(this.order)
    const solved = crossings === 0
    const pulse = solved ? 1 + Math.sin(time * 0.01) * 0.05 : 1
    const radius = g.socketRadius * 1.06 * pulse

    ctx.save()
    ctx.shadowColor = solved ? 'rgba(95, 236, 103, .68)' : 'rgba(0,0,0,.42)'
    ctx.shadowBlur = solved ? 22 : 8

    const gradient = ctx.createRadialGradient(
      g.cx - radius * 0.25,
      g.cy - radius * 0.3,
      radius * 0.1,
      g.cx,
      g.cy,
      radius,
    )
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.2, solved ? '#c9ffb4' : '#fff9e7')
    gradient.addColorStop(1, solved ? '#57c95a' : '#d9c59f')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, radius, 0, TAU)
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = solved ? '#2da73b' : '#8c7354'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, radius * 0.62, 0, TAU)
    ctx.stroke()

    ctx.fillStyle = solved ? '#2da73b' : '#51483f'
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, radius * 0.25, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  draw(time = 0) {
    const ctx = this.ctx
    const g = this.geometry()
    ctx.clearRect(0, 0, g.width, g.height)

    this.drawBoard(g)
    this.syncPhysics(time, g)

    const ropeIds = [...new Set(this.order)]
    const depthOrder = stableDepthOrder(ropeIds, this.depthSeed)
    depthOrder.forEach((ropeId) => this.drawRope(ropeId, time))

    for (const contact of this.physics.getContacts()) {
      this.drawCrossingBridge(contact, depthOrder, time)
    }

    this.order.forEach((_, index) => this.drawPeg(index, time))
    this.drawCenterHub(g, time)

    if (this.hint && performance.now() > this.hintUntil) this.hint = null
  }
}
