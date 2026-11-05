# SCAD Online Demo

> **Stav:** běží demo části 2 (modulární organizace, kategorie Kabely). Zbytek je specifikace.

## Demo: konfigurátor kabelového žlabu

**URL:** https://scad-online-demo.localhost (Caddy, statický web, root `public/`)

Díly se renderují v prohlížeči přes OpenSCAD WASM (oficiální snapshot 2026.11.01, Manifold backend). UI OpenSCADu se nepoužívá.

Aplikace je navržená jako nástroj pro modulární organizaci domácnosti. Zatím obsahuje kategorii **Kabely**, další kategorie jsou na úvodní obrazovce jako „Již brzy“.

- **Úvodní okno:** výběr kategorie, pak způsob začátku: šablona **Rovná trasa**, nebo jeden díl (rovný, zatáčka, křižovatka). Když existuje uložená sestava, nabídne „Pokračovat“. Tlačítko „Nová sestava…“ okno otevře znovu.
- **Rovná trasa:** zadáš délku kabelu v cm a počet dílů. Trasa se rozdělí na stejně dlouhé rovné díly, takže v seznamu k tisku je jedno STL. V panelu „Rovná trasa“ jde délku i počet dílů kdykoli změnit a délka dílů se přepočítá, aby součet seděl. Počet je omezený tak, aby díl měl mezi minimální délkou a 300 mm. Na oba konce trasy jde napojovat další díly a při změně počtu zůstanou napojené na konci. Smazáním dílu z trasy se šablona zruší a díly zůstanou jako běžné.
- **Díly:** rovný díl, zatáčka L (doleva/doprava), křižovatka +.
- **Řetězení:** klik na zelenou šipku na volném konci → výběr dílu, který se připojí.
- **Spoj na zacvaknutí:** každý konec je buď **s čepy** (pružné jazýčky na bocích s kuželovým čepem, přesahují 10 mm přes konec), nebo **s otvory** (kulaté díry v bočních stěnách). Jazýčky se zasunou dovnitř sousedního dílu a čep zacvakne do díry. Pohlaví konců se určí automaticky: připojený konec je opačný než soused, ostatní konce dílu pokračují stejně.
- **Rozměry:** vnitřní šířka, výška, délka (u L a + délka ramene). Navazující díly se posunou okamžitě, přerenderuje se jen změněný díl.
- **Výřezy (žebrování):** průhledové výřezy skrz **boky**, **dno** a **kryt**, mezi nimi zůstávají žebra. U každého jde zapnout a nastavit šířku výřezu, šířku žebra, okraj a **sklon** (výchozí 45°, 0° = rovné). Na koncích se spoji se nevyřezává. Šikmé výřezy v bocích mají na protější stěně opačný sklon, takže z vnějšku vypadají obě strany stejně.
- **Zkosení u spojů:** na koncích dílů se šikmo (45°) usekne horní roh bočních stěn, takže mezi sousedními díly vznikne shora zářez do V. Kryt je na koncích kratší a jeho čela pokračují ve stejné šikmé rovině. Jazýčky souseda, které by do zářezu zasahovaly, se zkosí taky. Velikost je 0 až polovina vnitřní výšky. S větším zkosením se prodlužuje konec bez výřezů a roste minimální délka dílu.
- **Kryt na zacvaknutí:** kryt drží límcem zasunutým do kanálu. Čepy na límci zacvaknou do otvorů pod horní hranou stěn. Díl s krytem má tyto otvory navíc, proto je v seznamu jako samostatná varianta.
- Rozměry, zkosení, výřezy i kryt jdou nastavit **po jednom dílu** (klik na díl), nebo tlačítkem „Použít … na všechny díly“ **najednou**. Nový díl převezme nastavení od dílu, na který se připojuje.
- **Celá sestava:** tloušťka stěny, dna a krytu, vůle spojů, výška čepu spoje a výška čepu krytu platí pro všechny díly.
- **Díly k tisku:** seznam unikátních dílů a krytů s počty kusů a tlačítkem **STL** u každého. Díly, které se liší jen otočením (rovný díl o 180°, křižovatka o 90°), jsou jedno STL. Levá a pravá zatáčka jsou různé díly, jejich kryt je společný.
- **Export:** ZIP se všemi unikátními STL (počet kusů je v názvu), `kusovnik.txt`, `sestava.scad`, `cable.scad` a `sestava.json`. Druhá možnost je jedno STL celé sestavy.
- **Uzavřené smyčky:** volné konce opačného pohlaví, které na sebe přesně lícují, se spojí automaticky.
- Sestava se průběžně ukládá do `localStorage`.

### Tisková orientace
- Díly se tisknou dnem na podložce. Čepy, díry a výřezy jsou na svislých stěnách nebo skrz dno, takže se tisknou bez podpor.
- Kryty jsou v STL otočené vzhůru nohama: deska leží na podložce, límec s čepy je nahoře.

### Soubory

| Soubor | Účel |
|---|---|
| `public/cable.scad` | geometrie dílů a krytů (moduly `cable_part(...)`, `cable_lid(...)`) |
| `public/app.js` | stav sestavy (strom), polohy a pohlaví portů, three.js scéna, UI, seznam k tisku, export |
| `public/worker.js` | Web Worker: jeden render = nová instance OpenSCAD WASM, zkompilovaný modul se kešuje |
| `scripts/vendor.sh` | stáhne OpenSCAD WASM (ověří SHA-256) a zkopíruje three.js + fflate do `public/vendor/` |

### Obnova závislostí

```bash
npm install && npm run vendor
```

### Zjednodušení a neověřené věci
- Polohy portů jsou definované **dvakrát**: v `cable.scad` (`arms()`) a v `app.js` (`TYPES[].ports`). Totéž platí pro `tab_len` / `TAB_LEN` a `keep_len()` / `keepLen()`. Musí se ručně udržovat ve shodě. Specifikace počítá s jejich čtením ze SCADu přes `echo`.
- Spoje jsou ověřené jen geometricky: průnik spojených dílů, dílu s krytem i krytu se sousedem má nulový objem a čep spoje zasahuje 0,7 mm do stěny souseda. **Nevyzkoušel to reálný tisk.** Vůle, výšky čepů a pružnost jazýčků a límce bude potřeba doladit.
- Sestava je strom s jedním kořenem. První díl nejde smazat ani změnit jeho typ.
- Délka trasy je součet délek dílů od portu k portu. Jazýčky na volném konci s čepy přesahují o dalších 10 mm.
- Nekontrolují se kolize dílů ani velikost tiskové plochy.
- Šikmé výřezy potřebují víc místa než rovné. Na krátkých ramenech (např. křižovatka s ramenem 40 mm) se proto nemusí vejít žádný.

---

Projekt má dvě části:

1. **OpenSCAD v prohlížeči.** Statická HTML+JS aplikace, kde se OpenSCAD (WASM) spouští přímo v prohlížeči, včetně knihoven (BOSL2, MCAD…).
2. **Modulární parametrický editor komponent.** Vizuální skládání parametrických dílů, které na sebe navazují přes konektory (např. modulární držák kabelů).

---

# Část 1: OpenSCAD Online (HTML + JS)

## 1.1 Cíl
Statická webová aplikace, kde uživatel napíše nebo nahraje `.scad` kód, vykreslí ho do 3D náhledu a stáhne výsledek (STL/3MF). Volitelně nastaví parametry přes Customizer a použije knihovny. Žádný backend: vše běží v prohlížeči a hostovat se dá kdekoli jako statické soubory.

## 1.2 Architektura

```
┌──────────────── Hlavní vlákno (UI) ────────────────┐
│ Editor kódu │ 3D viewer │ Customizer │ Konzole/log │
└──────┬──────────────────────────────────▲──────────┘
       │ postMessage(kód, parametry)      │ výsledek (STL/3MF bytes, log, chyby)
┌──────▼──────────────────────────────────┴──────────┐
│ Web Worker                                         │
│  openscad.wasm (Emscripten) + virtuální FS (MEMFS) │
│   /input.scad, /libraries/BOSL2/..., /fonts/...    │
└────────────────────────────────────────────────────┘
```

- **OpenSCAD WASM** poběží ve **Web Workeru**, aby renderování nezamrazilo UI a šlo ho zrušit (`worker.terminate()`).
- Pro každý render se vytvoří **nová instance modulu**. Emscripten `callMain()` je spolehlivý jen jednou na instanci. Zkompilovaný `WebAssembly.Module` se ale nakešuje, takže instancování je rychlé.
- Do virtuálního FS se zapíše `/input.scad` a zavolá se zhruba tohle:
  `openscad /input.scad -o /out.stl --backend=manifold -D 'param=value'`
  Pak se přečte `/out.stl` a výstup ze stdout/stderr.

## 1.3 Komponenty

| Komponenta | Návrh | Poznámka |
|---|---|---|
| WASM build | oficiální `openscad/openscad-wasm`, případně buildy z OpenSCAD playgroundu | Brát novější dev verzi s **Manifold** backendem, je řádově rychlejší než CGAL |
| Editor | **CodeMirror 6** (lehčí), nebo Monaco (těžší, VS Code feeling) | Zvýrazňování syntaxe OpenSCAD a chybové řádky z logu |
| 3D náhled | **three.js** + `STLLoader` / `3MFLoader`, `OrbitControls` | 3MF nebo OFF zachová barvy z `color()` |
| Customizer | parsování komentářů `// [min:step:max]`, případně export parametrů z OpenSCADu do JSON | Formulář → `-D` argumenty nebo `-p params.json -P set` |
| Export | STL, 3MF, OFF, u 2D modelů SVG/DXF | Stažení přes `Blob` + `URL.createObjectURL` |
| Persistence | `localStorage` / IndexedDB pro rozpracovaný kód, sdílení přes URL (kód zkomprimovaný v hash) | |

## 1.4 Knihovny

**Jak je dostat do prohlížeče:**
1. Každá knihovna se zabalí jako **ZIP** (např. `BOSL2.zip`) a hostuje vedle aplikace.
2. Při prvním použití se stáhne, rozbalí (`fflate` / JSZip) a zapíše do FS jako `/libraries/BOSL2/...`. Do IndexedDB nebo Cache API se uloží, aby se příště nestahovala znovu.
3. OpenSCAD najde knihovny přes `OPENSCADPATH=/libraries` (env proměnná v Emscripten modulu), takže `include <BOSL2/std.scad>` funguje beze změny kódu.
4. **Lazy loading:** z kódu se vyparsují `include` a `use` a stáhnou se jen potřebné knihovny.

**Kandidáti:**

| Knihovna | Účel | Licence |
|---|---|---|
| BOSL2 | obecný „standard library“ | BSD-2 |
| MCAD | ozubená kola, šrouby, motory | LGPL-2.1 |
| threads.scad (rcolyer) | závity | CC0 |
| NopSCADlib | vitamíny, elektronika | GPL-3 |
| Round-Anything, dotSCAD | zaoblení, generativní tvary | MIT / LGPL |

**Fonty:** `text()` potřebuje fonty a fontconfig konfiguraci ve FS. Dodá se základní sada (Liberation Sans/Serif/Mono) a dají se volitelně nahrát vlastní `.ttf`.

**Uživatelské soubory:** nahrání vlastních `.scad`, `.stl` a `.svg` (pro `import()`) do `/home/` ve FS. Víc souborů v projektu pak tvoří jednoduchý strom souborů.

## 1.5 UX workflow
1. Uživatel píše kód a dá **F5** pro rychlý náhled nebo **F6** pro plný render. Volitelně se automaticky renderuje s debounce.
2. Stav se zobrazuje průběžně: „Načítám WASM…“, „Renderuji…“, čas a počet vrcholů.
3. Chyby z logu (`ERROR: ... line 12`) se zvýrazní přímo v editoru.
4. Je k dispozici tlačítko **Zrušit** (ukončí worker) a ukázkové modely.

## 1.6 Nefunkční požadavky a rizika
- **Velikost:** WASM má jednotky až desítky MB a BOSL2 cca 1–2 MB zipnutý. Řeší se kompresí (brotli/gzip na serveru), Service Workerem pro offline a cache.
- **Paměť:** wasm32 má strop zhruba 2–4 GB. Velmi složité modely (hodně `minkowski`, vysoké `$fn`) můžou spadnout, takže je potřeba zachytit OOM a ukázat srozumitelnou hlášku.
- **Výkon:** Manifold backend je nutnost, s CGAL je to v prohlížeči bolestivě pomalé. Vícevláknový build by vyžadoval `SharedArrayBuffer`, tedy hlavičky COOP/COEP na serveru. Pro MVP stačí jednovláknový.
- **Licence:** OpenSCAD je **GPL-2.0+**. Distribuce WASM znamená zpřístupnit zdrojáky (stačí odkaz na upstream a vlastní build skripty) a respektovat licence jednotlivých knihoven.
- **Prohlížeče:** aktuální Chrome, Firefox a Safari. Safari má přísnější limity paměti, hlavně na iOS.

## 1.7 Fáze
- **MVP:** editor, render ve workeru, three.js náhled, export STL.
- **v2:** Customizer, BOSL2 a další knihovny, fonty, 3MF s barvami, ukládání a sdílení přes URL.
- **v3:** projekty s více soubory, import STL/SVG, PWA/offline, případně vícevláknový build.

---

# Část 2: Modulární parametrický editor komponent

## 2.1 Princip
Uživatel neskládá kód, ale **díly**. Každý díl je parametrický SCAD modul s popisem svých parametrů a **konektorů** (míst, kde se dá napojit další díl). Editor drží **graf sestavy** (díly a spoje), z něj odvodí polohy dílů a na pozadí vygeneruje SCAD kód.

Příklad, modulární držák kabelů:
```
[Svěrka na stůl] ─(rybina 20)─ [Segment 60 mm] ─(rybina 20)─ [Segment 60 mm] ─(rybina 20)─ [Klip na kabel Ø8]
```
Změna průměru kabelu se propíše jen do klipu. Změna velikosti rybiny se propíše do všech dílů, které ji sdílejí.

## 2.2 Definice komponenty

Komponenta je SCAD soubor se dvěma částmi: **geometrie** a **metadata**.

```scad
// @component cable_segment
// @name "Segment ramene"
// @category "Cable holder"

/* [Rozměry] */
length = 60;      // [20:5:200]
width  = 20;      // [10:1:40]
joint  = "dove20"; // @shared  ← parametr sdílený napříč sestavou

module cable_segment(length=length, width=width, joint=joint) { ... }

// Konektory: funkce z parametrů → poloha, směr, typ, pohlaví
function cable_segment_connectors(length=length) = [
  ["in",  [0,0,0],      [-1,0,0], "dove20", "female"],
  ["out", [length,0,0], [ 1,0,0], "dove20", "male"]
];
```

- **Konektory se počítají v SCADu**, protože jejich poloha závisí na parametrech (delší segment má konektor dál). Editor je zjistí tak, že spustí OpenSCAD s `echo(...)` a exportem do `.echo`. Geometrie se při tom nepočítá, takže je to rychlé (desítky ms).
- Alternativa je **BOSL2 attachments** (`attach()`, anchory), které konektory v podstatě už řeší. Komponenty psané v BOSL2 by mohly anchory exportovat přímo. Doporučení: vyjít z toho a nevymýšlet vlastní systém úplně od nuly.
- Fallback: JSON sidecar (`cable_segment.json`) pro jednoduché komponenty s pevnými konektory.

**Typ konektoru** (např. `dove20`, `snap-m3`, `peg-6`) definuje:
- kompatibilitu (male↔female, případně genderless),
- geometrii spoje jako sdílený SCAD modul, aby obě strany byly vždy rozměrově shodné,
- **vůli (tolerance)** jako globální parametr tiskárny, např. `clearance = 0.2`.

## 2.3 Editor (UI)

```
┌────────────┬──────────────────────────────┬──────────────┐
│ Knihovna   │ 3D scéna (three.js)          │ Parametry    │
│ komponent  │                              │ vybraného    │
│            │   [díl]──●──[díl]──●──[díl]  │ dílu         │
│ ▸ Cable    │         ↑ snap konektorů     │──────────────│
│ ▸ Brackets │                              │ Globální     │
│ ▸ Joints   │                              │ (tolerance,  │
│            │                              │  joint size) │
├────────────┴──────────────────────────────┴──────────────┤
│ Strom sestavy │ Log │ Export: [Sestava] [Díly k tisku]   │
└──────────────────────────────────────────────────────────┘
```

- **Drag & drop z knihovny:** při přiblížení k volnému kompatibilnímu konektoru se díl „přichytí“ (snap). Nekompatibilní konektory se nezvýrazní.
- **Rotace kolem osy konektoru** po krocích (např. 90°), pokud to typ spoje dovoluje.
- **Parametry** se nastavují pro vybraný díl, globální parametry pro celou sestavu (tolerance, velikost spoje, `$fn`).
- **Strom sestavy** zobrazuje díly hierarchicky, s možností duplikovat větev („přidej ještě 3 segmenty“).
- **Undo/redo**, uložení sestavy jako JSON a sdílení přes URL.

## 2.4 Datový model sestavy

```json
{
  "globals": { "clearance": 0.2, "joint": "dove20" },
  "parts": [
    { "id": "p1", "component": "desk_clamp",    "params": { "thickness": 25 } },
    { "id": "p2", "component": "cable_segment", "params": { "length": 60 } },
    { "id": "p3", "component": "cable_clip",    "params": { "cable_d": 8 } }
  ],
  "joints": [
    { "a": "p1.out", "b": "p2.in",  "rotation": 0 },
    { "a": "p2.out", "b": "p3.in",  "rotation": 90 }
  ]
}
```

- **Polohy dílů se neukládají.** Odvodí se průchodem grafu od kořenového dílu: transformace konektoru A se zarovná s inverzní transformací konektoru B. Pak změna délky segmentu automaticky posune vše za ním.
- Graf je pro MVP **strom** (žádné cykly). Uzavřené smyčky by vyžadovaly řešení constraintů a to je výrazně složitější.

## 2.5 Render pipeline (výkon)

Klíčová věc je **nerenderovat celou sestavu najednou**:
1. **Každý díl se renderuje zvlášť** ve workeru a výsledná mesh se kešuje podle `hash(komponenta + parametry + globals)`.
2. Sestava se v three.js skládá jen **transformací kešovaných meshí**. Přesun nebo přidání dílu je tak okamžité a renderuje se jen díl se změněnými parametry.
3. Rendery běží paralelně v poolu workerů (2–4, podle paměti).
4. Plný SCAD kód sestavy se generuje jen pro export nebo zobrazení: díly jako `multmatrix(...) cable_segment(...)`.

## 2.6 Export

| Režim | Co vznikne | Použití |
|---|---|---|
| **Díly k tisku** | ZIP se STL/3MF pro každý díl (duplikáty se sloučí: „Segment 60 mm × 3“) | hlavní use-case, modulární díly se tisknou zvlášť |
| Tisková deska | 3MF s díly rozloženými na podložce (jednoduchý 2D bin-packing) | rovnou do sliceru |
| Sestava | jedna mesh sestaveného celku | vizualizace, kontrola |
| SCAD | vygenerovaný `.scad` + použité komponenty | pro pokročilé, další úpravy ručně |
| Kusovník (BOM) | seznam dílů a parametrů, případně šroubů a vitamínů | |

Díly by se měly exportovat **natočené do tiskové orientace**. Každá komponenta může mít metadata `@print_orientation`.

## 2.7 Validace (v2+)
- **Kolize** mezi díly: hrubě přes bounding boxy, přesněji přes three-mesh-bvh v náhledu.
- Kontrola **rozsahů parametrů** a kompatibility konektorů.
- Upozornění na díl větší než tisková plocha (velikost plochy v nastavení tiskárny).

## 2.8 Fáze
- **MVP:** 3–5 ručně napsaných komponent (držák kabelů), jeden typ spoje, snapování, parametry dílu, export dílů do STL ZIPu.
- **v2:** globální/sdílené parametry, BOSL2 anchory, kešování a pool workerů, tisková deska v 3MF, BOM, ukládání a sdílení.
- **v3:** uživatelské komponenty (nahrání vlastního `.scad` s anotacemi), validace kolizí, galerie sestav, případně cyklické sestavy.

> **Hlavní riziko:** nejde o techniku renderu, ale o **dobře navržené spoje a tolerance**, aby díly po vytištění opravdu do sebe zapadly. Doporučení: začít prototypem jednoho typu spoje a ověřit ho na reálném tisku, ještě než se staví editor.

---

# Otevřené otázky

**Část 1: OpenSCAD v prohlížeči**
- **Existující řešení:** [openscad-playground](https://github.com/openscad/openscad-playground) už většinu části 1 dělá (React + Monaco, knihovny, Customizer). Stavět od nuly jako čisté HTML+JS, nebo forknout či inspirovat se?
- **Stack:** čistý vanilla JS bez buildu, nebo Vite plus pár npm balíčků? Doporučení je Vite (three.js, CodeMirror).
- **Účel:** demo, nebo veřejný nástroj? To rozhoduje o hostingu, analytice a míře doladění UX.
- **Před implementací ověřit** proti konkrétnímu WASM buildu: přesné velikosti, CLI přepínače pro export parametrů Customizeru a nastavení fontconfigu.

**Část 2: Editor komponent**
- **Konektory:** vlastní anotace + `echo`, nebo postavit všechno na BOSL2 attachments? BOSL2 dává hodně zadarmo, ale svazuje autory komponent s BOSL2.
- **Rozsah knihovny:** úzká doména (cable management, organizéry, Gridfinity-like systémy), nebo obecný systém? Doporučení je začít úzce.
- **Kdo píše komponenty:** jen kurátorovaná knihovna, nebo i uživatelé? To rozhoduje o validaci, sandboxu a formátu metadat.
- **Licence:** generované STL nejsou zatížené GPL, ale komponenty a sdílené knihovny ano. Je potřeba určit licenci knihovny komponent.
