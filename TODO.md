# TODO

Nápady na další rozvoj. Nic z toho zatím není rozpracované.

## Priorita (doporučené pořadí)

1. **Šablona „Test spoje“:** 2–3 mini díly (~30 mm) + kryt s různou vůlí (0,15 / 0,2 / 0,3 mm) a výškou čepu. Po vytištění vybrat, co sedí, a nastavit jako výchozí. Spoje jsou zatím ověřené jen geometricky.
2. **Uchycení a koncovka.** Bez nich se trasa nedá reálně namontovat (viz Nové díly 1 a 2).
3. **Kontrola tiskové plochy + export na desku (3MF)** (viz Aplikace 1 a 2).

## Nové díly

1. **Uchycení na zeď a pod desku stolu:** otvory se zahloubením pro vrut ve dně (průměr, rozteč); kapsa pro oboustrannou pásku 3M; klip na desku stolu (tloušťka 18–25 mm).
2. **Koncovka:** plná záslepka, nebo čelo s otvorem/výřezem pro kabel daného průměru, případně s pružnými jazýčky.
3. **Boční vývod (odbočka T):** otvor v boku s krytkou pro vyvedení kabelu ze žlabu.
4. **Redukce:** přechod mezi šířkami/výškami se šikmým přechodem místo schodu.
5. **Ohyb pod jiným úhlem:** zatáčka 45°; ohyb nahoru/dolů s nastavitelným úhlem.
6. **Vnitřní přepážka:** oddělení silových a datových kabelů (zasunovací lišta do drážek, nebo parametr „počet komor“).
7. **Držák zásuvkové lišty / zdroje:** vana nebo klec pod stůl, napojitelná na žlab.
8. **Kabelové klipy a hřebínky:** jednotlivé příchytky na stěnu nebo hranu stolu pro 1–N kabelů daného průměru.

## Aplikace

1. **Kontrola tiskové plochy:** zadaný rozměr podložky (např. 256×256), označení dílů, které se nevejdou; u rovné trasy omezí max. délku dílu; volitelně natočení na diagonálu.
2. **Export na tiskovou desku (3MF):** díly v počtu kusů rozmístěné na podložce, připravené pro slicer.
3. **Odhad materiálu a času:** gramy filamentu, cena a orientační čas tisku z objemu dílů; nový sloupec na tabuli K tisku.
4. **Kapacita žlabu:** zadané kabely (počet × průměr) → doporučený vnitřní rozměr (max. ~60 % zaplnění).
5. **Undo/redo** (Ctrl+Z).
6. **Měřítko a kóty ve scéně:** celková délka a rozměry sestavy ve 3D, volitelně mřížka v mm.
7. **Více sestav a sdílení:** pojmenované sestavy („Pracovní stůl“, „TV stěna“), export/import JSON, odkaz se sestavou v URL.
8. **Přesun/otočení sestavy a změna kořene:** dnes nejde smazat první díl ani napojit díl „před“ něj, pokud tam není volný port.
