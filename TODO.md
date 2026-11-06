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

## Další kategorie MOD

Doporučené pořadí: šuplíky, pak nástěnný systém. Každá kategorie převezme platformu z `docs/PLATFORM.md` (tiskárny a kontrola podložky, knihovna sestav, import/export, průvodce, tabule K tisku s kódy).

1. **Organizéry do šuplíků (doporučeno jako další):** zadá se vnitřní rozměr šuplíku a ten se rozdělí na přihrádky (příbory, kancelář, nářadí, kosmetika). Editor jako 2D mřížka, buňky se slučují do větších přihrádek. Velký organizér se automaticky rozdělí na moduly, které se vejdou na tiskárnu, a moduly se spojí zacvaknutím. Převezme profil se zkosením a zaoblením a přepážky; navíc zaoblené dno přihrádky, výřez na prst a štítek na popisek.
2. **Gridfinity-kompatibilní krabičky:** otevřený standard s mřížkou 42 mm. Parametrické základové desky (rozdělené podle tiskárny) a krabičky s přihrádkami.
3. **Nástěnný systém:** lišta na zeď a na ni zasunuté moduly (háček, police, držák na nářadí, kelímek, držák nabíječek a ovladačů). Nový typ spoje: zasunutí do drážky lišty, např. rybina. Navazuje na kabelové žlaby (kabely vedené ke stanici nabíječek).
4. **Držáky pod desku stolu:** vana na prodlužovačku a zdroje, držák sluchátek, ovladače nebo hubu, háček na tašku; napojitelné na žlab. Sdílí klip na desku stolu (viz Nové díly 1 a 6).
5. **Stohovatelné boxy a regály:** krabice do skříně se zámkem ve dně pro stohování, volitelné víko a čelní výřez. U velkých krabic hlídat velikost podložky a délku tisku.

Nevhodné pro MOD: nábytek a velké nosné police (3D tisk se na ně nehodí) a čistě dekorativní předměty (nemají parametrickou a modulární logiku).

**Příprava společného kódu:** přepážky, uchycení (šroubky, páska 3M), vzory výřezů (obdélník, zaoblené, voština), průřez se zkosením a zaoblením a tahové písmo kódu přesunout z `public/cable.scad` do sdílené knihovny `public/core/*.scad`, aby je další kategorie nepsaly znovu.
