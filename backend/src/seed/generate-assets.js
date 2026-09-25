// One-off generator for the SVG images used by the demo seed data.
// Run manually with `node src/seed/generate-assets.js` whenever the seed
// content changes shape. Output is committed under src/seed/assets/ and
// copied into uploads/seed/ by seed.js at seed time — nothing here touches
// third-party image storage, it's all local, on-brand, generated artwork.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'assets');

// ---- brand tokens (mirrors src/index.css) --------------------------------
const NAVY = '#10213F';
const NAVY_600 = '#1A2E4F';
const BLUE = '#0F6CFF';
const BLUE_600 = '#0B5BD8';
const LIGHT = '#EAF3FF';
const WHITE = '#FFFFFF';

const FONT_DISPLAY = "'Sora', 'Segoe UI', sans-serif";
const FONT_SANS = "'Inter', 'Segoe UI', sans-serif";

// ---- shared motif: the hill-ridge silhouette (see HillRidgeDivider.jsx) --
// Confined to a bottom band [bandTop, height] so it never collides with
// text or icons placed above it.
function hillRidge(width, height, bandTop, fill, opacity = 1) {
  const peak = bandTop;
  const trough = bandTop + (height - bandTop) * 0.55;
  const pts = [];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const x = (width / n) * i;
    const y = i % 2 === 0 ? peak : trough;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `<polygon fill="${fill}" opacity="${opacity}" points="0,${height} ${pts.join(' ')} ${width},${height}" />`;
}

// ---- shared motif: imigongo-style triangle strip (thin border accent) ----
function imigongoStrip(x, y, w, rowH, colors) {
  const cols = Math.round(w / rowH);
  const cw = w / cols;
  let out = '';
  for (let i = 0; i < cols; i++) {
    const cx = x + i * cw;
    const up = i % 2 === 0;
    const color = colors[i % colors.length];
    const points = up
      ? `${cx},${y + rowH} ${cx + cw / 2},${y} ${cx + cw},${y + rowH}`
      : `${cx},${y} ${cx + cw / 2},${y + rowH} ${cx + cw},${y}`;
    out += `<polygon points="${points}" fill="${color}" />`;
  }
  return out;
}

function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

// ---- trade icon glyphs (single-color, centered on a 0..200 box, bold/simple
// so they stay legible at small sizes) --------------------------------------
const ICONS = {
  electrical: '<path d="M116 24 L48 118 H92 L80 176 L156 78 H108 Z" stroke="none" />',
  welding: '<path d="M40 160 L86 114" stroke-width="16" stroke-linecap="round" fill="none" /><path d="M114 86 L160 40" stroke-width="16" stroke-linecap="round" fill="none" /><circle cx="100" cy="100" r="14" stroke="none" /><path d="M100 20 V50 M180 100 H150 M20 100 H50 M100 180 V150" stroke-width="10" stroke-linecap="round" fill="none" /><path d="M144 56 L166 34 M56 144 L34 166" stroke-width="10" stroke-linecap="round" fill="none" />',
  construction: '<path d="M100 26 C64 26 44 54 44 84 V96 H156 V84 C156 54 136 26 100 26 Z" stroke="none" /><rect x="30" y="96" width="140" height="18" rx="4" stroke="none" /><path d="M60 114 V168 M140 114 V168" stroke-width="12" stroke-linecap="round" fill="none" />',
  automobile: '<circle cx="100" cy="100" r="58" fill="none" stroke-width="14" /><circle cx="100" cy="100" r="16" stroke="none" /><path d="M100 42 V64 M100 136 V158 M42 100 H64 M136 100 H158 M58 58 L74 74 M126 126 L142 142 M142 58 L126 74 M74 126 L58 142" stroke-width="11" stroke-linecap="round" />',
  library: '<path d="M40 156 V54 Q70 38 100 54 V156 Q70 140 40 156 Z" stroke-width="8" stroke-linejoin="round" /><path d="M160 156 V54 Q130 38 100 54 V156 Q130 140 160 156 Z" fill="none" stroke-width="8" stroke-linejoin="round" />',
  graduation: '<path d="M20 78 L100 44 L180 78 L100 112 Z" stroke="none" /><path d="M58 92 V132 Q100 156 142 132 V92" fill="none" stroke-width="10" stroke-linejoin="round" /><path d="M176 78 V126" stroke-width="10" stroke-linecap="round" />',
  campus: '<path d="M26 92 L100 36 L174 92" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" /><rect x="42" y="92" width="116" height="70" fill="none" stroke-width="10" /><rect x="88" y="122" width="24" height="40" stroke="none" /><rect x="54" y="106" width="20" height="20" fill="none" stroke-width="7" /><rect x="126" y="106" width="20" height="20" fill="none" stroke-width="7" />',
  trophy: '<path d="M64 34 H136 V80 Q136 118 100 118 Q64 118 64 80 Z" fill="none" stroke-width="10" stroke-linejoin="round" /><path d="M64 44 H36 Q36 78 70 82" fill="none" stroke-width="10" stroke-linecap="round" /><path d="M136 44 H164 Q164 78 130 82" fill="none" stroke-width="10" stroke-linecap="round" /><path d="M100 118 V140" stroke-width="10" /><path d="M70 162 H130 L122 140 H78 Z" stroke="none" />',
  document: '<rect x="52" y="30" width="96" height="140" rx="6" fill="none" stroke-width="10" /><path d="M70 68 H130 M70 94 H130 M70 120 H108" stroke-width="10" stroke-linecap="round" />',
};

function iconGlyph(name, color, size = 88, cx, cy) {
  const inner = ICONS[name] || ICONS.document;
  // fill/stroke are inherited from the wrapping <g>; per-element attributes
  // like fill="none" or stroke="none" on individual shapes still override it.
  const scale = size / 200;
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})" fill="${color}" stroke="${color}" stroke-linecap="round">${inner}</g>`;
}

// ---- template: 4:3 category tile (programs, departments, gallery) --------
function categoryTile({ title, subtitle, icon, bg, accent }) {
  const w = 640, h = 480;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${bg}" />
  <rect width="${w}" height="${h}" fill="url(#grad)" opacity="0.55" />
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="${w}" y2="${h}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0.0" />
      <stop offset="1" stop-color="${NAVY}" stop-opacity="0.35" />
    </linearGradient>
  </defs>
  ${imigongoStrip(0, 0, w, 16, [accent, WHITE])}
  <circle cx="${w / 2}" cy="176" r="86" fill="${WHITE}" opacity="0.14" />
  <circle cx="${w / 2}" cy="176" r="86" fill="none" stroke="${WHITE}" stroke-opacity="0.35" stroke-width="2" />
  ${iconGlyph(icon, WHITE, 132, w / 2, 176)}
  <text x="${w / 2}" y="316" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="30" font-weight="700" fill="${WHITE}">${escapeXml(title)}</text>
  ${subtitle ? `<text x="${w / 2}" y="350" text-anchor="middle" font-family="${FONT_SANS}" font-size="17" fill="${WHITE}" opacity="0.85">${escapeXml(subtitle)}</text>` : ''}
  ${hillRidge(w, h, h - 100, NAVY, 0.85)}
  ${imigongoStrip(0, h - 16, w, 16, [WHITE, accent])}
</svg>`;
}

// ---- template: wide 16:9 banner (news) ------------------------------------
function bannerTile({ title, tag, icon, bg, accent }) {
  const w = 900, h = 500;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${bg}" />
  <rect width="${w}" height="${h}" fill="url(#grad)" opacity="0.6" />
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="${w}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0.55" />
      <stop offset="1" stop-color="${NAVY}" stop-opacity="0.05" />
    </linearGradient>
  </defs>
  ${imigongoStrip(0, 0, w, 14, [accent, WHITE])}
  <circle cx="150" cy="${h / 2 - 10}" r="100" fill="${WHITE}" opacity="0.12" />
  <circle cx="150" cy="${h / 2 - 10}" r="100" fill="none" stroke="${WHITE}" stroke-opacity="0.35" stroke-width="2" />
  ${iconGlyph(icon, WHITE, 150, 150, h / 2 - 10)}
  <text x="300" y="${h / 2 - 44}" font-family="${FONT_SANS}" font-size="16" letter-spacing="2" fill="${WHITE}" opacity="0.9">${escapeXml(tag)}</text>
  <text x="300" y="${h / 2 - 4}" font-family="${FONT_DISPLAY}" font-size="32" font-weight="700" fill="${WHITE}">${wrapText(title, 26)
    .map((line, i) => `<tspan x="300" dy="${i === 0 ? 0 : 40}">${escapeXml(line)}</tspan>`)
    .join('')}</text>
  ${hillRidge(w, h, h - 90, NAVY, 0.8)}
</svg>`;
}

// ---- template: staff avatar -----------------------------------------------
function avatarTile({ initials, bg, accent }) {
  const w = 400, h = 400;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${bg}" />
  <circle cx="${w / 2}" cy="${h / 2}" r="150" fill="${NAVY_600}" opacity="0.5" />
  <circle cx="${w / 2}" cy="${h / 2}" r="130" fill="none" stroke="${WHITE}" stroke-opacity="0.5" stroke-width="3" />
  <text x="${w / 2}" y="${h / 2 + 42}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="96" font-weight="700" fill="${WHITE}">${escapeXml(initials)}</text>
  ${imigongoStrip(0, h - 20, w, 20, [accent, WHITE])}
</svg>`;
}

// ---- template: book cover ---------------------------------------------------
function bookCover({ title, author, code, bg, accent }) {
  const w = 360, h = 520;
  const lines = wrapText(title, 18);
  const titleTspans = lines.map((line, i) => `<tspan x="${w / 2}" dy="${i === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${bg}" />
  <rect x="0" y="0" width="14" height="${h}" fill="${NAVY}" opacity="0.4" />
  ${imigongoStrip(14, 0, w - 14, 16, [accent, WHITE])}
  <rect x="34" y="60" width="${w - 68}" height="${h - 160}" fill="none" stroke="${WHITE}" stroke-opacity="0.55" stroke-width="2" />
  <text x="${w / 2}" y="220" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="26" font-weight="700" fill="${WHITE}">${titleTspans}</text>
  <text x="${w / 2}" y="${h - 120}" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" fill="${WHITE}" opacity="0.85">${escapeXml(author)}</text>
  <text x="${w / 2}" y="${h - 30}" text-anchor="middle" font-family="${FONT_SANS}" font-size="13" letter-spacing="2" fill="${WHITE}" opacity="0.75">${escapeXml(code)}</text>
  ${imigongoStrip(14, h - 16, w - 14, 16, [WHITE, accent])}
</svg>`;
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

// ---- template: site logo + hero -------------------------------------------
function logoTile() {
  const w = 240, h = 240;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" rx="24" fill="${NAVY}" />
  <circle cx="${w / 2}" cy="96" r="58" fill="${BLUE}" opacity="0.9" />
  <text x="${w / 2}" y="112" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="46" font-weight="700" fill="${WHITE}">RG</text>
  ${imigongoStrip(0, h - 34, w, 34, [BLUE, WHITE])}
</svg>`;
}

function heroTile() {
  const w = 1600, h = 700;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NAVY}" />
  <rect width="${w}" height="${h}" fill="url(#grad)" />
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="${w}" y2="${h}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${BLUE_600}" stop-opacity="0.5" />
      <stop offset="1" stop-color="${NAVY}" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  ${imigongoStrip(0, 0, w, 20, [BLUE, WHITE])}
  ${iconGlyph('campus', WHITE, 220, w / 2, h / 2 - 70)}
  <text x="${w / 2}" y="${h - 160}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="56" font-weight="700" fill="${WHITE}">Rambura Gar\u00e7ons TVET School</text>
  <text x="${w / 2}" y="${h - 115}" text-anchor="middle" font-family="${FONT_SANS}" font-size="24" fill="${LIGHT}" opacity="0.9">Nyabihu District, Rwanda</text>
  ${hillRidge(w, h, h - 90, NAVY_600, 0.85)}
</svg>`;
}

// ---- build everything -------------------------------------------------------
function write(rel, svg) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, svg.trim() + '\n');
}

const TRADES = {
  'electrical-technology': { icon: 'electrical', bg: NAVY, accent: BLUE },
  'welding-fabrication': { icon: 'welding', bg: BLUE_600, accent: LIGHT },
  construction: { icon: 'construction', bg: NAVY_600, accent: BLUE },
  'automobile-mechanics': { icon: 'automobile', bg: BLUE, accent: NAVY },
};

// Programs
write('programs/electrical-technology.svg', categoryTile({ title: 'Electrical Technology', subtitle: 'Level 3\u20135 \u00b7 3 years', icon: 'electrical', bg: TRADES['electrical-technology'].bg, accent: TRADES['electrical-technology'].accent }));
write('programs/welding-fabrication.svg', categoryTile({ title: 'Welding & Fabrication', subtitle: 'Level 3\u20135 \u00b7 3 years', icon: 'welding', bg: TRADES['welding-fabrication'].bg, accent: TRADES['welding-fabrication'].accent }));
write('programs/construction.svg', categoryTile({ title: 'Construction', subtitle: 'Level 3\u20135 \u00b7 3 years', icon: 'construction', bg: TRADES.construction.bg, accent: TRADES.construction.accent }));
write('programs/automobile-mechanics.svg', categoryTile({ title: 'Automobile Mechanics', subtitle: 'Level 3\u20135 \u00b7 3 years', icon: 'automobile', bg: TRADES['automobile-mechanics'].bg, accent: TRADES['automobile-mechanics'].accent }));

// Departments (same trades, department framing)
write('departments/electrical.svg', categoryTile({ title: 'Electrical Technology Dept.', subtitle: 'Eng. Callixte Bizimana', icon: 'electrical', bg: TRADES['electrical-technology'].bg, accent: TRADES['electrical-technology'].accent }));
write('departments/welding.svg', categoryTile({ title: 'Welding & Fabrication Dept.', subtitle: 'Mr. Vincent Habyarimana', icon: 'welding', bg: TRADES['welding-fabrication'].bg, accent: TRADES['welding-fabrication'].accent }));
write('departments/construction.svg', categoryTile({ title: 'Construction Dept.', subtitle: 'Eng. Solange Mukashyaka', icon: 'construction', bg: TRADES.construction.bg, accent: TRADES.construction.accent }));
write('departments/automobile.svg', categoryTile({ title: 'Automobile Mechanics Dept.', subtitle: 'Mr. Fabrice Nsengiyumva', icon: 'automobile', bg: TRADES['automobile-mechanics'].bg, accent: TRADES['automobile-mechanics'].accent }));

// Staff avatars
const STAFF_AVATARS = [
  ['s1', 'AN', NAVY, BLUE],
  ['s2', 'CB', BLUE_600, LIGHT],
  ['s3', 'VH', NAVY_600, BLUE],
  ['s4', 'SM', BLUE, NAVY],
  ['s5', 'FN', NAVY, LIGHT],
  ['s6', 'MU', BLUE_600, BLUE],
];
for (const [id, initials, bg, accent] of STAFF_AVATARS) write(`staff/${id}.svg`, avatarTile({ initials, bg, accent }));

// News banners
write('news/district-skills-competition-2026.svg', bannerTile({ title: 'Rambura Gar\u00e7ons Wins District Skills Competition', tag: 'ACHIEVEMENT', icon: 'trophy', bg: NAVY, accent: BLUE }));
write('news/new-welding-workshop-2026.svg', bannerTile({ title: 'New Welding Workshop Officially Opened', tag: 'FACILITIES', icon: 'welding', bg: BLUE_600, accent: LIGHT }));
write('news/admissions-2026-open.svg', bannerTile({ title: '2026 Admissions Window Now Open', tag: 'ADMISSIONS', icon: 'document', bg: NAVY_600, accent: BLUE }));

// Gallery
const GALLERY = [
  ['g1', 'Electrical workshop practical session', 'electrical', NAVY, BLUE],
  ['g2', 'Welding & fabrication bay', 'welding', BLUE_600, LIGHT],
  ['g3', 'Construction site training', 'construction', NAVY_600, BLUE],
  ['g4', 'Automobile mechanics workshop', 'automobile', BLUE, NAVY],
  ['g5', 'Annual skills competition', 'trophy', NAVY, BLUE],
  ['g6', 'Library reading hall', 'library', BLUE_600, LIGHT],
  ['g7', 'Graduation ceremony', 'graduation', NAVY_600, BLUE],
  ['g8', 'Campus front view', 'campus', BLUE, NAVY],
];
for (const [id, caption, icon, bg, accent] of GALLERY) write(`gallery/${id}.svg`, categoryTile({ title: caption, subtitle: '', icon, bg, accent }));

// Books
const BOOKS = [
  ['b1', 'Applied Electricity Vol. 2', 'J. Nkurunziza', 'ELT-002', NAVY, BLUE],
  ['b2', 'Welding Fundamentals', 'P. Habimana', 'WLD-014', BLUE_600, LIGHT],
  ['b3', 'Concrete Technology Basics', 'S. Mukashyaka', 'CST-021', NAVY_600, BLUE],
  ['b4', 'Automotive Engine Systems', 'F. Nsengiyumva', 'AUT-007', BLUE, NAVY],
  ['b5', 'English for Technical Studies', 'A. Uwimana', 'GEN-031', NAVY, LIGHT],
  ['b6', 'Workshop Safety Handbook', 'Ministry of Education', 'REF-004', BLUE_600, BLUE],
  ['b7', 'Electrical Circuit Theory', 'J. Nkurunziza', 'ELT-010', NAVY, BLUE],
  ['b8', 'Structural Steel Fabrication', 'P. Habimana', 'WLD-019', BLUE_600, LIGHT],
];
for (const [id, title, author, code, bg, accent] of BOOKS) write(`books/${id}.svg`, bookCover({ title, author, code, bg, accent }));

// Website branding
write('website/logo.svg', logoTile());
write('website/hero.svg', heroTile());

console.log(`Generated seed assets in ${OUT}`);
