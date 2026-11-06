// Knihovna pojmenovaných sestav v localStorage a formát souboru pro export/import.
// Společná pro všechny kategorie MOD; obsah `data` určuje kategorie (u kabelů stav sestavy).

import { readJSON, writeJSON } from './storage.js';

export const LIBRARY_KEY = 'mod-assemblies-v1';
export const ASSEMBLY_FORMAT = 'mod-assembly';
export const BUNDLE_FORMAT = 'mod-assemblies';

const newId = () => `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function cleanItem(it) {
  if (!it || typeof it !== 'object' || !it.data || typeof it.category !== 'string') return null;
  return {
    id: String(it.id || newId()),
    name: String(it.name ?? '').trim().slice(0, 80) || 'Bez názvu',
    category: it.category,
    savedAt: it.savedAt || new Date().toISOString(),
    data: it.data,
  };
}

export function loadLibrary() {
  const raw = readJSON(LIBRARY_KEY);
  return (Array.isArray(raw?.items) ? raw.items : []).map(cleanItem).filter(Boolean);
}

const store = (items) => writeJSON(LIBRARY_KEY, { version: 1, items });

export const listAssemblies = (category) =>
  loadLibrary().filter((it) => !category || it.category === category)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

export const getAssembly = (id) => loadLibrary().find((it) => it.id === id) ?? null;

// Uloží novou sestavu (bez id) nebo přepíše existující. Vrátí uloženou položku.
export function saveAssembly({ id, name, category, data }) {
  const items = loadLibrary();
  const item = cleanItem({ id: id || newId(), name, category, data, savedAt: new Date().toISOString() });
  const i = items.findIndex((it) => it.id === item.id);
  if (i >= 0) items[i] = item;
  else items.push(item);
  store(items);
  return item;
}

export function deleteAssembly(id) {
  store(loadLibrary().filter((it) => it.id !== id));
}

// ---------------------------------------------------------------------------
// Soubory

export const assemblyFile = (item) =>
  ({ format: ASSEMBLY_FORMAT, version: 1, app: 'MOD', category: item.category, name: item.name, savedAt: item.savedAt, data: item.data });

export const bundleFile = (items) =>
  ({ format: BUNDLE_FORMAT, version: 1, app: 'MOD', exportedAt: new Date().toISOString(), items: items.map(assemblyFile) });

// Rozpozná soubor sestavy i balík sestav. `legacy(json)` může vrátit položku pro
// starší formát dané kategorie (např. holý stav sestavy bez obálky).
export function parseAssemblyFile(json, legacy) {
  const one = (f) => (f?.format === ASSEMBLY_FORMAT ? cleanItem({ ...f, id: null }) : null);
  let items = [];
  if (json?.format === BUNDLE_FORMAT && Array.isArray(json.items)) items = json.items.map(one);
  else if (json?.format === ASSEMBLY_FORMAT) items = [one(json)];
  else if (legacy) items = [cleanItem(legacy(json))];
  items = items.filter(Boolean);
  if (!items.length) throw new Error('Soubor neobsahuje žádnou sestavu MOD.');
  return items;
}

// Přidá importované sestavy do knihovny jako nové položky. Vrátí je.
export function importAssemblies(items) {
  const lib = loadLibrary();
  const added = items.map((it) => ({ ...it, id: newId() }));
  store([...lib, ...added]);
  return added;
}
