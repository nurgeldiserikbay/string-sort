import { ROPE_COLORS, getCrossingCount } from './levels.js'
import { RopePhysics } from './RopePhysics.js'
import { stableDepthOrder } from './RopeTopology.js'
import { resolvePerformanceProfile } from './PerformanceProfile.js'
import { FrameGovernor } from './FrameGovernor.js'
import { RopeTangle } from './RopeTangle.js'

const TAU = Math.PI * 2

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export class RopeBoard {
  constructor(canvas, {
    onSwap,
    onSolved,
    onInvalidDrop,
    graphics = 'auto',
    pegMarkers = false,
  }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })
    this.onSwap = onSwap
    this.onSolved = onSolved
    this.onInvalidDrop = onInvalidDrop
    this.pegMarkers = pegMarkers
    this.order = []
    this.dragIndex = -1
    this.dragPoint = null
    this.dragVisualPoint = null
    this.hoverIndex = -1
    this.activePointerId = null
    this.invalidDropIndex = -1
    this.invalidDropUntil = 0
    this.hint = null
    this.hintUntil = 0
    this.running = false
    this.raf = 0
    this.depthSeed = 0x51f15e
    this.tangle = new RopeTangle(this.depthSeed)
    this.knotConstraints = []
    this.releaseBursts = []
    this.needsKnotPrime = true
    this.debugEnabled = (() => {
      try {
        return new URLSearchParams(globalThis.location?.search || '').get('debug') === '1'
      } catch {
        return false
      }
    })()
    this.debugFrameTimes = []
    this.debugFps = 0
    this.graphicsPreference = graphics
    this.performanceProfile = resolvePerformanceProfile(graphics)
    this.frameGovernor = graphics === 'auto'
      ? new FrameGovernor({ profileId: this.performanceProfile.id })
      : null
    this.physics = new RopePhysics({
      damping: 0.982,
      gravity: 0,
      constraintIterations: this.performanceProfile.constraintIterations,
    })

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onPointerCancel = this.onPointerCancel.bind(this)
    this.resize = this.resize.bind(this)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerCancel)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  setOrder(order) {
    const topologyChanged = this.order.length !== order.length
    this.order = [...order]

    if (topologyChanged) {
      this.depthSeed = (0x51f15e ^ Math.imul(order.length + 1, 0x9e3779b1)) >>> 0
      this.tangle = new RopeTangle(this.depthSeed)
      this.knotConstraints = []
      this.releaseBursts = []
      this.needsKnotPrime = true
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

      this.updateDiagnostics(time)

      const recommendation = this.frameGovernor?.pushFrame(time)
      if (recommendation && recommendation.id !== this.performanceProfile.id) {
        this.performanceProfile = recommendation
        this.physics.constraintIterations = recommendation.constraintIterations
        this.resize()
        this.frameGovernor.reset(time)
      }

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
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel)
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
    this.needsKnotPrime = true
  }

  geometry() {
    const rect = this.canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const size = Math.min(width, height)
    const cx = width / 2
    const cy = height / 2 + size * 0.012
    const boardRadius = size * 0.445
    const socketRadius = clamp(size * 0.028, 10, 17)

    return { width, height, size, cx, cy, boardRadius, socketRadius }
  }

  socketPosition(index) {
    const g = this.geometry()
    const count = this.order.length || 1
    const angle = -Math.PI / 2 + (index / count) * TAU
    const radius = g.boardRadius * 0.89

    return {
      x: g.cx + Math.cos(angle) * radius,
      y: g.cy + Math.sin(angle) * radius,
      angle,
    }
  }

  constrainDragPoint(point) {
    const g = this.geometry()
    const dx = point.x - g.cx
    const dy = point.y - g.cy
    const distance = Math.hypot(dx, dy)
    const maxDistance = g.boardRadius * 0.985

    if (distance <= maxDistance || distance < 0.001) return point

    const scale = maxDistance / distance
    return {
      x: g.cx + dx * scale,
      y: g.cy + dy * scale,
    }
  }

  findSocket(x, y, multiplier = 2.2) {
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
    if (this.activePointerId != null) return

    const point = this.eventPoint(event)
    const index = this.findSocket(point.x, point.y)
    if (index < 0 || this.order[index] == null) return

    this.dragIndex = index
    this.activePointerId = event.pointerId
    this.dragPoint = this.constrainDragPoint(point)
    this.dragVisualPoint = { ...this.dragPoint }
    this.hoverIndex = index
    this.canvas.setPointerCapture?.(event.pointerId)
  }

  onPointerMove(event) {
    if (
      this.dragIndex < 0
      || this.activePointerId == null
      || event.pointerId !== this.activePointerId
    ) return

    this.dragPoint = this.constrainDragPoint(this.eventPoint(event))
    this.hoverIndex = this.findSocket(this.dragPoint.x, this.dragPoint.y, 2.5)
  }

  onPointerUp(event) {
    if (
      this.dragIndex < 0
      || this.activePointerId == null
      || event.pointerId !== this.activePointerId
    ) return

    const from = this.dragIndex
    const point = this.constrainDragPoint(this.eventPoint(event))
    const to = this.findSocket(point.x, point.y, 2.65)

    this.cancelDrag()

    if (to >= 0 && to !== from && this.order[to] == null) {
      this.invalidDropIndex = -1
      this.invalidDropUntil = 0
      this.onSwap?.(from, to)
      if (getCrossingCount(this.order) === 0) this.onSolved?.()
      return
    }

    this.invalidDropIndex = from
    this.invalidDropUntil = performance.now() + 280
    this.onInvalidDrop?.(from)
  }

  onPointerCancel(event) {
    if (
      this.activePointerId == null
      || event.pointerId !== this.activePointerId
    ) return

    this.cancelDrag()
  }

  cancelDrag() {
    if (this.activePointerId != null) {
      try {
        this.canvas.releasePointerCapture?.(this.activePointerId)
      } catch {
        // Pointer capture may already have been released by the browser.
      }
    }

    this.dragIndex = -1
    this.dragPoint = null
    this.dragVisualPoint = null
    this.hoverIndex = -1
    this.activePointerId = null
  }

  endpointEntries(ropeId) {
    const entries = []

    this.order.forEach((id, index) => {
      if (id !== ropeId) return
      const position = index === this.dragIndex && this.dragVisualPoint
        ? this.dragVisualPoint
        : this.socketPosition(index)
      entries.push({ index, position })
    })

    return entries.length === 2 ? entries : null
  }

  syncPhysics(time, g) {
    const draggedRopeId = this.dragIndex >= 0 ? this.order[this.dragIndex] : null

    if (this.dragIndex >= 0 && this.dragPoint) {
      if (!this.dragVisualPoint) this.dragVisualPoint = { ...this.dragPoint }

      const boundKnots = draggedRopeId == null
        ? 0
        : this.tangle.getKnots().filter(
          (knot) => knot.aId === draggedRopeId || knot.bId === draggedRopeId,
        ).length
      const follow = clamp(0.46 - boundKnots * 0.035, 0.19, 0.42)

      this.dragVisualPoint.x += (this.dragPoint.x - this.dragVisualPoint.x) * follow
      this.dragVisualPoint.y += (this.dragPoint.y - this.dragVisualPoint.y) * follow
    }

    const ropeIds = [...new Set(this.order.filter((ropeId) => ropeId != null))]
    const logicalKnotCount = getCrossingCount(this.order)
    const ropeSlack = clamp(1.072 + logicalKnotCount * 0.0025, 1.075, 1.14)
    const segmentCounts = new Map()

    this.physics.removeMissing(ropeIds)

    for (const ropeId of ropeIds) {
      const endpoints = this.endpointEntries(ropeId)
      if (!endpoints) continue

      const segmentCount = g.size < 360
        ? this.performanceProfile.smallSegments
        : this.performanceProfile.largeSegments

      segmentCounts.set(ropeId, segmentCount)

      this.physics.syncRope(
        ropeId,
        endpoints[0].position,
        endpoints[1].position,
        {
          segmentCount,
          slack: ropeSlack,
          retargetLength: draggedRopeId !== ropeId,
        },
      )
    }

    this.tangle.update(this.order, g)

    for (const released of this.tangle.consumeReleased()) {
      this.releaseBursts.push({
        x: released.x,
        y: released.y,
        startedAt: time,
      })
    }

    const knots = this.tangle.buildConstraints(segmentCounts)
    this.knotConstraints = knots

    if (this.needsKnotPrime) {
      this.physics.primeKnotLayout(knots)
      this.needsKnotPrime = false
    }

    const pegs = this.order
      .map((ropeId, index) => {
        if (ropeId == null) return null
        const position = this.socketPosition(index)
        return {
          x: position.x,
          y: position.y,
          radius: g.socketRadius * 1.08,
          ropeId,
        }
      })
      .filter(Boolean)

    this.physics.update(time, {
      pegs,
      knots,
      boundary: {
        x: g.cx,
        y: g.cy,
        radius: g.boardRadius * 0.91,
      },
    })

    this.tangle.followPhysics(this.physics, g)
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
    const radii = [
      0.985, 1, 0.976, 0.995, 0.982, 1,
      0.972, 0.992, 0.98, 0.997, 0.974, 1,
      0.981, 0.993, 0.97, 0.998, 0.978, 0.992,
    ]

    const boardPath = (scale = 1) => {
      ctx.beginPath()
      radii.forEach((factor, index) => {
        const angle = -Math.PI / 2 + (index / radii.length) * TAU
        const radius = g.boardRadius * factor * scale
        const x = g.cx + Math.cos(angle) * radius
        const y = g.cy + Math.sin(angle) * radius
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
    }

    ctx.save()
    ctx.shadowColor = 'rgba(58, 38, 20, .26)'
    ctx.shadowBlur = 26
    ctx.shadowOffsetY = 13

    const boardGradient = ctx.createRadialGradient(
      g.cx - g.boardRadius * 0.34,
      g.cy - g.boardRadius * 0.38,
      g.boardRadius * 0.08,
      g.cx,
      g.cy,
      g.boardRadius,
    )
    boardGradient.addColorStop(0, '#676a73')
    boardGradient.addColorStop(0.52, '#555861')
    boardGradient.addColorStop(1, '#41444d')

    ctx.fillStyle = boardGradient
    boardPath()
    ctx.fill()
    ctx.restore()

    ctx.save()
    boardPath(0.96)
    ctx.strokeStyle = 'rgba(255,255,255,.075)'
    ctx.lineWidth = 2
    ctx.stroke()

    boardPath(0.91)
    ctx.strokeStyle = 'rgba(20,22,27,.16)'
    ctx.lineWidth = 2
    ctx.stroke()

    const sheen = ctx.createRadialGradient(
      g.cx - g.boardRadius * 0.26,
      g.cy - g.boardRadius * 0.32,
      0,
      g.cx - g.boardRadius * 0.18,
      g.cy - g.boardRadius * 0.22,
      g.boardRadius * 0.76,
    )
    sheen.addColorStop(0, 'rgba(255,255,255,.07)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sheen
    boardPath(0.9)
    ctx.fill()
    ctx.restore()

    if (getCrossingCount(this.order) === 0) {
      const pulse = 0.58 + Math.sin(performance.now() * 0.012) * 0.18
      ctx.save()
      boardPath(0.965)
      ctx.strokeStyle = `rgba(113, 241, 132, ${pulse})`
      ctx.lineWidth = 3.5
      ctx.shadowColor = 'rgba(94, 235, 117, .5)'
      ctx.shadowBlur = 18
      ctx.stroke()
      ctx.restore()
    }
  }

  drawRope(ropeId, time) {
    const points = this.physics.getPoints(ropeId)
    if (points.length < 2) return

    const g = this.geometry()
    const ctx = this.ctx
    const color = ROPE_COLORS[ropeId % ROPE_COLORS.length]
    const tension = clamp(this.physics.getTension(ropeId), 0, 0.32)
    const baseWidth = clamp(g.size * 0.0148, 5.2, 9.4) * (1 - tension * 0.12)

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
    ctx.strokeStyle = 'rgba(255,255,255,.22)'
    ctx.lineWidth = Math.max(1, baseWidth * 0.18)
    ctx.setLineDash([])
    ctx.stroke()

    ctx.restore()
  }

  drawReleaseBursts(time) {
    const ctx = this.ctx
    const duration = 460

    this.releaseBursts = this.releaseBursts.filter((burst) => {
      const age = time - burst.startedAt
      if (age < 0 || age > duration) return false

      const progress = age / duration
      const ease = 1 - (1 - progress) * (1 - progress)
      const alpha = 1 - progress
      const radius = 8 + ease * 28

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = 'rgba(255, 226, 107, .95)'
      ctx.fillStyle = 'rgba(255, 247, 198, .9)'
      ctx.lineCap = 'round'
      ctx.lineWidth = 2.2

      ctx.beginPath()
      ctx.arc(burst.x, burst.y, radius * 0.42, 0, TAU)
      ctx.stroke()

      for (let index = 0; index < 6; index++) {
        const angle = (index / 6) * TAU
        const inner = radius * 0.55
        const outer = radius
        ctx.beginPath()
        ctx.moveTo(
          burst.x + Math.cos(angle) * inner,
          burst.y + Math.sin(angle) * inner,
        )
        ctx.lineTo(
          burst.x + Math.cos(angle) * outer,
          burst.y + Math.sin(angle) * outer,
        )
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(burst.x, burst.y, Math.max(2, 4 * alpha), 0, TAU)
      ctx.fill()
      ctx.restore()

      return true
    })
  }

  drawKnotOverpasses() {
    const ctx = this.ctx
    const g = this.geometry()

    for (const knot of this.knotConstraints) {
      const ropeId = knot.topId
      const points = this.physics.getPoints(ropeId)
      const index = ropeId === knot.aId ? knot.aIndex : knot.bIndex
      if (!points.length || index < 2 || index > points.length - 3) continue

      const p0 = points[index - 2]
      const p1 = points[index]
      const p2 = points[index + 2]
      const color = ROPE_COLORS[ropeId % ROPE_COLORS.length]
      const tension = clamp(this.physics.getTension(ropeId), 0, 0.32)
      const width = clamp(g.size * 0.0148, 5.2, 9.4) * (1 - tension * 0.12)

      ctx.save()
      ctx.lineCap = 'butt'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
      ctx.strokeStyle = 'rgba(18,20,24,.42)'
      ctx.lineWidth = width + 2.2
      ctx.shadowColor = 'rgba(0,0,0,.34)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 2
      ctx.stroke()

      ctx.shadowColor = 'transparent'
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
      ctx.strokeStyle = 'rgba(255,255,255,.18)'
      ctx.lineWidth = Math.max(1, width * 0.15)
      ctx.stroke()

      ctx.restore()
    }
  }

  drawHintGuide(time) {
    if (!this.hint || performance.now() >= this.hintUntil) return

    const from = this.socketPosition(this.hint.from)
    const to = this.socketPosition(this.hint.to)
    const g = this.geometry()
    const ctx = this.ctx
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.008)
    const controlX = g.cx + (from.x + to.x - g.cx * 2) * 0.16
    const controlY = g.cy + (from.y + to.y - g.cy * 2) * 0.16

    const directionX = to.x - controlX
    const directionY = to.y - controlY
    const directionLength = Math.max(0.001, Math.hypot(directionX, directionY))
    const ux = directionX / directionLength
    const uy = directionY / directionLength
    const arrowLength = 14 + pulse * 3
    const arrowWidth = 7

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(controlX, controlY, to.x, to.y)
    ctx.strokeStyle = 'rgba(255,255,255,.58)'
    ctx.lineWidth = 8
    ctx.shadowColor = 'rgba(67, 211, 121, .28)'
    ctx.shadowBlur = 12
    ctx.stroke()

    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    gradient.addColorStop(0, 'rgba(99, 201, 255, .72)')
    gradient.addColorStop(1, 'rgba(116, 246, 155, .95)')

    ctx.shadowColor = 'transparent'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(controlX, controlY, to.x, to.y)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 3.2 + pulse * 0.8
    ctx.setLineDash([7, 8])
    ctx.lineDashOffset = -time * 0.025
    ctx.stroke()
    ctx.setLineDash([])

    const tipX = to.x - ux * 5
    const tipY = to.y - uy * 5
    const baseX = tipX - ux * arrowLength
    const baseY = tipY - uy * arrowLength
    const nx = -uy
    const ny = ux

    ctx.fillStyle = 'rgba(116, 246, 155, .96)'
    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(baseX + nx * arrowWidth, baseY + ny * arrowWidth)
    ctx.lineTo(baseX - nx * arrowWidth, baseY - ny * arrowWidth)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  drawSocket(index) {
    const g = this.geometry()
    const ctx = this.ctx
    const position = this.socketPosition(index)
    const isEmpty = this.order[index] == null
    const isDropTarget = isEmpty
      && this.dragIndex >= 0
      && this.hoverIndex === index
    const isHintTarget = isEmpty
      && this.hint
      && performance.now() < this.hintUntil
      && this.hint.to === index
    const isActiveTarget = isDropTarget || isHintTarget
    const pulse = isHintTarget
      ? 1 + Math.sin(performance.now() * 0.012) * 0.08
      : 1
    const radius = g.socketRadius * (isActiveTarget ? 1.16 : 0.9) * pulse

    ctx.save()
    ctx.shadowColor = isActiveTarget
      ? 'rgba(120, 255, 160, .58)'
      : 'rgba(0,0,0,.22)'
    ctx.shadowBlur = isActiveTarget ? 16 : 4
    ctx.shadowOffsetY = 2

    if (isEmpty) {
      const rim = ctx.createRadialGradient(
        position.x - radius * 0.3,
        position.y - radius * 0.32,
        radius * 0.08,
        position.x,
        position.y,
        radius,
      )
      rim.addColorStop(0, '#aeb2bb')
      rim.addColorStop(0.45, '#737780')
      rim.addColorStop(1, '#444850')

      ctx.fillStyle = rim
      ctx.beginPath()
      ctx.arc(position.x, position.y, radius, 0, TAU)
      ctx.fill()

      ctx.shadowColor = 'transparent'
      ctx.fillStyle = '#2f3239'
      ctx.beginPath()
      ctx.arc(position.x, position.y, radius * 0.58, 0, TAU)
      ctx.fill()
    } else {
      ctx.fillStyle = '#4d5058'
      ctx.beginPath()
      ctx.arc(position.x, position.y, radius, 0, TAU)
      ctx.fill()
      ctx.shadowColor = 'transparent'
    }

    ctx.strokeStyle = isActiveTarget
      ? 'rgba(164,255,191,.95)'
      : isEmpty
        ? 'rgba(255,255,255,.28)'
        : 'rgba(0,0,0,.2)'
    ctx.lineWidth = isActiveTarget ? 3 : 1.5
    ctx.setLineDash(isHintTarget ? [4, 4] : [])
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 0.78, 0, TAU)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.restore()
  }

  drawPegMarker(x, y, radius, ropeId) {
    const ctx = this.ctx
    const size = radius * 0.21
    const variant = ropeId % 12

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,.44)'
    ctx.fillStyle = 'rgba(255,255,255,.44)'
    ctx.lineWidth = Math.max(1.2, radius * 0.085)
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
    } else if (variant === 7) {
      ctx.beginPath()
      ctx.arc(x - size * 0.48, y, size * 0.25, 0, TAU)
      ctx.arc(x + size * 0.48, y, size * 0.25, 0, TAU)
      ctx.fill()
    } else if (variant === 8) {
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x, y + size)
      ctx.stroke()
    } else if (variant === 9) {
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x + size, y)
      ctx.lineTo(x, y + size)
      ctx.lineTo(x - size, y)
      ctx.closePath()
      ctx.stroke()
    } else if (variant === 10) {
      ctx.beginPath()
      ctx.arc(x, y - size * 0.46, size * 0.22, 0, TAU)
      ctx.arc(x, y + size * 0.46, size * 0.22, 0, TAU)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(x - size, y - size * 0.52)
      ctx.lineTo(x, y + size * 0.52)
      ctx.lineTo(x + size, y - size * 0.52)
      ctx.stroke()
    }

    ctx.restore()
  }

  drawPeg(index, time) {
    const g = this.geometry()
    const ctx = this.ctx
    let position = index === this.dragIndex && this.dragVisualPoint
      ? this.dragVisualPoint
      : this.socketPosition(index)
    const ropeId = this.order[index]
    if (ropeId == null) return
    const color = ROPE_COLORS[ropeId % ROPE_COLORS.length]

    if (index === this.invalidDropIndex && performance.now() < this.invalidDropUntil) {
      const remaining = clamp(
        (this.invalidDropUntil - performance.now()) / 280,
        0,
        1,
      )
      position = {
        ...position,
        x: position.x + Math.sin(time * 0.09) * 5 * remaining,
      }
    } else if (index === this.invalidDropIndex) {
      this.invalidDropIndex = -1
      this.invalidDropUntil = 0
    }

    let scale = index === this.dragIndex ? 1.18 : 1

    if (this.hint && performance.now() < this.hintUntil) {
      if (index === this.hint.from || index === this.hint.to) {
        scale += 0.09 + Math.sin(time * 0.012) * 0.06
      }
    }

    if (
      index === this.hoverIndex
      && this.dragIndex >= 0
      && this.order[index] == null
    ) scale += 0.08

    const radius = g.socketRadius * 1.18 * scale

    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,.3)'
    ctx.beginPath()
    ctx.arc(position.x, position.y + radius * 0.16, radius * 1.04, 0, TAU)
    ctx.fill()

    ctx.shadowColor = 'rgba(0,0,0,.32)'
    ctx.shadowBlur = 7
    ctx.shadowOffsetY = 4

    const gradient = ctx.createRadialGradient(
      position.x - radius * 0.34,
      position.y - radius * 0.44,
      radius * 0.1,
      position.x,
      position.y,
      radius,
    )
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.1, color)
    gradient.addColorStop(0.72, color)
    gradient.addColorStop(1, '#252932')

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

    ctx.fillStyle = 'rgba(24,27,33,.34)'
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 0.34, 0, TAU)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,255,255,.12)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 0.39, 0, TAU)
    ctx.stroke()

    if (this.pegMarkers) {
      this.drawPegMarker(position.x, position.y, radius, ropeId)
    }
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

  updateDiagnostics(time) {
    if (!this.debugEnabled || !Number.isFinite(time)) return

    const previous = this.debugFrameTimes.at(-1)
    this.debugFrameTimes.push(time)
    if (this.debugFrameTimes.length > 31) this.debugFrameTimes.shift()

    if (previous == null || this.debugFrameTimes.length < 12) return

    const first = this.debugFrameTimes[0]
    const last = this.debugFrameTimes.at(-1)
    const frameCount = this.debugFrameTimes.length - 1
    const elapsed = last - first
    if (elapsed > 0) this.debugFps = Math.round((frameCount * 1000) / elapsed)
  }

  drawDiagnostics(g) {
    if (!this.debugEnabled) return

    const ctx = this.ctx
    const contacts = this.physics.getContacts().length
    const ropes = new Set(this.order).size
    const lines = [
      `FPS ${this.debugFps || '--'}`,
      `Profile ${this.performanceProfile.id}`,
      `Ropes ${ropes} · Knots ${this.tangle.getKnots().length}`,
      `DPR cap ${this.performanceProfile.dprCap}`,
    ]

    ctx.save()
    ctx.font = '700 11px monospace'
    ctx.textBaseline = 'top'

    const width = 154
    const height = 14 + lines.length * 15
    const x = 8
    const y = 8

    ctx.fillStyle = 'rgba(15,18,22,.78)'
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, 10)
    } else {
      ctx.rect(x, y, width, height)
    }
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,.92)'
    lines.forEach((line, index) => {
      ctx.fillText(line, x + 10, y + 8 + index * 15)
    })
    ctx.restore()
  }

  draw(time = 0) {
    const ctx = this.ctx
    const g = this.geometry()
    ctx.clearRect(0, 0, g.width, g.height)

    this.drawBoard(g)
    this.order.forEach((_, index) => this.drawSocket(index))
    this.syncPhysics(time, g)

    const ropeIds = [...new Set(this.order.filter((ropeId) => ropeId != null))]
    const depthOrder = stableDepthOrder(ropeIds, this.depthSeed)

    // Each rope is rendered once, back-to-front. The rope's own shadow
    // naturally creates the over/under cue at crossings. Avoid redrawing
    // a short "bridge" segment on top of the crossing: that produced a
    // visible capsule/bulge and a discontinuous moving highlight.
    depthOrder.forEach((ropeId) => this.drawRope(ropeId, time))
    this.drawKnotOverpasses()
    this.drawReleaseBursts(time)
    this.drawHintGuide(time)

    this.order.forEach((ropeId, index) => {
      if (ropeId != null) this.drawPeg(index, time)
    })
    this.drawDiagnostics(g)

    if (this.hint && performance.now() > this.hintUntil) this.hint = null
  }
}
