// Usage: mkdir out && cd out && node ../scripts/placeholder-product-images.mjs
// then render each SVG with: qlmanage -t -s 1600 -o png <file>.svg (macOS)
// Generates brand placeholder product shots (BRAND.md: plain cream background).
import { writeFileSync } from "node:fs";

const C = {
  cream: "#F6F1E7", paper: "#FFFDF8", espresso: "#2B1E16", roast: "#6B4A35",
  apricot: "#E8834A", sage: "#8A9A7B", fog: "#D9D2C5", kraft: "#C9A27A",
};
const VARIANT = {
  Cream: "#EFE4D0", Espresso: "#2B1E16", Sage: "#8A9A7B", Apricot: "#E8834A",
  "Matte Black": "#262321", "Brushed Steel": "#B9B6AF",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "Menlo, 'Courier New', monospace";

const frame = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600" viewBox="0 0 1600 1600">` +
  `<rect width="1600" height="1600" fill="${C.cream}"/>` +
  `<ellipse cx="800" cy="1236" rx="400" ry="36" fill="${C.espresso}" opacity="0.08"/>` +
  body + `</svg>`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;");
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}
// The Morrow sun: a half-risen disc on a horizon line.
const sun = (cx, cy, r, color) =>
  `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="${color}"/>` +
  `<line x1="${cx - r * 1.6}" y1="${cy}" x2="${cx + r * 1.6}" y2="${cy}" stroke="${color}" stroke-width="${r / 5}" stroke-linecap="round"/>`;

function bag({ title, roast, bagColor = C.kraft, stamp = "ROASTED MONDAY" }) {
  const lines = wrap(title, 13);
  const longest = Math.max(...lines.map((l) => l.length));
  // Georgia bold averages ~0.6em (plus margin) per glyph; the label is 430px wide with padding.
  const size = Math.min(lines.length > 2 ? 58 : 68, Math.floor(380 / (longest * 0.68)));
  const step = size + 12;
  const startY = 780 + (3 - lines.length) * (step / 2);
  const text = lines
    .map((l, i) => `<text x="800" y="${startY + i * step}" font-family="${SERIF}" font-size="${size}" font-weight="600" text-anchor="middle" fill="${C.espresso}">${esc(l)}</text>`)
    .join("");
  const dots = roast
    ? Array.from({ length: 5 }, (_, i) => `<circle cx="${720 + i * 40}" cy="1010" r="12" fill="${i < roast ? C.roast : C.fog}"/>`).join("")
    : "";
  return frame(
    `<path d="M520 360 L1080 360 L1105 1230 L495 1230 Z" fill="${bagColor}"/>` +
    `<rect x="505" y="330" width="590" height="70" rx="10" fill="${C.espresso}" opacity="0.85"/>` +
    `<rect x="585" y="520" width="430" height="560" rx="18" fill="${C.paper}"/>` +
    sun(800, 630, 40, C.apricot) +
    `<text x="800" y="690" font-family="${SERIF}" font-size="40" text-anchor="middle" fill="${C.roast}">morrow</text>` +
    text + dots +
    `<text x="800" y="1060" font-family="${MONO}" font-size="24" letter-spacing="3" text-anchor="middle" fill="${C.roast}">${stamp}</text>`,
  );
}

const shapes = {
  dripper: (color) => frame(
    `<path d="M520 560 L1080 560 L900 1060 L700 1060 Z" fill="${color}" stroke="${C.espresso}" stroke-opacity="0.15" stroke-width="6"/>` +
    `<ellipse cx="800" cy="560" rx="280" ry="46" fill="${C.espresso}" opacity="0.18"/>` +
    `<rect x="600" y="1060" width="400" height="60" rx="20" fill="${color}" stroke="${C.espresso}" stroke-opacity="0.15" stroke-width="6"/>` +
    `<path d="M1080 640 q120 20 80 160 q-30 60 -100 40" fill="none" stroke="${color}" stroke-width="44" stroke-linecap="round"/>`,
  ),
  kettle: (color) => frame(
    `<rect x="560" y="640" width="480" height="520" rx="90" fill="${color}"/>` +
    `<path d="M560 980 C 420 960 380 760 330 600" fill="none" stroke="${color}" stroke-width="34" stroke-linecap="round"/>` +
    `<path d="M1040 720 q140 0 140 160 q0 160 -140 160" fill="none" stroke="${C.roast}" stroke-width="40" stroke-linecap="round"/>` +
    `<rect x="700" y="590" width="200" height="60" rx="24" fill="${C.roast}"/>` +
    `<ellipse cx="800" cy="580" rx="40" ry="24" fill="${C.espresso}"/>`,
  ),
  handGrinder: () => frame(
    `<rect x="650" y="560" width="300" height="640" rx="40" fill="${C.roast}"/>` +
    `<rect x="650" y="860" width="300" height="40" fill="${C.espresso}" opacity="0.35"/>` +
    `<rect x="785" y="430" width="30" height="140" fill="${C.espresso}"/>` +
    `<path d="M800 440 L1080 400" stroke="${C.espresso}" stroke-width="26" stroke-linecap="round"/>` +
    `<circle cx="1090" cy="398" r="44" fill="${C.apricot}"/>`,
  ),
  electricGrinder: () => frame(
    `<path d="M680 360 L920 360 L880 560 L720 560 Z" fill="${C.fog}" opacity="0.9"/>` +
    `<rect x="600" y="560" width="400" height="640" rx="36" fill="${C.espresso}"/>` +
    `<circle cx="800" cy="760" r="70" fill="${C.roast}"/><circle cx="800" cy="760" r="18" fill="${C.apricot}"/>` +
    `<rect x="700" y="980" width="200" height="140" rx="14" fill="${C.fog}"/>`,
  ),
  scale: () => frame(
    `<rect x="440" y="900" width="720" height="260" rx="48" fill="${C.espresso}"/>` +
    `<rect x="480" y="880" width="640" height="60" rx="24" fill="${C.roast}"/>` +
    `<rect x="620" y="1010" width="360" height="90" rx="14" fill="#11100e"/>` +
    `<text x="800" y="1075" font-family="${MONO}" font-size="58" text-anchor="middle" fill="${C.apricot}">15.0 g</text>`,
  ),
  filters: () => frame(
    [0, 1, 2, 3].map((i) =>
      `<path d="M${520 + i * 18} ${600 + i * 40} L${1080 + i * 18} ${600 + i * 40} L${900 + i * 18} ${1150 + i * 18} L${700 + i * 18} ${1150 + i * 18} Z" fill="${i % 2 ? C.paper : "#EADFCB"}" stroke="${C.roast}" stroke-opacity="0.25" stroke-width="4"/>`,
    ).join(""),
  ),
  cup: (color) => frame(
    `<path d="M610 520 L990 520 L950 1200 L650 1200 Z" fill="${color}" stroke="${C.espresso}" stroke-opacity="0.15" stroke-width="6"/>` +
    `<rect x="590" y="450" width="420" height="90" rx="30" fill="${C.espresso}"/>` +
    `<rect x="640" y="760" width="320" height="140" fill="${C.paper}" opacity="0.9"/>` +
    sun(800, 850, 36, C.apricot),
  ),
  tee: (color) => frame(
    `<path d="M600 400 L700 360 Q800 430 900 360 L1000 400 L1220 560 L1120 720 L1020 660 L1020 1220 L580 1220 L580 660 L480 720 L380 560 Z" fill="${color}" stroke="${C.espresso}" stroke-opacity="0.15" stroke-width="6"/>` +
    sun(800, 600, 34, C.apricot) +
    `<text x="800" y="660" font-family="${SERIF}" font-size="36" text-anchor="middle" fill="${color === VARIANT.Espresso ? C.cream : C.espresso}">morrow</text>`,
  ),
  giftCard: () => frame(
    `<rect x="380" y="560" width="840" height="520" rx="40" fill="${C.apricot}" transform="rotate(-6 800 820)"/>` +
    `<g transform="rotate(-6 800 820)">${sun(800, 790, 70, C.espresso)}` +
    `<text x="800" y="900" font-family="${SERIF}" font-size="96" font-weight="600" text-anchor="middle" fill="${C.espresso}">morrow</text>` +
    `<text x="800" y="980" font-family="${MONO}" font-size="30" letter-spacing="4" text-anchor="middle" fill="${C.espresso}">GIFT CARD</text></g>`,
  ),
  discoveryBox: () => frame(
    `<rect x="420" y="640" width="760" height="560" rx="24" fill="${C.kraft}"/>` +
    `<rect x="400" y="600" width="800" height="90" rx="20" fill="${C.roast}"/>` +
    [0, 1, 2, 3].map((i) => `<rect x="${470 + i * 175}" y="760" width="140" height="380" rx="14" fill="${C.paper}"/>` + sun(540 + i * 175, 880, 24, [C.apricot, C.sage, C.roast, C.espresso][i])).join(""),
  ),
  starterKit: () => frame(
    `<path d="M400 520 L1010 520 L1030 1220 L380 1220 Z" fill="${C.kraft}"/>` +
    `<rect x="480" y="640" width="440" height="420" rx="16" fill="${C.paper}"/>` +
    sun(700, 760, 40, C.apricot) +
    `<text x="700" y="850" font-family="${SERIF}" font-size="56" font-weight="600" text-anchor="middle" fill="${C.espresso}">Daybreak</text>` +
    `<path d="M930 760 L1270 760 L1170 1080 L1030 1080 Z" fill="${VARIANT.Cream}" stroke="${C.espresso}" stroke-opacity="0.15" stroke-width="6"/>` +
    `<rect x="980" y="1080" width="240" height="44" rx="14" fill="${VARIANT.Cream}" stroke="${C.espresso}" stroke-opacity="0.15" stroke-width="6"/>`,
  ),
};

const jobs = {
  "daybreak-blend": bag({ title: "Daybreak Blend", roast: 3 }),
  "night-owl-espresso": bag({ title: "Night Owl Espresso", roast: 4, bagColor: C.roast }),
  "ethiopia-guji-hambela": bag({ title: "Ethiopia Guji Hambela", roast: 2 }),
  "colombia-huila-el-mirador": bag({ title: "Colombia Huila El Mirador", roast: 3 }),
  "kenya-nyeri-gatomboya": bag({ title: "Kenya Nyeri Gatomboya", roast: 2, stamp: "LIMITED LOT" }),
  "brazil-cerrado-rio-claro": bag({ title: "Brazil Cerrado Rio Claro", roast: 4 }),
  "peru-swiss-water-decaf": bag({ title: "Peru Swiss Water Decaf", roast: 3, bagColor: C.sage, stamp: "DECAF" }),
  "guatemala-huehuetenango": bag({ title: "Guatemala Huehuetenango", roast: 3 }),
  "roasters-choice": bag({ title: "Roaster's Choice", bagColor: C.espresso, stamp: "PICKED BY INES" }),
  "hand-burr-grinder": shapes.handGrinder(),
  "precision-electric-grinder": shapes.electricGrinder(),
  "digital-brew-scale": shapes.scale(),
  "paper-filters": shapes.filters(),
  "gift-card": shapes.giftCard(),
  "coffee-discovery-box": shapes.discoveryBox(),
  "pour-over-starter-kit": shapes.starterKit(),
};
for (const c of ["Cream", "Espresso", "Sage"]) jobs[`ceramic-dripper--${c}`] = shapes.dripper(VARIANT[c]);
for (const c of ["Matte Black", "Brushed Steel"]) jobs[`gooseneck-kettle--${c}`] = shapes.kettle(VARIANT[c]);
for (const c of ["Cream", "Espresso", "Apricot"]) jobs[`travel-cup--${c}`] = shapes.cup(VARIANT[c]);
for (const c of ["Cream", "Espresso"]) jobs[`early-riser-tee--${c}`] = shapes.tee(VARIANT[c]);

for (const [name, svg] of Object.entries(jobs)) {
  writeFileSync(`${name.replace(/ /g, "_")}.svg`, svg);
}
console.log(Object.keys(jobs).length, "svgs");
