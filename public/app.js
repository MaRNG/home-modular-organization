import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { STLLoader } from 'three/addons/STLLoader.js';
import { zipSync, strToU8 } from './vendor/fflate.js';
import { download, esc, fileSlug } from './core/storage.js';
import { loadSettings, currentPrinter, printerName, footprint, checkFit } from './core/printers.js';
import { listAssemblies, assemblyFile } from './core/library.js';
import { openPrinterDialog, openLibraryDialog } from './core/dialogs.js';

// Kategorie MOD, kterou tato aplikace obsluhuje (klíč v knihovně sestav a v souborech).
const CATEGORY = 'cables';
const CATEGORY_LABEL = 'Kabely';

// ---------------------------------------------------------------------------
// Komponenty
// Polohy portů musí odpovídat funkci arms() v cable.scad. Port = poloha p (střed čela
// na vnější straně dna), směr ven d a směr otevřené strany kanálu u.
// Konec portu je buď F (otvory ve stěnách), nebo M (jazýčky s čepy).

const TAB_LEN = 10; // = tab_len v cable.scad
const cosd = (a) => Math.cos((a * Math.PI) / 180);
const sind = (a) => Math.sin((a * Math.PI) / 180);
const rad = (a) => (a * Math.PI) / 180;

// Port vodorovného ramene: v rovině dna, otevřená strana nahoru.
const flat = (x, y, a) => ({ p: [x, y, 0], d: [cosd(a), sind(a), 0], u: [0, 0, 1] });

const TYPES = {
  straight: {
    label: 'Rovný díl',
    lidLabel: 'rovný díl',
    slug: 'rovny',
    icon: 'i-straight',
    sym: 2, // počet otočení kolem Z, ve kterých díl vypadá stejně
    ports: (p) => [flat(-p.len / 2, 0, 180), flat(p.len / 2, 0, 0)],
  },
  corner: {
    label: 'Zatáčka L',
    lidLabel: 'zatáčka L',
    slug: 'zatacka',
    icon: 'i-corner-left',
    sym: 1,
    ports: (p) => [flat(-p.arm, 0, 180), flat(0, p.arm, 90)],
  },
  cross: {
    label: 'Křižovatka +',
    lidLabel: 'křižovatka +',
    slug: 'krizovatka',
    icon: 'i-cross',
    sym: 4,
    ports: (p) => [0, 90, 180, 270].map((a) => flat(p.arm * cosd(a), p.arm * sind(a), a)),
  },
  // Vnitřní roh, např. ze stolu na stěnu: svislé rameno jde nahoru, otevřená strana míří zpět.
  up: {
    label: 'Zatáčka nahoru',
    lidLabel: 'zatáčka nahoru',
    slug: 'nahoru',
    icon: 'i-up',
    sym: 1,
    ports: (p) => [flat(-p.arm, 0, 180), { p: [0, 0, p.arm], d: [0, 0, 1], u: [-1, 0, 0] }],
  },
  // Vnější roh přes hranu stolu: svislé rameno jde dolů, otevřená strana míří ven.
  down: {
    label: 'Zatáčka dolů',
    lidLabel: 'zatáčka dolů',
    slug: 'dolu',
    icon: 'i-down',
    sym: 1,
    ports: (p) => [flat(-p.arm, 0, 180), { p: [0, 0, -p.arm], d: [0, 0, -1], u: [1, 0, 0] }],
  },
  // Přesazení do strany: vstup a výstup rovnoběžně, mezi nimi dva oblouky.
  // Doleva = výstup posunutý do +y (vlevo ve směru toku od portu 0).
  s: {
    label: 'Díl S',
    lidLabel: 'díl S',
    slug: 'esko',
    icon: 'i-s-left',
    sym: 2,
    ports: (p) => {
      const o = sOffset(p);
      return [flat(-p.len / 2, -o / 2, 180), flat(p.len / 2, o / 2, 0)];
    },
  },
};

// Přesazení dílu S se znaménkem; v cable.scad jde jako `arm` (záporné = doprava).
const sOffset = (p) => (p.s_right ? -p.off : p.off);

const isBend = (type) => type === 'up' || type === 'down';

// = chamfer() v cable.scad: zkosení nesmí prořezat stěnu.
// = keep_len() v cable.scad: konec ramene bez výřezů (jazýčky, otvory, useknutý roh).
const keepLen = (p) => Math.max(TAB_LEN + 1, p.ce + 2);
// Rovný úsek ramene musí začínat za středem dílu, resp. za ohybem (= seg_start() v cable.scad).
function minArm(part) {
  const p = part.params, g = state.globals;
  if (part.type === 'up') return Math.ceil(g.f + p.h + 4 + keepLen(p) + 2);
  if (part.type === 'down') return Math.ceil(g.f + 1 + keepLen(p) + 2);
  return Math.ceil((p.w + 2 * g.t) / 2 + keepLen(p) + 1);
}
const minLen = (p) => Math.ceil(2 * keepLen(p) + 8);

// Díl S: nástavce na koncích (= s_lead() v cable.scad) a oblouky s poloměrem aspoň
// W/2 + 3 mm a úhlem nejvýš 90°. Poloměr dvou oblouků je (dx² + o²) / (4o).
function minLenS(p) {
  const lead = keepLen(p) + 8;
  const rMin = (p.w + 2 * state.globals.t) / 2 + 3;
  const dx = Math.max(p.off, Math.sqrt(Math.max(0, 4 * p.off * rMin - p.off * p.off)));
  return Math.ceil(2 * lead + dx + 1);
}

const lenMin = (part) => (part.type === 's' ? minLenS(part.params) : minLen(part.params));
const maxNotch = (p) => Math.floor(p.h / 2);

// Parametry dílu po skupinách; každou skupinu jde přenést na všechny díly.
const PART_GROUPS = [
  {
    title: 'Rozměry',
    apply: ['w', 'h'],
    params: {
      w: { label: 'Vnitřní šířka', min: 14, max: 80, step: 1 },
      h: { label: 'Vnitřní výška', min: 10, max: 60, step: 1 },
      len: { label: 'Délka', min: lenMin, max: 300, step: 5, only: ['straight', 's'] },
      off: { label: 'Přesazení do strany', min: 5, max: 150, step: 1, only: ['s'] },
      s_right: { label: 'Přesazení doprava', type: 'bool', only: ['s'] },
      arm: { label: 'Délka ramene (od středu)', min: minArm, max: 200, step: 1, only: ['corner', 'cross', 'up', 'down'] },
    },
  },
  {
    title: 'Zkosení',
    apply: ['ce'],
    params: {
      ce: { label: 'Useknutý horní roh u spojů (0 = rovný)', min: 0, max: (part) => maxNotch(part.params), step: 0.5 },
    },
  },
  {
    title: 'Výřezy v bocích',
    apply: ['slots', 'slot_w', 'slot_bar', 'slot_m', 'slot_a'],
    params: {
      slots: { label: 'Výřezy v bocích', type: 'bool' },
      slot_w: { label: 'Šířka výřezu', min: 2, max: 30, step: 0.5, needs: ['slots'] },
      slot_bar: { label: 'Šířka žebra mezi výřezy', min: 1.5, max: 20, step: 0.5, needs: ['slots'] },
      slot_m: { label: 'Okraj nahoře a dole', min: 1, max: 10, step: 0.5, needs: ['slots'] },
      slot_a: { label: 'Sklon výřezu', unit: '°', min: -60, max: 60, step: 5, needs: ['slots'] },
    },
  },
  {
    title: 'Výřezy ve dně',
    apply: ['floor_slots', 'floor_slot_w', 'floor_slot_bar', 'floor_slot_m', 'floor_slot_a'],
    params: {
      floor_slots: { label: 'Výřezy ve dně', type: 'bool' },
      floor_slot_w: { label: 'Šířka výřezu', min: 2, max: 30, step: 0.5, needs: ['floor_slots'] },
      floor_slot_bar: { label: 'Šířka žebra mezi výřezy', min: 1.5, max: 20, step: 0.5, needs: ['floor_slots'] },
      floor_slot_m: { label: 'Okraj od stěn', min: 1, max: 15, step: 0.5, needs: ['floor_slots'] },
      floor_slot_a: { label: 'Sklon výřezu', unit: '°', min: -60, max: 60, step: 5, needs: ['floor_slots'] },
    },
  },
  {
    title: 'Kryt',
    apply: ['lid', 'lid_slots', 'lid_slot_w', 'lid_slot_bar', 'lid_slot_m', 'lid_slot_a'],
    params: {
      lid: { label: 'Zakrytovat (kryt na zacvaknutí)', type: 'bool' },
      lid_slots: { label: 'Výřezy v krytu', type: 'bool', needs: ['lid'] },
      lid_slot_w: { label: 'Šířka výřezu', min: 2, max: 30, step: 0.5, needs: ['lid', 'lid_slots'] },
      lid_slot_bar: { label: 'Šířka žebra mezi výřezy', min: 1.5, max: 20, step: 0.5, needs: ['lid', 'lid_slots'] },
      lid_slot_m: { label: 'Okraj od límce', min: 1, max: 10, step: 0.5, needs: ['lid', 'lid_slots'] },
      lid_slot_a: { label: 'Sklon výřezu', unit: '°', min: -60, max: 60, step: 5, needs: ['lid', 'lid_slots'] },
    },
  },
];

const DEFAULT_PARAMS = {
  w: 30, h: 20, ce: 0, off: 30, s_right: false,
  slots: false, slot_w: 6, slot_bar: 4, slot_m: 2, slot_a: 45,
  floor_slots: false, floor_slot_w: 4, floor_slot_bar: 6, floor_slot_m: 4, floor_slot_a: 45,
  lid: false, lid_slots: false, lid_slot_w: 6, lid_slot_bar: 6, lid_slot_m: 2, lid_slot_a: 45,
};

const GLOBAL_PARAMS = {
  t: { label: 'Tloušťka stěny', min: 1.2, max: 4, step: 0.2 },
  f: { label: 'Tloušťka dna', min: 2, max: 5, step: 0.2 },
  c: { label: 'Vůle spoje', min: 0, max: 0.5, step: 0.05 },
  bump: { label: 'Výška čepu spoje', min: 0.4, max: 1.6, step: 0.1 },
  lid_bump: { label: 'Výška čepu krytu', min: 0.2, max: 1.2, step: 0.1 },
  lid_t: { label: 'Tloušťka krytu', min: 1.2, max: 4, step: 0.2 },
};

const DEFAULT_GLOBALS = { t: 2, f: 3, c: 0.2, bump: 0.9, lid_bump: 0.6, lid_t: 2 };

const limit = (v, p) => (typeof v === 'function' ? v(p) : v);

// ---------------------------------------------------------------------------
// Stav sestavy: strom dílů, polohy a pohlaví portů se vždy dopočítají.

const STORAGE_KEY = 'scad-cable-demo-v3';
let state = loadState() ?? emptyState();
let selectedId = null;
let showLids = true;

function emptyState() {
  return { category: CATEGORY, globals: { ...DEFAULT_GLOBALS }, nextId: 1, parts: [], run: null, saved: null };
}

// Nová sestava začínající jedním dílem.
function singlePartState(type) {
  const s = emptyState();
  const part = { id: s.nextId++, type, params: { ...DEFAULT_PARAMS }, parent: null };
  initSize(part);
  s.parts.push(part);
  return s;
}

// Šablona: rovná trasa zadané délky rozdělená na stejně dlouhé rovné díly.
function runState(totalCm, count) {
  const s = emptyState();
  s.run = { totalCm, count, ids: [], linked: true };
  return s;
}

// Doplní chybějící hodnoty a ověří strukturu stavu (z localStorage, knihovny nebo souboru).
function normalizeState(raw) {
  if (!Array.isArray(raw?.parts) || !raw.parts.length) return null;
  const s = structuredClone(raw);
  s.category = CATEGORY;
  s.globals = { ...DEFAULT_GLOBALS, ...s.globals };
  s.run ??= null;
  if (s.run) s.run.linked ??= true;
  s.saved ??= null;
  const ids = new Set();
  for (const p of s.parts) {
    if (!TYPES[p.type] || !Number.isInteger(p.id) || !p.params) throw new Error('Neplatný díl v sestavě.');
    ids.add(p.id);
    const { ch, cj, ...params } = p.params; // zrušené zkosení hran z dřívější verze
    p.params = { ...DEFAULT_PARAMS, ...params };
    p.parent ??= null;
  }
  for (const p of s.parts) if (p.parent !== null && !ids.has(p.parent)) throw new Error('Sestava odkazuje na chybějící díl.');
  s.nextId = Math.max(s.nextId || 0, ...ids) + 1;
  return s;
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return null;
  }
}

const serialize = (space) =>
  JSON.stringify(state, (k, v) => (k === 'used' || k === 'matrix' ? undefined : v), space);

function saveState() {
  localStorage.setItem(STORAGE_KEY, serialize());
}

// Data sestavy pro knihovnu a soubory: bez odkazu na uloženou položku.
function assemblyData() {
  if (!state.parts.length) return null;
  const { saved, ...data } = JSON.parse(serialize());
  return data;
}

// Liší se aktuální sestava od své uložené verze v knihovně? Porovnává se se
// snímkem pořízeným při uložení nebo otevření (state.saved.base).
function isDirty() {
  const data = assemblyData();
  if (!data) return false;
  return !state.saved || JSON.stringify(data) !== state.saved.base;
}

function markSaved(item) {
  state.saved = item && { id: item.id, name: item.name, base: null };
  if (state.saved) state.saved.base = JSON.stringify(assemblyData());
  saveState();
  renderAssemblyName();
}

const partById = (id) => state.parts.find((p) => p.id === id);

function addPart(type, parentId, parentPort, ownPort, right = false) {
  const parent = partById(parentId);
  const { len, arm, off, s_right, ...params } = parent.params;
  const part = { id: state.nextId++, type, params, parent: parentId, parentPort, port: ownPort };
  initSize(part, right);
  state.parts.push(part);
  return part;
}

// Výchozí velikost nového dílu podle typu.
function initSize(part, right = false) {
  const p = part.params;
  if (part.type === 'straight') {
    p.len = 80;
  } else if (part.type === 's') {
    Object.assign(p, { off: 30, s_right: right });
    p.len = Math.max(140, lenMin(part));
  } else {
    p.arm = Math.max(40, minArm(part));
  }
}

function removePart(id) {
  const doomed = new Set([id]);
  // Rodiče jsou v poli vždy před dětmi, takže stačí jeden průchod.
  for (const p of state.parts) if (doomed.has(p.parent)) doomed.add(p.id);
  state.parts = state.parts.filter((p) => !doomed.has(p.id));
  // Smazáním dílu z rovné trasy trasa přestává platit, díly zůstanou jako běžné.
  if (state.run?.ids.some((i) => doomed.has(i))) state.run = null;
}

// ---------------------------------------------------------------------------
// Rovná trasa: řetěz rovných dílů, jejichž délky dávají dohromady zadanou délku.

const MAX_LEN = PART_GROUPS[0].params.len.max;
const isRunPart = (part) => !!state.run?.ids.includes(part.id);
const runPartLen = (run) => Math.round(((run.totalCm * 10) / run.count) * 100) / 100;

// Rozsah počtu dílů, aby délka jednoho dílu zůstala mezi minimem a MAX_LEN.
function runCountRange(totalCm, params) {
  const total = totalCm * 10;
  const min = Math.max(1, Math.ceil(total / MAX_LEN - 1e-9));
  return { min, max: Math.max(min, Math.floor(total / minLen(params) + 1e-9)) };
}

// Uvede díly trasy do souladu s run.count a run.totalCm. Zachová nastavení
// existujících dílů; nové díly převezmou nastavení posledního dílu trasy.
// Díly napojené na konec trasy se přepojí na nový poslední díl.
function syncRun() {
  const run = state.run;
  if (!run) return;
  const old = run.ids.map(partById);
  const template = old.at(-1)?.params ?? { ...DEFAULT_PARAMS };
  const range = runCountRange(run.totalCm, template);
  run.count = Math.min(range.max, Math.max(range.min, run.count));
  const len = runPartLen(run);

  const ids = [];
  const added = [];
  for (let i = 0; i < run.count; i++) {
    let part = old[i];
    if (!part) {
      part = i === 0
        ? { id: state.nextId++, type: 'straight', params: { ...template }, parent: null }
        : { id: state.nextId++, type: 'straight', params: { ...template }, parent: ids[i - 1], parentPort: 1, port: 0 };
      added.push(part);
    }
    if (part.params.len !== len) {
      part.params.len = len;
      refreshGeometry(part, 200);
    }
    ids.push(part.id);
  }

  const keep = new Set(ids);
  const runParts = [...old.filter((p) => keep.has(p.id)), ...added];
  const lastOld = old.at(-1)?.id;
  const others = state.parts.filter((p) => !run.ids.includes(p.id));
  for (const p of others) if (p.parent === lastOld && p.parentPort === 1) p.parent = ids.at(-1);
  // Rodiče musí být v poli před dětmi: nejdřív trasa, pak zbytek v původním pořadí.
  state.parts = [...runParts.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)), ...others];
  run.ids = ids;
  for (const part of added) refreshGeometry(part);
  if (!partById(selectedId)) selectedId = null;
}

function clampSize(part) {
  const p = part.params;
  p.ce = Math.min(p.ce, maxNotch(p));
  if (p.arm !== undefined) p.arm = Math.max(p.arm, minArm(part));
  // Délky dílů rovné trasy hlídá syncRun() přes počet dílů.
  if (p.len !== undefined && !isRunPart(part)) p.len = Math.max(p.len, lenMin(part));
}

// Rámec portu: x = směr ven, z = otevřená strana kanálu, počátek ve středu čela.
function portMatrix({ p, d, u }) {
  const x = new THREE.Vector3(...d);
  const z = new THREE.Vector3(...u);
  return new THREE.Matrix4().makeBasis(x, z.clone().cross(x), z).setPosition(...p);
}

// Otočení o 180° kolem otevřené strany: port souseda míří proti, otevřená strana stejně.
const TURN = new THREE.Matrix4().makeRotationZ(Math.PI);

// Port v souřadnicích světa.
function worldPort(part, index) {
  const m = part.matrix.clone().multiply(portMatrix(TYPES[part.type].ports(part.params)[index]));
  return {
    pos: new THREE.Vector3().setFromMatrixPosition(m),
    d: new THREE.Vector3().setFromMatrixColumn(m, 0),
    u: new THREE.Vector3().setFromMatrixColumn(m, 2),
  };
}

const opposite = (g) => (g === 'F' ? 'M' : 'F');

// Dopočítá polohu (part.matrix), pohlaví portů a obsazenost portů všech dílů.
function layout() {
  for (const part of state.parts) {
    part.used = new Set();
    const ports = TYPES[part.type].ports(part.params);
    if (part.parent === null) {
      part.matrix = new THREE.Matrix4();
      part.genders = ports.map((_, i) => (i === 0 ? 'F' : 'M'));
      continue;
    }
    const parent = partById(part.parent);
    parent.used.add(part.parentPort);
    part.used.add(part.port);
    // Připojený konec má opačné pohlaví než rodič, ostatní konce pokračují stejně jako rodič.
    const g = parent.genders[part.parentPort];
    part.genders = ports.map((_, i) => (i === part.port ? opposite(g) : g));
    // Vlastní port dílu se položí na port rodiče otočený o 180°.
    part.matrix = parent.matrix.clone()
      .multiply(portMatrix(TYPES[parent.type].ports(parent.params)[part.parentPort]))
      .multiply(TURN)
      .multiply(portMatrix(ports[part.port]).invert());
  }

  // Uzavřené smyčky: volné porty opačného pohlaví, které na sebe přesně lícují, se spojí taky.
  const free = [];
  for (const part of state.parts) {
    part.genders.forEach((_, i) => {
      if (!part.used.has(i)) free.push({ part, i, ...worldPort(part, i) });
    });
  }
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      const a = free[i], b = free[j];
      if (a.part === b.part || a.part.used.has(a.i) || b.part.used.has(b.i)) continue;
      if (a.part.genders[a.i] === b.part.genders[b.i]) continue;
      if (a.pos.distanceTo(b.pos) < 0.5 && a.d.dot(b.d) < -0.999 && a.u.dot(b.u) > 0.999) {
        a.part.used.add(a.i);
        b.part.used.add(b.i);
      }
    }
  }
}

// Díly, které se liší jen otočením (rovný díl o 180°, křižovatka o 90°), jsou fyzicky
// stejné. Vrátí kanonické pohlaví portů a otočení, o které se kanonická geometrie natočí.
function canonical(part) {
  const g = part.genders.join('');
  const { sym } = TYPES[part.type];
  const shift = g.length / sym;
  let best = g, rot = 0;
  for (let k = 1; k < sym; k++) {
    const candidate = [...g].map((_, j) => g[(j + k * shift) % g.length]).join('');
    if (candidate < best) {
      best = candidate;
      rot = (k * 360) / sym;
    }
  }
  return { genders: best, rot };
}

// ---------------------------------------------------------------------------
// Parametry pro OpenSCAD. Do klíče cache jde jen to, co mění geometrii.

const sizeParam = (part) =>
  part.type === 'straight' ? { len: part.params.len }
    : part.type === 's' ? { len: part.params.len, arm: sOffset(part.params) }
      : { arm: part.params.arm };

// Přidá parametry skupiny, jen když je zapnutá (jinak by měnily klíč cache).
function enabled(params, on, keys) {
  return params[on] ? Object.fromEntries(keys.map((k) => [k, params[k]])) : {};
}

function bodyDefs(part) {
  const p = part.params, g = state.globals;
  return {
    what: 'body', part: part.type, ...sizeParam(part), w: p.w, h: p.h,
    t: g.t, f: g.f, c: g.c, bump: g.bump, genders: canonical(part).genders, ce: p.ce,
    slots: p.slots, ...enabled(p, 'slots', ['slot_w', 'slot_bar', 'slot_m', 'slot_a']),
    floor_slots: p.floor_slots, ...enabled(p, 'floor_slots', ['floor_slot_w', 'floor_slot_bar', 'floor_slot_m', 'floor_slot_a']),
    lid: p.lid,
  };
}

// Kryt k tisku. Kryt vodorovného dílu nezávisí na výšce dílu, kryt ohybu ano.
function lidDefs(part) {
  const p = part.params, g = state.globals;
  if (!p.lid) return null;
  return {
    what: 'lid', part: part.type, ...sizeParam(part), w: p.w, t: g.t, c: g.c, lid_bump: g.lid_bump, lid_t: g.lid_t,
    ce: p.ce, ...(isBend(part.type) ? { h: p.h, f: g.f } : {}),
    lid_slots: p.lid_slots, ...enabled(p, 'lid_slots', ['lid_slot_w', 'lid_slot_bar', 'lid_slot_m', 'lid_slot_a']),
  };
}

// Kryt v poloze na dílu, pro náhled a sestavu.
function lidViewDefs(part) {
  const defs = lidDefs(part);
  return defs && { ...defs, what: 'lid_view', h: part.params.h, f: state.globals.f };
}

const defsKey = (defs) => JSON.stringify(defs);

// ---------------------------------------------------------------------------
// Render přes OpenSCAD WASM v poolu workerů, výsledky se kešují podle parametrů.

const POOL_SIZE = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
const workers = Array.from({ length: POOL_SIZE }, () => ({
  worker: new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }),
  busy: false,
}));
const queue = [];
const pending = new Map();
let jobSeq = 0;
let wasmReady = false;
let fitPending = true;

for (const w of workers) {
  w.worker.onmessage = ({ data }) => {
    const job = pending.get(data.id);
    pending.delete(data.id);
    w.busy = false;
    if (data.error) {
      console.error(data.log.join('\n'));
      job.reject(new Error(data.error));
    } else {
      job.resolve(data.stl);
    }
    pump();
  };
}

function pump() {
  for (const w of workers) {
    if (w.busy || !queue.length) continue;
    const job = queue.shift();
    w.busy = true;
    pending.set(job.id, job);
    w.worker.postMessage({ id: job.id, defs: job.defs });
  }
  updateStatus();
}

function runOpenSCAD(defs) {
  return new Promise((resolve, reject) => {
    queue.push({ id: ++jobSeq, defs, resolve, reject });
    pump();
  });
}

const loader = new STLLoader();
const cache = new Map(); // klíč → Promise<{ stl, geometry }>
const ready = new Set(); // klíče s hotovým renderem
const footprints = new Map(); // klíč → půdorys a výška pro kontrolu tiskové plochy

function geometryFor(defs) {
  const k = defsKey(defs);
  if (!cache.has(k)) {
    cache.set(k, runOpenSCAD(defs).then((stl) => {
      const geometry = loader.parse(stl);
      footprints.set(k, footprint(geometry.getAttribute('position').array));
      ready.add(k);
      refreshBoardStates();
      return { stl, geometry };
    }));
    cache.get(k).catch(() => cache.delete(k));
  }
  return cache.get(k);
}

let lastError = null;

const plural = (n, one, few, many) => (n === 1 ? one : n > 1 && n < 5 ? few : many);
const fmt = (n) => n.toLocaleString('cs-CZ', { maximumFractionDigits: 2 });

function updateStatus() {
  const el = document.getElementById('status');
  const busy = pending.size + queue.length;
  el.className = `status${busy ? ' busy' : lastError ? ' error' : ''}`;
  if (busy) {
    el.textContent = !wasmReady ? 'Načítám OpenSCAD' : `Renderuji ${busy} ${plural(busy, 'model', 'modely', 'modelů')}`;
  } else {
    el.textContent = lastError ? `Chyba: ${lastError}` : wasmReady ? 'Připraveno' : 'OpenSCAD připraven';
  }
}

// ---------------------------------------------------------------------------
// 3D scéna

const viewport = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
viewport.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfdf5dc);

const camera = new THREE.PerspectiveCamera(40, 1, 1, 10000);
camera.up.set(0, 0, 1);
camera.position.set(-160, -220, 200);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// Dokud uživatel kamerou nepohne, drží se celá sestava v záběru (i při změně velikosti okna).
let autoFit = true;
controls.addEventListener('start', () => { autoFit = false; });

scene.add(new THREE.HemisphereLight(0xfff6e0, 0x8a6a3a, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-1, -2, 3);
scene.add(sun);

const grid = new THREE.GridHelper(1000, 100, 0xe3c987, 0xf0e2b8);
grid.rotation.x = Math.PI / 2;
grid.position.z = -0.05;
scene.add(grid);

const partGroup = new THREE.Group();
const portGroup = new THREE.Group();
scene.add(partGroup, portGroup);

const parts3d = new Map(); // part.id → { group, body, lid }

// Díly mají jednu barvu plastu; typ poznáš podle tvaru a kódu, ne podle barvy.
const PLASTIC = 0xf2a900;
const PLASTIC_SELECTED = 0xcc6f00;
const LID = 0xf9e6a8;
const LID_SELECTED = 0xf5c46a;
const litParts = new Set(); // díly zvýrazněné z tabule k tisku

function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (autoFit) fitView();
}
new ResizeObserver(resize).observe(viewport);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
  updateTags();
});

function makePart3d(part) {
  const mesh = (color) => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
    m.userData.partId = part.id;
    return m;
  };
  const o = { type: part.type, group: new THREE.Group(), body: mesh(PLASTIC), lid: mesh(LID) };
  // Poloha dílu se počítá jako matice (díly můžou být i svislé).
  o.group.matrixAutoUpdate = false;
  o.group.add(o.body, o.lid);
  partGroup.add(o.group);
  return o;
}

function paintParts() {
  for (const [id, o] of parts3d) {
    const selected = id === selectedId;
    o.body.material.color.setHex(selected ? PLASTIC_SELECTED : PLASTIC);
    o.lid.material.color.setHex(selected ? LID_SELECTED : LID);
    const glow = litParts.has(id) ? 0x5a3200 : 0x000000;
    o.body.material.emissive.setHex(glow);
    o.lid.material.emissive.setHex(glow);
  }
}

function syncScene() {
  for (const [id, o] of parts3d) {
    // Nová sestava čísluje díly znovu od 1, takže stejné id může mít jiný typ.
    if (partById(id)?.type !== o.type) {
      partGroup.remove(o.group);
      o.body.material.dispose();
      o.lid.material.dispose();
      parts3d.delete(id);
    }
  }

  for (const part of state.parts) {
    if (!parts3d.has(part.id)) parts3d.set(part.id, makePart3d(part));
    const o = parts3d.get(part.id);
    o.group.matrix.copy(part.matrix);
    o.group.matrixWorldNeedsUpdate = true;
    o.body.rotation.z = rad(canonical(part).rot);
    o.lid.visible = part.params.lid && showLids;
  }

  paintParts();
  rebuildPortMarkers();
}

// Štítky s kódem STL nad díly; poloha se počítá po každém snímku.
const tagLayer = document.getElementById('tags');
const tags = new Map(); // part.id → element
const tagPoint = new THREE.Vector3();

function updateTags() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  for (const [id, el] of tags) {
    if (!parts3d.has(id)) {
      el.remove();
      tags.delete(id);
    }
  }
  for (const [id, o] of parts3d) {
    let el = tags.get(id);
    if (!el) {
      el = document.createElement('span');
      tagLayer.append(el);
      tags.set(id, el);
    }
    const geometry = o.body.geometry;
    if (!geometry.boundingBox && geometry.getAttribute('position')) geometry.computeBoundingBox();
    if (!geometry.boundingBox) {
      el.hidden = true;
      continue;
    }
    geometry.boundingBox.getCenter(tagPoint).applyMatrix4(o.body.matrixWorld).project(camera);
    el.hidden = tagPoint.z > 1;
    const text = partCodes.get(id) ?? '';
    const cls = `tag${id === selectedId ? ' selected' : litParts.has(id) ? ' lit' : ''}`;
    if (el.textContent !== text) el.textContent = text;
    if (el.className !== cls) el.className = cls;
    el.style.transform = `translate(${((tagPoint.x + 1) / 2) * w}px, ${((1 - tagPoint.y) / 2) * h}px) translate(-50%, -50%)`;
  }
}

const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2a00, roughness: 0.5 });
const markerHover = new THREE.MeshStandardMaterial({ color: 0xf2a900, roughness: 0.4 });
const coneGeometry = new THREE.ConeGeometry(4, 10, 20).rotateZ(-Math.PI / 2).translate(9, 0, 0);
const ballGeometry = new THREE.SphereGeometry(3.5, 20, 12);

function rebuildPortMarkers() {
  portGroup.clear();
  for (const part of state.parts) {
    part.genders.forEach((gender, i) => {
      if (part.used.has(i)) return;
      const p = worldPort(part, i);
      const marker = new THREE.Group();
      marker.add(new THREE.Mesh(coneGeometry, markerMaterial), new THREE.Mesh(ballGeometry, markerMaterial));
      // Konec s čepy má jazýčky přesahující přes port, šipka je proto o kus dál.
      const reach = gender === 'M' ? TAB_LEN : 0;
      marker.position.copy(p.pos).addScaledVector(p.d, reach).addScaledVector(p.u, state.globals.f + part.params.h / 2);
      marker.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(p.d, p.u.clone().cross(p.d), p.u));
      marker.userData.port = { partId: part.id, index: i };
      portGroup.add(marker);
    });
  }
}

// Přerenderuje tělo a kryt dílu, pokud neodpovídají aktuálním parametrům.
const renderTimers = new Map();

function refreshGeometry(part, delay = 0) {
  clearTimeout(renderTimers.get(part.id));
  renderTimers.set(part.id, setTimeout(() => {
    renderTimers.delete(part.id);
    const slots = { body: bodyDefs, lid: lidViewDefs };
    for (const [slot, defsOf] of Object.entries(slots)) {
      const defs = defsOf(part);
      if (!defs) continue;
      const k = defsKey(defs);
      geometryFor(defs).then(({ geometry }) => {
        const current = partById(part.id);
        const o = parts3d.get(part.id);
        if (!current || !o || defsKey(defsOf(current)) !== k) return;
        o[slot].geometry = geometry;
        lastError = null;
        wasmReady = true;
        if (fitPending && !pending.size && !queue.length) {
          fitPending = false;
          // Stejné díly sdílí jeden render; počkat, až geometrii dostanou všechny.
          setTimeout(fitView);
        }
        updateStatus();
      }).catch((e) => {
        lastError = e.message;
        updateStatus();
      });
    }
  }, delay));
}

function fitView() {
  const box = new THREE.Box3().setFromObject(partGroup);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const dir = new THREE.Vector3(-0.45, -0.65, 0.6).normalize();
  controls.target.copy(center);
  // Na výšku (mobil) je potřeba víc ustoupit, aby se sestava vešla i do šířky.
  const portrait = Math.max(1, 1.4 / camera.aspect);
  camera.position.copy(center).addScaledVector(dir, Math.max(size, 80) * 1.05 * portrait);
  autoFit = true;
}

// ---------------------------------------------------------------------------
// Interakce: klik na díl = výběr, klik na šipku = menu pro připojení.

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const portMenu = document.getElementById('port-menu');
let menuPort = null;
let downAt = null;
let hovered = null;

function pick(event, objects) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(objects, true).find((hit) => hit.object.visible)?.object ?? null;
}

const markerOf = (obj) => (obj?.parent?.userData.port ? obj.parent : null);

renderer.domElement.addEventListener('pointerdown', (e) => {
  downAt = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointermove', (e) => {
  const marker = markerOf(pick(e, portGroup.children));
  if (marker === hovered) return;
  hovered?.children.forEach((m) => (m.material = markerMaterial));
  marker?.children.forEach((m) => (m.material = markerHover));
  hovered = marker;
  renderer.domElement.style.cursor = marker || pick(e, partGroup.children) ? 'pointer' : '';
});

renderer.domElement.addEventListener('pointerup', (e) => {
  // Tažení kamerou není klik.
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 4) return;
  const marker = markerOf(pick(e, portGroup.children));
  if (marker) {
    openPortMenu(marker.userData.port, e);
    return;
  }
  closePortMenu();
  const hit = pick(e, partGroup.children);
  select(hit ? hit.userData.partId : null);
});

function openPortMenu(port, event) {
  menuPort = port;
  const rect = viewport.getBoundingClientRect();
  portMenu.hidden = false;
  const x = Math.min(event.clientX - rect.left + 8, rect.width - portMenu.offsetWidth - 8);
  const y = Math.min(event.clientY - rect.top + 8, rect.height - portMenu.offsetHeight - 8);
  portMenu.style.left = `${x}px`;
  portMenu.style.top = `${y}px`;
}

function closePortMenu() {
  portMenu.hidden = true;
  menuPort = null;
}

portMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || !menuPort) return;
  const part = addPart(btn.dataset.add, menuPort.partId, menuPort.index, Number(btn.dataset.port), 'right' in btn.dataset);
  closePortMenu();
  changed();
  refreshGeometry(part);
  select(part.id);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePortMenu();
  if (e.key === 'Delete' && selectedId && e.target === document.body) deleteSelected();
});

// ---------------------------------------------------------------------------
// Boční panel

function slider(def, value, ctx, onInput) {
  const row = document.createElement('div');
  row.className = 'field';
  const id = `f-${Math.random().toString(36).slice(2)}`;
  row.innerHTML = `<div class="field-row"><label for="${id}">${def.label}</label>
    <span class="field-value"><input type="number" id="${id}" inputmode="decimal"><span class="field-unit">${def.unit ?? 'mm'}</span></span></div>
    <input type="range" aria-label="${def.label}" tabindex="-1">`;
  const number = row.querySelector('input[type="number"]');
  const range = row.querySelector('input[type="range"]');
  const apply = () => {
    for (const el of [range, number]) {
      el.min = limit(def.min, ctx());
      el.max = limit(def.max, ctx());
      el.step = def.step;
    }
  };
  apply();
  range.value = number.value = value;
  const set = (v, src) => {
    v = Math.min(limit(def.max, ctx()), Math.max(limit(def.min, ctx()), Number(v)));
    if (Number.isNaN(v)) return;
    if (src !== range) range.value = v;
    if (src !== number) number.value = v;
    onInput(v);
  };
  range.addEventListener('input', () => set(range.value, range));
  number.addEventListener('change', () => set(number.value, null));
  row.refreshLimits = apply;
  row.setValue = (v) => {
    if (!row.contains(document.activeElement)) range.value = number.value = v;
  };
  return row;
}

function checkbox(def, value, onChange) {
  const row = document.createElement('label');
  row.className = 'check';
  row.innerHTML = `<input type="checkbox"> ${def.label}`;
  const input = row.querySelector('input');
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  return row;
}

// Záložky lístku: DÍL / TRASA / SESTAVA. Každá vždy říká, na kolik dílů změna dopadne.
const tabs = [...document.querySelectorAll('.pass-tabs [role="tab"]')];
let activeTab = 'part';

const partsWord = (n) => `${n} ${plural(n, 'díl', 'díly', 'dílů')}`;

// Díly, na které dopadne změna nastavení vybraného dílu.
function partTargets(part) {
  return state.run?.linked && isRunPart(part) ? state.run.ids.map(partById) : [part];
}

function renderTabs() {
  if (activeTab === 'run' && !state.run) activeTab = 'part';
  const part = partById(selectedId);
  const scopes = {
    part: part ? (partTargets(part).length > 1 ? `${partsWord(partTargets(part).length)} trasy` : `#${part.id}`) : 'nevybráno',
    run: state.run ? partsWord(state.run.count) : 'není',
    assembly: partsWord(state.parts.length),
  };
  for (const tab of tabs) {
    const name = tab.dataset.tab;
    const on = name === activeTab;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    tab.disabled = name === 'run' && !state.run;
    tab.querySelector('.tab-scope').textContent = scopes[name];
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
  }
  document.getElementById('assembly-scope').textContent = `všech ${partsWord(state.parts.length)}`;
}

function setTab(name) {
  activeTab = name;
  renderTabs();
}

for (const tab of tabs) {
  tab.addEventListener('click', () => setTab(tab.dataset.tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const usable = tabs.filter((t) => !t.disabled);
    const next = usable[(usable.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : usable.length - 1)) % usable.length];
    setTab(next.dataset.tab);
    next.focus();
  });
}

function select(id) {
  selectedId = id;
  if (id) activeTab = 'part';
  renderPartPanel();
  renderTabs();
  paintParts();
}

function variant(part) {
  const g = canonical(part).genders;
  if (part.type === 'corner') return g[0] === 'F' ? { label: 'levá', slug: '-leva' } : { label: 'pravá', slug: '-prava' };
  if (part.type === 'cross') {
    const m = [...g].filter((x) => x === 'M').length;
    return { label: `${m}× čepy, ${4 - m}× otvory`, slug: `-${m}cepy` };
  }
  if (part.type === 's') {
    return part.params.s_right ? { label: 'doprava', slug: `-doprava-${part.params.off}` }
                               : { label: 'doleva', slug: `-doleva-${part.params.off}` };
  }
  // Ohyb s čepy dole a s čepy nahoře jsou dva různé díly.
  if (isBend(part.type)) {
    return g[0] === 'F' ? { label: 'čepy na svislém konci', slug: '-cepy-svisle' }
                        : { label: 'čepy na vodorovném konci', slug: '-cepy-vodorovne' };
  }
  return { label: '', slug: '' };
}

const sizeLabel = (part) =>
  part.type === 'straight' ? `délka ${part.params.len} mm`
    : part.type === 's' ? `délka ${part.params.len} mm, přesazení ${part.params.off} mm`
      : `rameno ${part.params.arm} mm`;

function bodyLabel(part) {
  const v = variant(part).label;
  return `${TYPES[part.type].label}${v ? ` (${v})` : ''} – ${part.params.w}×${part.params.h}, ${sizeLabel(part)}` +
    (part.params.ce ? ', zkosení' : '') + (part.params.slots ? ', výřezy v bocích' : '') + (part.params.floor_slots ? ', výřezy ve dně' : '') +
    (part.params.lid ? ', pro kryt' : '');
}

const lidVariant = (part) => (part.type === 's' ? variant(part) : { label: '', slug: '' });

const lidLabel = (part) =>
  `Kryt – ${TYPES[part.type].lidLabel}${lidVariant(part).label ? ` (${lidVariant(part).label})` : ''}, šířka ${part.params.w}, ${sizeLabel(part)}` +
  (part.params.ce ? ', zkosení' : '') + (part.params.lid_slots ? ', s výřezy' : '');

const sizeSlug = (part) => part.params.len ?? part.params.arm;
const bodyFile = (part) =>
  `${TYPES[part.type].slug}${variant(part).slug}_${part.params.w}x${part.params.h}_${sizeSlug(part)}mm` +
  `${part.params.ce ? '_zkos' : ''}${part.params.slots ? '_bok' : ''}${part.params.floor_slots ? '_dno' : ''}${part.params.lid ? '_kryt' : ''}`;
const lidFile = (part) =>
  `kryt-${TYPES[part.type].slug}${lidVariant(part).slug}_${part.params.w}_${sizeSlug(part)}mm` +
  `${part.params.ce ? '_zkos' : ''}${part.params.lid_slots ? '_vyrezy' : ''}`;

function renderPartPanel() {
  const panel = document.getElementById('part-panel');
  panel.innerHTML = '';
  const part = partById(selectedId);
  if (!part) {
    panel.innerHTML = `<div class="empty"><strong>Žádný vybraný díl</strong>
      Klikni na díl ve scéně. Na volném konci je šipka, přes kterou připojíš další díl.</div>`;
    return;
  }
  // U propojené rovné trasy se změna dílu trasy použije na všechny její díly.
  const targets = partTargets(part);
  const v = variant(part).label;
  panel.innerHTML = `<div class="pass-head">
      <div class="pass-code">${partCodes.get(part.id) ?? '–'}</div>
      <div class="pass-type">${TYPES[part.type].label}</div>
      <div class="pass-meta">#${part.id}${v ? ` · ${v}` : ''}</div>
    </div>
    <dl class="pass-stub" id="pass-stub">
      <div><dt>Rozměr</dt><dd data-stub="size"></dd></div>
      <div><dt>Ks</dt><dd data-stub="count"></dd></div>
      <div><dt>Trasa</dt><dd data-stub="run"></dd></div>
      <div><dt>Stav</dt><dd data-stub="state"></dd></div>
    </dl>
    <div class="tear" aria-hidden="true"></div>
    <div class="scope${targets.length > 1 ? ' linked' : ''}"><span>Platí pro</span>
      <b>${targets.length > 1 ? `${partsWord(targets.length)} rovné trasy` : 'jen tento díl'}</b></div>`;
  updateStub();
  const setParam = (name, value, delay) => {
    for (const p of targets) {
      p.params[name] = value;
      clampSize(p);
      refreshGeometry(p, delay);
    }
    changed();
  };

  const rows = {};
  for (const group of PART_GROUPS) {
    const section = document.createElement('div');
    section.className = 'segment';
    section.innerHTML = `<div class="segment-head"><h3>${group.title}</h3></div>`;
    if (state.parts.length > targets.length) {
      const apply = document.createElement('button');
      apply.className = 'link-btn';
      apply.type = 'button';
      apply.textContent = `Na všech ${state.parts.length}`;
      apply.title = `Použít „${group.title}“ na všechny díly sestavy`;
      apply.addEventListener('click', () => {
        for (const p of state.parts) {
          for (const k of group.apply) p.params[k] = part.params[k];
          clampSize(p);
          refreshGeometry(p);
        }
        changed();
        renderPartPanel();
      });
      section.firstElementChild.append(apply);
    }
    for (const [name, def] of Object.entries(group.params)) {
      if (def.only && !def.only.includes(part.type)) continue;
      if (def.needs && !def.needs.every((n) => part.params[n])) continue;
      if (name === 'len' && isRunPart(part)) {
        const note = document.createElement('p');
        note.className = 'segment-note';
        note.textContent = `Délku ${fmt(part.params.len)} mm určuje rovná trasa.`;
        section.append(note);
        continue;
      }
      if (def.type === 'bool') {
        rows[name] = checkbox(def, part.params[name], (value) => {
          setParam(name, value, 0);
          renderPartPanel();
        });
      } else {
        rows[name] = slider(def, part.params[name], () => part, (value) => {
          setParam(name, value, 200);
          // Rozměry na sobě závisí (šířka a zkosení mění minimální délku, výška maximum zkosení).
          for (const [other, row] of Object.entries(rows)) {
            if (other === name || !row.refreshLimits) continue;
            row.refreshLimits();
            row.setValue(part.params[other]);
          }
        });
      }
      section.append(rows[name]);
    }
    panel.append(section);
  }

  const foot = document.createElement('div');
  foot.className = 'pass-foot';
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn btn-danger';
  del.textContent = 'Smazat díl a navazující';
  del.disabled = part.parent === null;
  del.addEventListener('click', deleteSelected);
  foot.append(del);
  if (del.disabled) {
    const why = document.createElement('p');
    why.className = 'segment-note';
    why.textContent = 'První díl sestavy nejde smazat; začni Novou sestavou.';
    foot.append(why);
  }
  panel.append(foot);
}

// Údaje lístku vybraného dílu: rozměr, počet kusů jeho STL, trasa a stav renderu.
function updateStub() {
  const stub = document.getElementById('pass-stub');
  const part = partById(selectedId);
  if (!stub || !part) return;
  const item = printList.find((it) => it.kind === 'body' && it.partIds.includes(part.id));
  const values = {
    size: sizeText(part, false),
    count: item ? String(item.count) : '–',
    run: isRunPart(part) ? partsWord(state.run.count) : '—',
    state: item ? rowState(item).text : '–',
  };
  for (const [k, v] of Object.entries(values)) stub.querySelector(`[data-stub="${k}"]`).textContent = v;
  stub.querySelector('[data-stub="state"]').classList.toggle('changed', !!item && unseen.has(item.key) && ready.has(item.key));
}

function deleteSelected() {
  const part = partById(selectedId);
  if (!part || part.parent === null) return;
  removePart(part.id);
  selectedId = null;
  changed();
  renderPartPanel();
}

function renderGlobalPanel() {
  const panel = document.getElementById('global-panel');
  panel.innerHTML = '<div class="segment-head"><h3>Profil a spoje</h3></div>';
  for (const [name, def] of Object.entries(GLOBAL_PARAMS)) {
    panel.append(slider(def, state.globals[name], () => state.globals, (value) => {
      state.globals[name] = value;
      for (const p of state.parts) {
        clampSize(p);
        refreshGeometry(p, 250);
      }
      changed();
      renderPartPanel();
    }));
  }
  panel.append(checkbox({ label: 'Zobrazit kryty v náhledu' }, showLids, (value) => {
    showLids = value;
    syncScene();
  }));
}

// ---------------------------------------------------------------------------
// Tabule k tisku: stejná geometrie = jedno STL, tiskne se vícekrát.
// Každé STL má kód (A, B, …), který je vidět i na dílech ve scéně. Nový nebo
// změněný řádek se překlopí a drží stav ZMĚNĚNO, dokud na něj uživatel nenajede.

let printList = [];
const partCodes = new Map(); // part.id → kód STL těla
const seenKeys = new Set();
const unseen = new Set();
const flipNext = new Set();
let boardPrimed = false;

const codeAt = (i) => (i < 26 ? String.fromCharCode(65 + i) : codeAt(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));

function sizeText(part, lid) {
  const { w, h, len, arm, off } = part.params;
  const size = part.type === 'straight' ? `×${fmt(len)}`
    : part.type === 's' ? `×${fmt(len)} · posun ${off}` : ` · R${arm}`;
  return lid ? `${w}${size}` : `${w}×${h}${size}`;
}

function bodyMods(part) {
  const p = part.params;
  return [variant(part).label, p.ce && `zkosení ${fmt(p.ce)}`, p.slots && 'výřezy boky', p.floor_slots && 'výřezy dno',
    p.lid && 'pro kryt'].filter(Boolean).join(' · ');
}

const lidMods = (part) =>
  [lidVariant(part).label, part.params.ce && 'zkosení', part.params.lid_slots && 'výřezy'].filter(Boolean).join(' · ');

function buildPrintList() {
  const items = new Map();
  const add = (defs, part, fields) => {
    const key = defsKey(defs);
    if (!items.has(key)) items.set(key, { key, defs, partIds: [], count: 0, ...fields });
    const item = items.get(key);
    item.count++;
    item.partIds.push(part.id);
  };
  for (const part of state.parts) {
    add(bodyDefs(part), part, {
      kind: 'body', icon: part.type === 's' && part.params.s_right ? 'i-s-right' : TYPES[part.type].icon,
      name: TYPES[part.type].label,
      size: sizeText(part, false), mods: bodyMods(part), label: bodyLabel(part), file: bodyFile(part),
    });
  }
  for (const part of state.parts) {
    const defs = lidDefs(part);
    if (!defs) continue;
    add(defs, part, {
      kind: 'lid', icon: 'i-lid', name: `Kryt · ${TYPES[part.type].lidLabel}`,
      size: sizeText(part, true), mods: lidMods(part), label: lidLabel(part), file: lidFile(part),
    });
  }
  return [...items.values()].map((item, i) => ({ ...item, code: codeAt(i) }));
}

// ---------------------------------------------------------------------------
// Tiskárna: kontrola, jestli se STL vejde na podložku.

let settings = loadSettings();

function fitOf(item) {
  const fp = footprints.get(item.key);
  return fp ? checkFit(fp, currentPrinter(settings), settings.margin) : null;
}

function fitCell(item) {
  const fit = fitOf(item);
  if (!fit) return '<span class="fit pending">—</span>';
  const dims = fit.size.map((v) => Math.ceil(v)).join('×');
  if (fit.status === 'fit') return `<span class="fit ok">Vejde se</span><small class="fit-dims">${dims}</small>`;
  if (fit.status === 'diagonal') {
    return `<span class="fit diagonal" title="Vejde se jen natočený o ${fit.angle}° na podložce">Natočit ${fit.angle}°</span><small class="fit-dims">${dims}</small>`;
  }
  const why = fit.reason === 'height' ? 'vysoký' : 'velký';
  return `<span class="fit none" title="Díl ${dims} mm je na podložku příliš ${why}">Nevejde se</span><small class="fit-dims">${dims}</small>`;
}

function fitSummary() {
  const bad = printList.filter((item) => fitOf(item)?.status === 'none').length;
  const el = document.getElementById('fit-summary');
  el.hidden = !bad;
  el.textContent = bad ? `${bad} STL se ${plural(bad, 'nevejde', 'nevejdou', 'nevejde')} na podložku` : '';
}

function renderPrinterButton() {
  const p = currentPrinter(settings);
  document.getElementById('printer-name').textContent = `${printerName(p)} · ${p.x}×${p.y}×${p.z}`;
}

document.getElementById('printer').onclick = () => openPrinterDialog({
  settings,
  onChange: (next) => {
    settings = next;
    renderPrinterButton();
    renderPrintList();
  },
});

function rowState(item) {
  if (!ready.has(item.key)) return { cls: 'busy', text: 'Renderuji' };
  if (unseen.has(item.key)) return { cls: 'changed', text: 'Změněno' };
  return { cls: '', text: 'Připraveno' };
}

function renderPrintList() {
  printList = buildPrintList();
  partCodes.clear();
  for (const item of printList) if (item.kind === 'body') for (const id of item.partIds) partCodes.set(id, item.code);

  const keys = new Set(printList.map((item) => item.key));
  if (boardPrimed) {
    for (const k of keys) {
      if (!seenKeys.has(k)) {
        unseen.add(k);
        flipNext.add(k);
      }
    }
  }
  for (const k of [...unseen]) if (!keys.has(k)) unseen.delete(k);
  seenKeys.clear();
  for (const k of keys) seenKeys.add(k);
  boardPrimed = state.parts.length > 0;

  // Kryty k tisku se renderují dopředu, aby šly hned stáhnout.
  for (const item of printList) geometryFor(item.defs);

  const total = printList.reduce((sum, item) => sum + item.count, 0);
  document.getElementById('print-summary').textContent =
    total ? `${total} ks · ${printList.length} STL` : '';
  fitSummary();
  const body = document.getElementById('print-list');
  if (!printList.length) {
    body.innerHTML = '<tr class="board-empty"><td colspan="8">Sestava je prázdná. Začni tlačítkem Nová sestava.</td></tr>';
    return;
  }
  body.innerHTML = printList.map((item, i) => {
    const st = rowState(item);
    const cls = [unseen.has(item.key) && 'changed', flipNext.has(item.key) && 'flip',
      fitOf(item)?.status === 'none' && 'nofit'].filter(Boolean).join(' ');
    return `<tr data-item="${i}" class="${cls}">
      <td><span class="board-code">${item.code}</span></td>
      <td><span class="board-name"><svg class="ico"><use href="#${item.icon}"/></svg>${item.name}</span></td>
      <td><span>${item.size}</span></td>
      <td><span class="board-mod">${item.mods || '—'}</span></td>
      <td><span class="board-fit">${fitCell(item)}</span></td>
      <td class="num"><span class="board-count">${item.count}</span></td>
      <td><span class="state ${st.cls}">${st.text}</span></td>
      <td><button class="board-dl" type="button" data-item="${i}" ${ready.has(item.key) ? '' : 'disabled'}
        aria-label="Stáhnout ${item.file}.stl"><svg class="ico"><use href="#i-download"/></svg>STL</button></td>
    </tr>`;
  }).join('');
  flipNext.clear();
}

// Po dokončení renderu jen přepíše stav řádků, aby se nepřerušilo překlopení.
let boardRefresh = 0;
function refreshBoardStates() {
  cancelAnimationFrame(boardRefresh);
  boardRefresh = requestAnimationFrame(() => {
    for (const row of document.querySelectorAll('#print-list tr[data-item]')) {
      const item = printList[Number(row.dataset.item)];
      if (!item) continue;
      const st = rowState(item);
      const badge = row.querySelector('.state');
      badge.className = `state ${st.cls}`;
      badge.textContent = st.text;
      row.querySelector('.board-dl').disabled = !ready.has(item.key);
      row.querySelector('.board-fit').innerHTML = fitCell(item);
      row.classList.toggle('nofit', fitOf(item)?.status === 'none');
    }
    fitSummary();
    updateStub();
  });
}

const boardBody = document.getElementById('print-list');

function markSeen(row) {
  const item = printList[Number(row.dataset.item)];
  if (!item || !unseen.delete(item.key)) return;
  row.classList.remove('changed');
  updateStub();
  const st = rowState(item);
  row.querySelector('.state').className = `state ${st.cls}`;
  row.querySelector('.state').textContent = st.text;
}

boardBody.addEventListener('mouseover', (e) => {
  const row = e.target.closest('tr[data-item]');
  if (!row) return;
  markSeen(row);
  const item = printList[Number(row.dataset.item)];
  litParts.clear();
  for (const id of item.partIds) litParts.add(id);
  paintParts();
});

boardBody.addEventListener('mouseleave', () => {
  litParts.clear();
  paintParts();
});

boardBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-item]');
  const row = e.target.closest('tr[data-item]');
  if (!row) return;
  const item = printList[Number(row.dataset.item)];
  if (!btn) {
    // Klik na řádek vybere první díl s tímto STL.
    select(item.partIds[0]);
    return;
  }
  btn.disabled = true;
  try {
    const { stl } = await geometryFor(item.defs);
    download(`${item.code}_${item.file}_${item.count}ks.stl`, stl, 'model/stl');
  } catch (err) {
    lastError = err.message;
    updateStatus();
  } finally {
    btn.disabled = false;
  }
});

function changed() {
  syncRun();
  layout();
  syncScene();
  renderRunPanel();
  renderPrintList();
  renderTabs();
  updateStub();
  saveState();
  renderAssemblyName();
  updateStatus();
  const empty = !state.parts.length;
  for (const id of ['export-zip', 'export-stl', 'fit']) document.getElementById(id).disabled = empty;
}

// ---------------------------------------------------------------------------
// Export

// Argumenty modulu ze stejných parametrů, jaké jdou do rendrování dílů.
function scadArgs(defs) {
  const { what, part, ...args } = defs;
  return `"${part}", ` + Object.entries(args)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? JSON.stringify(v) : v}`).join(', ');
}

function assemblyScad() {
  const lines = [];
  for (const p of state.parts) {
    // Matice v řádcích; three.js ji drží po sloupcích.
    const e = p.matrix.elements.map((v) => +v.toFixed(4));
    const at = `multmatrix([${[0, 1, 2, 3].map((r) => `[${e[r]}, ${e[r + 4]}, ${e[r + 8]}, ${e[r + 12]}]`).join(', ')}])`;
    // V sestavě se díl kreslí se skutečným pořadím pohlaví portů, ne kanonickým.
    lines.push(`${at} cable_part(${scadArgs({ ...bodyDefs(p), genders: p.genders.join('') })});`);
    const lid = lidViewDefs(p);
    if (lid) lines.push(`${at} cable_lid_placed(${scadArgs(lid)});`);
  }
  return `// Vygenerováno konfigurátorem kabelového žlabu\nuse <cable.scad>\n\n${lines.join('\n')}\n`;
}

document.getElementById('export-zip').onclick = async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const files = {};
    const lines = [];
    for (const item of buildPrintList()) {
      const { stl } = await geometryFor(item.defs);
      const name = `${item.code}_${item.file}_${item.count}ks.stl`;
      files[name] = new Uint8Array(stl);
      const fit = fitOf(item);
      const note = fit?.status === 'none' ? '  [NEVEJDE SE NA PODLOŽKU]' : fit?.status === 'diagonal' ? `  [natočit o ${fit.angle}°]` : '';
      lines.push(`${item.code}  ${item.count}× ${item.label}  →  ${name}${note}`);
    }
    const p = currentPrinter(settings);
    files['kusovnik.txt'] = strToU8(`Díly k tisku${state.saved ? ` – ${state.saved.name}` : ''}\n` +
      `Tiskárna: ${printerName(p)} (${p.x}×${p.y}×${p.z} mm${settings.margin ? `, rezerva ${settings.margin} mm` : ''})\n\n${lines.join('\n')}\n`);
    files['sestava.scad'] = strToU8(assemblyScad());
    files['cable.scad'] = strToU8(await (await fetch('cable.scad')).text());
    files['sestava.json'] = strToU8(JSON.stringify(assemblyFile({
      name: state.saved?.name ?? 'Kabelový žlab', category: CATEGORY, savedAt: new Date().toISOString(), data: assemblyData(),
    }), null, 2));
    download(`${state.saved ? fileSlug(state.saved.name) : 'kabelovy-zlab'}.zip`, zipSync(files, { level: 6 }), 'application/zip');
  } catch (err) {
    lastError = err.message;
    updateStatus();
  } finally {
    btn.disabled = false;
  }
};

// Sloučí geometrie všech dílů a krytů v jejich polohách do jednoho binárního STL.
document.getElementById('export-stl').onclick = async () => {
  partGroup.updateMatrixWorld(true);
  const pieces = [];
  for (const part of state.parts) {
    const o = parts3d.get(part.id);
    pieces.push({ defs: bodyDefs(part), matrix: o.body.matrixWorld });
    const lid = lidViewDefs(part);
    if (lid) pieces.push({ defs: lid, matrix: o.lid.matrixWorld });
  }
  const tris = [];
  const v = new THREE.Vector3();
  for (const { defs, matrix } of pieces) {
    const pos = (await geometryFor(defs)).geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) tris.push(...v.fromBufferAttribute(pos, i).applyMatrix4(matrix).toArray());
  }
  const count = tris.length / 9;
  const buf = new DataView(new ArrayBuffer(84 + count * 50));
  buf.setUint32(80, count, true);
  for (let t = 0; t < count; t++) {
    const o = 84 + t * 50;
    const [a, b, c] = [0, 1, 2].map((k) => new THREE.Vector3().fromArray(tris, t * 9 + k * 3));
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    [normal, a, b, c].forEach((vec, k) => vec.toArray().forEach((val, j) => buf.setFloat32(o + k * 12 + j * 4, val, true)));
  }
  download('kabelovy-zlab-sestava.stl', buf.buffer, 'model/stl');
};

document.getElementById('fit').onclick = fitView;

document.getElementById('reset').onclick = () => openStart();

// ---------------------------------------------------------------------------
// Knihovna sestav (sdílené okno z core/dialogs.js)

function renderAssemblyName() {
  const el = document.getElementById('assembly-name');
  const dirty = isDirty();
  el.textContent = state.saved ? state.saved.name : state.parts.length ? 'Neuložená sestava' : '';
  el.classList.toggle('unsaved', !!state.saved && dirty);
  el.title = state.saved && dirty ? 'Neuložené změny' : '';
}

const legacyAssembly = (json) =>
  (Array.isArray(json?.parts) ? { name: 'Importovaná sestava', category: CATEGORY, data: json } : null);

function openAssemblyLibrary() {
  openLibraryDialog({
    category: CATEGORY,
    categoryLabel: CATEGORY_LABEL,
    snapshot: assemblyData,
    current: () => state.saved,
    isDirty,
    describe: (data) => partsWord(data.parts?.length ?? 0) + (data.run ? ` · trasa ${fmt(data.run.totalCm)} cm` : ''),
    onSaved: markSaved,
    onOpen: (item) => {
      const s = normalizeState(item.data);
      if (!s) throw new Error('Sestava je prázdná.');
      startWith(s);
      markSaved(item);
    },
    legacy: legacyAssembly,
  });
}

document.getElementById('library').onclick = openAssemblyLibrary;

function startWith(newState) {
  state = newState;
  selectedId = null;
  activeTab = state.run ? 'run' : 'part';
  // Díly nové sestavy nejsou „změněné“.
  boardPrimed = false;
  unseen.clear();
  changed();
  renderGlobalPanel();
  renderPartPanel();
  fitPending = true;
  for (const p of state.parts) refreshGeometry(p);
  closeStart();
}

// ---------------------------------------------------------------------------
// Panel rovné trasy

const runRows = {};

function renderRunPanel() {
  const panel = document.getElementById('run-panel');
  const run = state.run;
  if (!run) {
    panel.innerHTML = '';
    return;
  }
  if (!panel.querySelector('.run-figure')) buildRunPanel(panel);
  runRows.total.setValue(run.totalCm);
  runRows.count.refreshLimits();
  runRows.count.setValue(run.count);
  panel.querySelector('#run-figure').innerHTML =
    `<b>${run.count} × ${fmt(runPartLen(run))}</b><span>mm = ${fmt(run.totalCm)} cm</span>`;
  panel.querySelector('#run-scope').textContent = `${partsWord(run.count)} trasy`;
  panel.querySelector('#run-linked').checked = run.linked;
}

function buildRunPanel(panel) {
  panel.innerHTML = `<div class="run-figure" id="run-figure"></div>
    <div class="scope"><span>Platí pro</span><b id="run-scope"></b></div>
    <div class="segment" id="run-fields"><div class="segment-head"><h3>Délka a dělení</h3></div></div>
    <div class="segment"><label class="check"><input type="checkbox" id="run-linked"> Nastavení dílu platí pro celou trasu</label>
      <p class="segment-note">Změna rozměrů, zkosení, výřezů nebo krytu na kterémkoli dílu trasy se použije na všechny její díly.</p></div>`;
  const range = () => runCountRange(state.run.totalCm, partById(state.run.ids[0])?.params ?? DEFAULT_PARAMS);
  const apply = (key) => (value) => {
    state.run[key] = value;
    changed();
    renderPartPanel();
  };
  runRows.total = slider({ label: 'Délka trasy', unit: 'cm', min: 5, max: 1000, step: 0.5 },
    state.run.totalCm, () => state.run, apply('totalCm'));
  runRows.count = slider({ label: 'Počet dílů', unit: 'ks', min: () => range().min, max: () => range().max, step: 1 },
    state.run.count, () => state.run, apply('count'));
  panel.querySelector('#run-fields').append(runRows.total, runRows.count);
  panel.querySelector('#run-linked').addEventListener('change', (e) => {
    state.run.linked = e.target.checked;
    saveState();
    renderPartPanel();
    renderTabs();
  });
}

// ---------------------------------------------------------------------------
// Úvodní okno: výběr kategorie a způsobu začátku

const startModal = document.getElementById('start');

const START_PARTS = [
  ['straight', 'Rovný díl'],
  ['corner', 'Zatáčka L'],
  ['cross', 'Křižovatka'],
  ['up', 'Nahoru'],
  ['down', 'Dolů'],
  ['s', 'Díl S'],
];

function openStart(step = 'category') {
  startModal.hidden = false;
  const body = startModal.querySelector('.modal-body');
  if (step === 'category') {
    const stored = listAssemblies(CATEGORY).length;
    const resume = state.parts.length
      ? `<div class="modal-resume"><p>Rozpracovaná sestava: ${state.saved ? `${esc(state.saved.name)}, ` : ''}${partsWord(state.parts.length)}</p>
         <button class="btn" type="button" data-resume>Pokračovat</button></div>` : '';
    const library = stored
      ? `<div class="modal-resume"><p>V prohlížeči ${plural(stored, 'je uložená', 'jsou uložené', 'je uloženo')} ${stored} ${plural(stored, 'sestava', 'sestavy', 'sestav')}</p>
         <button class="btn" type="button" data-library>Otevřít uloženou</button></div>`
      : `<div class="modal-resume"><p>Máš sestavu v souboru JSON?</p>
         <button class="btn" type="button" data-library>Importovat sestavu</button></div>`;
    body.innerHTML = `<div class="modal-head"><svg class="brand-mark"><use href="#i-logo"/></svg>
        <h2 id="start-title">Nová sestava</h2><span class="modal-step">1 / 2</span></div>
      <div class="modal-section"><h3>Co chceš organizovat</h3>
        <div class="choices">
          <button class="choice" type="button" data-category="cables"><svg class="ico"><use href="#i-straight"/></svg>
            <span class="choice-title">Kabely</span>
            <span class="choice-text">Kabelové žlaby s krytem: rovné díly, zatáčky, křižovatky a ohyby, které do sebe zacvaknou.</span></button>
          <div class="choice soon" aria-disabled="true"><svg class="ico"><use href="#i-logo"/></svg>
            <span class="choice-title">Další moduly</span>
            <span class="choice-text">Šuplíky, nářadí, police.</span>
            <span class="choice-badge">Již brzy</span></div>
        </div>${resume}${library}
      </div>`;
    body.querySelector('[data-category]').onclick = () => openStart('cables');
    body.querySelector('[data-resume]')?.addEventListener('click', closeStart);
    body.querySelector('[data-library]').addEventListener('click', openAssemblyLibrary);
    body.querySelector('[data-category]').focus();
    return;
  }

  body.innerHTML = `<div class="modal-head">
      <button class="modal-back" type="button" data-back aria-label="Zpět"><svg class="ico"><use href="#i-back"/></svg></button>
      <h2 id="start-title">Kabely</h2><span class="modal-step">2 / 2</span></div>
    <div class="modal-section"><h3>Rovná trasa podle délky kabelu</h3>
      <div class="template">
        <label>Délka kabelu (cm)<input type="number" id="tpl-total" min="5" max="1000" step="0.5" value="100"></label>
        <label>Počet dílů<input type="number" id="tpl-count" step="1"></label>
        <div class="template-result"><small>Délka dílu</small><output id="tpl-result"></output><small id="tpl-range"></small></div>
      </div>
      <div class="template-actions"><p>Počet dílů jde později změnit, délka se vždy dopočítá.</p>
        <button class="btn btn-primary" type="button" id="tpl-create">Vytvořit trasu</button></div>
    </div>
    <div class="modal-section"><h3>Nebo začni jedním dílem</h3>
      <div class="part-picks">${START_PARTS.map(([type, label]) =>
        `<button type="button" data-part="${type}"><svg class="ico"><use href="#${TYPES[type].icon}"/></svg>${label}</button>`).join('')}</div>
    </div>`;
  body.querySelector('[data-back]').onclick = () => openStart('category');
  for (const btn of body.querySelectorAll('[data-part]')) btn.onclick = () => startWith(singlePartState(btn.dataset.part));

  const total = body.querySelector('#tpl-total');
  const count = body.querySelector('#tpl-count');
  const result = body.querySelector('#tpl-result');
  const rangeNote = body.querySelector('#tpl-range');
  const create = body.querySelector('#tpl-create');
  let countTouched = false;
  const update = () => {
    const cm = Number(total.value);
    const valid = cm >= 5 && cm <= 1000;
    create.disabled = !valid;
    if (!valid) {
      result.textContent = '—';
      rangeNote.textContent = 'délka 5–1000 cm';
      return;
    }
    const range = runCountRange(cm, DEFAULT_PARAMS);
    Object.assign(count, { min: range.min, max: range.max });
    // Výchozí počet: díly do 20 cm, a jen tak dlouhé, aby se i s jazýčky vešly na vybranou tiskárnu.
    const bed = currentPrinter(settings);
    const maxLen = Math.min(200, Math.max(bed.x, bed.y) - 2 * settings.margin - TAB_LEN - 5);
    if (!countTouched) count.value = Math.min(range.max, Math.max(range.min, Math.ceil((cm * 10) / maxLen)));
    count.value = Math.min(range.max, Math.max(range.min, Number(count.value) || range.min));
    result.textContent = `${fmt(runPartLen({ totalCm: cm, count: Number(count.value) }))} mm`;
    rangeNote.textContent = `${range.min}–${range.max} dílů`;
  };
  total.addEventListener('input', update);
  count.addEventListener('input', () => { countTouched = true; });
  count.addEventListener('change', update);
  create.onclick = () => startWith(runState(Number(total.value), Number(count.value)));
  update();
  total.focus();
  total.select();
}

function closeStart() {
  if (!state.parts.length) return; // bez sestavy není s čím pracovat
  startModal.hidden = true;
}

startModal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeStart();
});

// ---------------------------------------------------------------------------

layout();
renderPrinterButton();
renderGlobalPanel();
renderPartPanel();
changed();
for (const part of state.parts) refreshGeometry(part);
// Rozpracovaná sestava se otevře rovnou, úvodní okno je za tlačítkem Nová sestava.
if (!state.parts.length) openStart();
