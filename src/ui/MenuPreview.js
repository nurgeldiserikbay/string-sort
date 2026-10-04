const COLORS = ['#ff4757', '#2d8cff', '#34c96b', '#ffd23f', '#9b5de5']

function drawCord(ctx, points, color, width) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2
    ctx.quadraticCurveTo(current.x, current.y, midX, midY)
  }
  ctx.lineTo(points.at(-1).x, points.at(-1).y)

  ctx.strokeStyle = 'rgba(0,0,0,.34)'
  ctx.lineWidth = width + 4
  ctx.shadowColor = 'rgba(0,0,0,.3)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 3
  ctx.stroke()

  ctx.shadowColor = 'transparent'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2
    ctx.quadraticCurveTo(current.x, current.y, midX, midY)
  }
  ctx.lineTo(points.at(-1).x, points.at(-1).y)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()

  ctx.restore()
}

function pointOnRing(cx, cy, radius, angle) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  }
}

export function installMenuPreview(canvas) {
  if (!canvas) return () => {}

  const render = () => {
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, rect.width)
    const height = Math.max(1, rect.height)
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const size = Math.min(width, height)
    const cx = width / 2
    const cy = height / 2
    const boardRadius = size * 0.46

    ctx.save()
    ctx.shadowColor = 'rgba(73,48,24,.2)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 10

    const board = ctx.createRadialGradient(
      cx - boardRadius * 0.28,
      cy - boardRadius * 0.34,
      boardRadius * 0.05,
      cx,
      cy,
      boardRadius,
    )
    board.addColorStop(0, '#676a73')
    board.addColorStop(0.58, '#50535c')
    board.addColorStop(1, '#3c3f48')

    ctx.fillStyle = board
    ctx.beginPath()
    ctx.arc(cx, cy, boardRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const ringRadius = boardRadius * 0.82
    const sockets = 11
    const socketRadius = Math.max(5, size * 0.025)
    const socketPoints = Array.from({ length: sockets }, (_, index) => (
      pointOnRing(
        cx,
        cy,
        ringRadius,
        -Math.PI / 2 + (index / sockets) * Math.PI * 2,
      )
    ))

    socketPoints.forEach((point, index) => {
      if (index === sockets - 1) return

      ctx.fillStyle = 'rgba(0,0,0,.28)'
      ctx.beginPath()
      ctx.arc(point.x, point.y + 2, socketRadius * 1.12, 0, Math.PI * 2)
      ctx.fill()
    })

    const routes = [
      [0, { x: cx - size * .06, y: cy - size * .02 }, { x: cx + size * .07, y: cy + size * .07 }, 5],
      [2, { x: cx + size * .04, y: cy - size * .08 }, { x: cx - size * .07, y: cy + size * .04 }, 7],
      [4, { x: cx + size * .09, y: cy + size * .02 }, { x: cx - size * .04, y: cy - size * .07 }, 9],
      [1, { x: cx - size * .02, y: cy + size * .09 }, { x: cx + size * .03, y: cy - size * .03 }, 6],
      [3, { x: cx - size * .09, y: cy + size * .03 }, { x: cx + size * .06, y: cy - size * .06 }, 8],
    ]

    routes.forEach((route, ropeId) => {
      const [startIndex, a, b, endIndex] = route
      drawCord(
        ctx,
        [socketPoints[startIndex], a, b, socketPoints[endIndex]],
        COLORS[ropeId],
        Math.max(5.5, size * 0.022),
      )
    })

    routes.forEach((route, ropeId) => {
      const [startIndex, , , endIndex] = route
      const color = COLORS[ropeId]
      for (const socketIndex of [startIndex, endIndex]) {
        const point = socketPoints[socketIndex]
        const gradient = ctx.createRadialGradient(
          point.x - socketRadius * .32,
          point.y - socketRadius * .35,
          1,
          point.x,
          point.y,
          socketRadius,
        )
        gradient.addColorStop(0, '#fff')
        gradient.addColorStop(.12, color)
        gradient.addColorStop(.72, color)
        gradient.addColorStop(1, '#171a20')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, socketRadius * 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    const empty = socketPoints.at(-1)
    ctx.fillStyle = '#5b5e67'
    ctx.beginPath()
    ctx.arc(empty.x, empty.y, socketRadius * .86, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.16)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(empty.x, empty.y, socketRadius * .62, 0, Math.PI * 2)
    ctx.stroke()
  }

  render()

  const observer = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(render)
    : null

  observer?.observe(canvas)
  const onResize = observer ? null : () => render()
  if (onResize) window.addEventListener('resize', onResize)

  return () => {
    observer?.disconnect()
    if (onResize) window.removeEventListener('resize', onResize)
  }
}
