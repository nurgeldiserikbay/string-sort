export const TOTAL_LEVELS = 100

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
    order: [0, 1, 0, 1, 2, 2, null],
    parMoves: 1,
    targetTime: 35,
    tutorial: 'Move a peg into the empty socket. The old spot becomes empty.',
    initialHint: { from: 1, to: 6 },
  },
  2: {
    order: [0, 1, 0, 2, 1, 2, 3, 3, null],
    parMoves: 2,
    targetTime: 40,
    tutorial: 'Watch the Crossings counter. Lower is better.',
  },
  3: {
    order: [0, 1, 2, 0, 1, 2, 3, 3, null],
    parMoves: 2,
    targetTime: 42,
    tutorial: 'Stuck? Hint highlights a swap that improves the board.',
  },
  4: {
    order: [0, 1, 2, 3, 0, 1, 2, 3, null],
    parMoves: 3,
    targetTime: 48,
    tutorial: 'Reach zero crossings to finish the level.',
  },
  5: {
    order: [0, 1, 2, 0, 3, 1, 4, 2, 3, 4, null],
    parMoves: 3,
    targetTime: 58,
  },
  6: {
    order: [0, 1, 2, 3, 0, 4, 1, 2, 3, 4, null],
    parMoves: 4,
    targetTime: 62,
  },
  7: {
    order: [0, 1, 2, 3, 4, 0, 1, 2, 3, 4, null],
    parMoves: 4,
    targetTime: 68,
  },
  8: {
    order: [5, 3, 0, 4, 1, 2, 5, 4, 3, 0, 2, 1, null],
    parMoves: 4,
    targetTime: 78,
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
    if (ropeId == null) return
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
  return [
    ...Array.from({ length: ropeCount }, (_, id) => [id, id]).flat(),
    null,
  ]
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
  const ropeIds = [...new Set(working.filter((ropeId) => ropeId != null))]
    .sort((a, b) => a - b)
  const target = [
    ...ropeIds.flatMap((ropeId) => [ropeId, ropeId]),
    null,
  ]
  const moves = []
  const maxMoves = working.length * working.length

  for (let step = 0; step < maxMoves; step++) {
    if (working.every((value, index) => value === target[index])) break

    const emptyIndex = working.indexOf(null)
    if (emptyIndex < 0) break

    const desired = target[emptyIndex]
    let fromIndex = -1

    if (desired == null) {
      fromIndex = working.findIndex(
        (value, index) => index !== emptyIndex && value !== target[index],
      )
    } else {
      const candidates = []
      working.forEach((value, index) => {
        if (index !== emptyIndex && value === desired) candidates.push(index)
      })

      fromIndex = candidates.find((index) => working[index] !== target[index])
        ?? candidates[0]
        ?? -1
    }

    if (fromIndex < 0) break

    ;[working[emptyIndex], working[fromIndex]] = [
      working[fromIndex],
      working[emptyIndex],
    ]

    moves.push({
      from: fromIndex,
      to: emptyIndex,
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
      initialHint: intro.initialHint ?? null,
    }
  }

  let ropeCount
  let minCrossings

  if (levelNumber <= 24) {
    ropeCount = 6
    minCrossings = 8 + Math.floor((levelNumber - 9) / 3)
  } else if (levelNumber <= 49) {
    ropeCount = 7
    minCrossings = 10 + Math.floor((levelNumber - 25) / 4)
  } else {
    ropeCount = 8
    minCrossings = 12 + Math.floor((levelNumber - 50) / 5)
  }

  const maxCrossings = Math.floor((ropeCount * (ropeCount - 1)) / 2)
  minCrossings = Math.min(maxCrossings, Math.max(1, minCrossings))

  const order = shuffleForLevel(ropeCount, 9001 + levelNumber * 7919, minCrossings)
  const actualCrossings = countCrossings(order)

  return {
    id: levelNumber,
    ropeCount,
    socketCount: order.length,
    order,
    parMoves: Math.max(3, getGuaranteedSolveMoves(order).length),
    targetTime: Math.min(130, 30 + ropeCount * 5 + actualCrossings * 3),
  }
}

export function getCrossingCount(order) {
  return countCrossings(order)
}

export function findBestSwap(order) {
  const current = countCrossings(order)
  const emptyIndex = order.indexOf(null)
  if (emptyIndex < 0) return null

  let best = null

  for (let from = 0; from < order.length; from++) {
    if (from === emptyIndex || order[from] == null) continue

    const candidate = [...order]
    ;[candidate[from], candidate[emptyIndex]] = [
      candidate[emptyIndex],
      candidate[from],
    ]
    const crossings = countCrossings(candidate)

    if (!best || crossings < best.crossings) {
      best = { from, to: emptyIndex, crossings }
    }
  }

  if (best && best.crossings < current) return best

  const fallback = getGuaranteedSolveMoves(order)[0]
  return fallback ? { ...fallback, fallback: true } : null
}
