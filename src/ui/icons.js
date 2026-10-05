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
    '<path d="M8.8 15.6c-1.3-1-2-2.5-2-4.1a5.2 5.2 0 1 1 8.4 4.1c-.75.58-1.2 1.25-1.32 2.1h-3.76c-.12-.85-.57-1.52-1.32-2.1Z"/>',
    '<path d="M10 20h4M10.7 17.7h2.6"/>',
    '<path d="M12 6.8v1.4m3.55.05-.95.95m-5.2 0-.95-.95"/>',
  ].join(''),

  undo: [
    '<path d="M8.4 8H5V4.6"/>',
    '<path d="M5.35 8.15A7.1 7.1 0 1 1 7.2 17.8"/>',
  ].join(''),

  restart: [
    '<path d="M15.6 8H19V4.6"/>',
    '<path d="M18.65 8.15A7.1 7.1 0 1 0 16.8 17.8"/>',
  ].join(''),

  pause: [
    '<rect x="7.1" y="5.6" width="3.5" height="12.8" rx="1.35" fill="currentColor" stroke="none"/>',
    '<rect x="13.4" y="5.6" width="3.5" height="12.8" rx="1.35" fill="currentColor" stroke="none"/>',
  ].join(''),

  home: [
    '<path d="m4.5 11.2 7.5-6.3 7.5 6.3"/>',
    '<path d="M6.5 10.2v8.6h11v-8.6M10 18.8v-5h4v5"/>',
  ].join(''),

  back: '<path d="m14.8 5.6-6.4 6.4 6.4 6.4"/>',
  chevronRight: '<path d="m9.2 5.6 6.4 6.4-6.4 6.4"/>',

  chapterStart: [
    '<path d="M6.2 18.2 12 5.8l5.8 12.4"/>',
    '<path d="M8.2 14.2h7.6"/>',
    '<circle cx="12" cy="18.2" r="1.2" fill="currentColor" stroke="none"/>',
  ].join(''),

  chapterTwist: [
    '<path d="M5 7.2c3.4-2.8 10.6-2.8 14 0"/>',
    '<path d="M5 16.8c3.4 2.8 10.6 2.8 14 0"/>',
    '<path d="M8.5 5.4 15.5 18.6M15.5 5.4 8.5 18.6"/>',
  ].join(''),

  chapterGarden: [
    '<path d="M12 19v-7"/>',
    '<path d="M12 12c-4.6.1-6.5-2.4-6.6-5.7 3.5-.2 6.2 1.7 6.6 5.7Z"/>',
    '<path d="M12 12c4.6.1 6.5-2.4 6.6-5.7-3.5-.2-6.2 1.7-6.6 5.7Z"/>',
  ].join(''),

  chapterKnot: [
    '<path d="M7 7c2.8 0 3.2 3.2 5 5s2.2 5 5 5"/>',
    '<path d="M17 7c-2.8 0-3.2 3.2-5 5s-2.2 5-5 5"/>',
    '<circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="17" r="1.5"/>',
  ].join(''),

  chapterMaster: [
    '<path d="m5 9 3.2 2.2L12 5l3.8 6.2L19 9l-1.2 9H6.2Z"/>',
    '<path d="M7 18h10"/>',
  ].join(''),

  timer: [
    '<circle cx="12" cy="13" r="7.1"/>',
    '<path d="M9.4 3.5h5.2M12 5.9V3.5M17.3 7.7l1.45-1.45"/>',
    '<path d="M12 9.1v4.2l2.8 1.65"/>',
  ].join(''),

  crossings: [
    '<path d="M4.1 6.2c4.2 0 5 5.8 8.7 5.8 2.2 0 3.55-1.55 6.9-4.8"/>',
    '<path d="M19.9 17.8c-4.2 0-5-5.8-8.7-5.8-2.2 0-3.55 1.55-6.9 4.8"/>',
    '<path d="m17.1 5.1 2.7 2.1-2.35 2.45M6.9 18.9l-2.7-2.1 2.35-2.45"/>',
  ].join(''),

  moves: [
    '<path d="M5 12h13"/>',
    '<path d="m14.8 8.8 3.2 3.2-3.2 3.2"/>',
    '<circle cx="5" cy="12" r="1.5"/>',
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

  reset: [
    '<path d="M7.4 7.4h9.2M9 7.4l.7 11h4.6l.7-11"/>',
    '<path d="M10 7.4V5.2h4v2.2M10.8 10.3v5.1M13.2 10.3v5.1"/>',
  ].join(''),

  close: '<path d="m7 7 10 10M17 7 7 17"/>',

  check: '<path d="m5.8 12.3 3.8 3.8 8.6-8.6"/>',
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
