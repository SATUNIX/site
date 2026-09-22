// A tiny 5-row block font for rendering banner text as ASCII art.
// Each glyph is 5 strings; '#' is ink, anything else is blank.

const G = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  0: [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  1: ['  #  ', ' ##  ', '  #  ', '  #  ', ' ### '],
  2: [' ### ', '#   #', '  ## ', ' #   ', '#####'],
  3: ['#### ', '    #', ' ### ', '    #', '#### '],
  4: ['#   #', '#   #', '#####', '    #', '    #'],
  5: ['#####', '#    ', '#### ', '    #', '#### '],
  6: [' ### ', '#    ', '#### ', '#   #', ' ### '],
  7: ['#####', '    #', '   # ', '  #  ', '  #  '],
  8: [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  9: [' ### ', '#   #', ' ####', '    #', ' ### '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
  '-': ['    ', '    ', '### ', '    ', '    '],
  '_': ['     ', '     ', '     ', '     ', '#####'],
  '.': [' ', ' ', ' ', ' ', '#'],
  ',': ['  ', '  ', '  ', ' #', '# '],
  ':': [' ', '#', ' ', '#', ' '],
  '!': ['#', '#', '#', ' ', '#'],
  '?': [' ### ', '#   #', '  ## ', '     ', '  #  '],
  '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
  "'": ['#', '#', ' ', ' ', ' '],
  '(': [' #', '# ', '# ', '# ', ' #'],
  ')': ['# ', ' #', ' #', ' #', '# '],
  '+': ['     ', '  #  ', '#####', '  #  ', '     '],
  '=': ['     ', '#####', '     ', '#####', '     '],
  '>': ['#   ', ' #  ', '  # ', ' #  ', '#   '],
  '<': ['   #', '  # ', ' #  ', '  # ', '   #'],
  '*': ['     ', '# # #', ' ### ', '# # #', '     '],
  '#': [' # # ', '#####', ' # # ', '#####', ' # # '],
  '$': [' ####', '# #  ', ' ### ', '  # #', '#### '],
  '%': ['#   #', '   # ', '  #  ', ' #   ', '#   #'],
  '&': [' ##  ', '#  # ', ' ## #', '#  # ', ' ## #'],
  '@': [' ### ', '# ###', '# # #', '# ###', ' ### '],
};

const ROWS = 5;

/**
 * Render text as a block-letter banner.
 * @param {string} text   One line of text (unknown characters become '?').
 * @param {object} opts
 * @param {'shadow'|'block'|'hash'} [opts.style='shadow']
 * @returns {string} Multi-line string with every line padded to equal width.
 */
export function renderBanner(text, { style = 'shadow' } = {}) {
  const glyphs = Array.from(text.toUpperCase()).map((ch) => G[ch] || G['?']);
  const rows = Array.from({ length: ROWS }, (_, r) => glyphs.map((g) => g[r]).join(' '));

  const ink = style === 'hash' ? '#' : '█'; // █
  if (style !== 'shadow') return rows.map((r) => r.replace(/#/g, ink)).join('\n');

  // Shadow style: one extra row and column, with a light shade cast down-right.
  const h = ROWS + 1;
  const w = rows[0].length + 1;
  const filled = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < rows[r].length && rows[r][c] === '#';
  const out = [];
  for (let r = 0; r < h; r++) {
    let line = '';
    for (let c = 0; c < w; c++) {
      if (filled(r, c)) line += ink;
      else if (filled(r - 1, c - 1)) line += '░'; // ░
      else line += ' ';
    }
    out.push(line);
  }
  return out.join('\n');
}

/** Render several lines (one banner per line) separated by a blank row. */
export function renderBannerLines(lines, opts) {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => renderBanner(l, opts))
    .join('\n\n');
}
