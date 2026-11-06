// Sdílené úložiště a soubory pro všechny kategorie MOD (kabely i budoucí moduly).
// Nic z tohoto souboru nezná konkrétní kategorii.

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadJSON = (name, obj) => download(name, JSON.stringify(obj, null, 2), 'application/json');

// Otevře výběr souboru a vrátí jeho obsah jako JSON. Při zrušení výběru vrátí null.
export function pickJSONFile() {
  return new Promise((resolve, reject) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(JSON.parse(await file.text()));
      } catch {
        reject(new Error(`Soubor ${file.name} není platný JSON.`));
      }
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

// Bezpečné vložení textu do HTML šablon.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const fileSlug = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sestava';
