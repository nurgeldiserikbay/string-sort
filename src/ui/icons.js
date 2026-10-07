const ICONS = {
  play: '<path d="M9 7.1v9.8L17.2 12 9 7.1Z" fill="currentColor" stroke="none"/>',

  levels: [
    '<rect x="4.5" y="4.5" width="6" height="6" rx="1.8"/>',
    '<rect x="13.5" y="4.5" width="6" height="6" rx="1.8"/>',
    '<rect x="4.5" y="13.5" width="6" height="6" rx="1.8"/>',
    '<rect x="13.5" y="13.5" width="6" height="6" rx="1.8"/>',
  ].join(''),

  star: '<path d="m12 3.8 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 15.78l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L12 3.8Z" fill="currentColor" stroke="none"/>',

  settings: [
    '<circle cx="12" cy="12" r="3.2"/>',
    '<path d="M12 3.7v2M12 18.3v2M3.7 12h2M18.3 12h2"/>',
    '<path d="m6.1 6.1 1.4 1.4m9 9 1.4 1.4m0-11.8-1.4 1.4m-9 9-1.4 1.4"/>',
  ].join(''),

  hint: [
    '<path d="M8.3 14.7c-1.15-1.05-1.8-2.45-1.8-4.05a5.5 5.5 0 1 1 11 0c0 1.6-.65 3-1.8 4.05-.85.76-1.25 1.48-1.35 2.3h-4.7c-.1-.82-.5-1.54-1.35-2.3Z"/>',
    '<path d="M9.7 19h4.6M10.3 21h3.4"/>',
    '<path d="M12 3.2v1.35M5.7 5.9l1 1M18.3 5.9l-1 1"/>',
  ].join(''),

  undo: [
    '<path d="M9.2 7.7H5.1V3.8"/>',
    '<path d="M5.5 7.55A7.7 7.7 0 1 1 7.35 18.4"/>',
    '<path d="m5.15 7.65 3.1-2.7"/>',
  ].join(''),

  restart: [
    '<path d="M14.8 7.7h4.1V3.8"/>',
    '<path d="M18.5 7.55A7.7 7.7 0 1 0 16.65 18.4"/>',
    '<path d="m18.85 7.65-3.1-2.7"/>',
  ].join(''),

  pause: [
    '<rect x="6.8" y="4.8" width="3.9" height="14.4" rx="1.7" fill="currentColor" stroke="none"/>',
    '<rect x="13.3" y="4.8" width="3.9" height="14.4" rx="1.7" fill="currentColor" stroke="none"/>',
  ].join(''),

  home: [
    '<path d="m4.5 11.2 7.5-6.3 7.5 6.3"/>',
    '<path d="M6.5 10.2v8.6h11v-8.6M10 18.8v-5h4v5"/>',
  ].join(''),

  back: '<path d="m14.8 5.6-6.4 6.4 6.4 6.4"/>',
  forward: '<path d="m9.2 5.6 6.4 6.4-6.4 6.4"/>',

  timer: [
    '<circle cx="12" cy="13" r="7.1"/>',
    '<path d="M9.4 3.5h5.2M12 5.9V3.5M17.3 7.7l1.45-1.45"/>',
    '<path d="M12 9.1v4.2l2.8 1.65"/>',
  ].join(''),

  crossings: [
    '<path d="M8.1 5.3c-2.35 0-3.8 1.55-3.8 3.55 0 2.05 1.55 3.55 3.7 3.55h2.25"/>',
    '<path d="M15.9 18.7c2.35 0 3.8-1.55 3.8-3.55 0-2.05-1.55-3.55-3.7-3.55h-2.25"/>',
    '<path d="M9.3 7.4 14.7 16.6M14.7 7.4 9.3 16.6"/>',
  ].join(''),

  moves: [
    '<path d="M7.9 4.3c1.45.1 2.2 1.45 1.85 3.05-.38 1.75-1.5 3.8-2.95 3.62-1.4-.18-2.08-2.05-1.8-3.72.27-1.63 1.35-3.06 2.9-2.95Z" fill="currentColor" stroke="none"/>',
    '<path d="M5.7 12.25c1.45-.14 2.65 1.2 2.78 2.85.14 1.85-.53 4.15-2.05 4.3-1.44.14-2.62-1.72-2.83-3.43-.2-1.65.55-3.57 2.1-3.72Z" fill="currentColor" stroke="none"/>',
    '<path d="M15.75 6.1c1.32-.1 2.28 1.15 2.2 2.65-.08 1.67-.93 3.62-2.3 3.68-1.32.05-2.25-1.55-2.25-3.12 0-1.5.95-3.1 2.35-3.21Z" fill="currentColor" stroke="none"/>',
    '<path d="M17.35 13.65c1.35-.05 2.38 1.2 2.38 2.75 0 1.72-.9 3.8-2.3 3.86-1.35.06-2.4-1.63-2.46-3.24-.05-1.55.95-3.32 2.38-3.37Z" fill="currentColor" stroke="none"/>',
  ].join(''),

  help: [
    '<circle cx="12" cy="12" r="8.1"/>',
    '<path d="M9.8 9.2a2.4 2.4 0 0 1 4.7.7c0 1.7-1.65 2-2.25 3.05-.18.32-.25.62-.25 1.05"/>',
    '<path d="M12 17.35h.01"/>',
  ].join(''),

  lock: [
    '<rect x="6.4" y="10.2" width="11.2" height="9.1" rx="2.1"/>',
    '<path d="M8.8 10.2V7.9a3.2 3.2 0 0 1 6.4 0v2.3"/>',
    '<path d="M12 14v2.2"/>',
  ].join(''),

  sound: [
    '<path d="M5 10h3l4-3.2v10.4L8 14H5z"/>',
    '<path d="M15.2 9.2a4 4 0 0 1 0 5.6M17.5 6.9a7.2 7.2 0 0 1 0 10.2"/>',
  ].join(''),

  haptics: [
    '<rect x="8.1" y="5.1" width="7.8" height="13.8" rx="2"/>',
    '<path d="M5.2 8.2a6 6 0 0 0 0 7.6M18.8 8.2a6 6 0 0 1 0 7.6"/>',
    '<path d="M11 16.2h2"/>',
  ].join(''),

  graphics: [
    '<path d="M5 17.8 8.4 6.2l3.6 8.2 2.45-5.1L19 17.8Z"/>',
    '<circle cx="17.2" cy="6.2" r="1.7"/>',
  ].join(''),

  markers: [
    '<circle cx="7" cy="7" r="2.3"/>',
    '<path d="M14.2 4.9 19 9.7M19 4.9l-4.8 4.8"/>',
    '<path d="M5 15h4v4H5zM14.2 14.3l4.6 4.6m0-4.6-4.6 4.6"/>',
  ].join(''),

  info: [
    '<circle cx="12" cy="12" r="8.1"/>',
    '<path d="M12 10.8v5.2M12 7.5h.01"/>',
  ].join(''),

  privacy: [
    '<path d="M12 3.8 18 6v4.7c0 4.05-2.35 7.35-6 9.5-3.65-2.15-6-5.45-6-9.5V6l6-2.2Z"/>',
    '<path d="m9.5 12 1.7 1.7 3.6-3.8"/>',
  ].join(''),

  reset: [
    '<path d="M7.4 7.4h9.2M9 7.4l.7 11h4.6l.7-11"/>',
    '<path d="M10 7.4V5.2h4v2.2M10.8 10.3v5.1M13.2 10.3v5.1"/>',
  ].join(''),

  knot: [
    '<path d="M6.2 8.2c1.4-2.2 4.9-2.3 6.5-.2l4.1 5.2c1.2 1.5.1 3.8-1.8 3.8-1 0-1.7-.55-2.35-1.4L8.9 10.7"/>',
    '<path d="M17.8 8.2c-1.4-2.2-4.9-2.3-6.5-.2l-4.1 5.2c-1.2 1.5-.1 3.8 1.8 3.8 1 0 1.7-.55 2.35-1.4l3.75-4.9"/>',
  ].join(''),

  twist: [
    '<path d="M6 5.5c4.5 0 7.5 2.2 7.5 5.2 0 2.8-2.2 4.6-5.2 4.6"/>',
    '<path d="M18 18.5c-4.5 0-7.5-2.2-7.5-5.2 0-2.8 2.2-4.6 5.2-4.6"/>',
    '<path d="m7.8 12.8-2.2 2.5 2.6 2M16.2 11.2l2.2-2.5-2.6-2"/>',
  ].join(''),

  garden: [
    '<path d="M12 19.5V11"/>',
    '<path d="M12 13.2c-3.7 0-6-2.1-6.2-5.8 3.9-.2 6.2 1.9 6.2 5.8Z"/>',
    '<path d="M12 10.6c3.7 0 6-2.1 6.2-5.8-3.9-.2-6.2 1.9-6.2 5.8Z"/>',
    '<path d="M8.2 19.5h7.6"/>',
  ].join(''),

  weave: [
    '<path d="M5 7h14M5 12h14M5 17h14"/>',
    '<path d="M8 4v16M13 4v16M18 4v16"/>',
  ].join(''),

  crown: [
    '<path d="m4.7 8.2 4 3 3.3-5 3.3 5 4-3-1.2 9.1H5.9L4.7 8.2Z"/>',
    '<path d="M6.2 19h11.6"/>',
  ].join(''),

  trophy: [
    '<path d="M8 5h8v4.6c0 3-1.7 5.1-4 5.1s-4-2.1-4-5.1V5Z"/>',
    '<path d="M8 7H5.5v1.6c0 2 1.2 3.2 3.1 3.2M16 7h2.5v1.6c0 2-1.2 3.2-3.1 3.2"/>',
    '<path d="M12 14.8V18M8.6 19h6.8"/>',
  ].join(''),

  close: '<path d="m7 7 10 10M17 7 7 17"/>',

  check: '<path d="m5.8 12.3 3.8 3.8 8.6-8.6"/>',
}

export function hasUiIcon(name) {
  return Object.prototype.hasOwnProperty.call(ICONS, name)
}

export function uiIcon(name, className = 'ui-svg') {
  const icon = ICONS[name] ?? ICONS.help

  return `<svg
    class="${className}"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >${icon}</svg>`
}
