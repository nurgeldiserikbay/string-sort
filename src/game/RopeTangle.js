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

  update(order, geometry) {
    const pairs = getKnotPairs(order)
    const previous = this.knotMap
    const nextMap = new Map()

    const sortedPairs = pairs
      .map((pair) => ({
        ...pair,
        key: pairKey(pair.aId, pair.bId),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))

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
      const radialBand = 0.09 + (((hash >>> 10) & 255) / 255) * 0.27
      const radius = geometry.boardRadius * radialBand

      const knot = {
        key,
        aId: pair.aId,
        bId: pair.bId,
        topId: prior?.topId ?? ((hash & 1) ? pair.aId : pair.bId),
        twistAngle: prior?.twistAngle
          ?? (((hash >>> 18) & 1023) / 1023) * Math.PI,
        wraps: prior?.wraps
          ?? (
            sortedPairs.length >= 8 && index % 7 === 0
              ? 3
              : sortedPairs.length >= 4 && index % 3 === 0
                ? 2
                : 1
          ),
        x: prior?.x ?? geometry.cx + Math.cos(angle) * radius,
        y: prior?.y ?? geometry.cy + Math.sin(angle) * radius,
        aT: prior?.aT ?? 0.5,
        bT: prior?.bT ?? 0.5,
        stiffness: 0.2,
        drag: 0.72,
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
    this.relaxCenters(geometry)
    return this.knots
  }

  relaxCenters(geometry) {
    const maxRadius = geometry.boardRadius * 0.44
    const minDistance = Math.max(18, geometry.boardRadius * 0.09)

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

          const push = (minDistance - distance) * 0.24
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

  followPhysics(physics, geometry) {
    const maxRadius = geometry.boardRadius * 0.46

    const nearestT = (points, x, y, currentT) => {
      const last = points.length - 1
      const currentIndex = clamp(Math.round(last * currentT), 2, last - 2)
      let bestIndex = currentIndex
      let bestScore = Infinity

      for (let index = 2; index <= last - 2; index++) {
        const point = points[index]
        const distance = Math.hypot(point.x - x, point.y - y)
        const travelPenalty = Math.abs(index - currentIndex) * 2.2
        const score = distance + travelPenalty

        if (score < bestScore) {
          bestScore = score
          bestIndex = index
        }
      }

      return clamp(bestIndex / last, 0.12, 0.88)
    }

    for (const knot of this.knots) {
      const ropeA = physics.getPoints(knot.aId)
      const ropeB = physics.getPoints(knot.bId)
      if (ropeA.length < 5 || ropeB.length < 5) continue

      const nextAT = nearestT(ropeA, knot.x, knot.y, knot.aT)
      const nextBT = nearestT(ropeB, knot.x, knot.y, knot.bT)
      const slide = 0.055

      knot.aT += (nextAT - knot.aT) * slide
      knot.bT += (nextBT - knot.bT) * slide

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
      const follow = 0.09

      knot.x += (targetX - knot.x) * follow
      knot.y += (targetY - knot.y) * follow

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
      const wraps = Math.max(1, knot.wraps ?? 1)
      const spacing = wraps >= 3 ? 9 : 10
      const nx = -Math.sin(knot.twistAngle ?? 0)
      const ny = Math.cos(knot.twistAngle ?? 0)

      for (let wrapIndex = 0; wrapIndex < wraps; wrapIndex++) {
        const centered = wrapIndex - (wraps - 1) / 2
        const offset = centered * spacing
        const tOffset = centered * 0.055
        const alternate = wrapIndex % 2 === 0

        constraints.push({
          ...knot,
          key: `${knot.key}#${wrapIndex}`,
          parentKey: knot.key,
          wrapIndex,
          wraps,
          topId: alternate
            ? knot.topId
            : knot.topId === knot.aId
              ? knot.bId
              : knot.aId,
          x: knot.x + nx * offset,
          y: knot.y + ny * offset,
          aIndex: clamp(
            Math.round(aCount * clamp(knot.aT + tOffset, 0.12, 0.88)),
            2,
            Math.max(2, aCount - 2),
          ),
          bIndex: clamp(
            Math.round(bCount * clamp(knot.bT - tOffset, 0.12, 0.88)),
            2,
            Math.max(2, bCount - 2),
          ),
          stiffness: wraps >= 3 ? 0.15 : wraps > 1 ? 0.17 : knot.stiffness,
          drag: wraps >= 3 ? 0.62 : wraps > 1 ? 0.66 : knot.drag,
        })
      }
    }

    return constraints
  }
}
