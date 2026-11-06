---
name: MOD · Modulární organizace domácnosti
description: Konfigurátor 3D tisknutelných modulů jako palubní lístek a odletová tabule.
colors:
  ink: "#4d2a00"
  ink-2: "#6e4a18"
  ink-3: "#87612a"
  paper: "#f9e6a8"
  paper-hi: "#fdf5dc"
  amber: "#f2a900"
  amber-hi: "#ffc43a"
  rust: "#cc6f00"
  line: "rgb(77 42 0 / 0.16)"
  line-strong: "rgb(77 42 0 / 0.38)"
  on-ink: "#f9e6a8"
  on-ink-2: "rgb(249 230 168 / 0.68)"
  on-ink-line: "rgb(249 230 168 / 0.14)"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 0.8
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 0.9
  title:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.02em"
  section:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  label:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.1em"
  button:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  body-sm:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.2
  data-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1
rounded:
  sm: "2px"
  md: "3px"
  full: "50%"
spacing:
  half: "4px"
  u: "8px"
  u-1-5: "12px"
  u-2: "16px"
  u-3: "24px"
  u-4: "32px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.amber-hi}"
    textColor: "{colors.ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-on-dark:
    backgroundColor: "transparent"
    textColor: "{colors.on-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-on-dark-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "10px 14px 9px"
  tab-active:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
  chip-category:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "5px 10px 4px"
  tag-part:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
    padding: "3px 5px 2px"
  tag-part-selected:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.paper-hi}"
  board-code:
    backgroundColor: "transparent"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
    padding: "4px 6px 3px"
  state-changed:
    backgroundColor: "rgb(204 111 0 / 0.28)"
    textColor: "{colors.on-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 6px 3px"
  input-value:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    width: "64px"
---

# Design System: MOD · Modulární organizace domácnosti

## Overview

**Creative North Star: "Palubní lístek a odletová tabule"**

Sestava je let, díly jsou cestující. Nastavení se čte jako segmentovaný palubní lístek: velký kód dílu jako číslo brány, datový útržek s rozměry, perforace a pod ní segmenty parametrů, každý se štítkem rozsahu (DÍL / TRASA / SESTAVA). Co se tiskne, je tmavá odletová tabule s kódy, počty, stavem a stažením STL po řádcích. Svět je teplý a tištěný: inkoustově hnědá na krémovém papíře, jantar jako barva filamentu a jediná výrazná akce.

Hustota je pracovní, ne prezentační. 3D scéna drží největší plochu, lístek má pevnou šířku a tabule je dole přes šířku scény. Hloubka vzniká plochým papírem, vlasovými linkami, čárkovanou perforací a kontrastem papír / inkoust, nikdy stínem. Odmítnutý protipól: šedý panel se zásobníkem karet nad sebou, generický vzhled, pastelové barvy dílů a Unicode ikonky.

**Key Characteristics:**
- Dvě plochy: světlý papír (scéna, lístek, úvodní okno) a tmavý inkoust (horní pruh, tabule, hlavička dialogu).
- Kondenzovaný grotesk velkými písmeny pro štítky, kódy a nadpisy; monospace jen pro čísla.
- Jantar je filament a hlavní akce; rez výhradně výběr a změna.
- Segmenty oddělené linkami a perforací, žádné karty v kartách, žádné gradienty, žádné šedé.
- Ikony jako vlastní SVG sprite s tahem 1,6 px, hranaté konce a spoje.

## Colors

Úzká teplá paleta zadaná uživatelem; neutrální škála je tónovaná z inkoustu, šedá neexistuje.

### Primary
- **Jantarový filament** (amber): barva tisknutých dílů ve 3D (`PLASTIC`), primární tlačítko, aktivní záložka lístku, palce posuvníků, zaškrtnuté políčko, štítek kategorie, hover volby v menu a v úvodním okně, ikony dílů na tabuli. Na tmavé tabuli i stav „počítá se“.
- **Rozžhavený jantar** (amber-hi): pouze hover primárního tlačítka.

### Secondary
- **Rez** (rust): vyhrazena pro výběr a změnu. Vybraný díl ve 3D (`PLASTIC_SELECTED`) a jeho štítek ve scéně, stav ZMĚNĚNO na tabuli (rezavý obrys a průsvitný rezavý podklad s papírovým textem), 3px rezavá značka na začátku změněného řádku, čtvercová značka 8 px u rozsahu „Platí pro“, když změna dopadá na víc dílů, podtržení zaostřeného vstupu a focus ring. Destruktivní tlačítko „Odebrat“ má rezavý obrys.

### Neutral
- **Inkoust** (ink): text na papíře, horní pruh, tabule K TISKU, hlavička dialogu, obrysy tlačítek a ohraničení lístku, značky portů ve 3D.
- **Inkoust 2** (ink-2): sekundární text na papíře, popisky polí, poznámky segmentů, meta řádky.
- **Inkoust 3** (ink-3): jednotky, pomocné popisky, vypnuté záložky a volby „Již brzy“.
- **Papír lístku** (paper): pozadí stránky a lístku; také barva krytů ve 3D (`LID`) a text na inkoustu (on-ink).
- **Světlý papír** (paper-hi): 3D scéna, hlavička a útržek lístku, řádek rozsahu, volby a šablona v úvodním okně, menu připojení dílu.
- **Linka** (line, line-strong): vlasové dělicí čáry, perforace, stopy posuvníků, podtržení vstupů. Obě jsou průhledný inkoust.
- **Text na inkoustu** (on-ink, on-ink-2, on-ink-line): primární a tlumený text na tabuli a v horním pruhu a jejich dělicí linky.

### Named Rules
**The Rust Means Change Rule.** Rez se objeví jen tam, kde je něco vybrané nebo změněné (nebo zaostřené). Ne jako dekorace, ne jako druhá akcentová barva, ne pro nadpisy.

**The Rust Is A Mark Rule.** Rez nese obrys, výplň, značku nebo prstenec, ne malý text na papíře: rez na papíře má kontrast jen asi 2,9:1, na světlém papíře 3,3:1. Text stavu nebo akce zůstává inkoustový (na papíře) nebo papírový (na inkoustu) a rez ho označí kolem.

**The No Grey Rule.** Každá neutrální hodnota je inkoust v jiné síle nebo průhlednosti. Nová neutrální barva se odvozuje z `ink`, nikdy z šedé.

**The Amber Is Filament Rule.** Díly ve 3D mají vždy jantarovou barvu, kryty papírovou. Rozlišení typů dílů barvou neexistuje; rozlišují je kódy a ikony.

## Typography

**Display Font:** Barlow Semi Condensed 500/600/700 (s Arial Narrow, sans-serif)
**Body Font:** Barlow 400/500 (se system-ui)
**Label/Mono Font:** JetBrains Mono 400/500 (s ui-monospace)

Všechna písma jsou self-hosted ve `vendor/fonts` (latin + latin-ext), `font-display: swap`; Barlow Semi Condensed 600 a JetBrains Mono 400 se přednačítají.

**Character:** Kondenzovaný grotesk velkými písmeny s prostrkáním je hlas letištní signalizace: kódy, štítky, nadpisy. Barlow je klidný text pro věty a popisky polí. Mono je strojový otisk čísel na lístku a tabuli.

### Hierarchy
- **Display** (700, 64px, 0.8): kód vybraného dílu v hlavičce lístku, jako číslo brány. Jen jednou na obrazovce.
- **Headline** (700, 44px, 0.9): výsledná hodnota v záložce Trasa; v úvodním okně podobně 24–30px pro titul volby a výsledek šablony.
- **Title** (700, 20–22px, 1.05, 0.02–0.06em, velká písmena): typ dílu v lístku, prázdný stav, nadpis dialogu, značka MOD (22px, 0.12em).
- **Section** (700, 14–18px, 0.1–0.12em, velká písmena): nadpisy segmentů lístku, K TISKU, sekce dialogu, záložky (15px).
- **Label** (600, 11–12px, 0.1em, velká písmena): popisky útržku, hlavičky tabule, stavy, odznaky, „Platí pro“.
- **Button** (600, 14px, 0.06em, velká písmena): text tlačítek.
- **Body** (400, 14px, 1.45; tabulkové číslice): věty, poznámky, legenda scény (12px). Popisky polí a meta řádky Barlow 500 13px.
- **Data** (JetBrains Mono 500, 15px): rozměry v útržku a ve vstupech (28px v šabloně), počty; 11–13px pro štítky dílů ve scéně, kódy a rozměry na tabuli, souhrn, jednotky, krok dialogu.

### Named Rules
**The Mono Is For Numbers Rule.** JetBrains Mono jen pro rozměry, počty, jednotky a kódy. Popisky, i krátké, jsou Barlow nebo Barlow Semi Condensed.

**The Uppercase Is Condensed Rule.** Velká písmena patří jen Barlow Semi Condensed, vždy s prostrkáním 0.04–0.12em. Barlow i mono zůstávají v normální velikosti písmen.

## Layout

Mřížka s roztečí 8 px (`--u`); používané kroky 4, 8, 12, 16, 24, 32 px. Celá aplikace je jedna obrazovka bez posouvání stránky: horní pruh 48 px, pod ním mřížka se scénou vlevo, lístkem vpravo (384 px) a tabulí dole přes šířku scény (výška `clamp(200px, 32vh, 340px)`). Lístek a tabule se posouvají uvnitř sebe.

Pod 900 px se lístek zúží na 320 px, zmizí podtitul značky a legenda scény a šablona i výběr dílů v úvodním okně přejdou na dva sloupce. Pod 720 px se vše skládá pod sebe (scéna 56vh, lístek, tabule), stránka se posouvá, tabule skryje sloupce Úprava a STL ikony názvů a akce tabule se roztáhnou na celou šířku.

Uvnitř lístku je vnitřní odsazení 16 px vodorovně; segmenty mají 16 px nahoře a 8 px dole, pole 12 px pod sebou. Útržek dělí sloupce svislé vlasové linky.

## Elevation & Depth

Systém je plochý. Hloubku nese střídání papíru (paper / paper-hi), tmavé inkoustové plochy, linky 1–1,5 px a čárkovaná perforace s půlkruhovými výseky na okrajích lístku. Rozptýlené stíny se nepoužívají nikde. `box-shadow` se objevuje jen jako ostrý vnitřní obrys bez rozostření: rezavá značka změněného řádku, obrys stavu ZMĚNĚNO a dvojitý prstenec focusu na palci posuvníku. Dialog leží nad 55% inkoustovým závojem, sám je plochý papír s 2px inkoustovým rámem.

### Named Rules
**The Flat Paper Rule.** Žádný rozptýlený stín na ohraničené ploše. Co má vystoupit, dostane inkoustový rám, světlejší papír nebo inkoustovou plochu.

**The Perforation Rule.** Část lístku se od další odděluje čárkovanou linkou (2px dashed `line-strong` u trhací linky, 1px dashed mezi volbami), ne mezerou ani kartou.

## Shapes

Téměř pravé úhly: 3 px pro tlačítka, rámy skupin a dialog, 2 px pro malé prvky (štítky dílů, kódy na tabuli, stavy, odznaky, zaškrtávátko). Plný kruh jen pro palce posuvníků, výseky perforace a tečku stavu renderu. Obrysy 1,5 px inkoustem pro interaktivní a rámové prvky, 1 px pro vnitřní dělení; na tabuli 1 px `on-ink-2`. Ikony jsou tah 1,6 px s hranatými konci a ostrými spoji, 16–32 px. Skupiny voleb (volby kategorie, šablona, výběr dílu) jsou jeden rám rozdělený čárkovanými linkami, ne samostatné karty.

## Components

### Buttons
Pevná, tištěná tlačítka velkými písmeny.
- **Shape:** mírně zaoblené (3px), výška 36 px, vodorovně 16 px, rám 1,5 px.
- **Primary:** jantarová plocha s inkoustovým textem; hover rozžhavený jantar. Jedno na oblast (Stáhnout vše · ZIP, Vytvořit trasu).
- **Outline:** průhledné s inkoustovým rámem; hover se plně vybarví inkoustem a text se změní na papír.
- **On dark:** na inkoustu rám `on-ink-2`, papírový text; hover papírová plocha s inkoustovým textem.
- **Danger:** rezavý rám, hover rezavá plocha se světlým papírem.
- **Link:** 12px kondenzované velkými písmeny, podtržené `line-strong`, hover inkoust s rezavým podtržením (např. „Na všech 9“ v hlavičce segmentu).
- **Disabled:** průhlednost 0.4. **Focus:** 2px rezavý obrys s odsazením 2 px. Přechody 160 ms `ease-out`.

### Chips
- **Kategorie:** jantarová plocha, inkoustový text 700 13px s prostrkáním 0.1em, 3px; v horním pruhu.
- **Štítek dílu ve scéně:** inkoustová plocha, papírový mono text 11px, 2px; vybraný díl rez, zvýrazněný (najetí na řádek tabule) jantar s inkoustovým textem.
- **Kód na tabuli:** 1px rám `on-ink-2`, mono 500.
- **Odznak „Již brzy“:** 1px rám `ink-3`, label 11px.

### Cards / Containers
- **Corner Style:** 3px u rámů skupin a dialogu.
- **Background:** paper-hi pro volby a šablonu uvnitř rámu, paper pro dialog a lístek.
- **Shadow Strategy:** žádný, viz Elevation & Depth.
- **Border:** 1,5 px inkoust zvenku, 1px dashed `line-strong` mezi buňkami.
- **Internal Padding:** 14–20 px.

### Inputs / Fields
- **Hodnota u posuvníku:** bez rámu, jen spodní linka 1,5 px `line-strong`, mono 500 15px zarovnané vpravo, šířka 64 px, jednotka vedle v mono 12px `ink-3`. Šipky číselného vstupu skryté.
- **Šablona v dialogu:** stejné pojetí, mono 28px, spodní linka plným inkoustem.
- **Posuvník:** stopa 3 px `line-strong`, vyplněná část inkoust, palec 16 px jantar s 2px inkoustovým rámem.
- **Zaškrtávátko:** 18 px, 1,5 px inkoustový rám, 2px roh; zaškrtnuté jantar s inkoustovou fajfkou.
- **Focus:** podtržení se změní na rez; palec posuvníku dostane papírový a rezavý prstenec.

### Navigation
- **Horní pruh:** inkoustová plocha 48 px; značka MOD (jantarový znak + 700 22px), podtitul oddělený linkou `on-ink-line`, štítek kategorie, vpravo stav renderu (tečka 8 px: tlumená, pulzující jantar při počítání, rez při chybě) a tlačítko Nová sestava.
- **Záložky lístku:** tři stejné sloupce DÍL / TRASA / SESTAVA, kondenzované 700 15px velkými písmeny, pod nimi Barlow 12px s rozsahem („4 díly trasy“). Aktivní záložka jantarová plocha; hover 6% inkoust; vypnutá `ink-3`. Oddělené svislými linkami, pod nimi 1,5 px inkoust.

### Palubní lístek (signature)
Hlavička na světlém papíře: obří kód dílu (Display) vedle typu (Title) a meta řádku. Pod ní útržek: čtyři sloupce ROZMĚR / KS / TRASA / STAV, popisky Label, hodnoty mono 15px, STAV kondenzovaným písmem. Trhací linka s půlkruhovými výseky odděluje útržek od řádku „Platí pro“, který vždy říká, na kolik dílů změna dopadne; když na víc dílů, předchází mu rezavý čtverec. Pak segmenty parametrů, každý s nadpisem Section a odkazem rozsahu vpravo.

### Odletová tabule K TISKU (signature)
Inkoustová plocha, nadpis Section 18px, mono souhrn, akce vpravo (STL sestavy on-dark, Stáhnout vše primární). Tabulka s lepicí hlavičkou, řádky 40 px oddělené `on-ink-line`, hover 7% papír. Sloupce: kód, díl s jantarovou ikonou, rozměr (mono), úprava, ks (mono 15px), stav, tlačítko STL (1px rám, hover jantar).
- **Split-flap:** změněný řádek se překlopí (`rotateX` z -88°, 520 ms `ease-out`, buňky postupně po 40 ms) a drží stav ZMĚNĚNO s 3px rezavou značkou vlevo, dokud na něj uživatel nenajede. Při `prefers-reduced-motion` se animace vypíná.

### Úvodní okno
Inkoustová hlavička se znakem, nadpisem Title a krokem „1 / 2“ v mono; sekce oddělené čárkovanou linkou. Volby a výběr dílu jsou buňky v jednom rámu, hover jantar. Šablona rovné trasy je řádek segmentů: dvě mono pole a výsledek s popiskem v Barlow a rozsahem v mono.

## Do's and Don'ts

### Do:
- **Do** barvit díly ve 3D jantarem a kryty papírem; vybraný díl rezí.
- **Do** psát kódy, štítky a nadpisy Barlow Semi Condensed velkými písmeny s prostrkáním 0.04–0.12em.
- **Do** používat JetBrains Mono pouze pro rozměry, počty, jednotky a kódy.
- **Do** oddělovat části lístku vlasovými linkami a čárkovanou perforací; skupiny voleb dělit uvnitř jednoho rámu.
- **Do** u každého nastavení uvést rozsah („Platí pro“, štítek záložky), na kolik dílů změna dopadne.
- **Do** kreslit ikony jako SVG v spritu s tahem 1,6 px, hranatými konci a ostrými spoji.
- **Do** držet jedno primární jantarové tlačítko na oblast.

### Don't:
- **Don't** používat rez pro cokoli jiného než výběr, změnu, focus a destruktivní akci.
- **Don't** psát malý text rezí na papíře; rez je obrys, výplň nebo značka.
- **Don't** zavádět šedé; neutrální odstíny jsou vždy z inkoustu.
- **Don't** dávat rozptýlené stíny na ohraničené plochy ani gradienty kamkoli.
- **Don't** skládat karty do karet ani stohovat samostatné karty nad sebou.
- **Don't** používat Unicode znaky jako ikony.
- **Don't** rozlišovat typy dílů barvou ani používat pastelové barvy dílů.
