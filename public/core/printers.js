// Tiskárny, nastavení aplikace a kontrola, jestli se díl vejde na tiskovou podložku.
// Nastavení je společné pro všechny kategorie MOD.

import { readJSON, writeJSON } from './storage.js';

// Tisková plocha X × Y × Z v mm podle výrobce (stav 11/2026).
export const PRINTER_PRESETS = [
  { id: 'bambu-a1-mini', brand: 'Bambu Lab', name: 'A1 mini', x: 180, y: 180, z: 180 },
  { id: 'bambu-a1', brand: 'Bambu Lab', name: 'A1', x: 256, y: 256, z: 256 },
  { id: 'bambu-p1s', brand: 'Bambu Lab', name: 'P1S / P1P', x: 256, y: 256, z: 256 },
  { id: 'bambu-p2s', brand: 'Bambu Lab', name: 'P2S', x: 256, y: 256, z: 256 },
  { id: 'bambu-x1c', brand: 'Bambu Lab', name: 'X1 Carbon / X1E', x: 256, y: 256, z: 256 },
  { id: 'bambu-h2d', brand: 'Bambu Lab', name: 'H2D (jedna tryska)', x: 325, y: 320, z: 325 },
  { id: 'bambu-h2s', brand: 'Bambu Lab', name: 'H2S', x: 340, y: 320, z: 340 },
  { id: 'prusa-mini', brand: 'Prusa Research', name: 'MINI+', x: 180, y: 180, z: 180 },
  { id: 'prusa-mk4s', brand: 'Prusa Research', name: 'MK4S / MK4', x: 250, y: 210, z: 220 },
  { id: 'prusa-core-one', brand: 'Prusa Research', name: 'CORE One', x: 250, y: 220, z: 270 },
  { id: 'prusa-xl', brand: 'Prusa Research', name: 'XL', x: 360, y: 360, z: 360 },
  { id: 'creality-ender3-v3-se', brand: 'Creality', name: 'Ender-3 V3 SE', x: 220, y: 220, z: 250 },
  { id: 'creality-ender3-v3-ke', brand: 'Creality', name: 'Ender-3 V3 KE', x: 220, y: 220, z: 240 },
  { id: 'creality-k1c', brand: 'Creality', name: 'K1C / K1', x: 220, y: 220, z: 250 },
  { id: 'creality-k1-max', brand: 'Creality', name: 'K1 Max', x: 300, y: 300, z: 300 },
  { id: 'creality-k2-plus', brand: 'Creality', name: 'K2 Plus', x: 350, y: 350, z: 350 },
  { id: 'elegoo-centauri-carbon', brand: 'Elegoo', name: 'Centauri Carbon', x: 256, y: 256, z: 256 },
  { id: 'elegoo-neptune4-pro', brand: 'Elegoo', name: 'Neptune 4 Pro', x: 225, y: 225, z: 265 },
  { id: 'anycubic-kobra3', brand: 'Anycubic', name: 'Kobra 3', x: 250, y: 250, z: 260 },
  { id: 'anycubic-kobra-s1', brand: 'Anycubic', name: 'Kobra S1', x: 250, y: 250, z: 250 },
  { id: 'qidi-q1-pro', brand: 'Qidi', name: 'Q1 Pro', x: 245, y: 245, z: 240 },
  { id: 'qidi-plus4', brand: 'Qidi', name: 'Plus4', x: 305, y: 305, z: 280 },
  { id: 'sovol-sv06', brand: 'Sovol', name: 'SV06', x: 220, y: 220, z: 250 },
  { id: 'flashforge-ad5m', brand: 'Flashforge', name: 'Adventurer 5M', x: 220, y: 220, z: 220 },
  { id: 'voron-24-350', brand: 'Voron', name: '2.4 (350)', x: 350, y: 350, z: 340 },
];

export const DEFAULT_PRINTER_ID = 'bambu-p1s';

// ---------------------------------------------------------------------------
// Nastavení: { printerId, customPrinters: [{ id, name, x, y, z }], margin }

export const SETTINGS_KEY = 'mod-settings-v1';
export const SETTINGS_FORMAT = 'mod-settings';

const DEFAULT_SETTINGS = { printerId: DEFAULT_PRINTER_ID, customPrinters: [], margin: 0 };

const dim = (v) => Number.isFinite(+v) && +v >= 20 && +v <= 2000;

function cleanPrinter(p) {
  if (!p || !dim(p.x) || !dim(p.y) || !dim(p.z)) return null;
  const name = String(p.name ?? '').trim().slice(0, 60) || 'Vlastní tiskárna';
  return { id: String(p.id || `custom-${Date.now().toString(36)}`), name, x: +p.x, y: +p.y, z: +p.z };
}

export function normalizeSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  s.customPrinters = (Array.isArray(s.customPrinters) ? s.customPrinters : []).map(cleanPrinter).filter(Boolean)
    .map((p) => (p.id.startsWith('custom-') ? p : { ...p, id: `custom-${p.id}` }));
  s.margin = Math.min(50, Math.max(0, Number(s.margin) || 0));
  if (!findPrinter(s, s.printerId)) s.printerId = DEFAULT_PRINTER_ID;
  return { printerId: s.printerId, customPrinters: s.customPrinters, margin: s.margin };
}

export const loadSettings = () => normalizeSettings(readJSON(SETTINGS_KEY));
export const saveSettings = (s) => writeJSON(SETTINGS_KEY, s);

export const findPrinter = (s, id) =>
  s.customPrinters?.find((p) => p.id === id) ?? PRINTER_PRESETS.find((p) => p.id === id) ?? null;

export const currentPrinter = (s) => findPrinter(s, s.printerId) ?? findPrinter(s, DEFAULT_PRINTER_ID);

export const printerName = (p) => (p.brand ? `${p.brand} ${p.name}` : p.name);

export function addCustomPrinter(s, printer) {
  const p = cleanPrinter({ ...printer, id: `custom-${Date.now().toString(36)}` });
  if (!p) throw new Error('Rozměry podložky musí být 20–2000 mm.');
  s.customPrinters.push(p);
  s.printerId = p.id;
  return p;
}

export function removeCustomPrinter(s, id) {
  s.customPrinters = s.customPrinters.filter((p) => p.id !== id);
  if (s.printerId === id) s.printerId = DEFAULT_PRINTER_ID;
}

export const exportSettings = (s) => ({ format: SETTINGS_FORMAT, version: 1, exportedAt: new Date().toISOString(), settings: s });

// Import přidá vlastní tiskárny ze souboru k existujícím (podle id se nepřepisují duplicitně)
// a převezme vybranou tiskárnu a rezervu.
export function importSettings(current, file) {
  if (file?.format !== SETTINGS_FORMAT || !file.settings) throw new Error('Soubor není export nastavení MOD.');
  const incoming = normalizeSettings(file.settings);
  const ids = new Set(current.customPrinters.map((p) => p.id));
  const merged = [...current.customPrinters, ...incoming.customPrinters.filter((p) => !ids.has(p.id))];
  return normalizeSettings({ ...incoming, customPrinters: merged, printerId: file.settings.printerId });
}

// ---------------------------------------------------------------------------
// Kontrola tiskové plochy. Díl se kontroluje v orientaci, v jaké je v STL
// (tak, jak se bude tisknout). Půdorys se bere jako konvexní obal, takže zatáčka L
// se po natočení vejde i tam, kam by se nevešel její obdélníkový obrys.

// Konvexní obal půdorysu a výška z pozic trojúhelníků (Float32Array x,y,z…).
export function footprint(positions) {
  const pts = [];
  let zMin = Infinity, zMax = -Infinity;
  const seen = new Set();
  for (let i = 0; i < positions.length; i += 3) {
    const x = Math.round(positions[i] * 100) / 100, y = Math.round(positions[i + 1] * 100) / 100, z = positions[i + 2];
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
    const k = `${x},${y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    pts.push([x, y]);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const h = [];
    for (const p of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  };
  const hull = [...half(pts), ...half([...pts].reverse())];
  return { hull, height: pts.length ? zMax - zMin : 0 };
}

function extents(hull, deg) {
  const c = Math.cos((deg * Math.PI) / 180), s = Math.sin((deg * Math.PI) / 180);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of hull) {
    const rx = x * c - y * s, ry = x * s + y * c;
    if (rx < x0) x0 = rx;
    if (rx > x1) x1 = rx;
    if (ry < y0) y0 = ry;
    if (ry > y1) y1 = ry;
  }
  return [x1 - x0, y1 - y0];
}

// Vrátí { status: 'fit' | 'diagonal' | 'none', size: [x, y, z], angle, reason }.
// fit = vejde se rovně (případně otočený o 90°), diagonal = jen natočený na podložce.
export function checkFit(fp, printer, margin = 0) {
  const bx = printer.x - 2 * margin, by = printer.y - 2 * margin, bz = printer.z;
  const [sx, sy] = extents(fp.hull, 0);
  const size = [sx, sy, fp.height];
  const eps = 0.01;
  const fits = ([w, d]) => (w <= bx + eps && d <= by + eps) || (w <= by + eps && d <= bx + eps);
  if (fp.height > bz + eps) return { status: 'none', size, reason: 'height' };
  if (fits([sx, sy])) return { status: 'fit', size, angle: 0 };
  for (let a = 1; a < 90; a++) {
    if (fits(extents(fp.hull, a))) return { status: 'diagonal', size, angle: a };
  }
  return { status: 'none', size, reason: 'footprint' };
}
