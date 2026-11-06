# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primárně sám autor: osobní nástroj na navrhování modulární organizace vlastní domácnosti. Uživatel zná 3D tisk (vůle, čepy, orientace tisku), rozhraní na to smí spoléhat a nemusí vysvětlovat základy.

## Product Purpose

MOD (modulární organizace domácnosti) je prototyp/demo: v prohlížeči si navrhneš parametrické 3D tisknutelné moduly, poskládáš je do sestavy a stáhneš STL k tisku. Úspěch = navržená sestava, která po vytištění do sebe zapadne, a seznam dílů, kde se stejné díly tisknou z jednoho STL.

## Positioning

Geometrii počítá skutečný OpenSCAD (WASM) přímo v prohlížeči, bez serveru. Díly jsou parametrické a skládají se přes porty se spojem na zacvaknutí; sestava se počítá ve 3D (vodorovné i svislé ohyby).

## Operating Context

- Desktop s myší, prohlížeč; mobil jen okrajově na prohlížení.
- Lokální vývojový server Caddy (`https://scad-online-demo.localhost`), statické soubory v `public/`.
- Výstup jde do sliceru a na 3D tiskárnu: STL po dílech, ZIP s kusovníkem, `sestava.scad`.

## Capabilities and Constraints

- Kategorie: zatím jen **Kabely** (kabelové žlaby); další kategorie jsou „Již brzy“.
- Díly: rovný, zatáčka L, křižovatka +, zatáčka nahoru, zatáčka dolů; kryty.
- Šablona rovné trasy podle délky kabelu v cm s nastavitelným počtem dílů.
- Nastavení po dílech i pro všechny; výřezy (boky, dno, kryt), zkosení u spojů, kryt na zacvaknutí.
- Stack: čisté HTML/CSS/JS bez build kroku, three.js, fflate, OpenSCAD WASM ve Web Workerech.
- UI je v češtině.

## Brand Commitments

- Pracovní název **MOD** (modulární organizace domácnosti), status prototyp/demo.
- Barevná paleta zadaná uživatelem: `#F9E6A8`, `#F2A900` (hlavní), `#CC6F00`, `#4D2A00`.
- Uživatel chce přehlednější a „méně AI“ vzhled.

## Evidence on Hand

Žádné reference, zákazníci ani testimonialy; nic takového nevymýšlet. Fotky vytištěných dílů zatím neexistují.

## Product Principles

1. Model ve 3D je hlavní věc na obrazovce; ovládání mu nesmí brát místo.
2. Co se vytiskne, musí být vidět a spočítané (seznam dílů, počty, STL).
3. Nastavení dílu a nastavení celé sestavy musí být jasně oddělené.
4. Žádné vysvětlování základů 3D tisku; přesné technické popisky.
