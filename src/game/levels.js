export const ROPE_COLORS = [
  '#ff4b4b',
  '#2f9bff',
  '#36c76b',
  '#ffc62e',
  '#b85cff',
  '#ff7a22',
  '#24c7d9',
  '#ff5eaa',
]

const INTRO_LEVELS = {
  1: {
    order: [0, 1, 0, 2, 1, 3, 2, 3],
    parMoves: 2,
    targetTime: 55,
    tutorial: 'Drag one colored peg onto another peg to swap them.',
  },
  2: {
    order: [0, 1, 2, 0, 3, 2, 1, 3],
    parMoves: 1,
    targetTime: 48,
    tutorial: 'Try to reduce the crossing counter with every move.',
  },
  3: {
    order: [0, 1, 2, 3, 0, 1, 2, 3],
    parMoves: 2,
    targetTime: 52,
    tutorial: 'No crossings left means the level is solved.',
  },
}

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function countCrossings(order) {
  const positionsByRope = new Map()
  order.forEach((ropeId, index) => {
    const list = positionsByRope.get(ropeId) ?? []
    list.push(index)
    positionsByRope.set(ropeId, list)
  })

  const pairs = [...positionsByRope.values()]
  let crossings = 0

  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const [a, b] = pairs[i].sort((x, y) => x - y)
      const [c, d] = pairs[j].sort((x, y) => x - y)
      if ((a < c && c < b && b < d) || (c < a && a < d && d < b)) crossings++
    }
  }

  return crossings
}

function makeSolvedOrder(ropeCount) {
  return Array.from({ length: ropeCount }, (_, id) => [id, id]).flat()
}

function shuffleForLevel(ropeCount, seed, minCrossings) {
  const random = seededRandom(seed)
  const base = makeSolvedOrder(ropeCount)
  let best = [...base]
  let bestScore = 0

  for (let attempt = 0; attempt < 160; attempt++) {
    const candidate = [...base]
    for (let i = candidate.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[candidate[i], candidate[j]] = [candidate[j], candidate[i]]
    }

    const score = countCrossings(candidate)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
    if (score >= minCrossings) return candidate
  }

  return best
}


export function getGuaranteedSolveMoves(order) {
  const working = [...order]
  const moves = []

  for (let index = 0; index < working.length; index += 2) {
    if (working[index] === working[index + 1]) continue

    const matchIndex = working.findIndex(
      (ropeId, candidateIndex) =>
        candidateIndex > index + 1 && ropeId === working[index],
    )

    if (matchIndex === -1) continue

    ;[working[index + 1], working[matchIndex]] = [
      working[matchIndex],
      working[index + 1],
    ]
    moves.push({
      from: index + 1,
      to: matchIndex,
      crossings: countCrossings(working),
    })
  }

  return moves
}

export function createLevel(levelNumber) {
  const intro = INTRO_LEVELS[levelNumber]
  if (intro) {
    const ropeCount = new Set(intro.order).size
    return {
      id: levelNumber,
      ropeCount,
      socketCount: intro.order.length,
      order: [...intro.order],
      parMoves: intro.parMoves,
      targetTime: intro.targetTime,
      tutorial: intro.tutorial,
    }
  }

  const ropeCount = Math.min(8, 4 + Math.floor((levelNumber - 1) / 4))
  const minCrossings = Math.min(
    Math.floor((ropeCount * (ropeCount - 1)) / 2),
    2 + Math.floor(levelNumber * 0.7),
  )

  const order = shuffleForLevel(ropeCount, 9001 + levelNumber * 7919, minCrossings)

  return {
    id: levelNumber,
    ropeCount,
    socketCount: ropeCount * 2,
    order,
    parMoves: Math.max(3, getGuaranteedSolveMoves(order).length),
    targetTime: 28 + ropeCount * 7 + levelNumber * 1.5,
  }
}

export function getCrossingCount(order) {
  return countCrossings(order)
}

export function findBestSwap(order) {
  const current = countCrossings(order)
  let best = null

  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[i] === order[j]) continue
      const candidate = [...order]
      ;[candidate[i], candidate[j]] = [candidate[j], candidate[i]]
      const crossings = countCrossings(candidate)
      if (!best || crossings < best.crossings) {
        best = { from: i, to: j, crossings }
      }
    }
  }

  if (best && best.crossings < current) return best

  const fallback = getGuaranteedSolveMoves(order)[0]
  return fallback ? { ...fallback, fallback: true } : null
}
