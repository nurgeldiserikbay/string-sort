// Multi-colour drawn icons for the prominent spots (menu cards, HUD, round
// actions), matching the toy-like mockups. Line icons in icons.js stay for
// places that tint by currentColor (buttons, settings rows, modals).

function gearPath(cx, cy, outer, inner, teeth) {
  const step = (Math.PI * 2) / teeth
  const half = step * 0.24
  const points = []
  for (let i = 0; i < teeth; i += 1) {
    const a = i * step - Math.PI / 2
    for (const [angle, r] of [
      [a - step / 2 + half * 0.6, inner],
      [a - half, outer],
      [a + half, outer],
      [a + step / 2 - half * 0.6, inner],
    ]) {
      points.push(`${(cx + Math.cos(angle) * r).toFixed(2)} ${(cy + Math.sin(angle) * r).toFixed(2)}`)
    }
  }
  return `M${points.join('L')}Z`
}

const GEAR = gearPath(24, 24, 19, 14.6, 8)

const ICONS = {
  settings: `
    <defs><linearGradient id="art-gear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4f78b8"/><stop offset="1" stop-color="#22426f"/>
    </linearGradient></defs>
    <path d="${GEAR}" fill="url(#art-gear)" stroke="#17345a" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="24" cy="24" r="6.4" fill="#f7ecd8" stroke="#17345a" stroke-width="2.4"/>
    <path d="M14.5 15.5a13 13 0 0 1 9.5-4.2" stroke="#a9c4ee" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".8"/>`,

  levels: `
    <defs><linearGradient id="art-tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="#ffaa17"/>
    </linearGradient></defs>
    <g fill="url(#art-tile)" stroke="#d9800c" stroke-width="2.2">
      <rect x="6" y="6" width="16" height="16" rx="5"/><rect x="26" y="6" width="16" height="16" rx="5"/>
      <rect x="6" y="26" width="16" height="16" rx="5"/><rect x="26" y="26" width="16" height="16" rx="5"/>
    </g>
    <g fill="#fff6c9" opacity=".85">
      <rect x="9.5" y="9" width="6" height="3" rx="1.5"/><rect x="29.5" y="9" width="6" height="3" rx="1.5"/>
      <rect x="9.5" y="29" width="6" height="3" rx="1.5"/><rect x="29.5" y="29" width="6" height="3" rx="1.5"/>
    </g>`,

  hint: `
    <defs><radialGradient id="art-bulb" cx=".4" cy=".35" r=".7">
      <stop offset="0" stop-color="#fff3a6"/><stop offset=".55" stop-color="#ffd43b"/><stop offset="1" stop-color="#ffaa12"/>
    </radialGradient></defs>
    <g stroke="#ffb21f" stroke-width="3" stroke-linecap="round">
      <path d="M24 2.8v4.4M8.6 9.2l3 3M39.4 9.2l-3 3M3.6 23h4.2M40.2 23h4.2"/>
    </g>
    <path d="M24 9.5c-7.6 0-13 5.6-13 12.6 0 4.6 2.4 7.6 4.7 9.9 1.5 1.5 2.3 3 2.3 5h12c0-2 .8-3.5 2.3-5 2.3-2.3 4.7-5.3 4.7-9.9 0-7-5.4-12.6-13-12.6Z"
      fill="url(#art-bulb)" stroke="#c97a06" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17.6 18.5a7.4 7.4 0 0 1 5-4.6" stroke="#fffbe0" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <rect x="17.4" y="37" width="13.2" height="7.4" rx="2.4" fill="#8f98a8" stroke="#5d6676" stroke-width="2"/>
    <path d="M18 40.6h12" stroke="#5d6676" stroke-width="1.8"/>`,

  star: `
    <defs><linearGradient id="art-star" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffaa14"/>
    </linearGradient></defs>
    <path d="m24 4.5 5.9 12 13.2 1.9-9.6 9.3 2.3 13.1L24 34.6l-11.8 6.2 2.3-13.1-9.6-9.3 13.2-1.9L24 4.5Z"
      fill="url(#art-star)" stroke="#d27a0a" stroke-width="2.6" stroke-linejoin="round"/>
    <ellipse cx="19.5" cy="19" rx="3.2" ry="2" transform="rotate(-30 19.5 19)" fill="#fff7c2" opacity=".9"/>`,

  moves: `
    <g fill="#2f5fc6" stroke="#1d3f8a" stroke-width="1.6">
      <ellipse cx="15.5" cy="12.5" rx="6" ry="8" transform="rotate(-12 15.5 12.5)"/>
      <ellipse cx="12.5" cy="31.5" rx="5.4" ry="7" transform="rotate(-6 12.5 31.5)"/>
      <ellipse cx="33" cy="17" rx="6" ry="8" transform="rotate(12 33 17)"/>
      <ellipse cx="35" cy="36" rx="5.4" ry="7" transform="rotate(6 35 36)"/>
    </g>
    <g fill="#8fb3ff" opacity=".75">
      <ellipse cx="13.6" cy="9.6" rx="2" ry="3"/><ellipse cx="31.6" cy="14" rx="2" ry="3"/>
    </g>`,

  knot: `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#b86a08" stroke-width="9">
        <path d="M10 14c3-6 13-6 17 0l9 12c3 4 0 10-5 10-2.5 0-4-1.4-5.6-3.4L17 22"/>
        <path d="M38 14c-3-6-13-6-17 0l-9 12c-3 4 0 10 5 10 2.5 0 4-1.4 5.6-3.4L31 22"/>
      </g>
      <g stroke="#ffb52e" stroke-width="5.2">
        <path d="M10 14c3-6 13-6 17 0l9 12c3 4 0 10-5 10-2.5 0-4-1.4-5.6-3.4L17 22"/>
        <path d="M38 14c-3-6-13-6-17 0l-9 12c-3 4 0 10 5 10 2.5 0 4-1.4 5.6-3.4L31 22"/>
      </g>
      <path d="M12.5 12.5c2.4-3 7-3.6 10.5-1.4" stroke="#ffe39a" stroke-width="2"/>
    </g>`,

  restart: `
    <g fill="none" stroke-linecap="round">
      <path d="M23 13A13 13 0 1 0 37 26" stroke="#b81f2b" stroke-width="9"/>
      <path d="M23 13A13 13 0 1 0 37 26" stroke="#ff4747" stroke-width="5.4"/>
    </g>
    <path d="M32 13.5 22 6v15Z" fill="#ff4747" stroke="#b81f2b" stroke-width="2.4" stroke-linejoin="round"/>`,

  undo: `
    <g fill="none" stroke-linecap="round">
      <path d="M25 13A13 13 0 1 1 11 26" stroke="#8d8578" stroke-width="9"/>
      <path d="M25 13A13 13 0 1 1 11 26" stroke="#c9c1b4" stroke-width="5.4"/>
    </g>
    <path d="M16 13.5 26 6v15Z" fill="#c9c1b4" stroke="#8d8578" stroke-width="2.4" stroke-linejoin="round"/>`,
}

export function artIcon(name, className = 'art-svg') {
  return `<svg class="${className}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`
}
