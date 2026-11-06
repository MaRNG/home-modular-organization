# MOD · Modulární organizace domácnosti

Webový konfigurátor modulárních 3D tisknutelných sestav (OpenSCAD WASM v prohlížeči, three.js, bez buildu).
Dnes kategorie **Kabely** (kabelové žlaby). Další kategorie budou následovat a musí převzít společné funkce platformy.

Při práci vždy vycházej z těchto souborů (načítají se automaticky):

@README.md
@docs/PLATFORM.md
@TODO.md

Při úpravách vzhledu si navíc přečti `DESIGN.md` a `PRODUCT.md`.

## Rychlá orientace

- `public/core/`: společné funkce všech kategorií (tiskárny a kontrola podložky, knihovna sestav, import/export JSON, dialogy, průvodce). Nesmí obsahovat nic specifického pro kabely.
- `public/app.js` + `public/cable.scad`: kategorie Kabely.
- Lokálně běží na https://scad-online-demo.localhost (Caddy, root `public/`). Produkce je https://mod.marng.dev a nasazuje se přes `deploy/deploy.sh deploy`, jen když o to uživatel požádá.
- Závislosti obnovíš příkazem `npm install && npm run vendor` (`public/vendor/` není v gitu).

## Pravidla

- Nová kategorie sdílí `mod-settings-v1` a `mod-assemblies-v1` a soubory ve formátech `mod-assembly`, `mod-assemblies` a `mod-settings` (viz `docs/PLATFORM.md`). Formáty měň jen zpětně kompatibilně, případně se zvýšením `version` a migrací při importu.
- Každé STL exportuj v tiskové orientaci. Kontrola podložky s tím počítá.
- Commit, push a nasazení dělej jen na výslovnou žádost uživatele.
