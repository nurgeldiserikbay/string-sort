export const TOTAL_LEVELS = 100

export const ROPE_COLORS = [
  '#ff4757',
  '#2d8cff',
  '#34c96b',
  '#ffd23f',
  '#9b5de5',
  '#ff8c32',
  '#24c7d9',
  '#ff67ae',
  '#8bd450',
  '#9b6b43',
  '#536dfe',
  '#ff6b6b',
]

const INTRO_LEVELS = {
  1: {
    order: [0, 1, 0, 1, 2, 2, null],
    parMoves: 1,
    targetTime: 35,
    tutorial: 'Move the glowing peg into the empty socket.',
    initialHint: { from: 1, to: 6 },
  },
  2: {
    order: [0, 1, 0, 2, 1, 2, 3, 3, null],
    parMoves: 2,
    targetTime: 40,
    tutorial: 'Each move shifts the empty socket. Reduce the Knots counter.',
  },
  3: {
    order: [0, 1, 2, 0, 1, 2, 3, 3, null],
    parMoves: 2,
    targetTime: 42,
    tutorial: 'Stuck? Hint shows a move that loosens the tangle.',
  },
  4: {
    order: [2, 3, 1, null, 0, 2, 1, 0, 3],
    parMoves: 3,
    targetTime: 48,
    tutorial: 'No knots left means the level is complete.',
  },
  5: {
    order: [0, 1, null, 2, 4, 0, 1, 4, 3, 2, 3],
    parMoves: 3,
    targetTime: 56,
  },
  6: {
    order: [null, 3, 0, 2, 3, 1, 4, 0, 1, 2, 4],
    parMoves: 4,
    targetTime: 60,
  },
  7: {
    order: [3, 1, 0, 2, 4, 3, 2, null, 1, 0, 4],
    parMoves: 4,
    targetTime: 66,
  },
  8: {
    order: [3, 1, null, 5, 2, 3, 4, 0, 1, 0, 5, 4, 2],
    parMoves: 4,
    targetTime: 74,
  },
}

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function getKnotPairs(order) {
  const positionsByRope = new Map()

  order.forEach((ropeId, index) => {
    if (ropeId == null) return
    const list = positionsByRope.get(ropeId) ?? []
    list.push(index)
    positionsByRope.set(ropeId, list)
  })

  const entries = [...positionsByRope.entries()]
    .filter(([, positions]) => positions.length === 2)
    .map(([ropeId, positions]) => ({
      ropeId,
      positions: [...positions].sort((a, b) => a - b),
    }))
    .sort((a, b) => a.ropeId - b.ropeId)

  const knots = []

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const first = entries[i]
      const second = entries[j]
      const [a, b] = first.positions
      const [c, d] = second.positions
      const crosses = (
        (a < c && c < b && b < d)
        || (c < a && a < d && d < b)
      )

      if (!crosses) continue

      knots.push({
        aId: first.ropeId,
        bId: second.ropeId,
        aPositions: first.positions,
        bPositions: second.positions,
      })
    }
  }

  return knots
}

export function getKnotGraphStats(order) {
  const ropeIds = [...new Set(order.filter((ropeId) => ropeId != null))]
    .sort((a, b) => a - b)
  const knots = getKnotPairs(order)
  const adjacency = new Map(ropeIds.map((ropeId) => [ropeId, new Set()]))

  for (const knot of knots) {
    adjacency.get(knot.aId)?.add(knot.bId)
    adjacency.get(knot.bId)?.add(knot.aId)
  }

  const involvedRopes = [...adjacency.values()]
    .filter((neighbors) => neighbors.size > 0)
    .length

  const visited = new Set()
  let components = 0

  for (const ropeId of ropeIds) {
    if (visited.has(ropeId)) continue
    components++

    const stack = [ropeId]
    while (stack.length) {
      const current = stack.pop()
      if (visited.has(current)) continue
      visited.add(current)

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) stack.push(neighbor)
      }
    }
  }

  const maxDegree = Math.max(
    0,
    ...[...adjacency.values()].map((neighbors) => neighbors.size),
  )

  return {
    ropeCount: ropeIds.length,
    knotCount: knots.length,
    involvedRopes,
    components,
    connected: ropeIds.length > 0 && components === 1,
    maxDegree,
  }
}

function countCrossings(order) {
  return getKnotPairs(order).length
}

function makeSolvedOrder(ropeCount) {
  return [
    ...Array.from({ length: ropeCount }, (_, id) => [id, id]).flat(),
    null,
  ]
}

function shuffleForLevel(
  ropeCount,
  seed,
  minCrossings,
  {
    minInvolvedRopes = Math.max(2, ropeCount - 1),
    requireConnected = false,
    maxCrossings = minCrossings + 1,
  } = {},
) {
  const random = seededRandom(seed)
  const base = makeSolvedOrder(ropeCount)
  let best = [...base]
  let bestRank = -Infinity

  for (let attempt = 0; attempt < 320; attempt++) {
    const candidate = [...base]
    for (let i = candidate.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[candidate[i], candidate[j]] = [candidate[j], candidate[i]]
    }

    const stats = getKnotGraphStats(candidate)
    const crossingDistance = Math.abs(stats.knotCount - minCrossings)
    const overshoot = Math.max(0, stats.knotCount - maxCrossings)
    const rank = (
      stats.involvedRopes * 5
      - stats.components * 8
      + stats.maxDegree
      - crossingDistance * 10
      - overshoot * 24
    )

    if (rank > bestRank) {
      best = candidate
      bestRank = rank
    }

    if (
      stats.knotCount >= minCrossings
      && stats.knotCount <= maxCrossings
      && stats.involvedRopes >= minInvolvedRopes
      && (!requireConnected || stats.connected)
    ) {
      return candidate
    }
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
    const ropeCount = new Set(
      intro.order.filter((ropeId) => ropeId != null),
    ).size
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
    minCrossings = 5 + Math.floor((levelNumber - 9) / 8)
  } else if (levelNumber <= 49) {
    ropeCount = 7
    minCrossings = 7 + Math.floor((levelNumber - 25) / 12)
  } else if (levelNumber <= 74) {
    ropeCount = 8
    minCrossings = 8 + Math.floor((levelNumber - 50) / 12)
  } else {
    ropeCount = 9
    minCrossings = 9 + Math.floor((levelNumber - 75) / 12)
  }

  const maxCrossings = Math.floor((ropeCount * (ropeCount - 1)) / 2)
  minCrossings = Math.min(maxCrossings, Math.max(1, minCrossings))

  const order = shuffleForLevel(
    ropeCount,
    9001 + levelNumber * 7919,
    minCrossings,
    {
      minInvolvedRopes: levelNumber <= 16 ? ropeCount - 1 : ropeCount,
      requireConnected: levelNumber >= 25,
      maxCrossings: Math.min(maxCrossings, minCrossings + 1),
    },
  )
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
  if (emptyIndex < 0 || current === 0) return null

  const guaranteed = getGuaranteedSolveMoves(order)
  const currentDistance = guaranteed.length
  let best = null

  for (let from = 0; from < order.length; from++) {
    if (from === emptyIndex || order[from] == null) continue

    const candidate = [...order]
    ;[candidate[from], candidate[emptyIndex]] = [
      candidate[emptyIndex],
      candidate[from],
    ]

    const crossings = countCrossings(candidate)
    const solveDistance = getGuaranteedSolveMoves(candidate).length

    // A hint must always make measurable progress toward a known solved
    // arrangement. Without this guard, a locally good knot-reducing move
    // can send the stateless hint system into a loop on larger boards.
    if (solveDistance >= currentDistance) continue

    if (
      !best
      || crossings < best.crossings
      || (
        crossings === best.crossings
        && solveDistance < best.solveDistance
      )
    ) {
      best = {
        from,
        to: emptyIndex,
        crossings,
        solveDistance,
      }
    }
  }

  if (best) {
    return {
      from: best.from,
      to: best.to,
      crossings: best.crossings,
      fallback: best.crossings >= current,
    }
  }

  const fallback = guaranteed[0]
  return fallback ? { ...fallback, fallback: true } : null
}
