# Platforma MOD: společné funkce všech modulárních sestav

MOD (Modulární organizace domácnosti) bude mít víc kategorií: dnes **Kabely**, později šuplíky, nářadí, police…
Funkce v tomto souboru jsou **společné pro všechny kategorie**. Nová kategorie je má převzít, ne psát znovu.
Kód je v `public/core/` a o konkrétní kategorii nic neví. Kategorie (dnes `public/app.js`) ho jen volá.

## Moduly

| Soubor | Obsah |
|---|---|
| `core/storage.js` | `readJSON` / `writeJSON` (localStorage), `download`, `downloadJSON`, `pickJSONFile` (výběr a načtení souboru JSON), `esc` (escapování do HTML), `fileSlug` (název souboru bez diakritiky) |
| `core/printers.js` | seznam tiskáren `PRINTER_PRESETS`, nastavení (`loadSettings`, `saveSettings`, `exportSettings`, `importSettings`), vlastní tiskárny a kontrola podložky (`footprint`, `checkFit`) |
| `core/library.js` | knihovna pojmenovaných sestav v localStorage a formát souborů (`saveAssembly`, `listAssemblies`, `deleteAssembly`, `assemblyFile`, `bundleFile`, `parseAssemblyFile`, `importAssemblies`) |
| `core/tour.js` | průvodce rozhraním: zvýrazněný prvek, bublina se šipkou, Přeskočit a „Příště nezobrazovat“ (`startTour`, `tourSeen`, `setTourSeen`, `endTour`) |
| `core/dialogs.js` | okna **Tiskárna** (`openPrinterDialog`) a **Sestavy** (`openLibraryDialog`). Používají element `#dialog` v `index.html` a styly z `style.css` (sekce „Okna Tiskárna a Sestavy“) |

## Klíče v localStorage

| Klíč | Obsah | Sdílení |
|---|---|---|
| `mod-settings-v1` | `{ printerId, customPrinters: [{ id, name, x, y, z }], margin }` | všechny kategorie |
| `mod-assemblies-v1` | `{ version: 1, items: [{ id, name, category, savedAt, data }] }` | všechny kategorie, filtruje se podle `category` |
| `mod-tours-v1` | `{ [idPrůvodce]: datum zhlédnutí }`, např. `cables-editor` | všechny kategorie, každá má vlastní id průvodce |
| `scad-cable-demo-v3` | rozpracovaná sestava kategorie Kabely (autosave, včetně `saved`) | jen Kabely |

Nová kategorie si pro autosave založí vlastní klíč (např. `mod-drawers-current-v1`). Knihovnu a nastavení sdílí.

## Formáty souborů

Všechny soubory mají `format` a `version`, aby šly bezpečně rozpoznat a v budoucnu migrovat.

```jsonc
// Jedna sestava (Export JSON, sestava.json v ZIPu)
{ "format": "mod-assembly", "version": 1, "app": "MOD", "category": "cables",
  "name": "Pracovní stůl", "savedAt": "2026-11-06T18:45:00.000Z", "data": { /* stav kategorie */ } }

// Víc sestav (Exportovat vše)
{ "format": "mod-assemblies", "version": 1, "app": "MOD", "exportedAt": "…", "items": [ /* mod-assembly */ ] }

// Nastavení (tiskárna, vlastní tiskárny, rezerva)
{ "format": "mod-settings", "version": 1, "exportedAt": "…",
  "settings": { "printerId": "bambu-p1s", "customPrinters": [], "margin": 0 } }
```

- `data` je stav sestavy dané kategorie. Platforma ho jen ukládá a přenáší, strukturu ověřuje kategorie (u Kabelů `normalizeState()` v `app.js`).
- Import sestav **přidá** nové položky do knihovny s novým `id`, nic nepřepisuje. Sestavy jiné kategorie se při importu přeskočí.
- `parseAssemblyFile(json, legacy)`: kategorie může předat `legacy(json)` pro starší soubory bez obálky. Kabely tak načtou i starý holý `sestava.json`.
- Import nastavení převezme vybranou tiskárnu a rezervu a vlastní tiskárny **přidá** ke stávajícím.

## Tiskárny a kontrola podložky

- `PRINTER_PRESETS` obsahuje rozšířené tiskárny (Bambu Lab, Prusa, Creality, Elegoo, Anycubic, Qidi, Sovol, Flashforge, Voron) s rozměry podložky X × Y × Z v mm podle výrobců (stav 11/2026). Nové modely přidávej sem, `id` měň jen výjimečně (je uložené v nastavení uživatelů).
- Vlastní tiskárny mají `id` s prefixem `custom-`.
- `footprint(positions)` z trojúhelníků STL (Float32Array) spočítá konvexní obal půdorysu a výšku. Kategorie ho volá **jednou na každé unikátní STL** po dokončení renderu a výsledek si kešuje podle klíče geometrie.
- `checkFit(fp, printer, margin)` vrací `{ status, size, angle, reason }`:
  - `fit`: vejde se rovně nebo otočený o 90°
  - `diagonal`: vejde se jen natočený o `angle` stupňů (zkouší 1–89°)
  - `none`: nevejde se, `reason` je `height` nebo `footprint`
- Díl se kontroluje v orientaci, v jaké je v STL, tedy v tiskové orientaci. Proto musí každá kategorie exportovat STL už otočené k tisku.
- `margin` (rezerva od okraje, např. pro brim) se odečte ze všech čtyř stran, ne z výšky.

## Jak napojit novou kategorii

1. Do `index.html` dej tlačítka `#library` (Sestavy) a `#printer` se `<span id="printer-name">` a element `#dialog` (zkopíruj z kabelové verze).
2. Na tabuli „K tisku“ přidej sloupec **Podložka**: po renderu STL ulož `footprint(...)`, ve sloupci zobraz výsledek `checkFit(...)`. Řádek, který se nevejde, dostane třídu `nofit` (červený pruh a podklad) a souhrn v hlavičce `#fit-summary`. Do kusovníku v ZIPu připiš `[NEVEJDE SE NA PODLOŽKU]` nebo `[natočit o N°]`.
3. Okno Sestavy otevři přes `openLibraryDialog({ category, categoryLabel, snapshot, current, isDirty, describe, onSaved, onOpen, legacy })`:
   - `snapshot()` vrací data aktuální sestavy bez pomocných polí (u Kabelů `assemblyData()` bez `saved`, `matrix`, `used`), nebo `null`, když je sestava prázdná.
   - `current()` vrací `{ id, name }` položky knihovny, ze které sestava vychází.
   - `isDirty()` porovná aktuální data se snímkem `saved.base` pořízeným při uložení nebo otevření.
   - `onOpen(item)` data ověří (při chybě vyhodí `Error`, okno ji zobrazí) a sestavu načte.
4. Okno Tiskárna: `openPrinterDialog({ settings, onChange })`. V `onChange` přepočítej tabuli K tisku.
5. Průvodce: definuj kroky `{ target, title, text | html, side? }` a spusť `startTour('<kategorie>-editor', kroky)` při prvním vstupu do editoru, pokud `!tourSeen(id)`. Do horního pruhu dej otazník `#help`, který průvodce spustí znovu. `target` je selektor, element nebo funkce vracející `DOMRect` (např. bod ve 3D scéně promítnutý na obrazovku). Když cíl není vidět, bublina se ukáže uprostřed bez šipky.
6. Na úvodní obrazovce nabídni „Otevřít uloženou / Importovat sestavu“, pokud knihovna danou kategorii obsahuje.

## Pravidla UI

- Červená `--red` (#B3261E) je **jen** pro „nevejde se na podložku“ a chybové zprávy. Výběr a změny zůstávají rezavé (`--rust`), viz `DESIGN.md`.
- Nepoužívej `alert` ani `confirm`. Nevratné akce (smazání, zahození neuložených změn) se potvrzují druhým kliknutím přímo v řádku.
- Texty UI jsou česky, kód a commity anglicky (viz globální pravidla).
