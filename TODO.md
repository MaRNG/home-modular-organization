# TODO

Nápady na další rozvoj. Nic z toho zatím není rozpracované.

## Priorita (doporučené pořadí)

1. **Šablona „Test spoje“:** 2–3 mini díly (~30 mm) + kryt s různou vůlí (0,15 / 0,2 / 0,3 mm) a výškou čepu. Po vytištění vybrat, co sedí, a nastavit jako výchozí. Spoje jsou zatím ověřené jen geometricky.
2. **Klip na desku stolu** (viz Nové díly 1). Šroubky, páska 3M a koncovka s vývodem kabelu už jsou.
3. **Export na tiskovou desku (3MF)** (viz Aplikace 1). Kontrola tiskové plochy už je hotová.

## Nové díly

1. **Uchycení pod desku stolu klipem:** klip na desku stolu (tloušťka 18–25 mm). Otvory pro šroubky a kapsa pro pásku 3M už jsou; případně šroubky i uprostřed dlouhých dílů.
2. **Průchodka v koncovce:** pružné jazýčky nebo kartáčový výřez, který kabel přidrží (plné čelo, otvor a výřez shora už jsou).
3. **Boční vývod (odbočka T):** otvor v boku s krytkou pro vyvedení kabelu ze žlabu.
4. **Redukce:** přechod mezi šířkami/výškami se šikmým přechodem místo schodu.
5. **Ohyb pod jiným úhlem:** zatáčka 45°; ohyb nahoru/dolů s nastavitelným úhlem.
6. **Držák zásuvkové lišty / zdroje:** vana nebo klec pod stůl, napojitelná na žlab.
7. **Kabelové klipy a hřebínky:** jednotlivé příchytky na stěnu nebo hranu stolu pro 1–N kabelů daného průměru.

## Vzhled

1. **Obloukové zatáčky:** zatáčka L a ohyby s vnitřním poloměrem (parametr, 0 = dnešní ostrý roh); šetrnější k HDMI a napájecím kabelům.
2. **Stínová spára u spojů:** drážka do V po obvodu na koncích dílů, aby spoj vypadal jako záměrný předěl; díry po čepech zahloubené.
3. **Kryt s přesahem:** deska krytu o 0,5 mm širší než žlab, se stínovou mezerou.
4. **Barvy žlabu a krytu v náhledu:** volba barev podle filamentu.

## Aplikace

1. **Export na tiskovou desku (3MF):** díly v počtu kusů rozmístěné na podložce, připravené pro slicer.
2. **Odhad materiálu a času:** gramy filamentu, cena a orientační čas tisku z objemu dílů; nový sloupec na tabuli K tisku.
3. **Kapacita žlabu:** zadané kabely (počet × průměr) → doporučený vnitřní rozměr (max. ~60 % zaplnění).
4. **Undo/redo** (Ctrl+Z).
5. **Měřítko a kóty ve scéně:** celková délka a rozměry sestavy ve 3D, volitelně mřížka v mm.
6. **Sdílení odkazem:** sestava zakódovaná v URL (pojmenované sestavy a export/import JSON už jsou hotové).
7. **Přesun/otočení sestavy a změna kořene:** dnes nejde smazat první díl ani napojit díl „před“ něj, pokud tam není volný port.
8. **Rozdělení dlouhého dílu:** když se díl nevejde na podložku, nabídnout jeho rozdělení na dva (u rovné trasy navýšit počet dílů).
