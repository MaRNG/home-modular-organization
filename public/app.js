import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { STLLoader } from 'three/addons/STLLoader.js';
import { zipSync, strToU8 } from './vendor/fflate.js';

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
    color: 0x4e8fd8,
    sym: 2, // počet otočení kolem Z, ve kterých díl vypadá stejně
    ports: (p) => [flat(-p.len / 2, 0, 180), flat(p.len / 2, 0, 0)],
  },
  corner: {
    label: 'Zatáčka L',
    lidLabel: 'zatáčka L',
    slug: 'zatacka',
    color: 0xe39b3a,
    sym: 1,
    ports: (p) => [flat(-p.arm, 0, 180), flat(0, p.arm, 90)],
  },
  cross: {
    label: 'Křižovatka +',
    lidLabel: 'křižovatka +',
    slug: 'krizovatka',
    color: 0x5bb36a,
    sym: 4,
    ports: (p) => [0, 90, 180, 270].map((a) => flat(p.arm * cosd(a), p.arm * sind(a), a)),
  },
  // Vnitřní roh, např. ze stolu na stěnu: svislé rameno jde nahoru, otevřená strana míří zpět.
  up: {
    label: 'Zatáčka nahoru',
    lidLabel: 'zatáčka nahoru',
    slug: 'nahoru',
    color: 0x8f6ad8,
    sym: 1,
    ports: (p) => [flat(-p.arm, 0, 180), { p: [0, 0, p.arm], d: [0, 0, 1], u: [-1, 0, 0] }],
  },
  // Vnější roh přes hranu stolu: svislé rameno jde dolů, otevřená strana míří ven.
  down: {
    label: 'Zatáčka dolů',
    lidLabel: 'zatáčka dolů',
    slug: 'dolu',
    color: 0xd0608f,
    sym: 1,
    ports: (p) => [flat(-p.arm, 0, 180), { p: [0, 0, -p.arm], d: [0, 0, -1], u: [1, 0, 0] }],
  },
};

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
const maxNotch = (p) => Math.floor(p.h / 2);

// Parametry dílu po skupinách; každou skupinu jde přenést na všechny díly.
const PART_GROUPS = [
  {
    title: 'Rozměry',
    apply: ['w', 'h'],
    applyLabel: 'Použít šířku a výšku na všechny díly',
    params: {
      w: { label: 'Vnitřní šířka', min: 14, max: 80, step: 1 },
      h: { label: 'Vnitřní výška', min: 10, max: 60, step: 1 },
      len: { label: 'Délka', min: (part) => minLen(part.params), max: 300, step: 5, only: ['straight'] },
      arm: { label: 'Délka ramene (od středu)', min: minArm, max: 200, step: 1, only: ['corner', 'cross', 'up', 'down'] },
    },
  },
  {
    title: 'Zkosení',
    apply: ['ce'],
    applyLabel: 'Použít zkosení na všechny díly',
    params: {
      ce: { label: 'Useknutý horní roh u spojů (0 = rovný)', min: 0, max: (part) => maxNotch(part.params), step: 0.5 },
    },
  },
  {
    title: 'Výřezy v bocích',
    apply: ['slots', 'slot_w', 'slot_bar', 'slot_m', 'slot_a'],
    applyLabel: 'Použít výřezy v bocích na všechny díly',
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
    applyLabel: 'Použít výřezy ve dně na všechny díly',
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
    applyLabel: 'Použít kryt na všechny díly',
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
  w: 30, h: 20, ce: 0,
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
  return { category: 'cables', globals: { ...DEFAULT_GLOBALS }, nextId: 1, parts: [], run: null };
}

// Nová sestava začínající jedním dílem.
function singlePartState(type) {
  const s = emptyState();
  const params = { ...DEFAULT_PARAMS };
  const part = { id: s.nextId++, type, params, parent: null };
  if (type === 'straight') params.len = 80;
  else params.arm = Math.max(40, minArm(part));
  s.parts.push(part);
  return s;
}

// Šablona: rovná trasa zadané délky rozdělená na stejně dlouhé rovné díly.
function runState(totalCm, count) {
  const s = emptyState();
  s.run = { totalCm, count, ids: [] };
  return s;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.parts?.length) return null;
    saved.globals = { ...DEFAULT_GLOBALS, ...saved.globals };
    saved.run ??= null;
    for (const p of saved.parts) {
      const { ch, cj, ...params } = p.params; // zrušené zkosení hran z dřívější verze
      p.params = { ...DEFAULT_PARAMS, ...params };
    }
    return saved;
  } catch {
    return null;
  }
}

const serialize = (space) =>
  JSON.stringify(state, (k, v) => (k === 'used' || k === 'matrix' ? undefined : v), space);

function saveState() {
  localStorage.setItem(STORAGE_KEY, serialize());
}

const partById = (id) => state.parts.find((p) => p.id === id);

function addPart(type, parentId, parentPort, ownPort) {
  const parent = partById(parentId);
  const { len, arm, ...params } = parent.params;
  const part = { id: state.nextId++, type, params, parent: parentId, parentPort, port: ownPort };
  if (type === 'straight') params.len = 80;
  else params.arm = Math.max(40, minArm(part));
  state.parts.push(part);
  return part;
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
  if (p.len !== undefined && !isRunPart(part)) p.len = Math.max(p.len, minLen(p));
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

const sizeParam = (part) => (part.type === 'straight' ? { len: part.params.len } : { arm: part.params.arm });

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

function geometryFor(defs) {
  const k = defsKey(defs);
  if (!cache.has(k)) {
    cache.set(k, runOpenSCAD(defs).then((stl) => ({ stl, geometry: loader.parse(stl) })));
    cache.get(k).catch(() => cache.delete(k));
  }
  return cache.get(k);
}

let lastError = null;

function updateStatus() {
  const el = document.getElementById('status');
  const busy = pending.size + queue.length;
  el.className = busy ? 'busy' : lastError ? 'error' : '';
  if (busy) {
    el.textContent = !wasmReady ? 'Načítám OpenSCAD…' : `Renderuji ${busy} ${busy === 1 ? 'díl' : busy < 5 ? 'díly' : 'dílů'}…`;
  } else {
    el.textContent = lastError ? `Chyba: ${lastError}`
      : state.parts.length ? `Hotovo · ${state.parts.length} dílů v sestavě` : 'Prázdná sestava';
  }
}

// ---------------------------------------------------------------------------
// 3D scéna

const viewport = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
viewport.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f4);

const camera = new THREE.PerspectiveCamera(40, 1, 1, 10000);
camera.up.set(0, 0, 1);
camera.position.set(-160, -220, 200);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(-1, -2, 3);
scene.add(sun);

const grid = new THREE.GridHelper(1000, 100, 0xc5ccd3, 0xdde2e7);
grid.rotation.x = Math.PI / 2;
grid.position.z = -0.05;
scene.add(grid);

const partGroup = new THREE.Group();
const portGroup = new THREE.Group();
scene.add(partGroup, portGroup);

const parts3d = new Map(); // part.id → { group, body, lid }

function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

function makePart3d(part) {
  const color = new THREE.Color(TYPES[part.type].color);
  const mesh = (c) => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
    m.userData.partId = part.id;
    return m;
  };
  const o = {
    type: part.type,
    group: new THREE.Group(),
    body: mesh(color),
    lid: mesh(color.clone().lerp(new THREE.Color(0xffffff), 0.45)),
  };
  // Poloha dílu se počítá jako matice (díly můžou být i svislé).
  o.group.matrixAutoUpdate = false;
  o.group.add(o.body, o.lid);
  partGroup.add(o.group);
  return o;
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
    const glow = part.id === selectedId ? 0x553300 : 0x000000;
    o.body.material.emissive.setHex(glow);
    o.lid.material.emissive.setHex(glow);
  }

  rebuildPortMarkers();
}

const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x2da44e, roughness: 0.5 });
const markerHover = new THREE.MeshStandardMaterial({ color: 0x7ee2a0, roughness: 0.5 });
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
  camera.position.copy(center).addScaledVector(dir, Math.max(size, 80) * 1.3);
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
  const part = addPart(btn.dataset.add, menuPort.partId, menuPort.index, Number(btn.dataset.port));
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
  row.className = 'slider';
  const id = `s-${Math.random().toString(36).slice(2)}`;
  row.innerHTML = `<label for="${id}">${def.label} (${def.unit ?? 'mm'})</label>
    <input type="range" id="${id}"><input type="number" aria-label="${def.label}">`;
  const [range, number] = row.querySelectorAll('input');
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
  row.setValue = (v) => (range.value = number.value = v);
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

function select(id) {
  selectedId = id;
  renderPartPanel();
  syncScene();
}

function variant(part) {
  const g = canonical(part).genders;
  if (part.type === 'corner') return g[0] === 'F' ? { label: 'levá', slug: '-leva' } : { label: 'pravá', slug: '-prava' };
  if (part.type === 'cross') {
    const m = [...g].filter((x) => x === 'M').length;
    return { label: `${m}× čepy, ${4 - m}× otvory`, slug: `-${m}cepy` };
  }
  // Ohyb s čepy dole a s čepy nahoře jsou dva různé díly.
  if (isBend(part.type)) {
    return g[0] === 'F' ? { label: 'čepy na svislém konci', slug: '-cepy-svisle' }
                        : { label: 'čepy na vodorovném konci', slug: '-cepy-vodorovne' };
  }
  return { label: '', slug: '' };
}

const sizeLabel = (part) => (part.type === 'straight' ? `délka ${part.params.len} mm` : `rameno ${part.params.arm} mm`);

function bodyLabel(part) {
  const v = variant(part).label;
  return `${TYPES[part.type].label}${v ? ` (${v})` : ''} – ${part.params.w}×${part.params.h}, ${sizeLabel(part)}` +
    (part.params.ce ? ', zkosení' : '') + (part.params.slots ? ', výřezy v bocích' : '') + (part.params.floor_slots ? ', výřezy ve dně' : '') +
    (part.params.lid ? ', pro kryt' : '');
}

const lidLabel = (part) =>
  `Kryt – ${TYPES[part.type].lidLabel}, šířka ${part.params.w}, ${sizeLabel(part)}` +
  (part.params.ce ? ', zkosení' : '') + (part.params.lid_slots ? ', s výřezy' : '');

const sizeSlug = (part) => part.params.len ?? part.params.arm;
const bodyFile = (part) =>
  `${TYPES[part.type].slug}${variant(part).slug}_${part.params.w}x${part.params.h}_${sizeSlug(part)}mm` +
  `${part.params.ce ? '_zkos' : ''}${part.params.slots ? '_bok' : ''}${part.params.floor_slots ? '_dno' : ''}${part.params.lid ? '_kryt' : ''}`;
const lidFile = (part) =>
  `kryt-${TYPES[part.type].slug}_${part.params.w}_${sizeSlug(part)}mm` +
  `${part.params.ce ? '_zkos' : ''}${part.params.lid_slots ? '_vyrezy' : ''}`;

function renderPartPanel() {
  const panel = document.getElementById('part-panel');
  panel.innerHTML = '';
  const part = partById(selectedId);
  if (!part) {
    panel.innerHTML = '<h2>Vybraný díl</h2><p class="note">Klikni na díl ve scéně.</p>';
    return;
  }
  const v = variant(part).label;
  const targets = [part];
  panel.innerHTML = `<h2><span class="swatch" style="background:${hex(TYPES[part.type].color)}"></span>` +
    `${TYPES[part.type].label} #${part.id}${v ? ` <small>(${v})</small>` : ''}</h2>`;
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
    section.className = 'group';
    section.innerHTML = `<h3>${group.title}</h3>`;
    for (const [name, def] of Object.entries(group.params)) {
      if (def.only && !def.only.includes(part.type)) continue;
      if (def.needs && !def.needs.every((n) => part.params[n])) continue;
      if (name === 'len' && isRunPart(part)) {
        const note = document.createElement('p');
        note.className = 'note';
        note.textContent = `Délka ${part.params.len} mm je daná rovnou trasou (panel Rovná trasa).`;
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
    const apply = document.createElement('button');
    apply.textContent = group.applyLabel;
    apply.addEventListener('click', () => {
      for (const p of state.parts) {
        for (const k of group.apply) p.params[k] = part.params[k];
        clampSize(p);
        refreshGeometry(p);
      }
      changed();
    });
    section.append(apply);
    panel.append(section);
  }

  const del = document.createElement('button');
  del.className = 'danger';
  del.textContent = 'Smazat díl (i navazující)';
  del.disabled = part.parent === null;
  if (del.disabled) del.title = 'Výchozí díl nelze smazat';
  del.addEventListener('click', deleteSelected);
  panel.append(del);
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
  panel.innerHTML = '';
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

// Díly k tisku: stejná geometrie = jedno STL, tiskne se vícekrát.
let printList = [];

function buildPrintList() {
  const items = new Map();
  const add = (defs, label, file, color) => {
    const k = defsKey(defs);
    if (!items.has(k)) items.set(k, { defs, label, file, color, count: 0 });
    items.get(k).count++;
  };
  for (const part of state.parts) add(bodyDefs(part), bodyLabel(part), bodyFile(part), TYPES[part.type].color);
  for (const part of state.parts) {
    const defs = lidDefs(part);
    if (defs) add(defs, lidLabel(part), lidFile(part), 0xb8c0c8);
  }
  return [...items.values()];
}

function renderPrintList() {
  printList = buildPrintList();
  const total = printList.reduce((sum, item) => sum + item.count, 0);
  document.getElementById('print-summary').textContent =
    `${total} ks k tisku, ${printList.length} ${printList.length === 1 ? 'unikátní STL' : printList.length < 5 ? 'unikátní STL' : 'unikátních STL'}`;
  document.getElementById('print-list').innerHTML = printList.map((item, i) =>
    `<li><span class="swatch" style="background:${hex(item.color)}"></span>` +
    `<span class="item"><b>${item.count}×</b> ${item.label}</span>` +
    `<button data-item="${i}" title="Stáhnout ${item.file}.stl">STL</button></li>`).join('');
}

document.getElementById('print-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-item]');
  if (!btn) return;
  const item = printList[Number(btn.dataset.item)];
  btn.disabled = true;
  try {
    const { stl } = await geometryFor(item.defs);
    download(`${item.file}_${item.count}ks.stl`, stl, 'model/stl');
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
  saveState();
  updateStatus();
  const empty = !state.parts.length;
  for (const id of ['export-zip', 'export-stl', 'fit']) document.getElementById(id).disabled = empty;
}

// ---------------------------------------------------------------------------
// Export

function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
    let n = 1;
    for (const item of buildPrintList()) {
      const { stl } = await geometryFor(item.defs);
      const name = `${String(n++).padStart(2, '0')}_${item.file}_${item.count}ks.stl`;
      files[name] = new Uint8Array(stl);
      lines.push(`${item.count}× ${item.label}  →  ${name}`);
    }
    files['kusovnik.txt'] = strToU8(`Díly k tisku\n\n${lines.join('\n')}\n`);
    files['sestava.scad'] = strToU8(assemblyScad());
    files['cable.scad'] = strToU8(await (await fetch('cable.scad')).text());
    files['sestava.json'] = strToU8(serialize(2));
    download('kabelovy-zlab.zip', zipSync(files, { level: 6 }), 'application/zip');
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

function startWith(newState) {
  state = newState;
  selectedId = null;
  changed();
  renderGlobalPanel();
  renderPartPanel();
  fitPending = true;
  for (const p of state.parts) refreshGeometry(p);
  closeStart();
}

// ---------------------------------------------------------------------------
// Panel rovné trasy

function renderRunPanel() {
  const panel = document.getElementById('run-panel');
  const run = state.run;
  panel.hidden = !run;
  if (!run) {
    panel.innerHTML = '';
    return;
  }
  if (!panel.querySelector('#run-count')) buildRunPanel(panel);
  const range = runCountRange(run.totalCm, partById(run.ids[0])?.params ?? DEFAULT_PARAMS);
  const $ = (id) => panel.querySelector(`#${id}`);
  // Prvek, se kterým uživatel právě pracuje, se nepřepisuje.
  const set = (el, value) => {
    if (document.activeElement !== el) el.value = value;
  };
  set($('run-total-range'), run.totalCm);
  set($('run-total'), run.totalCm);
  for (const el of [$('run-count-range'), $('run-count')]) {
    Object.assign(el, { min: range.min, max: range.max });
    set(el, run.count);
  }
  $('run-result').innerHTML = `<b>${run.count} × ${runPartLen(run)} mm</b> = ${run.totalCm} cm` +
    ` <span class="note">(${range.min}–${range.max} dílů)</span>`;
}

function buildRunPanel(panel) {
  panel.innerHTML = `<h2>Rovná trasa</h2>
    <p class="note">Díly jsou stejně dlouhé a dohromady dají délku trasy.</p>
    <div class="slider"><label for="run-total">Délka trasy (cm)</label>
      <input type="range" id="run-total-range" min="5" max="1000" step="1">
      <input type="number" id="run-total" min="5" max="1000" step="0.5"></div>
    <div class="slider"><label for="run-count">Počet dílů</label>
      <input type="range" id="run-count-range" step="1"><input type="number" id="run-count" step="1"></div>
    <p class="run-result" id="run-result"></p>`;
  const $ = (id) => panel.querySelector(`#${id}`);
  const apply = (key, value, min, max) => {
    value = Math.min(max, Math.max(min, Number(value)));
    if (Number.isNaN(value)) return;
    state.run[key] = value;
    changed();
    renderPartPanel();
  };
  const bind = (rangeId, numberId, key, min, max) => {
    $(rangeId).addEventListener('input', () => {
      $(numberId).value = $(rangeId).value;
      apply(key, $(rangeId).value, min(), max());
    });
    $(numberId).addEventListener('change', () => apply(key, $(numberId).value, min(), max()));
  };
  bind('run-total-range', 'run-total', 'totalCm', () => 5, () => 1000);
  bind('run-count-range', 'run-count', 'count', () => Number($('run-count').min), () => Number($('run-count').max));
  // Po dokončení úpravy se zobrazí i oříznutá hodnota.
  panel.addEventListener('change', () => {
    document.activeElement.blur();
    renderRunPanel();
  });
}

// ---------------------------------------------------------------------------
// Úvodní okno: výběr kategorie a způsobu začátku

const startModal = document.getElementById('start');

function openStart(step = 'category') {
  startModal.hidden = false;
  const body = startModal.querySelector('.modal-body');
  if (step === 'category') {
    const resume = state.parts.length
      ? `<button class="link" data-resume>Pokračovat v rozpracované sestavě (${state.parts.length} dílů) →</button>` : '';
    body.innerHTML = `<h2>Co chceš organizovat?</h2>
      <div class="cards">
        <button class="card" data-category="cables">
          <span class="card-title">Kabely</span>
          <span class="card-text">Kabelové žlaby s krytem: rovné díly, zatáčky a křižovatky, které do sebe zacvaknou.</span>
        </button>
        <div class="card disabled" aria-disabled="true">
          <span class="badge">Již brzy</span>
          <span class="card-title">Další organizace</span>
          <span class="card-text">Šuplíky, nářadí, police a další moduly pro domácnost.</span>
        </div>
      </div>${resume}`;
    body.querySelector('[data-category]').onclick = () => openStart('cables');
    body.querySelector('[data-resume]')?.addEventListener('click', closeStart);
    return;
  }

  body.innerHTML = `<button class="link" data-back>← Zpět</button>
    <h2>Kabely – jak začít?</h2>
    <div class="card template">
      <span class="card-title">Rovná trasa podle délky kabelu</span>
      <span class="card-text">Zadej, kolik kabelu chceš zakrytovat. Trasa se rozdělí na stejně dlouhé rovné díly, jejich počet jde později změnit.</span>
      <div class="template-inputs">
        <label>Délka (cm) <input type="number" id="tpl-total" min="5" max="1000" step="0.5" value="100"></label>
        <label>Počet dílů <input type="number" id="tpl-count" step="1"></label>
      </div>
      <p class="run-result" id="tpl-result"></p>
      <button class="primary" id="tpl-create">Vytvořit trasu</button>
    </div>
    <h3>Nebo začni jedním dílem</h3>
    <div class="cards three">
      <button class="card" data-part="straight"><span class="card-title">━ Rovný díl</span></button>
      <button class="card" data-part="corner"><span class="card-title">┗ Zatáčka L</span></button>
      <button class="card" data-part="cross"><span class="card-title">╋ Křižovatka +</span></button>
    </div>`;
  body.querySelector('[data-back]').onclick = () => openStart('category');
  for (const btn of body.querySelectorAll('[data-part]')) btn.onclick = () => startWith(singlePartState(btn.dataset.part));

  const total = body.querySelector('#tpl-total');
  const count = body.querySelector('#tpl-count');
  const result = body.querySelector('#tpl-result');
  const create = body.querySelector('#tpl-create');
  let countTouched = false;
  const update = () => {
    const cm = Number(total.value);
    const valid = cm >= 5 && cm <= 1000;
    create.disabled = !valid;
    if (!valid) {
      result.textContent = 'Zadej délku 5–1000 cm.';
      return;
    }
    const range = runCountRange(cm, DEFAULT_PARAMS);
    Object.assign(count, { min: range.min, max: range.max });
    // Výchozí počet: díly do 20 cm, aby se vešly na běžnou tiskovou plochu.
    if (!countTouched) count.value = Math.min(range.max, Math.max(range.min, Math.ceil((cm * 10) / 200)));
    count.value = Math.min(range.max, Math.max(range.min, Number(count.value) || range.min));
    result.innerHTML = `<b>${count.value} × ${runPartLen({ totalCm: cm, count: Number(count.value) })} mm</b>` +
      ` <span class="note">(${range.min}–${range.max} dílů)</span>`;
  };
  total.addEventListener('input', update);
  count.addEventListener('input', () => { countTouched = true; });
  count.addEventListener('change', update);
  create.onclick = () => startWith(runState(Number(total.value), Number(count.value)));
  update();
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
renderGlobalPanel();
renderPartPanel();
changed();
for (const part of state.parts) refreshGeometry(part);
openStart();
