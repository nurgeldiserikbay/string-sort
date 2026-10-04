import { getKnotPairs } from './levels.js'

const TAU = Math.PI * 2

function mix(value) {
  let x = value >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d)
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b)
  x ^= x >>> 16
  return x >>> 0
}

function pairKey(aId, bId) {
  return aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function segmentIntersection(a0, a1, b0, b1) {
  const rX = a1.x - a0.x
  const rY = a1.y - a0.y
  const sX = b1.x - b0.x
  const sY = b1.y - b0.y
  const denominator = rX * sY - rY * sX

  if (Math.abs(denominator) < 0.00001) return null

  const qX = b0.x - a0.x
  const qY = b0.y - a0.y
  const t = (qX * sY - qY * sX) / denominator
  const u = (qX * rY - qY * rX) / denominator

  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null

  return {
    x: a0.x + rX * t,
    y: a0.y + rY * t,
    aT: clamp(t, 0.12, 0.88),
    bT: clamp(u, 0.12, 0.88),
  }
}

function geometricKnot(pair, socketPositions) {
  if (!socketPositions) return null

  const [a0Index, a1Index] = pair.aPositions ?? []
  const [b0Index, b1Index] = pair.bPositions ?? []
  const a0 = socketPositions[a0Index]
  const a1 = socketPositions[a1Index]
  const b0 = socketPositions[b0Index]
  const b1 = socketPositions[b1Index]

  if (!a0 || !a1 || !b0 || !b1) return null
  return segmentIntersection(a0, a1, b0, b1)
}

export class RopeTangle {
  constructor(seed = 0x51f15e) {
    this.seed = seed >>> 0
    this.knots = []
    this.knotMap = new Map()
    this.released = []
  }

  clear() {
    this.knots = []
    this.knotMap.clear()
    this.released = []
  }

  update(order, geometry, socketPositions = null) {
    const pairs = getKnotPairs(order)
    const previous = this.knotMap
    const nextMap = new Map()

    const sortedPairs = pairs
      .map((pair) => ({
        ...pair,
        key: pairKey(pair.aId, pair.bId),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))

    const hasNewKnots = sortedPairs.some((pair) => !previous.has(pair.key))
    const ropeKnots = new Map()

    sortedPairs.forEach((pair, index) => {
      const key = pair.key
      const prior = previous.get(key)
      const hash = mix(
        this.seed
        ^ Math.imul(pair.aId + 11, 0x9e3779b1)
        ^ Math.imul(pair.bId + 37, 0x85ebca6b),
      )

      const goldenAngle = 2.399963229728653
      const angle = (
        index * goldenAngle
        + ((hash & 1023) / 1023) * 0.62
      ) % TAU
      const radialBand = 0.12 + (((hash >>> 10) & 255) / 255) * 0.24
      const radius = geometry.boardRadius * radialBand
      const geometric = prior ? null : geometricKnot(pair, socketPositions)

      const knot = {
        key,
        aId: pair.aId,
        bId: pair.bId,
        topId: prior?.topId ?? ((hash & 1) ? pair.aId : pair.bId),
        twistAngle: prior?.twistAngle
          ?? (((hash >>> 18) & 1023) / 1023) * Math.PI,
        // One stable physical contact per logical knot. Multiple artificial
        // wraps made dense boards collapse into unreadable mini-loops.
        wraps: 1,
        x: prior?.x
          ?? geometric?.x
          ?? geometry.cx + Math.cos(angle) * radius,
        y: prior?.y
          ?? geometric?.y
          ?? geometry.cy + Math.sin(angle) * radius,
        aT: prior?.aT ?? geometric?.aT ?? 0.5,
        bT: prior?.bT ?? geometric?.bT ?? 0.5,
        stiffness: 0.16,
        drag: 0.78,
      }

      nextMap.set(key, knot)

      for (const ropeId of [pair.aId, pair.bId]) {
        const list = ropeKnots.get(ropeId) ?? []
        list.push(knot)
        ropeKnots.set(ropeId, list)
      }
    })

    for (const [ropeId, knots] of ropeKnots) {
      knots.sort((a, b) => {
        const aa = Math.atan2(a.y - geometry.cy, a.x - geometry.cx)
        const ba = Math.atan2(b.y - geometry.cy, b.x - geometry.cx)
        return aa - ba
      })

      knots.forEach((knot, index) => {
        // Existing knot contacts keep their rope-relative position.
        // Reassigning aT/bT every frame made the visible tie point jump
        // between particles and was the main source of "swimming" knots.
        if (previous.has(knot.key)) return

        const spread = knots.length <= 1
          ? 0.5
          : 0.24 + (index / (knots.length - 1)) * 0.52

        if (knot.aId === ropeId) knot.aT = spread
        if (knot.bId === ropeId) knot.bT = 1 - spread
      })
    }

    this.released = []

    for (const [key, knot] of previous) {
      if (nextMap.has(key)) continue
      this.released.push({
        key,
        x: knot.x,
        y: knot.y,
        aId: knot.aId,
        bId: knot.bId,
      })
    }

    this.knotMap = nextMap
    this.knots = [...nextMap.values()]

    // Center spreading is layout initialization, not an animation force.
    // Re-running it every frame caused knots to repel one another while
    // physics simultaneously pulled them back, producing visible jitter.
    if (hasNewKnots) this.relaxCenters(geometry)

    return this.knots
  }

  relaxCenters(geometry) {
    const maxRadius = geometry.boardRadius * 0.58
    const minDistance = Math.max(24, geometry.boardRadius * 0.12)

    for (let iteration = 0; iteration < 5; iteration++) {
      for (let i = 0; i < this.knots.length; i++) {
        const a = this.knots[i]

        for (let j = i + 1; j < this.knots.length; j++) {
          const b = this.knots[j]
          let dx = b.x - a.x
          let dy = b.y - a.y
          let distance = Math.hypot(dx, dy)

          if (distance >= minDistance) continue

          if (distance < 0.001) {
            const angle = ((i + 1) * 2.399963229728653) % TAU
            dx = Math.cos(angle)
            dy = Math.sin(angle)
            distance = 1
          }

          const push = (minDistance - distance) * 0.38
          const nx = dx / distance
          const ny = dy / distance

          a.x -= nx * push
          a.y -= ny * push
          b.x += nx * push
          b.y += ny * push
        }
      }

      for (const knot of this.knots) {
        const dx = knot.x - geometry.cx
        const dy = knot.y - geometry.cy
        const distance = Math.hypot(dx, dy)

        if (distance > maxRadius) {
          const scale = maxRadius / distance
          knot.x = geometry.cx + dx * scale
          knot.y = geometry.cy + dy * scale
        }
      }
    }
  }

  followPhysics(physics, geometry, { activeRopeId = null } = {}) {
    const maxRadius = geometry.boardRadius * 0.58
    const centerDeadZone = Math.max(1.15, geometry.boardRadius * 0.006)

    const nearestT = (points, x, y, currentT) => {
      const last = points.length - 1
      const currentIndex = clamp(Math.round(last * currentT), 2, last - 2)
      const searchStart = Math.max(2, currentIndex - 2)
      const searchEnd = Math.min(last - 2, currentIndex + 2)
      const currentPoint = points[currentIndex]
      const currentScore = Math.hypot(currentPoint.x - x, currentPoint.y - y)
      let bestIndex = currentIndex
      let bestScore = currentScore

      // Only search locally around the existing contact. A global nearest
      // point search can suddenly jump to a different loop of the same rope.
      for (let index = searchStart; index <= searchEnd; index++) {
        const point = points[index]
        const distance = Math.hypot(point.x - x, point.y - y)
        const travelPenalty = Math.abs(index - currentIndex) * 3.4
        const score = distance + travelPenalty

        if (score < bestScore) {
          bestScore = score
          bestIndex = index
        }
      }

      // Hysteresis keeps the contact on its current particle unless moving
      // to a neighbor is meaningfully better.
      if (currentScore - bestScore < 2.4) return currentT

      return clamp(bestIndex / last, 0.12, 0.88)
    }

    const slideToward = (current, target, response, maxStep) => {
      const requested = (target - current) * response
      return current + clamp(requested, -maxStep, maxStep)
    }

    for (const knot of this.knots) {
      const isActivelyPulled = (
        activeRopeId != null
        && (knot.aId === activeRopeId || knot.bId === activeRopeId)
      )
      const maxCenterStep = isActivelyPulled
        ? Math.max(0.45, geometry.boardRadius * 0.0035)
        : Math.max(0.08, geometry.boardRadius * 0.00055)
      const maxTStep = isActivelyPulled ? 0.0014 : 0.00018
      const slideResponse = isActivelyPulled ? 0.018 : 0.006
      const ropeA = physics.getPoints(knot.aId)
      const ropeB = physics.getPoints(knot.bId)
      if (ropeA.length < 5 || ropeB.length < 5) continue

      const nextAT = nearestT(ropeA, knot.x, knot.y, knot.aT)
      const nextBT = nearestT(ropeB, knot.x, knot.y, knot.bT)

      knot.aT = slideToward(knot.aT, nextAT, slideResponse, maxTStep)
      knot.bT = slideToward(knot.bT, nextBT, slideResponse, maxTStep)

      const aIndex = clamp(
        Math.round((ropeA.length - 1) * knot.aT),
        2,
        ropeA.length - 3,
      )
      const bIndex = clamp(
        Math.round((ropeB.length - 1) * knot.bT),
        2,
        ropeB.length - 3,
      )

      const a = ropeA[aIndex]
      const b = ropeB[bIndex]
      const targetX = (a.x + b.x) / 2
      const targetY = (a.y + b.y) / 2
      const targetDx = targetX - knot.x
      const targetDy = targetY - knot.y
      const targetDistance = Math.hypot(targetDx, targetDy)

      if (targetDistance > centerDeadZone) {
        const desiredStep = Math.min(
          maxCenterStep,
          (targetDistance - centerDeadZone) * 0.035,
        )
        knot.x += (targetDx / targetDistance) * desiredStep
        knot.y += (targetDy / targetDistance) * desiredStep
      }

      const dx = knot.x - geometry.cx
      const dy = knot.y - geometry.cy
      const distance = Math.hypot(dx, dy)

      if (distance > maxRadius) {
        const scale = maxRadius / distance
        knot.x = geometry.cx + dx * scale
        knot.y = geometry.cy + dy * scale
      }
    }
  }

  getKnots() {
    return this.knots
  }

  consumeReleased() {
    const released = this.released
    this.released = []
    return released
  }

  buildConstraints(segmentCounts) {
    const constraints = []

    for (const knot of this.knots) {
      const aCount = segmentCounts.get(knot.aId) ?? 1
      const bCount = segmentCounts.get(knot.bId) ?? 1

      constraints.push({
        ...knot,
        key: `${knot.key}#0`,
        parentKey: knot.key,
        wrapIndex: 0,
        wraps: 1,
        aIndex: clamp(
          Math.round(aCount * clamp(knot.aT, 0.12, 0.88)),
          2,
          Math.max(2, aCount - 2),
        ),
        bIndex: clamp(
          Math.round(bCount * clamp(knot.bT, 0.12, 0.88)),
          2,
          Math.max(2, bCount - 2),
        ),
      })
    }

    return constraints
  }
}
