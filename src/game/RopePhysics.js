import { detectRopeCrossings } from './RopeTopology.js'

const EPSILON = 0.0001

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clonePoint(point, pinned = false) {
  return {
    x: point.x,
    y: point.y,
    oldX: point.x,
    oldY: point.y,
    pinned,
  }
}

export class RopePhysics {
  constructor({
    damping = 0.985,
    gravity = 22,
    constraintIterations = 8,
  } = {}) {
    this.damping = damping
    this.gravity = gravity
    this.constraintIterations = constraintIterations
    this.ropes = new Map()
    this.lastTime = 0
    this.contacts = []
  }

  clear() {
    this.ropes.clear()
    this.lastTime = 0
    this.contacts = []
  }

  removeMissing(validIds) {
    const valid = new Set(validIds)
    for (const id of this.ropes.keys()) {
      if (!valid.has(id)) this.ropes.delete(id)
    }
  }

  createRope(id, start, end, segmentCount, slack = 1.12) {
    const chord = Math.max(1, distance(start, end))
    const totalLength = chord * slack
    const segmentLength = totalLength / segmentCount
    const dx = end.x - start.x
    const dy = end.y - start.y
    const inv = 1 / Math.max(EPSILON, chord)
    const nx = -dy * inv
    const ny = dx * inv
    const direction = id % 2 === 0 ? 1 : -1
    const bend = Math.min(44, chord * 0.13) * direction
    const phase = (id * 1.61803398875) % (Math.PI * 2)

    const points = Array.from({ length: segmentCount + 1 }, (_, index) => {
      const t = index / segmentCount
      const envelope = Math.sin(t * Math.PI)
      const mainArc = envelope * bend
      const secondaryArc = (
        Math.sin(t * Math.PI * 2 + phase)
        * envelope
        * Math.min(12, Math.abs(bend) * 0.28)
      )
      const arc = mainArc + secondaryArc

      return clonePoint({
        x: lerp(start.x, end.x, t) + nx * arc,
        y: lerp(start.y, end.y, t) + ny * arc,
      }, index === 0 || index === segmentCount)
    })

    const rope = {
      id,
      points,
      segmentCount,
      segmentLength,
      targetSegmentLength: segmentLength,
      start: { ...start },
      end: { ...end },
      tension: 0,
    }

    this.ropes.set(id, rope)
    return rope
  }

  syncRope(id, start, end, {
    segmentCount = 26,
    slack = 1.12,
    retargetLength = true,
  } = {}) {
    let rope = this.ropes.get(id)

    if (!rope || rope.segmentCount !== segmentCount) {
      rope = this.createRope(id, start, end, segmentCount, slack)
    }

    rope.start = { ...start }
    rope.end = { ...end }

    if (retargetLength) {
      const targetTotal = Math.max(1, distance(start, end)) * slack
      rope.targetSegmentLength = targetTotal / rope.segmentCount
    }

    const first = rope.points[0]
    const last = rope.points[rope.points.length - 1]

    first.x = start.x
    first.y = start.y
    first.oldX = start.x
    first.oldY = start.y

    last.x = end.x
    last.y = end.y
    last.oldX = end.x
    last.oldY = end.y

    const currentLength = rope.segmentLength * rope.segmentCount
    rope.tension = Math.max(0, distance(start, end) / Math.max(1, currentLength) - 1)

    return rope
  }

  primeKnotLayout(knots) {
    const place = (rope, index, x, y) => {
      const point = rope?.points?.[index]
      if (!point || point.pinned) return
      point.x = x
      point.y = y
      point.oldX = x
      point.oldY = y
    }

    for (const knot of knots) {
      const ropeA = this.ropes.get(knot.aId)
      const ropeB = this.ropes.get(knot.bId)
      if (!ropeA || !ropeB) continue

      place(ropeA, knot.aIndex, knot.x, knot.y)
      place(ropeB, knot.bIndex, knot.x, knot.y)

      const shoulder = 9
      const angle = knot.twistAngle ?? 0
      const ax = Math.cos(angle)
      const ay = Math.sin(angle)
      const bx = -ay
      const by = ax

      place(
        ropeA,
        knot.aIndex - 1,
        knot.x - ax * shoulder,
        knot.y - ay * shoulder,
      )
      place(
        ropeA,
        knot.aIndex + 1,
        knot.x + ax * shoulder,
        knot.y + ay * shoulder,
      )
      place(
        ropeB,
        knot.bIndex - 1,
        knot.x - bx * shoulder,
        knot.y - by * shoulder,
      )
      place(
        ropeB,
        knot.bIndex + 1,
        knot.x + bx * shoulder,
        knot.y + by * shoulder,
      )
    }

    for (let iteration = 0; iteration < Math.max(4, this.constraintIterations); iteration++) {
      for (const rope of this.ropes.values()) {
        this.pinEndpoints(rope)
        this.solveDistanceConstraints(rope)
        this.pinEndpoints(rope)
      }
      this.solveKnotConstraints(knots)
    }
  }

  update(time, {
    pegs = [],
    boundary = null,
    knots = [],
  } = {}) {
    const now = typeof time === 'number' ? time : performance.now()
    if (!this.lastTime) this.lastTime = now

    const frameSeconds = Math.min(1 / 30, Math.max(1 / 120, (now - this.lastTime) / 1000 || 1 / 60))
    this.lastTime = now

    const substeps = frameSeconds > 1 / 50 ? 2 : 1
    const dt = frameSeconds / substeps

    for (let step = 0; step < substeps; step++) {
      for (const rope of this.ropes.values()) {
        rope.segmentLength = lerp(rope.segmentLength, rope.targetSegmentLength, 0.09)
        this.integrate(rope, dt, now)
      }

      for (let iteration = 0; iteration < this.constraintIterations; iteration++) {
        for (const rope of this.ropes.values()) {
          this.pinEndpoints(rope)
          this.solveDistanceConstraints(rope)
        }

        this.solveKnotConstraints(knots)

        for (const rope of this.ropes.values()) {
          this.solvePegCollisions(rope, pegs)
          if (boundary) this.solveBoundary(rope, boundary)
          this.pinEndpoints(rope)
        }
      }
    }

    this.contacts = detectRopeCrossings([...this.ropes.values()], {
      maxContactsPerPair: 5,
      dedupeDistance: 12,
    })

    const activePairs = new Set(
      knots.map((knot) => (
        knot.aId < knot.bId
          ? `${knot.aId}:${knot.bId}`
          : `${knot.bId}:${knot.aId}`
      )),
    )
    const boundContacts = this.contacts.filter((contact) => activePairs.has(contact.pair))
    this.applyCrossingFriction(boundContacts)
  }

  integrate(rope, dt, time) {
    const dtSquared = dt * dt
    const wind = Math.sin(time * 0.0018 + rope.id * 1.31) * 8

    for (let index = 1; index < rope.points.length - 1; index++) {
      const point = rope.points[index]
      const velocityX = (point.x - point.oldX) * this.damping
      const velocityY = (point.y - point.oldY) * this.damping

      point.oldX = point.x
      point.oldY = point.y

      const weight = Math.sin((index / rope.segmentCount) * Math.PI)
      point.x += velocityX + wind * weight * dtSquared
      point.y += velocityY + this.gravity * weight * dtSquared
    }
  }

  pinEndpoints(rope) {
    const first = rope.points[0]
    const last = rope.points[rope.points.length - 1]

    first.x = rope.start.x
    first.y = rope.start.y
    last.x = rope.end.x
    last.y = rope.end.y
  }

  solveDistanceConstraints(rope) {
    for (let index = 0; index < rope.points.length - 1; index++) {
      const a = rope.points[index]
      const b = rope.points[index + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const current = Math.max(EPSILON, Math.hypot(dx, dy))
      const error = (current - rope.segmentLength) / current

      const aWeight = a.pinned ? 0 : 1
      const bWeight = b.pinned ? 0 : 1
      const totalWeight = aWeight + bWeight
      if (!totalWeight) continue

      const correctionX = dx * error
      const correctionY = dy * error

      if (aWeight) {
        a.x += correctionX * (aWeight / totalWeight)
        a.y += correctionY * (aWeight / totalWeight)
      }
      if (bWeight) {
        b.x -= correctionX * (bWeight / totalWeight)
        b.y -= correctionY * (bWeight / totalWeight)
      }
    }
  }

  solveKnotConstraints(knots) {
    const movePoint = (point, targetX, targetY, strength, drag) => {
      if (!point || point.pinned) return

      point.x += (targetX - point.x) * strength
      point.y += (targetY - point.y) * strength

      const velocityX = point.x - point.oldX
      const velocityY = point.y - point.oldY
      point.oldX = point.x - velocityX * drag
      point.oldY = point.y - velocityY * drag
    }

    for (const knot of knots) {
      const ropeA = this.ropes.get(knot.aId)
      const ropeB = this.ropes.get(knot.bId)
      if (!ropeA || !ropeB) continue

      const a = ropeA.points[knot.aIndex]
      const b = ropeB.points[knot.bIndex]
      if (!a || !b) continue

      const midpointX = (a.x + b.x) / 2
      const midpointY = (a.y + b.y) / 2
      const anchorStrength = 0.22
      const targetX = midpointX + (knot.x - midpointX) * anchorStrength
      const targetY = midpointY + (knot.y - midpointY) * anchorStrength
      const stiffness = knot.stiffness ?? 0.18
      const drag = knot.drag ?? 0.7

      movePoint(a, targetX, targetY, stiffness, drag)
      movePoint(b, targetX, targetY, stiffness, drag)

      const aPrev = ropeA.points[knot.aIndex - 1]
      const aNext = ropeA.points[knot.aIndex + 1]
      const bPrev = ropeB.points[knot.bIndex - 1]
      const bNext = ropeB.points[knot.bIndex + 1]
      const shoulderStrength = stiffness * 0.34
      const shoulder = 9
      const angle = knot.twistAngle ?? 0
      const ax = Math.cos(angle)
      const ay = Math.sin(angle)
      const bx = -ay
      const by = ax

      movePoint(
        aPrev,
        targetX - ax * shoulder,
        targetY - ay * shoulder,
        shoulderStrength,
        drag,
      )
      movePoint(
        aNext,
        targetX + ax * shoulder,
        targetY + ay * shoulder,
        shoulderStrength,
        drag,
      )
      movePoint(
        bPrev,
        targetX - bx * shoulder,
        targetY - by * shoulder,
        shoulderStrength,
        drag,
      )
      movePoint(
        bNext,
        targetX + bx * shoulder,
        targetY + by * shoulder,
        shoulderStrength,
        drag,
      )
    }
  }

  solvePegCollisions(rope, pegs) {
    for (let index = 1; index < rope.points.length - 1; index++) {
      const point = rope.points[index]

      for (const peg of pegs) {
        if (peg.ropeId === rope.id) continue

        const dx = point.x - peg.x
        const dy = point.y - peg.y
        const minDistance = peg.radius
        const currentSquared = dx * dx + dy * dy

        if (currentSquared >= minDistance * minDistance) continue

        const current = Math.max(EPSILON, Math.sqrt(currentSquared))
        const push = (minDistance - current) / current
        point.x += dx * push
        point.y += dy * push
      }
    }
  }

  solveBoundary(rope, boundary) {
    const { x, y, radius } = boundary
    for (let index = 1; index < rope.points.length - 1; index++) {
      const point = rope.points[index]
      const dx = point.x - x
      const dy = point.y - y
      const current = Math.max(EPSILON, Math.hypot(dx, dy))
      if (current <= radius) continue

      point.x = x + (dx / current) * radius
      point.y = y + (dy / current) * radius
    }
  }

  applyCrossingFriction(contacts) {
    const dampPoint = (point, retainVelocity = 0.58) => {
      if (!point || point.pinned) return
      const velocityX = point.x - point.oldX
      const velocityY = point.y - point.oldY
      point.oldX = point.x - velocityX * retainVelocity
      point.oldY = point.y - velocityY * retainVelocity
    }

    for (const contact of contacts) {
      const ropeA = this.ropes.get(contact.aId)
      const ropeB = this.ropes.get(contact.bId)
      if (!ropeA || !ropeB) continue

      dampPoint(ropeA.points[contact.aSegment])
      dampPoint(ropeA.points[contact.aSegment + 1])
      dampPoint(ropeB.points[contact.bSegment])
      dampPoint(ropeB.points[contact.bSegment + 1])
    }
  }

  getContacts() {
    return this.contacts
  }

  getPoints(id) {
    return this.ropes.get(id)?.points ?? []
  }

  getTension(id) {
    return this.ropes.get(id)?.tension ?? 0
  }
}
