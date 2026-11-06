---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: []
---

# Konfigurátor MOD · Kabely

Scope: celá aplikace v `public/index.html` (editor sestavy, úvodní okno, seznam k tisku). Visitor mode: **Operate**.

Úkol: navrhnout sestavu kabelových žlabů, upravit díly, stáhnout STL. Hlavní bolesti uživatele: nejasné, co platí pro co (díl / trasa / sestava); seznam k tisku a export schovaný; přidávání dílů neintuitivní. Odstranit: generický vzhled, Unicode ikonky, pastelové barvy dílů. Zachovat všechny funkce.

## Direction contract

THESIS: Sestava je let a díly jsou cestující: nastavení se čte jako segmentovaný palubní lístek, kde každý segment nese štítek rozsahu (DÍL / TRASA / SESTAVA), a co se tiskne, je odletová tabule. Odmítá šedý panel se zásobníkem karet nad sebou.

OWN-WORLD: Inkoust #4D2A00 a hnědě tónovaná neutrální škála, papír lístku #F9E6A8, hlavní #F2A900 jako filament dílů, primární akce a aktivní segment; #CC6F00 výhradně pro změnu a výběr. Kondenzovaný grotesk velkými písmeny pro štítky a kódy, monospace jen pro rozměry, počty a kódy. Segmenty oddělené vlasovými linkami a perforací, žádné karty ve kartách, žádné gradienty.

STORY: Uživatel vidí model, klikne na díl, lístek ukáže jeho kód a vždy napíše, na kolik dílů změna dopadne; změněné řádky na tabuli svítí, dokud je nezkontroluje; stáhne STL řádek po řádku nebo vše.

FIRST VIEWPORT: Tmavohnědý pruh nahoře (značka MOD, kategorie KABELY, stav renderu, Nová sestava). Vlevo světlá scéna s jantarovými díly a jejich kódy; vpravo 380 px lístek se záložkami DÍL / TRASA / SESTAVA. Dole přes šířku scény tmavá tabule K TISKU (kód, díl, rozměr, varianta, ks, stav, STL) a vpravo v ní primární STÁHNOUT VŠE.

FORM: Palubní lístek a odletová tabule (vernacular-ephemera-boarding-pass-and-gate-board), challenger zvolený uživatelem místo přiděleného č. 5 Dílenská stěna; seed e1b2574f. Signature: řádek tabule se při změně překlopí jako split-flap a drží stav ZMĚNĚNO, dokud na něj uživatel nenajede.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
