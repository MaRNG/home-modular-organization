// Modulární kabelový žlab: rovný díl, zatáčka L, křižovatka +, zatáčka
// nahoru (vnitřní roh, např. ze stolu na stěnu), zatáčka dolů (vnější roh
// přes hranu stolu) a kryty.
//
// Spoj na zacvaknutí: konec s čepy (M) má na bocích pružné jazýčky
// s kuželovým čepem, které se zasunou dovnitř sousedního dílu; konec
// s otvory (F) má v bočních stěnách kulaté díry, do kterých čep zapadne.
// Kryt drží límcem v kanálu a zacvakne se čepy na límci do otvorů
// pod horní hranou stěn.
//
// Žebrování = průhledové výřezy skrz stěny, dno nebo kryt; mezi výřezy
// zůstávají žebra. Výřezy můžou být šikmé (úhel od svislice / od příčného směru).
//
// Zkosení (ce): u spojů se šikmo (45°) usekne horní roh bočních stěn, takže
// mezi sousedními díly vznikne shora zářez do V. Kryt je na koncích kratší
// a jeho čela pokračují ve stejné šikmé rovině.
//
// Souřadnice: dno leží v rovině z = 0. Díl se skládá z ramen vycházejících
// ze středu. Každé rameno má vlastní rámec: osa x vede ven k portu, z = směr
// otevřené strany kanálu (u svislých ramen zatáček nahoru/dolů je rámec
// natočený). Port = střed čela ramene na vnější straně dna.
// Pořadí a polohy portů musí odpovídat TYPES[].ports v app.js.

/* [Co renderovat] */
what = "body";     // [body, lid, lid_view] – lid = tisková orientace, lid_view = poloha na dílu
part = "straight"; // [straight, corner, cross, up, down]
len  = 80;         // délka rovného dílu
arm  = 40;         // délka ramene zatáčky/křižovatky od středu k portu
genders = "FM";    // pohlaví portů v pořadí ramen: F = otvory, M = čepy

/* [Profil] */
w = 30;        // vnitřní šířka
h = 20;        // vnitřní výška
t = 2;         // tloušťka stěny
f = 3;         // tloušťka dna
c = 0.2;       // vůle spojů
bump = 0.9;    // výška čepu spoje dílů
lid_bump = 0.6; // výška čepu krytu

/* [Zkosení] */
ce = 0; // velikost useknutého horního rohu u spojů, 0 = bez zkosení

/* [Výřezy v bocích] */
slots    = false;
slot_w   = 6;  // šířka výřezu
slot_bar = 4;  // šířka žebra mezi výřezy
slot_m   = 2;  // okraj nad dnem a pod límcem krytu
slot_a   = 45; // úhel výřezu, 0 = svislý

/* [Výřezy ve dně] */
floor_slots    = false;
floor_slot_w   = 4;
floor_slot_bar = 6;
floor_slot_m   = 4; // okraj od stěn
floor_slot_a   = 45;

/* [Kryt] */
lid       = false; // díl má otvory pro zacvaknutí krytu
lid_t     = 2;
lid_slots    = false;
lid_slot_w   = 6;
lid_slot_bar = 6;
lid_slot_m   = 2; // okraj od límce
lid_slot_a   = 45;

/* [Pevné rozměry spojů] */
tab_len   = 10;   // jak daleko jazýček přesahuje přes konec dílu
bump_r    = 1.8;  // poloměr paty čepu spoje dílů
lip_d     = 4;    // hloubka límce krytu
lip_w     = 1.6;  // tloušťka límce krytu
lid_bump_r = 1.2; // poloměr paty čepu krytu
lid_bump_z = 2.4; // hloubka čepu krytu pod horní hranou stěny

$fn = 32;

if (what == "body")
  cable_part(part, len, arm, w, h, t, f, c, bump, genders, ce,
             slots, slot_w, slot_bar, slot_m, slot_a,
             floor_slots, floor_slot_w, floor_slot_bar, floor_slot_m, floor_slot_a, lid);
else if (what == "lid")
  cable_lid_print(part, len, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                  lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);
else if (what == "lid_view")
  cable_lid_placed(part, len, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                   lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);

// Ramena dílu: [rámec pro rotate(), délka od středu k portu].
// Zatáčka nahoru: svislé rameno jde do +z, otevřená strana míří do -x.
// Zatáčka dolů: svislé rameno jde do -z, otevřená strana míří do +x.
function arms(part, len, arm) =
  part == "straight" ? [[180, len / 2], [0, len / 2]] :
  part == "corner"   ? [[180, arm], [90, arm]] :
  part == "up"       ? [[180, arm], [[0, -90, 0], arm]] :
  part == "down"     ? [[180, arm], [[0, 90, 0], arm]] :
                       [[0, arm], [90, arm], [180, arm], [270, arm]];

function is_bend(part) = part == "up" || part == "down";

// Kde v rámci ramene začíná plný profil (vnější tvar) a dutina kanálu.
// U vodorovných dílů se ramena překrývají ve středu, u ohybů tvoří L v bočním pohledu.
function outer_x0(part, W, H) = part == "up" ? 0 : part == "down" ? -H : -W / 2;
function inner_x0(part, w, f, H) = part == "up" ? f : part == "down" ? -H - 1 : -w / 2;

// Kde na rameni začíná rovný úsek (za středem dílu nebo za ohybem).
function seg_start(part, W, f, H) = part == "up" ? H + 4 : part == "down" ? f + 1 : W / 2;

// Kolik se na konci ramene nechává bez výřezů a čepů krytu: jazýčky,
// otvory pro čepy a useknutý roh. Musí odpovídat keepLen() v app.js.
function keep_len(ce) = max(tab_len + 1, ce + 2);

// Úseky ramen bez spojů na koncích: [rámec, x0, x1].
function free_segments(part, len, arm, W, ce, f, H) =
  let (keep = keep_len(ce))
  part == "straight" ? [[0, -len / 2 + keep, len / 2 - keep]]
                     : [for (a = arms(part, len, arm)) [a[0], seg_start(part, W, f, H), a[1] - keep]];

// Polohy čepů krytu: [rámec, x] – na každém volném úseku kraje, nebo střed.
function lid_snaps(part, len, arm, W, ce, f, H) = [for (sg = free_segments(part, len, arm, W, ce, f, H)) each snaps_on(sg)];
function snaps_on(sg) =
  sg[2] <= sg[1] ? [] :
  sg[2] - sg[1] > 30 ? [[sg[0], sg[1] + 4], [sg[0], sg[2] - 4]] : [[sg[0], (sg[1] + sg[2]) / 2]];

// Výška jazýčku: nad dnem souseda a pod límcem krytu.
function tab_z0(f, c) = f + c;
function tab_z1(f, h, c) = f + h - lip_d - c;

// Pás podél X od x0 do x1, šířka W vycentrovaná na ose, výška H.
module bar(x0, x1, W, H) translate([x0, -W / 2, 0]) cube([x1 - x0, W, H]);
module bar2d(x0, x1, W) translate([x0, -W / 2]) square([x1 - x0, W]);

// Zkosení x podle z (kolem výšky zc), resp. x podle y.
module shear_xz(k, zc) multmatrix([[1, 0, k, -k * zc], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) children();
module shear_yz(k, zc) multmatrix([[1, 0, 0, 0], [0, 1, k, -k * zc], [0, 0, 1, 0], [0, 0, 0, 1]]) children();
module shear_xy(k) multmatrix([[1, k, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) children();

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

// Výřezy v bočních stěnách. Šikmé výřezy mají na protilehlé stěně opačný
// sklon, takže z vnějšku vypadají obě stěny stejně a díl zůstává souměrný
// při otočení (kvůli slučování stejných dílů do jednoho STL).
module side_slots(part, len, arm, w, h, t, f, sw, sb, m, ang, ce) {
  W = w + 2 * t;
  z0 = f + m;
  z1 = f + h - lip_d - m;
  zc = (z0 + z1) / 2;
  k = tan(ang);
  off = abs(k) * (z1 - z0);
  if (z1 > z0) {
    for (sg = free_segments(part, len, arm, W, ce, f, f + h)) rotate(sg[0])
      for (side = [1, -1])
        for (x = spread(sg[1] + m + off / 2, sg[2] - m - off / 2, sw, sb))
          shear_xz(side * k, zc)
            translate([x - sw / 2, side > 0 ? w / 2 - 1 : -W / 2 - 1, z0]) cube([sw, t + 2, z1 - z0]);
    // Plochy středu, ze kterých nevede rameno (vnější roh zatáčky).
    if (part == "corner" || part == "cross")
      for (a = [0, 90, 180, 270])
        if (len([for (r = arms(part, len, arm)) if (r[0] == a) 1]) == 0)
          rotate(a) for (y = spread(-w / 2 + m + off / 2, w / 2 - m - off / 2, sw, sb))
            shear_yz(-k, zc) translate([w / 2 - 1, y - sw / 2, z0]) cube([t + 2, sw, z1 - z0]);
  }
}

// Výřezy skrz dno.
module floor_slots_cut(part, len, arm, w, h, t, f, sw, sb, m, ang, ce) {
  W = w + 2 * t;
  k = tan(ang);
  off = abs(k) * (w - 2 * m);
  for (sg = free_segments(part, len, arm, W, ce, f, f + h)) rotate(sg[0])
    for (x = spread(sg[1] + m + off / 2, sg[2] - m - off / 2, sw, sb))
      shear_xy(k) translate([x - sw / 2, -(w / 2 - m), -1]) cube([sw, w - 2 * m, f + 2]);
}

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
                  slots = false, slot_w = 6, slot_bar = 4, slot_m = 2, slot_a = 45,
                  floor_slots = false, floor_slot_w = 4, floor_slot_bar = 6, floor_slot_m = 4, floor_slot_a = 45,
                  lid = false) {
  $fn = 32; // i při `use <cable.scad>`, kde se globální $fn nepřebírá
  A = arms(part, len, arm);
  W = w + 2 * t;
  H = f + h;
  zc = (tab_z0(f, c) + tab_z1(f, h, c)) / 2;
  difference() {
    union() {
      difference() {
        for (a = A) rotate(a[0]) bar(outer_x0(part, W, H), a[1], W, H);
        for (a = A) rotate(a[0]) translate([0, 0, f]) bar(inner_x0(part, w, f, H), a[1] + 1, w, h + 1);
      }
      for (i = [0 : len(A) - 1])
        if (genders[i] == "M") rotate(A[i][0]) male_tabs(A[i][1], w, h, t, f, c, bump);
    }
    // Otvory pro čepy souseda.
    for (i = [0 : len(A) - 1])
      if (genders[i] == "F")
        rotate(A[i][0]) translate([A[i][1] - tab_len / 2, 0, zc])
          rotate([90, 0, 0]) cylinder(r = bump_r + c, h = W + 2, center = true);
    // Otvory pro čepy krytu.
    if (lid)
      for (s = lid_snaps(part, len, arm, W, ce, f, H))
        rotate(s[0]) translate([s[1], 0, H - lid_bump_z])
          rotate([90, 0, 0]) cylinder(r = lid_bump_r + c, h = W + 2, center = true);
    for (a = A) rotate(a[0]) end_notch(a[1], W, H, ce);
    if (slots) side_slots(part, len, arm, w, h, t, f, slot_w, slot_bar, slot_m, slot_a, ce);
    if (floor_slots) floor_slots_cut(part, len, arm, w, h, t, f, floor_slot_w, floor_slot_bar, floor_slot_m, floor_slot_a, ce);
  }
}

module footprint(A, W) for (a = A) rotate(a[0]) bar2d(-W / 2, a[1], W);
module channel2d(A, w, ext) for (a = A) rotate(a[0]) bar2d(-w / 2, a[1] + ext, w);

// Výřezy skrz desku krytu na úseku sg (v rámci ramene, deska z = z0..z0 + lid_t).
module lid_slots_cut(sg, w, c, lid_t, sw, sb, m, ang, z0 = 0) {
  half = w / 2 - c - lip_w - m; // od vnitřního líce límce
  k = tan(ang);
  off = abs(k) * 2 * half;
  if (half > 0)
    for (x = spread(sg[1] + m + off / 2, sg[2] - m - off / 2, sw, sb))
      shear_xy(k) translate([x - sw / 2, -half, z0 - 1]) cube([sw, 2 * half, lid_t + 2]);
}

// Čepy na vnější straně límce v místech s (v rámci ramene, horní hrana stěny v z = z0).
module lid_snap_bumps(x, w, c, lid_bump, z0 = 0) {
  for (m = [0, 1]) mirror([0, m, 0])
    translate([x, w / 2 - c - 0.01, z0 - lid_bump_z])
      rotate([-90, 0, 0]) cylinder(h = lid_bump + 0.01, r1 = lid_bump_r, r2 = lid_bump_r * 0.55);
}

// Kryt vodorovného dílu v poloze na dílu: deska z = 0..lid_t, límec pod ní (z < 0).
module cable_lid(part, len = 80, arm = 40, w = 30, t = 2, c = 0.2, lid_bump = 0.6, lid_t = 2, ce = 0,
                 lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6, lid_slot_m = 2, lid_slot_a = 45) {
  $fn = 32;
  A = arms(part, len, arm);
  W = w + 2 * t;
  segs = free_segments(part, len, arm, W, ce, 0, 0);
  difference() {
    union() {
      linear_extrude(lid_t) footprint(A, W);
      translate([0, 0, -lip_d]) linear_extrude(lip_d + 0.01) intersection() {
        footprint(A, W);
        difference() {
          offset(delta = -c) channel2d(A, w, 5);
          offset(delta = -c - lip_w) channel2d(A, w, 5);
        }
      }
      for (sg = segs) rotate(sg[0]) for (s = snaps_on(sg)) lid_snap_bumps(s[1], w, c, lid_bump);
    }
    for (a = A) rotate(a[0]) lid_end_cut(a[1], W, lid_t, ce);
    if (lid_slots)
      for (sg = segs) rotate(sg[0]) lid_slots_cut(sg, w, c, lid_t, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);
  }
}

// Kryt zatáčky nahoru/dolů: na každém rameni jedna rovná deska s límcem.
// [začátek desky, začátek límce] v rámci ramene; desky na sebe v ohybu navazují
// (u zatáčky dolů přesahuje vodorovná deska přes vnější roh, límce se v rohu nekříží).
function bend_lid_starts(part, H, lid_t) =
  part == "up" ? [[H, H], [H + lid_t, H + lid_t]]
               : [[-H - lid_t, -(H - lip_d)], [-H, -(H - lip_d)]];

// Deska krytu ohybu pro rameno i, v rámci ramene (horní hrana stěny v z = H).
module bend_lid_arm(i, part, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                    lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a) {
  W = w + 2 * t;
  H = f + h;
  L = arms(part, 0, arm)[i][1];
  st = bend_lid_starts(part, H, lid_t)[i];
  sg = free_segments(part, 0, arm, W, ce, f, H)[i];
  difference() {
    union() {
      translate([0, 0, H]) bar(st[0], L, W, lid_t);
      for (m = [0, 1]) mirror([0, m, 0])
        translate([st[1], w / 2 - c - lip_w, H - lip_d]) cube([L - st[1], lip_w, lip_d + 0.01]);
      for (s = snaps_on(sg)) lid_snap_bumps(s[1], w, c, lid_bump, H);
    }
    translate([0, 0, H]) lid_end_cut(L, W, lid_t, ce);
    if (lid_slots) lid_slots_cut(sg, w, c, lid_t, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a, H);
  }
}

// Kryt v poloze na dílu (souřadnice dílu), pro náhled a sestavu.
module cable_lid_placed(part, len = 80, arm = 40, w = 30, h = 20, t = 2, f = 3, c = 0.2, lid_bump = 0.6,
                        lid_t = 2, ce = 0, lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6,
                        lid_slot_m = 2, lid_slot_a = 45) {
  $fn = 32;
  if (is_bend(part)) {
    A = arms(part, len, arm);
    for (i = [0 : len(A) - 1]) rotate(A[i][0])
      bend_lid_arm(i, part, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                   lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);
  } else {
    translate([0, 0, f + h])
      cable_lid(part, len, arm, w, t, c, lid_bump, lid_t, ce, lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);
  }
}

// Kryt v tiskové orientaci: deska na podložce, límec nahoru. Kryt ohybu
// jsou dvě desky vedle sebe.
module cable_lid_print(part, len = 80, arm = 40, w = 30, h = 20, t = 2, f = 3, c = 0.2, lid_bump = 0.6,
                       lid_t = 2, ce = 0, lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6,
                       lid_slot_m = 2, lid_slot_a = 45) {
  $fn = 32;
  W = w + 2 * t;
  if (is_bend(part)) {
    for (i = [0, 1]) translate([0, i * (W + 5), 0])
      rotate([180, 0, 0]) translate([0, 0, -(f + h + lid_t)])
        bend_lid_arm(i, part, arm, w, h, t, f, c, lid_bump, lid_t, ce,
                     lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);
  } else {
    rotate([180, 0, 0]) translate([0, 0, -lid_t])
      cable_lid(part, len, arm, w, t, c, lid_bump, lid_t, ce, lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);
  }
}
