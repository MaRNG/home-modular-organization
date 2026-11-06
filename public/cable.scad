// Modulární kabelový žlab: rovný díl, zatáčka L, křižovatka +, zatáčka
// nahoru (vnitřní roh, např. ze stolu na stěnu), zatáčka dolů (vnější roh
// přes hranu stolu), díl S (přesazení do strany), koncovka a kryty.
//
// Spoj na zacvaknutí: konec s čepy (M) má na bocích pružné jazýčky
// s kuželovým čepem, které se zasunou dovnitř sousedního dílu; konec
// s otvory (F) má v bočních stěnách kulaté díry, do kterých čep zapadne.
// Kryt drží límcem v kanálu a zacvakne se čepy na límci do otvorů
// pod horní hranou stěn.
//
// Profil: každé rameno je protažený 2D průřez (u_profile) se zkosenou spodní
// hranou a zaoblenými horními hranami stěn. Ramena zatáček a křižovatky se
// potkávají na úhlopříčce (pokos), takže hrany průřezu plynule obejdou roh.
// Vnější roh zatáčky L je zaoblený s poloměrem tloušťky stěny.
//
// Žebrování = průhledové výřezy skrz stěny, dno nebo kryt; mezi výřezy
// zůstávají žebra. Tvar výřezu: obdélník, zaoblené konce, nebo voština.
// Obdélníkové a zaoblené výřezy můžou být šikmé (úhel od svislice / od příčného směru).
//
// Zkosení (ce): u spojů se šikmo (45°) usekne horní roh bočních stěn, takže
// mezi sousedními díly vznikne shora zářez do V. Kryt je na koncích kratší
// a jeho čela pokračují ve stejné šikmé rovině.
//
// Přepážky: kanál jde rozdělit podélnými přepážkami na 2–5 komor stejné šířky.
//
// Souřadnice: dno leží v rovině z = 0. Díl se skládá z ramen vycházejících
// ze středu. Každé rameno má vlastní rámec: osa x vede ven k portu, z = směr
// otevřené strany kanálu (u svislých ramen zatáček nahoru/dolů je rámec
// natočený). Port = střed čela ramene na vnější straně dna.
// Pořadí a polohy portů musí odpovídat TYPES[].ports v app.js.

/* [Co renderovat] */
what = "body";     // [body, lid, lid_view] – lid = tisková orientace, lid_view = poloha na dílu
part = "straight"; // [straight, corner, cross, up, down, s, end]
len  = 80;         // délka rovného dílu a dílu S (od portu k portu)
arm  = 40;         // délka ramene zatáčky/křižovatky od středu k portu, u koncovky od středu oblouku; u dílu S přesazení do strany (záporné = doprava)
genders = "FM";    // pohlaví portů v pořadí ramen: F = otvory, M = čepy

/* [Profil] */
w = 30;        // vnitřní šířka
h = 20;        // vnitřní výška
t = 2;         // tloušťka stěny
f = 3;         // tloušťka dna
c = 0.2;       // vůle spojů
bump = 0.9;    // výška čepu spoje dílů
lid_bump = 0.6; // výška čepu krytu

/* [Vzhled] */
bc = 1;         // zkosení spodní hrany (45°), 0 = ostrá hrana
er = 0.8;       // zaoblení horních hran stěn a zkosení hran krytu; > 0 zaoblí i vnější roh zatáčky L
flute = false;  // svislé drážkování vnějších stěn
flute_p = 3;    // rozteč drážek
label = "";     // kód dílu vyražený zespodu do dna (A–Z), "" = bez kódu

/* [Zkosení] */
ce = 0; // velikost useknutého horního rohu u spojů, 0 = bez zkosení

/* [Uchycení] */
mount    = "none"; // [none, screw, tape] – bez uchycení, otvory pro šroubky, kapsa pro oboustrannou pásku
screw_d  = 2;      // průměr šroubku (otvor má +0,4 mm vůli)
screw_cs = true;   // zahloubení pro zápustnou hlavu (kužel 90°)
tape_w   = 12;     // šířka pásky
tape_d   = 0.4;    // hloubka kapsy ve spodku (menší než tloušťka pásky, aby páska přesahovala)

/* [Koncovka] */
outlet  = "none"; // [none, hole, slot] – plné čelo, kulatý otvor, výřez do U shora
cable_d = 8;      // průměr vyvedeného kabelu (otvor má +1 mm)

/* [Přepážky] */
div_n = 1;   // počet komor, 1 = bez přepážek
div_t = 1.6; // tloušťka přepážky
div_h = 20;  // výška přepážky nad dnem (nejvýš vnitřní výška)

/* [Výřezy v bocích] */
slots    = false;
slot_w   = 6;  // šířka výřezu (u voštiny velikost buňky)
slot_bar = 4;  // šířka žebra mezi výřezy
slot_m   = 2;  // okraj nad dnem a pod límcem krytu
slot_a   = 45; // úhel výřezu, 0 = svislý
slot_shape = "rect"; // [rect, round, hex]

/* [Výřezy ve dně] */
floor_slots    = false;
floor_slot_w   = 4;
floor_slot_bar = 6;
floor_slot_m   = 4; // okraj od stěn
floor_slot_a   = 45;
floor_slot_shape = "rect";

/* [Kryt] */
lid       = false; // díl má otvory pro zacvaknutí krytu
lid_t     = 2;
lid_slots    = false;
lid_slot_w   = 6;
lid_slot_bar = 6;
lid_slot_m   = 2; // okraj od límce
lid_slot_a   = 45;
lid_slot_shape = "rect";

/* [Pevné rozměry spojů] */
tab_len   = 10;   // jak daleko jazýček přesahuje přes konec dílu
bump_r    = 1.8;  // poloměr paty čepu spoje dílů
lip_d     = 4;    // hloubka límce krytu
lip_w     = 1.6;  // tloušťka límce krytu
lid_bump_r = 1.2; // poloměr paty čepu krytu
lid_bump_z = 2.4; // hloubka čepu krytu pod horní hranou stěny

$fn = 32;

if (what == "body")
  cable_part(part, len = len, arm = arm, w = w, h = h, t = t, f = f, c = c, bump = bump, genders = genders, ce = ce,
             slots = slots, slot_w = slot_w, slot_bar = slot_bar, slot_m = slot_m, slot_a = slot_a, slot_shape = slot_shape,
             floor_slots = floor_slots, floor_slot_w = floor_slot_w, floor_slot_bar = floor_slot_bar,
             floor_slot_m = floor_slot_m, floor_slot_a = floor_slot_a, floor_slot_shape = floor_slot_shape,
             lid = lid, bc = bc, er = er, flute = flute, flute_p = flute_p,
             div_n = div_n, div_t = div_t, div_h = div_h, label = label,
             mount = mount, screw_d = screw_d, screw_cs = screw_cs, tape_w = tape_w, tape_d = tape_d,
             outlet = outlet, cable_d = cable_d);
else if (what == "lid")
  cable_lid_print(part, len = len, arm = arm, w = w, h = h, t = t, f = f, c = c, lid_bump = lid_bump, lid_t = lid_t, ce = ce,
                  lid_slots = lid_slots, lid_slot_w = lid_slot_w, lid_slot_bar = lid_slot_bar, lid_slot_m = lid_slot_m,
                  lid_slot_a = lid_slot_a, lid_slot_shape = lid_slot_shape, er = er, outlet = outlet, cable_d = cable_d);
else if (what == "lid_view")
  cable_lid_placed(part, len = len, arm = arm, w = w, h = h, t = t, f = f, c = c, lid_bump = lid_bump, lid_t = lid_t, ce = ce,
                   lid_slots = lid_slots, lid_slot_w = lid_slot_w, lid_slot_bar = lid_slot_bar, lid_slot_m = lid_slot_m,
                   lid_slot_a = lid_slot_a, lid_slot_shape = lid_slot_shape, er = er, outlet = outlet, cable_d = cable_d);

// Ramena dílu: [rámec pro rotate(), délka od středu k portu].
// Zatáčka nahoru: svislé rameno jde do +z, otevřená strana míří do -x.
// Zatáčka dolů: svislé rameno jde do -z, otevřená strana míří do +x.
// Koncovka: jedno rameno do +x, za počátkem je půlkruhové uzavřené čelo.
function arms(part, len, arm) =
  part == "end"      ? [[0, arm]] :
  part == "straight" ? [[180, len / 2], [0, len / 2]] :
  part == "corner"   ? [[180, arm], [90, arm]] :
  part == "up"       ? [[180, arm], [[0, -90, 0], arm]] :
  part == "down"     ? [[180, arm], [[0, 90, 0], arm]] :
  part == "s"        ? [[180, len / 2, [0, -arm / 2, 0]], [0, len / 2, [0, arm / 2, 0]]] :
                       [[0, arm], [90, arm], [180, arm], [270, arm]];
// Rámec ramene: rotate() a u dílu S i posun (třetí položka ramene).
module place(rot, off) translate(is_undef(off) ? [0, 0, 0] : off) rotate(rot) children();

// Díl S: na koncích rovné nástavce pro spoje a čepy krytu, mezi nimi dva oblouky
// stejného poloměru, které kanál přesadí do strany. Vrací [nástavec, dx, úhel, poloměr].
function s_lead(ce) = keep_len(ce) + 8;
function s_geom(len, off, ce) =
  let (lead = s_lead(ce), dx = len - 2 * lead, th = 2 * atan(off / dx))
    [lead, dx, th, dx / (2 * sin(th))];

// Středy a počáteční natočení obou oblouků dílu S.
function s_arcs(len, off, ce) =
  let (g = s_geom(len, off, ce))
    [[[-len / 2 + g[0], -off / 2 + g[3], 0], -90], [[len / 2 - g[0], off / 2 - g[3], 0], 90]];

// Protáhne 2D profil (x = vzdálenost od osy kanálu, y = výška) po obou obloucích dílu S.
module s_sweep(len, off, ce) {
  g = s_geom(len, off, ce);
  for (a = s_arcs(len, off, ce))
    translate(a[0]) rotate(a[1]) rotate_extrude(angle = g[2]) translate([g[3], 0]) children();
}

function is_bend(part) = part == "up" || part == "down";

// Kde v rámci ramene začíná protažený průřez. Ramena zatáček, křižovatky
// a ohybů se ořezávají pokosem (mitred), takže můžou začínat za středem.
function body_x0(part, a, W, H, ce) =
  part == "s" ? a[1] - s_lead(ce) - 0.01 :
  part == "corner" ? -W / 2 :
  part == "down" ? -H : -0.01;

// Přepážky křižovatky končí před středem, aby kabel prošel rovně i do stran.
function div_x0(part, a, W, H, ce) = part == "cross" ? W / 2 + 1 : body_x0(part, a, W, H, ce);

// Kde na rameni začíná rovný úsek (za středem dílu nebo za ohybem).
function seg_start(part, W, f, H) = part == "up" ? H + 4 : part == "down" ? f + 1 : part == "end" ? 0 : W / 2;

// Kolik se na konci ramene nechává bez výřezů a čepů krytu: jazýčky,
// otvory pro čepy a useknutý roh. Musí odpovídat keepLen() v app.js.
function keep_len(ce) = max(tab_len + 1, ce + 2);

// Úseky ramen bez spojů na koncích: [rámec, x0, x1, posun rámce].
function free_segments(part, len, arm, W, ce, f, H) =
  let (keep = keep_len(ce))
  part == "straight" ? [[0, -len / 2 + keep, len / 2 - keep]]
                     : [for (a = arms(part, len, arm))
                          [a[0], part == "s" ? a[1] - s_lead(ce) + 1 : seg_start(part, W, f, H), a[1] - keep, a[2]]];

// Polohy čepů krytu: [rámec, x] – na každém volném úseku kraje, nebo střed.
function lid_snaps(part, len, arm, W, ce, f, H) = [for (sg = free_segments(part, len, arm, W, ce, f, H)) each snaps_on(sg)];
function snaps_on(sg) =
  sg[2] <= sg[1] ? [] :
  sg[2] - sg[1] > 30 ? [[sg[0], sg[1] + 4, sg[3]], [sg[0], sg[2] - 4, sg[3]]] : [[sg[0], (sg[1] + sg[2]) / 2, sg[3]]];

// Výška jazýčku: nad dnem souseda a pod límcem krytu.
function tab_z0(f, c) = f + c;
function tab_z1(f, h, c) = f + h - lip_d - c;

// Pás podél X od x0 do x1, šířka W vycentrovaná na ose, výška H.
module bar(x0, x1, W, H) translate([x0, -W / 2, 0]) cube([x1 - x0, W, H]);

// Zkosení x podle z (kolem výšky zc), resp. x podle y.
module shear_xz(k, zc) multmatrix([[1, 0, k, -k * zc], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) children();
module shear_xy(k) multmatrix([[1, k, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) children();

// ---------------------------------------------------------------------------
// Průřez a ramena

// Poloměr zaoblení hrany na stěně tloušťky th (vejdou se dvě zaoblení vedle sebe).
function round_r(er, th) = max(0, min(er, th / 2 - 0.05));
// Zkosení spodní hrany nesmí prořezat dno ani stěnu.
function bottom_chamfer(bc, t, f) = max(0, min(bc, t - 0.4, f - 0.4));

module raw_u(w, h, t, f)
  difference() {
    translate([-w / 2 - t, 0]) square([w + 2 * t, f + h]);
    translate([-w / 2, f]) square([w, h + 1]);
  }

// Průřez žlabu: x = příčná vzdálenost od osy kanálu, y = výška.
// Horní hrany stěn zaoblené, spodní vnější hrany zkosené pod 45°.
module u_profile(w, h, t, f, bc, er) {
  W = w + 2 * t;
  H = f + h;
  r = round_r(er, t);
  b = bottom_chamfer(bc, t, f);
  intersection() {
    union() {
      intersection() {
        offset(r = r) offset(delta = -r) raw_u(w, h, t, f);
        translate([-W, f]) square([2 * W, H]);
      }
      intersection() {
        raw_u(w, h, t, f);
        translate([-W, -1]) square([2 * W, f + 1.01]);
      }
    }
    polygon([[-W / 2 + b, 0], [W / 2 - b, 0], [W / 2, b], [W / 2, H + 1], [-W / 2, H + 1], [-W / 2, b]]);
  }
}

// Přepážky: příčné polohy, horní hrana (pod krytem nechá vůli) a průřez.
function div_ys(w, n) = [for (i = [1 : 1 : n - 1]) -w / 2 + i * w / n];
function div_top(h, f, c, div_h, lid) = f + min(div_h, h - (lid ? c + 0.3 : 0));

module div_profile(w, h, f, c, er, div_n, div_t, div_h, lid) {
  r = round_r(er, div_t);
  top = div_top(h, f, c, div_h, lid);
  for (y = div_ys(w, div_n))
    offset(r = r) offset(delta = -r) translate([y - div_t / 2, f - 1]) square([div_t, top - f + 1]);
}

// Protáhne 2D průřez (x → y ramene, y → z ramene) podél ramene od x0 do x1.
module along(x0, x1) translate([x0, 0, 0]) rotate([90, 0, 90]) linear_extrude(x1 - x0) children();

// Pokos: část prostoru, která patří rameni i (v rámci ramene).
// Zatáčka L a křižovatka se dělí úhlopříčkou v půdorysu, ohyby v bočním pohledu.
B = 1000;
module mitre(part, i) {
  if (part == "corner")
    linear_extrude(4 * B, center = true)
      polygon(i == 0 ? [[-B, B], [B, -B], [B, B]] : [[-B, -B], [B, -B], [B, B]]);
  else if (part == "cross")
    linear_extrude(4 * B, center = true) polygon([[0, 0], [B, -B], [B, B]]);
  else if (part == "up")
    rotate([90, 0, 0]) linear_extrude(4 * B, center = true) polygon([[-B, -B], [B, -B], [B, B]]);
  else if (part == "down")
    rotate([90, 0, 0]) linear_extrude(4 * B, center = true) polygon([[-B, B], [B, -B], [B, B]]);
}

module mitred(part, i) {
  if (part == "corner" || part == "cross" || is_bend(part)) intersection() { mitre(part, i); children(); }
  else children();
}

// Zaoblený vnější roh zatáčky L (v bodě [W/2, -W/2]): z ramen se vyřízne čtverec
// rohu a nahradí ho čtvrtina průřezu stěny otočená kolem vnitřního rohu kanálu.
module corner_cut(w, t) translate([w / 2, -w / 2 - t - 1, -50]) cube([t + 1, t + 1, 200]);
module corner_round(w, t)
  translate([w / 2, -w / 2, 0]) rotate(-90) rotate_extrude(angle = 90)
    intersection() {
      translate([-w / 2, 0]) children();
      translate([0, -50]) square([t, 200]);
    }

// Půlkruhové čelo koncovky: pravá polovina průřezu otočená o 180° kolem osy z.
module end_round(W)
  rotate(90) rotate_extrude(angle = 180)
    intersection() {
      children();
      translate([0, -50]) square([W, 200]);
    }

// Vývod kabelu v čele koncovky (ve směru -x): kabel leží na dně, otvor má +1 mm.
// hole = kulatý otvor, slot = výřez do U otevřený nahoru (kabel se vloží i s konektorem).
function outlet_r(w, h, d) = min(d + 1, w - 2, h - 1) / 2;
module end_outlet(w, h, f, outlet, d) {
  r = outlet_r(w, h, d);
  rotate([0, -90, 0]) linear_extrude(w + 20)
    hull() {
      translate([f + r, 0]) circle(r = r);
      if (outlet == "slot") translate([f + h + 5, -r]) square([0.01, 2 * r]);
    }
}

// Límec krytu koncovky nad vývodem se vyřízne, aby kabel nezakrýval.
module end_outlet_lid_cut(w, h, c, d) {
  r = outlet_r(w, h, d) + 0.5;
  ri = w / 2 - c - lip_w;
  translate([-w, -r, -lip_d - 1]) cube([w - sqrt(max(0, ri * ri - r * r)) + 0.01, 2 * r, lip_d + 1]);
}

function corner_rounded(part, er, t) = part == "corner" && round_r(er, t) > 0;

module body_shell(part, len, arm, w, h, t, f, c, bc, er, ce, div_n, div_t, div_h, lid) {
  A = arms(part, len, arm);
  W = w + 2 * t;
  H = f + h;
  for (i = [0 : len(A) - 1]) place(A[i][0], A[i][2]) mitred(part, i) union() {
    along(body_x0(part, A[i], W, H, ce), A[i][1]) u_profile(w, h, t, f, bc, er);
    if (div_n > 1)
      along(div_x0(part, A[i], W, H, ce), A[i][1]) div_profile(w, h, f, c, er, div_n, div_t, div_h, lid);
  }
  if (part == "end") end_round(W) u_profile(w, h, t, f, bc, er);
  if (part == "s")
    s_sweep(len, arm, ce) {
      u_profile(w, h, t, f, bc, er);
      if (div_n > 1) div_profile(w, h, f, c, er, div_n, div_t, div_h, lid);
    }
}

// ---------------------------------------------------------------------------
// Zářezy a výřezy

// Zářez do V na konci ramene (konec je v x = L): useknutý horní roh stěn
// dílu a stejně zkosené jazýčky souseda, které do zářezu zasahují.
module end_notch(L, W, H, e) {
  if (e > 0)
    rotate([90, 0, 0]) linear_extrude(W + 2, center = true)
      polygon([[L - e - 0.01, H + 0.01], [L, H - e - 0.01], [L + e + 0.01, H + 0.01]]);
}

// Šikmé čelo krytu na konci ramene: rovina navazuje na useknutý roh stěny
// (v souřadnicích krytu leží horní hrana stěny v z = 0).
module lid_end_cut(L, W, lid_t, e) {
  if (e > 0)
    rotate([90, 0, 0]) linear_extrude(W + 2, center = true)
      polygon([[L - e - lid_t - 1, lid_t + 1], [L - e + lip_d + 1, -lip_d - 1],
               [L + lip_d + lid_t + 2, -lip_d - 1], [L + lip_d + lid_t + 2, lid_t + 1]]);
}

// Středy rovnoměrně rozložených výřezů šířky sw s žebry šířky sb v intervalu [x0, x1].
function spread(x0, x1, sw, sb) =
  x1 - x0 < sw ? [] :
  let (n = floor((x1 - x0 - sw) / (sw + sb)) + 1)
    [for (k = [0 : n - 1]) (x0 + x1) / 2 + (k - (n - 1) / 2) * (sw + sb)];

// Voština: středy šestiúhelníků (plochou stranou kolmo k ose v) velikosti s
// s žebry b v obdélníku [x0, x1] × [v0, v1]. Sloupce jsou souměrné podle středu;
// lichý sloupec má o buňku méně a je posunutý o půl rozteče. Když se vejde jen
// jedna řada, střídají se sloupce nahoru a dolů, případně zůstane jedna řada.
function hex_cells(x0, x1, v0, v1, s, b) =
  let (p = s + b, cs = p * sqrt(3) / 2, wv = 2 * s / sqrt(3),
       xc = (x0 + x1) / 2, vc = (v0 + v1) / 2, av = v1 - v0 - s)
  x1 - x0 < wv || av < 0 ? [] :
  let (mA = floor(av / p) + 1, n0 = floor((x1 - x0 - wv) / cs) + 1, n = n0 % 2 == 1 ? n0 : n0 - 1)
  mA >= 2 ? hex_cols(xc, vc, cs, p, n, mA, mA - 1, 0, 0) :
  av >= p / 2 ? hex_cols(xc, vc, cs, p, n, 1, 1, -p / 4, p / 4) :
  let (ps = wv + b, n1 = floor((x1 - x0 - wv) / ps) + 1)
    [for (i = [0 : 1 : n1 - 1]) [xc + (i - (n1 - 1) / 2) * ps, vc]];

function hex_cols(xc, vc, cs, p, n, mA, mB, sA, sB) =
  [for (i = [0 : 1 : n - 1])
     let (k = i - (n - 1) / 2, odd = abs(k) % 2 == 1, m = odd ? mB : mA, sh = odd ? sB : sA)
       for (j = [0 : 1 : m - 1]) [xc + k * cs, vc + sh + (j - (m - 1) / 2) * p]];

module hex2d(s) circle(d = 2 * s / sqrt(3), $fn = 6);

module stadium(wd, ln) {
  if (ln <= wd) circle(d = wd);
  else hull() for (s = [-1, 1]) translate([0, s * (ln - wd) / 2]) circle(d = wd);
}

// 2D vzor výřezů v obdélníku [x0, x1] × [v0, v1] (rect = obdélník, round = zaoblené konce, hex = voština).
module slot_pattern(x0, x1, v0, v1, sw, sb, shape) {
  if (shape == "hex")
    for (p = hex_cells(x0, x1, v0, v1, sw, sb)) translate(p) hex2d(sw);
  else
    for (x = spread(x0, x1, sw, sb)) translate([x, (v0 + v1) / 2])
      if (shape == "round") stadium(sw, v1 - v0);
      else square([sw, v1 - v0], center = true);
}

// Protáhne 2D vzor v rovině (x, z) skrz boční stěnu na straně side (+1 = +y).
module through_wall(side, w, t)
  translate([0, side > 0 ? w / 2 + t + 1 : -w / 2 + 1, 0]) rotate([90, 0, 0]) linear_extrude(t + 2) children();

// Výřezy v bočních stěnách. Šikmé výřezy mají na protilehlé stěně opačný
// sklon, takže z vnějšku vypadají obě stěny stejně a díl zůstává souměrný
// při otočení (kvůli slučování stejných dílů do jednoho STL).
module side_slots(part, len, arm, w, h, t, f, sw, sb, m, ang, ce, shape) {
  W = w + 2 * t;
  z0 = f + m;
  z1 = f + h - lip_d - m;
  zc = (z0 + z1) / 2;
  k = shape == "hex" ? 0 : tan(ang);
  off = abs(k) * (z1 - z0);
  if (z1 > z0) {
    for (sg = free_segments(part, len, arm, W, ce, f, f + h)) place(sg[0], sg[3])
      for (side = [1, -1])
        shear_xz(side * k, zc) through_wall(side, w, t)
          slot_pattern(sg[1] + m + off / 2, sg[2] - m - off / 2, z0, z1, sw, sb, shape);
    // Plochy středu, ze kterých nevede rameno (vnější roh zatáčky).
    if (part == "corner" || part == "cross")
      for (a = [0, 90, 180, 270])
        if (len([for (r = arms(part, len, arm)) if (r[0] == a) 1]) == 0)
          rotate(a) rotate(-90) shear_xz(k, zc) through_wall(1, w, t)
            slot_pattern(-w / 2 + m + off / 2, w / 2 - m - off / 2, z0, z1, sw, sb, shape);
  }
}

// Výřezy skrz dno.
module floor_slots_cut(part, len, arm, w, h, t, f, sw, sb, m, ang, ce, shape) {
  W = w + 2 * t;
  half = w / 2 - m;
  k = shape == "hex" ? 0 : tan(ang);
  off = abs(k) * 2 * half;
  for (sg = free_segments(part, len, arm, W, ce, f, f + h)) place(sg[0], sg[3])
    shear_xy(k) translate([0, 0, -1]) linear_extrude(f + 2)
      slot_pattern(sg[1] + m + off / 2, sg[2] - m - off / 2, -half, half, sw, sb, shape);
}

// Svislé drážkování vnějších stěn: [rameno, x0, x1, strana] pro každou rovnou plochu.
// Roh zatáčky L, střed křižovatky a ohyby zůstávají hladké.
function flute_faces(part, len, arm, w, W, H, ce) =
  part == "straight" ? [[0, -len / 2, len / 2, 1], [0, -len / 2, len / 2, -1]] :
  part == "corner" ? [[0, -w / 2, arm, 1], [0, W / 2, arm, -1], [1, -w / 2, arm, -1], [1, W / 2, arm, 1]] :
  part == "cross" ? [for (i = [0 : 3]) for (s = [-1, 1]) [i, W / 2, arm, s]] :
  part == "up" ? [for (i = [0 : 1]) for (s = [-1, 1]) [i, H, arm, s]] :
  part == "down" ? [for (i = [0 : 1]) for (s = [-1, 1]) [i, 0, arm, s]] :
  part == "end" ? [[0, 0, arm, 1], [0, 0, arm, -1]] :
  [for (i = [0 : 1]) for (s = [-1, 1]) [i, len / 2 - s_lead(ce), len / 2, s]];

function flute_xs(x0, x1, p) =
  let (n = max(1, round((x1 - x0) / p))) [for (k = [0 : 1 : n - 1]) x0 + (k + 0.5) * (x1 - x0) / n];

FLUTE_R = 0.65; // drážka hloubky 0,4 mm a šířky 1,2 mm
FLUTE_OUT = 0.25;

module flute_groove(z0, z1) cylinder(r = FLUTE_R, h = z1 - z0, $fn = 12);

module flutes(part, len, arm, w, h, t, f, bc, er, ce, p) {
  A = arms(part, len, arm);
  W = w + 2 * t;
  H = f + h;
  z0 = bottom_chamfer(bc, t, f) + 1;
  z1 = H - round_r(er, t) - 1;
  for (fc = flute_faces(part, len, arm, w, W, H, ce)) place(A[fc[0]][0], A[fc[0]][2])
    for (x = flute_xs(fc[1], fc[2], p)) translate([x, fc[3] * (W / 2 + FLUTE_OUT), z0]) flute_groove(z0, z1);
  if (part == "s") {
    g = s_geom(len, arm, ce);
    n = max(1, round(g[3] * g[2] * PI / 180 / p));
    for (a = s_arcs(len, arm, ce)) translate(a[0]) rotate(a[1])
      for (k = [0 : 1 : n - 1]) rotate((k + 0.5) * g[2] / n)
        for (r = [g[3] - W / 2 - FLUTE_OUT, g[3] + W / 2 + FLUTE_OUT]) translate([r, 0, z0]) flute_groove(z0, z1);
  }
}

// ---------------------------------------------------------------------------
// Kód dílu vyražený zespodu do dna: jednoduché tahové písmo A–Z v mřížce 4 × 6.
// Text je zrcadlený, aby se dal přečíst při pohledu zespodu.

function glyphs() = [
  [[[0, 0], [0, 4], [2, 6], [4, 4], [4, 0]], [[0, 3], [4, 3]]],                                          // A
  [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [0, 0]]],  // B
  [[[4, 6], [1, 6], [0, 5], [0, 1], [1, 0], [4, 0]]],                                                    // C
  [[[0, 0], [0, 6], [2, 6], [4, 4], [4, 2], [2, 0], [0, 0]]],                                            // D
  [[[4, 6], [0, 6], [0, 0], [4, 0]], [[0, 3], [3, 3]]],                                                  // E
  [[[4, 6], [0, 6], [0, 0]], [[0, 3], [3, 3]]],                                                          // F
  [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [2, 3]]],                    // G
  [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],                                                // H
  [[[1, 6], [3, 6]], [[2, 6], [2, 0]], [[1, 0], [3, 0]]],                                                // I
  [[[4, 6], [4, 1], [3, 0], [1, 0], [0, 1]]],                                                            // J
  [[[0, 0], [0, 6]], [[4, 6], [0, 2]], [[1, 3], [4, 0]]],                                                // K
  [[[0, 6], [0, 0], [4, 0]]],                                                                            // L
  [[[0, 0], [0, 6], [2, 3], [4, 6], [4, 0]]],                                                            // M
  [[[0, 0], [0, 6], [4, 0], [4, 6]]],                                                                    // N
  [[[1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 1], [3, 0], [1, 0]]],                            // O
  [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]]],                                            // P
  [[[1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 1], [3, 0], [1, 0]], [[2, 2], [4, 0]]],          // Q
  [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[2, 3], [4, 0]]],                          // R
  [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 4], [1, 3], [3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]],    // S
  [[[0, 6], [4, 6]], [[2, 6], [2, 0]]],                                                                  // T
  [[[0, 6], [0, 1], [1, 0], [3, 0], [4, 1], [4, 6]]],                                                    // U
  [[[0, 6], [2, 0], [4, 6]]],                                                                            // V
  [[[0, 6], [1, 0], [2, 3], [3, 0], [4, 6]]],                                                            // W
  [[[0, 0], [4, 6]], [[0, 6], [4, 0]]],                                                                  // X
  [[[0, 6], [2, 3], [4, 6]], [[2, 3], [2, 0]]],                                                          // Y
  [[[0, 6], [4, 6], [0, 0], [4, 0]]],                                                                    // Z
];

// Text vycentrovaný na počátku, výška písmen hgt.
module glyph_text(s, hgt) {
  k = hgt / 6;
  sw = max(0.8, hgt * 0.15);
  n = len(s);
  translate([-(n * 5 - 1) * k / 2, -3 * k])
    for (i = [0 : 1 : n - 1]) {
      o = ord(s[i]) - 65;
      if (o >= 0 && o < 26)
        translate([i * 5 * k, 0]) for (pl = glyphs()[o]) for (j = [0 : 1 : len(pl) - 2])
          hull() for (q = [pl[j], pl[j + 1]]) translate(q * k) circle(d = sw, $fn = 12);
    }
}

// Kód na spodku prvního ramene v úseku u konce bez výřezů. Písmena stojí
// podél ramene (nahoru = ke konci) a čtou se zespodu. Se šroubky nebo páskou
// se kód posune vedle otvoru, resp. vedle kapsy.
module code_mark(part, len, arm, w, t, f, bc, ce, label, mount = "none", screw_d = 2, screw_cs = true,
                 tape_w = 12, div_n = 1) {
  A = arms(part, len, arm);
  keep = keep_len(ce);
  n = len(label);
  edge = (w + 2 * t) / 2 - bottom_chamfer(bc, t, f) - 1;
  ys = screw_y(w, div_n);
  near = mount == "screw" ? screw_r(screw_d, screw_cs, f) + 1 - (ys > 0 ? ys : 0) :
         mount == "tape" ? tape_width(tape_w, w, t, bc, f) / 2 + 1 : -edge;
  side = near < edge - 2.5; // vejde se kód vedle?
  band = side ? [-edge, -near] : [-edge, edge];
  hgt = min(keep - 3, 8, (band[1] - band[0]) * 6 / (n * 5 - 1));
  d = min(0.6, f - 1);
  place(A[0][0], A[0][2]) translate([A[0][1] - keep / 2, (band[0] + band[1]) / 2, -0.01]) linear_extrude(d + 0.01)
    multmatrix([[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) glyph_text(label, hgt);
}

// ---------------------------------------------------------------------------
// Uchycení: šroubky v úsecích u konců ramen (bez výřezů), nebo kapsa pro pásku.

// Šroubek jde doprostřed komory: u sudého počtu komor je uprostřed přepážka.
function screw_y(w, div_n) = div_n % 2 == 0 ? w / (2 * div_n) : 0;
// Poloměr otvoru, resp. zahloubení (hlava ~2× průměr, zahloubení nesmí projít dnem).
function screw_r(d, cs, f) = cs ? min(d, (d + 0.4) / 2 + f - 0.8) : (d + 0.4) / 2;

module screw_holes(part, len, arm, w, f, ce, d, cs, div_n) {
  r0 = (d + 0.4) / 2;
  hr = screw_r(d, cs, f);
  for (a = arms(part, len, arm)) place(a[0], a[2])
    translate([a[1] - keep_len(ce) / 2, screw_y(w, div_n), 0]) {
      translate([0, 0, -1]) cylinder(r = r0, h = f + 2, $fn = 24);
      if (cs && hr > r0) translate([0, 0, f - (hr - r0)]) cylinder(h = hr - r0 + 0.01, r1 = r0, r2 = hr, $fn = 24);
    }
}

function tape_width(tw, w, t, bc, f) = min(tw, w + 2 * t - 2 * bottom_chamfer(bc, t, f) - 2);

// Kapsa pro pásku: pás pod osou kanálu, 2 mm před konci dílu končí, aby páska nevykukovala.
module tape_pocket(part, len, arm, w, t, f, bc, ce, tw, td) {
  A = arms(part, len, arm);
  ww = tape_width(tw, w, t, bc, f);
  d = min(td, f - 1.5);
  x0 = part == "corner" || part == "cross" ? -ww / 2 : part == "s" ? undef : is_bend(part) ? 2 : -0.01;
  for (i = [0 : len(A) - 1]) place(A[i][0], A[i][2]) mitred(part, i) {
    s0 = part == "s" ? A[i][1] - s_lead(ce) - 0.01 : x0;
    translate([s0, -ww / 2, -1]) cube([A[i][1] - 2 - s0, ww, d + 1]);
  }
  if (part == "s") s_sweep(len, arm, ce) translate([-ww / 2, -1]) square([ww, d + 1]);
}

// ---------------------------------------------------------------------------
// Tělo dílu

// Jazýčky s čepy na konci ramene (konec ramene je v x = L).
module male_tabs(L, w, h, t, f, c, bump) {
  z0 = tab_z0(f, c);
  z1 = tab_z1(f, h, c);
  for (m = [0, 1]) mirror([0, m, 0]) {
    // Zesílení stěny uvnitř dílu, ze kterého jazýček vychází.
    translate([L - tab_len, w / 2 - c - t, f - 0.01]) cube([tab_len, t + c + 0.02, z1 - f + 0.01]);
    translate([L - 0.01, w / 2 - c - t, z0]) cube([tab_len + 0.01, t, z1 - z0]);
    translate([L + tab_len / 2, w / 2 - c - 0.01, (z0 + z1) / 2])
      rotate([-90, 0, 0]) cylinder(h = bump + 0.01, r1 = bump_r, r2 = bump_r * 0.55);
  }
}

module cable_part(part, len = 80, arm = 40, w = 30, h = 20, t = 2, f = 3, c = 0.2, bump = 0.9,
                  genders = "FM", ce = 0,
                  slots = false, slot_w = 6, slot_bar = 4, slot_m = 2, slot_a = 45, slot_shape = "rect",
                  floor_slots = false, floor_slot_w = 4, floor_slot_bar = 6, floor_slot_m = 4, floor_slot_a = 45,
                  floor_slot_shape = "rect",
                  lid = false, bc = 0, er = 0, flute = false, flute_p = 3,
                  div_n = 1, div_t = 1.6, div_h = 20, label = "",
                  mount = "none", screw_d = 2, screw_cs = true, tape_w = 12, tape_d = 0.4,
                  outlet = "none", cable_d = 8) {
  $fn = 32; // i při `use <cable.scad>`, kde se globální $fn nepřebírá
  A = arms(part, len, arm);
  W = w + 2 * t;
  H = f + h;
  zc = (tab_z0(f, c) + tab_z1(f, h, c)) / 2;
  // Díl S přesazený doprava je zrcadlo dílu přesazeného doleva (porty zůstávají na místě).
  // Kód se vyrazí až po zrcadlení, aby byl čitelný.
  if (part == "s" && arm < 0) {
    difference() {
      mirror([0, 1, 0])
        cable_part(part, len, -arm, w, h, t, f, c, bump, genders, ce,
                   slots, slot_w, slot_bar, slot_m, slot_a, slot_shape,
                   floor_slots, floor_slot_w, floor_slot_bar, floor_slot_m, floor_slot_a, floor_slot_shape,
                   lid, bc, er, flute, flute_p, div_n, div_t, div_h, "", mount, screw_d, screw_cs, tape_w, tape_d);
      if (label != "") code_mark(part, len, arm, w, t, f, bc, ce, label, mount, screw_d, screw_cs, tape_w, div_n);
    }
  } else difference() {
    union() {
      if (corner_rounded(part, er, t)) {
        difference() {
          body_shell(part, len, arm, w, h, t, f, c, bc, er, ce, div_n, div_t, div_h, lid);
          corner_cut(w, t);
        }
        corner_round(w, t) u_profile(w, h, t, f, bc, er);
      } else {
        body_shell(part, len, arm, w, h, t, f, c, bc, er, ce, div_n, div_t, div_h, lid);
      }
      for (i = [0 : len(A) - 1])
        if (genders[i] == "M") place(A[i][0], A[i][2]) male_tabs(A[i][1], w, h, t, f, c, bump);
    }
    // Otvory pro čepy souseda.
    for (i = [0 : len(A) - 1])
      if (genders[i] == "F")
        place(A[i][0], A[i][2]) translate([A[i][1] - tab_len / 2, 0, zc])
          rotate([90, 0, 0]) cylinder(r = bump_r + c, h = W + 2, center = true);
    // Otvory pro čepy krytu.
    if (lid)
      for (s = lid_snaps(part, len, arm, W, ce, f, H))
        place(s[0], s[2]) translate([s[1], 0, H - lid_bump_z])
          rotate([90, 0, 0]) cylinder(r = lid_bump_r + c, h = W + 2, center = true);
    for (a = A) place(a[0], a[2]) end_notch(a[1], W, H, ce);
    if (slots) side_slots(part, len, arm, w, h, t, f, slot_w, slot_bar, slot_m, slot_a, ce, slot_shape);
    if (floor_slots)
      floor_slots_cut(part, len, arm, w, h, t, f, floor_slot_w, floor_slot_bar, floor_slot_m, floor_slot_a, ce,
                      floor_slot_shape);
    if (flute) flutes(part, len, arm, w, h, t, f, bc, er, ce, flute_p);
    if (part == "end" && outlet != "none") end_outlet(w, h, f, outlet, cable_d);
    if (mount == "screw") screw_holes(part, len, arm, w, f, ce, screw_d, screw_cs, div_n);
    if (mount == "tape") tape_pocket(part, len, arm, w, t, f, bc, ce, tape_w, tape_d);
    if (label != "") code_mark(part, len, arm, w, t, f, bc, ce, label, mount, screw_d, screw_cs, tape_w, div_n);
  }
}

// ---------------------------------------------------------------------------
// Kryt

// Průřez desky krytu (z = 0..lid_t) se zkosenými horními hranami a límce pod ní (z < 0).
module lid_plate2d(W, lid_t, er) {
  e = max(0, min(er, lid_t / 2));
  polygon([[-W / 2, 0], [W / 2, 0], [W / 2, lid_t - e], [W / 2 - e, lid_t], [-W / 2 + e, lid_t], [-W / 2, lid_t - e]]);
}
module lid_collar2d(w, c)
  for (m = [0, 1]) mirror([m, 0]) translate([w / 2 - c - lip_w, -lip_d]) square([lip_w, lip_d + 0.01]);

// Výřezy skrz desku krytu na úseku sg (v rámci ramene, deska z = z0..z0 + lid_t).
module lid_slots_cut(sg, w, c, lid_t, sw, sb, m, ang, shape, z0 = 0) {
  half = w / 2 - c - lip_w - m; // od vnitřního líce límce
  k = shape == "hex" ? 0 : tan(ang);
  off = abs(k) * 2 * half;
  if (half > 0)
    shear_xy(k) translate([0, 0, z0 - 1]) linear_extrude(lid_t + 2)
      slot_pattern(sg[1] + m + off / 2, sg[2] - m - off / 2, -half, half, sw, sb, shape);
}

// Čepy na vnější straně límce v místech s (v rámci ramene, horní hrana stěny v z = z0).
module lid_snap_bumps(x, w, c, lid_bump, z0 = 0) {
  for (m = [0, 1]) mirror([0, m, 0])
    translate([x, w / 2 - c - 0.01, z0 - lid_bump_z])
      rotate([-90, 0, 0]) cylinder(h = lid_bump + 0.01, r1 = lid_bump_r, r2 = lid_bump_r * 0.55);
}

// Kryt vodorovného dílu v poloze na dílu: deska z = 0..lid_t, límec pod ní (z < 0).
// Ramena se potkávají pokosem jako u těla dílu.
module cable_lid(part, len = 80, arm = 40, w = 30, t = 2, c = 0.2, lid_bump = 0.6, lid_t = 2, ce = 0,
                 lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6, lid_slot_m = 2, lid_slot_a = 45,
                 lid_slot_shape = "rect", er = 0, outlet = "none", cable_d = 8, h = 20) {
  $fn = 32;
  A = arms(part, len, arm);
  W = w + 2 * t;
  segs = free_segments(part, len, arm, W, ce, 0, 0);
  x0 = part == "corner" ? -W / 2 : -0.01;
  difference() {
    union() {
      difference() {
        for (i = [0 : len(A) - 1]) rotate(A[i][0]) mitred(part, i) along(x0, A[i][1]) {
          lid_plate2d(W, lid_t, er);
          lid_collar2d(w, c);
        }
        if (corner_rounded(part, er, t)) corner_cut(w, t);
      }
      if (corner_rounded(part, er, t)) corner_round(w, t) lid_plate2d(W, lid_t, er);
      if (part == "end") end_round(W) {
        lid_plate2d(W, lid_t, er);
        lid_collar2d(w, c);
      }
      for (sg = segs) rotate(sg[0]) for (s = snaps_on(sg)) lid_snap_bumps(s[1], w, c, lid_bump);
    }
    for (a = A) rotate(a[0]) lid_end_cut(a[1], W, lid_t, ce);
    if (part == "end" && outlet != "none") end_outlet_lid_cut(w, h, c, cable_d);
    if (lid_slots)
      for (sg = segs) rotate(sg[0])
        lid_slots_cut(sg, w, c, lid_t, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape);
  }
}

// Kryt zatáčky nahoru/dolů: na každém rameni jedna rovná deska s límcem.
// [začátek desky, začátek límce] v rámci ramene; desky na sebe v ohybu navazují
// (u zatáčky dolů přesahuje vodorovná deska přes vnější roh, límce se v rohu nekříží).
function bend_lid_starts(part, H, lid_t) =
  part == "up" ? [[H, H], [H + lid_t, H + lid_t]]
               : [[-H - lid_t, -(H - lip_d)], [-H, -(H - lip_d)]];

// Rovná deska krytu s límcem na rameni (v rámci ramene, horní hrana stěny v z = H):
// deska od x0, límec od lip_x0, konec ramene v L, čepy a výřezy na úseku sg.
module lid_arm(L, x0, lip_x0, sg, W, w, c, lid_bump, lid_t, ce, H,
               lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er) {
  difference() {
    union() {
      translate([0, 0, H]) {
        along(x0, L) lid_plate2d(W, lid_t, er);
        along(lip_x0, L) lid_collar2d(w, c);
      }
      for (s = snaps_on(sg)) lid_snap_bumps(s[1], w, c, lid_bump, H);
    }
    translate([0, 0, H]) lid_end_cut(L, W, lid_t, ce);
    if (lid_slots)
      lid_slots_cut(sg, w, c, lid_t, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, H);
  }
}

// Deska krytu ohybu pro rameno i, v rámci ramene.
module bend_lid_arm(i, part, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                    lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er) {
  W = w + 2 * t;
  H = f + h;
  st = bend_lid_starts(part, H, lid_t)[i];
  lid_arm(arms(part, 0, arm)[i][1], st[0], st[1], free_segments(part, 0, arm, W, ce, f, H)[i],
          W, w, c, lid_bump, lid_t, ce, H, lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a,
          lid_slot_shape, er);
}

// Kryt dílu S v poloze na dílu: rovné desky na nástavcích a deska s límcem
// protažená po obloucích. Výřezy v krytu jen na nástavcích.
module s_lid_placed(len, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                    lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er) {
  W = w + 2 * t;
  H = f + h;
  if (arm < 0) {
    mirror([0, 1, 0])
      s_lid_placed(len, -arm, w, h, t, f, c, lid_bump, lid_t, ce,
                   lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er);
  } else {
    A = arms("s", len, arm);
    segs = free_segments("s", len, arm, W, ce, f, H);
    for (i = [0, 1]) place(A[i][0], A[i][2]) {
      x0 = A[i][1] - s_lead(ce) - 0.01;
      lid_arm(A[i][1], x0, x0, segs[i], W, w, c, lid_bump, lid_t, ce, H,
              lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er);
    }
    s_sweep(len, arm, ce) translate([0, H]) {
      lid_plate2d(W, lid_t, er);
      lid_collar2d(w, c);
    }
  }
}

// Kryt v poloze na dílu (souřadnice dílu), pro náhled a sestavu.
module cable_lid_placed(part, len = 80, arm = 40, w = 30, h = 20, t = 2, f = 3, c = 0.2, lid_bump = 0.6,
                        lid_t = 2, ce = 0, lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6,
                        lid_slot_m = 2, lid_slot_a = 45, lid_slot_shape = "rect", er = 0,
                        outlet = "none", cable_d = 8) {
  $fn = 32;
  if (part == "s") {
    s_lid_placed(len, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                 lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er);
  } else if (is_bend(part)) {
    A = arms(part, len, arm);
    for (i = [0 : len(A) - 1]) rotate(A[i][0])
      bend_lid_arm(i, part, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                   lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er);
  } else {
    translate([0, 0, f + h])
      cable_lid(part, len, arm, w, t, c, lid_bump, lid_t, ce, lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m,
                lid_slot_a, lid_slot_shape, er, outlet, cable_d, h);
  }
}

// Kryt v tiskové orientaci: deska na podložce, límec nahoru. Kryt ohybu
// jsou dvě desky vedle sebe.
module cable_lid_print(part, len = 80, arm = 40, w = 30, h = 20, t = 2, f = 3, c = 0.2, lid_bump = 0.6,
                       lid_t = 2, ce = 0, lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6,
                       lid_slot_m = 2, lid_slot_a = 45, lid_slot_shape = "rect", er = 0,
                        outlet = "none", cable_d = 8) {
  $fn = 32;
  W = w + 2 * t;
  if (part == "s") {
    rotate([180, 0, 0]) translate([0, 0, -(f + h + lid_t)])
      s_lid_placed(len, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                   lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er);
  } else if (is_bend(part)) {
    for (i = [0, 1]) translate([0, i * (W + 5), 0])
      rotate([180, 0, 0]) translate([0, 0, -(f + h + lid_t)])
        bend_lid_arm(i, part, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                     lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, lid_slot_shape, er);
  } else {
    rotate([180, 0, 0]) translate([0, 0, -lid_t])
      cable_lid(part, len, arm, w, t, c, lid_bump, lid_t, ce, lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m,
                lid_slot_a, lid_slot_shape, er, outlet, cable_d, h);
  }
}
