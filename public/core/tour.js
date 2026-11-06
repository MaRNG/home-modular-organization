// Průvodce rozhraním: zvýrazní prvek a vedle něj ukáže bublinu se šipkou.
// Je společný pro všechny kategorie MOD; kroky dodává kategorie.
//
// step = { target: '#selektor' | () => Element | DOMRect | null, title, text, side?: 'top'|'bottom'|'left'|'right' }
// Když cíl chybí nebo není vidět, bublina se ukáže uprostřed obrazovky bez šipky.

import { readJSON, writeJSON, esc } from './storage.js';

export const TOUR_KEY = 'mod-tours-v1';

const seenMap = () => readJSON(TOUR_KEY, {}) ?? {};
export const tourSeen = (id) => !!seenMap()[id];
export function setTourSeen(id, seen) {
  const m = seenMap();
  if (seen) m[id] = new Date().toISOString();
  else delete m[id];
  writeJSON(TOUR_KEY, m);
}

let active = null;

export const tourActive = () => !!active;

export function startTour(id, steps, { onEnd } = {}) {
  endTour(false);
  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `<div class="tour-spot" aria-hidden="true"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text" tabindex="-1">
      <span class="tour-arrow" aria-hidden="true"></span>
      <div class="tour-head"><span class="tour-step"></span>
        <button class="tour-skip" type="button" data-skip>Přeskočit</button></div>
      <h2 id="tour-title" class="tour-title"></h2>
      <p id="tour-text" class="tour-text"></p>
      <div class="tour-foot">
        <label class="tour-never"><input type="checkbox" data-never checked> Příště nezobrazovat</label>
        <div class="tour-nav">
          <button class="btn" type="button" data-prev>Zpět</button>
          <button class="btn btn-primary" type="button" data-next>Další</button>
        </div>
      </div>
    </div>`;
  document.body.append(root);
  active = { id, steps, i: 0, root, onEnd, prevFocus: document.activeElement };

  root.querySelector('[data-skip]').onclick = () => endTour(true);
  root.querySelector('[data-prev]').onclick = () => go(-1);
  root.querySelector('[data-next]').onclick = () => go(1);
  // Klik mimo bublinu průvodce nezavře, aby se omylem neztratil.
  root.addEventListener('keydown', onKey);
  window.addEventListener('resize', place);
  show();
}

function onKey(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    endTour(true);
  } else if (e.key === 'ArrowRight') go(1);
  else if (e.key === 'ArrowLeft') go(-1);
}

function go(delta) {
  const next = active.i + delta;
  if (next < 0) return;
  if (next >= active.steps.length) return endTour(true);
  active.i = next;
  show();
}

function show() {
  const { steps, i, root } = active;
  const step = steps[i];
  root.querySelector('.tour-step').textContent = `${i + 1} / ${steps.length}`;
  root.querySelector('.tour-title').textContent = step.title;
  root.querySelector('.tour-text').innerHTML = step.html ?? esc(step.text);
  root.querySelector('[data-prev]').disabled = i === 0;
  root.querySelector('[data-next]').textContent = i === steps.length - 1 ? 'Hotovo' : 'Další';
  step.before?.();
  // Na úzké obrazovce se stránka posouvá: cíl nejdřív dostat do okna.
  const el = typeof step.target === 'string' ? document.querySelector(step.target) : null;
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ block: r.height > innerHeight ? 'start' : 'center' });
  }
  place();
  const card = root.querySelector('.tour-card');
  card.classList.remove('in');
  void card.offsetWidth;
  card.classList.add('in');
  root.querySelector('[data-next]').focus();
}

function targetRect(step) {
  let t = typeof step.target === 'function' ? step.target() : step.target;
  if (typeof t === 'string') t = document.querySelector(t);
  if (!t) return null;
  const r = t instanceof Element ? t.getBoundingClientRect() : t;
  if (!r.width || !r.height) return null;
  // Jen viditelná část cíle (např. tabule sahající pod okraj okna).
  const top = Math.max(r.top, 0), left = Math.max(r.left, 0);
  const bottom = Math.min(r.bottom, innerHeight), right = Math.min(r.right, innerWidth);
  if (bottom - top < 8 || right - left < 8) return null;
  return { top, left, bottom, right, width: right - left, height: bottom - top };
}

const GAP = 14; // mezera mezi cílem a bublinou (místo pro šipku)
const PAD = 6; // okraj zvýraznění kolem cíle
const EDGE = 12; // minimální odstup bubliny od okraje okna

function place() {
  if (!active) return;
  const step = active.steps[active.i];
  const spot = active.root.querySelector('.tour-spot');
  const card = active.root.querySelector('.tour-card');
  const arrow = active.root.querySelector('.tour-arrow');
  const r = targetRect(step);
  card.style.left = card.style.top = '0px';
  const cw = card.offsetWidth, ch = card.offsetHeight;

  if (!r) {
    spot.className = 'tour-spot none';
    Object.assign(spot.style, { left: `${innerWidth / 2}px`, top: `${innerHeight / 2}px`, width: '0px', height: '0px' });
    card.dataset.side = 'none';
    card.style.left = `${(innerWidth - cw) / 2}px`;
    card.style.top = `${(innerHeight - ch) / 2}px`;
    return;
  }
  spot.className = 'tour-spot';
  Object.assign(spot.style, {
    left: `${r.left - PAD}px`, top: `${r.top - PAD}px`, width: `${r.width + 2 * PAD}px`, height: `${r.height + 2 * PAD}px`,
  });

  const room = {
    bottom: innerHeight - r.bottom - GAP, top: r.top - GAP, right: innerWidth - r.right - GAP, left: r.left - GAP,
  };
  const fits = (side) => (side === 'top' || side === 'bottom' ? room[side] >= ch + EDGE : room[side] >= cw + EDGE);
  const order = [step.side, 'bottom', 'top', 'right', 'left'].filter(Boolean);
  let side = order.find(fits);
  // Cíl přes celou obrazovku (např. 3D scéna): bublina uvnitř cíle u jeho spodního okraje.
  if (!side) side = 'inside';

  const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));
  let x, y;
  if (side === 'bottom' || side === 'top') {
    x = clamp(r.left + r.width / 2 - cw / 2, EDGE, innerWidth - cw - EDGE);
    y = side === 'bottom' ? r.bottom + GAP : r.top - GAP - ch;
    arrow.style.left = `${clamp(r.left + r.width / 2 - x, 18, cw - 18)}px`;
    arrow.style.top = '';
  } else if (side === 'left' || side === 'right') {
    y = clamp(r.top + r.height / 2 - ch / 2, EDGE, innerHeight - ch - EDGE);
    x = side === 'right' ? r.right + GAP : r.left - GAP - cw;
    arrow.style.top = `${clamp(r.top + r.height / 2 - y, 18, ch - 18)}px`;
    arrow.style.left = '';
  } else {
    x = clamp(r.left + r.width / 2 - cw / 2, EDGE, innerWidth - cw - EDGE);
    y = clamp(r.bottom - ch - 24, EDGE, innerHeight - ch - EDGE);
  }
  card.dataset.side = side;
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;
}

// done = uživatel průvodce dokončil nebo přeskočil; pak platí volba „Příště nezobrazovat“.
export function endTour(done = true) {
  if (!active) return;
  const { id, root, onEnd, prevFocus } = active;
  if (done) setTourSeen(id, root.querySelector('[data-never]').checked);
  root.remove();
  window.removeEventListener('resize', place);
  active = null;
  prevFocus?.focus?.();
  onEnd?.();
}
