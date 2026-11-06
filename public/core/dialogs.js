// Okna Tiskárna a Sestavy. Jsou společná pro všechny kategorie MOD: o konkrétní
// kategorii vědí jen přes callbacky, které jim předá aplikace.

import { esc, downloadJSON, pickJSONFile, fileSlug } from './storage.js';
import {
  PRINTER_PRESETS, currentPrinter, printerName, saveSettings, addCustomPrinter, removeCustomPrinter,
  exportSettings, importSettings,
} from './printers.js';
import {
  listAssemblies, saveAssembly, deleteAssembly, assemblyFile, bundleFile, parseAssemblyFile, importAssemblies,
} from './library.js';

const dialog = document.getElementById('dialog');
const body = dialog.querySelector('.modal-body');
let onClose = null;

function openDialog(title, render, close) {
  dialog.hidden = false;
  onClose = close ?? null;
  body.innerHTML = `<div class="modal-head"><h2 id="dialog-title">${esc(title)}</h2>
      <button class="modal-close" type="button" data-close aria-label="Zavřít">Zavřít</button></div>
    <div class="dialog-content"></div>
    <p class="dialog-msg" role="status" aria-live="polite"></p>`;
  body.querySelector('[data-close]').onclick = closeDialog;
  render(body.querySelector('.dialog-content'));
}

export function closeDialog() {
  if (dialog.hidden) return;
  dialog.hidden = true;
  body.innerHTML = '';
  onClose?.();
  onClose = null;
}

dialog.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    closeDialog();
  }
});
dialog.addEventListener('mousedown', (e) => {
  if (e.target === dialog) closeDialog();
});

function message(text, error = false) {
  const el = body.querySelector('.dialog-msg');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('error', error);
}

const dims = (p) => `${p.x} × ${p.y} × ${p.z}`;

// ---------------------------------------------------------------------------
// Tiskárna

export function openPrinterDialog({ settings, onChange }) {
  const commit = () => {
    saveSettings(settings);
    onChange(settings);
  };

  openDialog('Tiskárna', (root) => {
    const draw = () => {
      const printer = currentPrinter(settings);
      const brands = [...new Set(PRINTER_PRESETS.map((p) => p.brand))];
      const opt = (p) => `<option value="${esc(p.id)}" ${p.id === settings.printerId ? 'selected' : ''}>${esc(p.name)} · ${dims(p)}</option>`;
      root.innerHTML = `<div class="modal-section">
          <h3>Tisková podložka</h3>
          <div class="bed">
            <label class="bed-pick">Tiskárna
              <select id="printer-select">
                ${settings.customPrinters.length ? `<optgroup label="Vlastní">${settings.customPrinters.map(opt).join('')}</optgroup>` : ''}
                ${brands.map((b) => `<optgroup label="${esc(b)}">${PRINTER_PRESETS.filter((p) => p.brand === b).map(opt).join('')}</optgroup>`).join('')}
              </select></label>
            <div class="bed-size"><small>Podložka X × Y × Z</small><output>${dims(printer)}</output><small>mm</small></div>
            <label class="bed-margin">Rezerva od okraje (mm)
              <input type="number" id="printer-margin" min="0" max="50" step="1" value="${settings.margin}"></label>
          </div>
          <p class="dialog-note">Díly na tabuli K tisku se kontrolují v tiskové orientaci. Rezerva se odečte ze všech čtyř stran podložky (např. pro brim).</p>
        </div>
        <div class="modal-section">
          <h3>Vlastní tiskárny</h3>
          ${settings.customPrinters.length ? `<ul class="rows">${settings.customPrinters.map((p) => `<li>
              <span class="row-name">${esc(p.name)}</span><span class="row-meta">${dims(p)} mm</span>
              <button class="btn" type="button" data-remove="${esc(p.id)}">Smazat</button></li>`).join('')}</ul>` : ''}
          <form class="printer-form" id="printer-form">
            <label class="grow">Název<input name="name" type="text" maxlength="60" placeholder="Moje tiskárna" required></label>
            <label>X (mm)<input name="x" type="number" min="20" max="2000" step="1" required></label>
            <label>Y (mm)<input name="y" type="number" min="20" max="2000" step="1" required></label>
            <label>Z (mm)<input name="z" type="number" min="20" max="2000" step="1" required></label>
            <button class="btn btn-primary" type="submit">Přidat</button>
          </form>
        </div>
        <div class="modal-section dialog-foot">
          <p>Nastavení se ukládá v tomto prohlížeči. Export ho přenese jinam.</p>
          <div class="dialog-actions">
            <button class="btn" type="button" id="settings-import">Importovat nastavení</button>
            <button class="btn" type="button" id="settings-export">Exportovat nastavení</button>
          </div>
        </div>`;

      root.querySelector('#printer-select').onchange = (e) => {
        settings.printerId = e.target.value;
        commit();
        draw();
        root.querySelector('#printer-select').focus();
      };
      root.querySelector('#printer-margin').onchange = (e) => {
        settings.margin = Math.min(50, Math.max(0, Math.round(Number(e.target.value) || 0)));
        e.target.value = settings.margin;
        commit();
      };
      for (const btn of root.querySelectorAll('[data-remove]')) {
        btn.onclick = () => {
          removeCustomPrinter(settings, btn.dataset.remove);
          commit();
          draw();
          message('Tiskárna smazána.');
        };
      }
      root.querySelector('#printer-form').onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
          const p = addCustomPrinter(settings, Object.fromEntries(f));
          commit();
          draw();
          message(`Přidáno a vybráno: ${p.name}.`);
        } catch (err) {
          message(err.message, true);
        }
      };
      root.querySelector('#settings-export').onclick = () => {
        downloadJSON('mod-nastaveni.json', exportSettings(settings));
        message('Nastavení exportováno do mod-nastaveni.json.');
      };
      root.querySelector('#settings-import').onclick = async () => {
        try {
          const json = await pickJSONFile();
          if (!json) return;
          Object.assign(settings, importSettings(settings, json));
          commit();
          draw();
          message(`Nastavení importováno, vybraná tiskárna: ${printerName(currentPrinter(settings))}.`);
        } catch (err) {
          message(err.message, true);
        }
      };
    };
    draw();
    root.querySelector('#printer-select').focus();
  });
}

// ---------------------------------------------------------------------------
// Sestavy
//
// app = {
//   category, categoryLabel,
//   snapshot()   → data aktuální sestavy (null, když je prázdná)
//   current()    → { id, name } uložené položky, ze které aktuální sestava vychází, nebo null
//   isDirty()    → aktuální sestava se liší od uložené (nebo není uložená vůbec)
//   describe(data) → krátký popis („8 dílů“)
//   onSaved(item), onOpen(item)
//   legacy(json) → položka pro starší formát souboru, nebo null
// }

const when = (iso) => new Date(iso).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function openLibraryDialog(app) {
  openDialog(`Sestavy · ${app.categoryLabel}`, (root) => {
    let confirmDelete = null;
    let confirmOpen = null;
    let highlight = new Set();

    const draw = () => {
      const items = listAssemblies(app.category);
      const cur = app.current();
      const data = app.snapshot();
      const dirty = app.isDirty();
      root.innerHTML = `<div class="modal-section">
          <h3>Aktuální sestava</h3>
          <form class="save-form" id="save-form">
            <label class="grow">Název<input name="name" type="text" maxlength="80" required
              value="${esc(cur?.name ?? '')}" placeholder="Např. Pracovní stůl" ${data ? '' : 'disabled'}></label>
            ${cur ? `<button class="btn btn-primary" type="submit" ${data && dirty ? '' : 'disabled'}>${dirty ? 'Uložit změny' : 'Uloženo'}</button>
                     <button class="btn" type="button" id="save-new" ${data ? '' : 'disabled'}>Uložit jako novou</button>`
                  : `<button class="btn btn-primary" type="submit" ${data ? '' : 'disabled'}>Uložit</button>`}
            <button class="btn" type="button" id="export-current" ${data ? '' : 'disabled'}>Export JSON</button>
          </form>
          <p class="dialog-note">${!data ? 'Sestava je prázdná.' : cur ? (dirty ? 'Od posledního uložení máš neuložené změny.' : `Uloženo jako „${esc(cur.name)}“.`)
            : 'Sestava se průběžně drží v prohlížeči, ale do seznamu níž se dostane až uložením.'}</p>
        </div>
        <div class="modal-section">
          <h3>Uložené sestavy <span class="h-count">${items.length}</span></h3>
          ${items.length ? `<ul class="rows">${items.map((it) => {
            const isCur = cur?.id === it.id;
            const cls = [isCur && 'current', highlight.has(it.id) && 'new'].filter(Boolean).join(' ');
            if (confirmOpen === it.id) {
              return `<li class="${cls} confirm"><span class="row-name">Aktuální sestava má neuložené změny. Otevřením „${esc(it.name)}“ se ztratí.</span>
                <button class="btn btn-danger" type="button" data-open-force="${esc(it.id)}">Zahodit a otevřít</button>
                <button class="btn" type="button" data-cancel>Zrušit</button></li>`;
            }
            return `<li class="${cls}">
              <span class="row-name">${esc(it.name)}${isCur ? '<span class="row-tag">Otevřená</span>' : ''}${highlight.has(it.id) ? '<span class="row-tag">Importováno</span>' : ''}</span>
              <span class="row-meta">${esc(app.describe(it.data))} · ${when(it.savedAt)}</span>
              <button class="btn" type="button" data-open="${esc(it.id)}">${isCur ? 'Znovu načíst' : 'Otevřít'}</button>
              <button class="btn" type="button" data-export="${esc(it.id)}">JSON</button>
              <button class="btn btn-danger" type="button" data-delete="${esc(it.id)}">${confirmDelete === it.id ? 'Opravdu smazat' : 'Smazat'}</button>
            </li>`;
          }).join('')}</ul>` : '<p class="dialog-note">Zatím žádná uložená sestava.</p>'}
        </div>
        <div class="modal-section dialog-foot">
          <p>Import přidá sestavy ze souboru JSON do seznamu. Funguje i <code>sestava.json</code> ze ZIPu.</p>
          <div class="dialog-actions">
            <button class="btn" type="button" id="lib-import">Importovat JSON</button>
            <button class="btn" type="button" id="lib-export-all" ${items.length ? '' : 'disabled'}>Exportovat vše</button>
          </div>
        </div>`;
      bind(items, cur, data);
    };

    const save = (asNew) => {
      const form = root.querySelector('#save-form');
      const name = form.elements.name.value.trim();
      if (!name) {
        form.elements.name.focus();
        message('Zadej název sestavy.', true);
        return;
      }
      const cur = app.current();
      const item = saveAssembly({ id: asNew ? null : cur?.id, name, category: app.category, data: app.snapshot() });
      app.onSaved(item);
      confirmDelete = confirmOpen = null;
      draw();
      message(`Uloženo: ${item.name}.`);
    };

    const open = (item) => {
      try {
        app.onOpen(item);
        closeDialog();
      } catch (err) {
        confirmOpen = null;
        draw();
        message(`Sestavu nejde otevřít: ${err.message}`, true);
      }
    };

    const bind = (items, cur, data) => {
      const byId = (id) => items.find((it) => it.id === id);
      root.querySelector('#save-form').onsubmit = (e) => {
        e.preventDefault();
        save(false);
      };
      root.querySelector('#save-new')?.addEventListener('click', () => save(true));
      // Změna názvu uložené sestavy jde uložit, i když se sestava jinak nezměnila.
      const nameInput = root.querySelector('#save-form').elements.name;
      const submit = root.querySelector('#save-form [type="submit"]');
      nameInput.addEventListener('input', () => {
        if (!cur || !data || app.isDirty()) return;
        const renamed = nameInput.value.trim() !== cur.name;
        submit.disabled = !renamed;
        submit.textContent = renamed ? 'Uložit změny' : 'Uloženo';
      });
      root.querySelector('#export-current').onclick = () => {
        const name = root.querySelector('#save-form').elements.name.value.trim() || cur?.name || 'Sestava';
        downloadJSON(`${fileSlug(name)}.json`, assemblyFile({ name, category: app.category, savedAt: new Date().toISOString(), data }));
        message('Aktuální sestava exportována.');
      };
      for (const btn of root.querySelectorAll('[data-open]')) {
        btn.onclick = () => {
          const item = byId(btn.dataset.open);
          const replacing = cur?.id !== item.id || app.isDirty();
          if (replacing && app.snapshot() && app.isDirty()) {
            confirmOpen = item.id;
            confirmDelete = null;
            draw();
            root.querySelector('[data-open-force]').focus();
          } else {
            open(item);
          }
        };
      }
      root.querySelector('[data-open-force]')?.addEventListener('click', (e) => open(byId(e.target.dataset.openForce)));
      root.querySelector('[data-cancel]')?.addEventListener('click', () => {
        confirmOpen = null;
        draw();
      });
      for (const btn of root.querySelectorAll('[data-export]')) {
        btn.onclick = () => {
          const item = byId(btn.dataset.export);
          downloadJSON(`${fileSlug(item.name)}.json`, assemblyFile(item));
        };
      }
      for (const btn of root.querySelectorAll('[data-delete]')) {
        btn.onclick = () => {
          const id = btn.dataset.delete;
          if (confirmDelete !== id) {
            confirmDelete = id;
            confirmOpen = null;
            draw();
            root.querySelector(`[data-delete="${CSS.escape(id)}"]`).focus();
            return;
          }
          const item = byId(id);
          deleteAssembly(id);
          if (cur?.id === id) app.onSaved(null);
          confirmDelete = null;
          draw();
          message(`Smazáno: ${item.name}. Exportovaný JSON jde kdykoli importovat zpět.`);
        };
      }
      root.querySelector('#lib-export-all')?.addEventListener('click', () => {
        downloadJSON(`mod-sestavy-${app.category}.json`, bundleFile(items));
        message(`Exportováno ${items.length} sestav.`);
      });
      root.querySelector('#lib-import').onclick = async () => {
        try {
          const json = await pickJSONFile();
          if (!json) return;
          const found = parseAssemblyFile(json, app.legacy);
          const mine = found.filter((it) => it.category === app.category);
          if (!mine.length) throw new Error('Soubor obsahuje sestavy jiné kategorie.');
          const added = importAssemblies(mine);
          highlight = new Set(added.map((it) => it.id));
          draw();
          message(`Importováno ${added.length} ${added.length === 1 ? 'sestava' : added.length < 5 ? 'sestavy' : 'sestav'}. Otevřeš ji tlačítkem Otevřít.`);
        } catch (err) {
          message(err.message, true);
        }
      };
    };

    draw();
  });
}

