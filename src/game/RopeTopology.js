const EPSILON = 1e-6

function pairKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx
}

export function segmentIntersection(a, b, c, d, edgePadding = 0.025) {
  const rX = b.x - a.x
  const rY = b.y - a.y
  const sX = d.x - c.x
  const sY = d.y - c.y

  const denominator = cross(rX, rY, sX, sY)
  if (Math.abs(denominator) < EPSILON) return null

  const qpx = c.x - a.x
  const qpy = c.y - a.y
  const t = cross(qpx, qpy, sX, sY) / denominator
  const u = cross(qpx, qpy, rX, rY) / denominator

  if (
    t <= edgePadding || t >= 1 - edgePadding
    || u <= edgePadding || u >= 1 - edgePadding
  ) {
    return null
  }

  return {
    x: a.x + rX * t,
    y: a.y + rY * t,
    t,
    u,
  }
}

function boxesOverlap(a, b, c, d) {
  const abMinX = Math.min(a.x, b.x)
  const abMaxX = Math.max(a.x, b.x)
  const abMinY = Math.min(a.y, b.y)
  const abMaxY = Math.max(a.y, b.y)
  const cdMinX = Math.min(c.x, d.x)
  const cdMaxX = Math.max(c.x, d.x)
  const cdMinY = Math.min(c.y, d.y)
  const cdMaxY = Math.max(c.y, d.y)

  return !(
    abMaxX < cdMinX
    || cdMaxX < abMinX
    || abMaxY < cdMinY
    || cdMaxY < abMinY
  )
}

function contactDistanceSquared(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export function detectRopeCrossings(ropes, {
  maxContactsPerPair = 5,
  dedupeDistance = 14,
} = {}) {
  const contacts = []
  const dedupeDistanceSquared = dedupeDistance * dedupeDistance

  for (let ropeIndex = 0; ropeIndex < ropes.length; ropeIndex++) {
    const ropeA = ropes[ropeIndex]
    if (!ropeA?.points?.length) continue

    for (let otherIndex = ropeIndex + 1; otherIndex < ropes.length; otherIndex++) {
      const ropeB = ropes[otherIndex]
      if (!ropeB?.points?.length) continue

      const pairContacts = []

      for (let aSegment = 0; aSegment < ropeA.points.length - 1; aSegment++) {
        const a0 = ropeA.points[aSegment]
        const a1 = ropeA.points[aSegment + 1]

        for (let bSegment = 0; bSegment < ropeB.points.length - 1; bSegment++) {
          const b0 = ropeB.points[bSegment]
          const b1 = ropeB.points[bSegment + 1]
          if (!boxesOverlap(a0, a1, b0, b1)) continue

          const hit = segmentIntersection(a0, a1, b0, b1)
          if (!hit) continue

          const duplicate = pairContacts.some(
            (contact) => contactDistanceSquared(contact, hit) < dedupeDistanceSquared,
          )
          if (duplicate) continue

          pairContacts.push({
            ...hit,
            pair: pairKey(ropeA.id, ropeB.id),
            aId: ropeA.id,
            bId: ropeB.id,
            aSegment,
            bSegment,
          })

          if (pairContacts.length >= maxContactsPerPair) break
        }

        if (pairContacts.length >= maxContactsPerPair) break
      }

      contacts.push(...pairContacts)
    }
  }

  return contacts
}

function mix(value) {
  let x = value >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d)
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b)
  x ^= x >>> 16
  return x >>> 0
}

export function stableDepthOrder(ropeIds, seed = 0x51f15e) {
  return [...ropeIds].sort((a, b) => {
    const aScore = mix((a + 1) * 977 + seed)
    const bScore = mix((b + 1) * 977 + seed)
    return aScore - bScore || a - b
  })
}

export function topRopeAtContact(contact, depthOrder) {
  const depth = new Map(depthOrder.map((id, index) => [id, index]))
  return (depth.get(contact.aId) ?? 0) > (depth.get(contact.bId) ?? 0)
    ? contact.aId
    : contact.bId
}
