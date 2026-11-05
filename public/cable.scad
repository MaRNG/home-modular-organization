// Modulární kabelový žlab: rovný díl, zatáčka L, křižovatka +, kryty.
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
// Zkosení: horní vnější hrany stěn (ch) a svislé vnější hrany na koncích
// dílů u spojů (cj); obojí platí i pro kryt.
//
// Souřadnice: dno leží v rovině z = 0. Díl se skládá z ramen vycházejících
// ze středu; port = střed čela ramene v rovině dna, úhel = směr ven.
// Pořadí a polohy portů musí odpovídat funkci `ports` v app.js.

/* [Co renderovat] */
what = "body";     // [body, lid]
part = "straight"; // [straight, corner, cross]
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
ch = 0; // horní vnější hrany stěn, 0 = bez zkosení
cj = 0; // svislé hrany na koncích u spojů, 0 = bez zkosení

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
  cable_part(part, len, arm, w, h, t, f, c, bump, genders, ch, cj,
             slots, slot_w, slot_bar, slot_m, slot_a,
             floor_slots, floor_slot_w, floor_slot_bar, floor_slot_m, floor_slot_a, lid);
else if (what == "lid")
  // Tisková orientace: deska krytu na podložce, límec nahoru.
  rotate([180, 0, 0]) translate([0, 0, -lid_t])
    cable_lid(part, len, arm, w, t, c, lid_bump, lid_t, ch, cj,
              lid_slots, lid_slot_w, lid_slot_bar, lid_slot_m, lid_slot_a);

// Ramena dílu: [úhel, délka od středu k portu].
function arms(part, len, arm) =
  part == "straight" ? [[180, len / 2], [0, len / 2]] :
  part == "corner"   ? [[180, arm], [90, arm]] :
                       [[0, arm], [90, arm], [180, arm], [270, arm]];

// Úseky ramen bez spojů na koncích: [úhel, x0, x1]. Na koncích jsou jazýčky
// nebo otvory pro čepy, takže se tam nic nevyřezává.
function free_segments(part, len, arm, W) =
  let (keep = tab_len + 1)
  part == "straight" ? [[0, -len / 2 + keep, len / 2 - keep]]
                     : [for (a = arms(part, len, arm)) [a[0], W / 2, a[1] - keep]];

// Polohy čepů krytu: [úhel, x] – na každém volném úseku kraje, nebo střed.
function lid_snaps(part, len, arm, W) =
  [for (sg = free_segments(part, len, arm, W))
     each (sg[2] - sg[1] > 30 ? [[sg[0], sg[1] + 4], [sg[0], sg[2] - 4]]
                              : [[sg[0], (sg[1] + sg[2]) / 2]])];

// Výška jazýčku: nad dnem souseda a pod límcem krytu.
function tab_z0(f, c) = f + c;
function tab_z1(f, h, c) = f + h - lip_d - c;

// Pás podél X od x0 do x1, šířka W vycentrovaná na ose, výška H.
module bar(x0, x1, W, H) translate([x0, -W / 2, 0]) cube([x1 - x0, W, H]);
module bar2d(x0, x1, W) translate([x0, -W / 2]) square([x1 - x0, W]);

// Zkosení nesmí prořezat stěnu ani kryt.
function chamfer(v, thickness) = max(0, min(v, thickness - 0.6));

// Zkosení x podle z (kolem výšky zc), resp. x podle y.
module shear_xz(k, zc) multmatrix([[1, 0, k, -k * zc], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) children();
module shear_yz(k, zc) multmatrix([[1, 0, 0, 0], [0, 1, k, -k * zc], [0, 0, 1, 0], [0, 0, 0, 1]]) children();
module shear_xy(k) multmatrix([[1, k, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) children();

// Rameno se zkosenými podélnými horními hranami a zkoseným vnitřním koncem.
// Konec u portu zůstává rovný, navazuje na souseda. Vnitřní konec je
// u rovného dílu i křižovatky schovaný v protějším rameni, u zatáčky tvoří vnější roh.
module arm_block(L, W, H, e) {
  if (e <= 0) bar(-W / 2, L, W, H);
  else hull() {
    bar(-W / 2, L, W, H - e);
    translate([0, 0, H - 0.01]) bar(-W / 2 + e, L, W - 2 * e, 0.01);
  }
}

// Zkosení svislých vnějších hran na konci ramene (konec je v x = L).
module joint_chamfer(L, W, H, e) {
  if (e > 0)
    for (m = [0, 1]) mirror([0, m, 0])
      translate([0, 0, -1]) linear_extrude(H + 2)
        polygon([[L + 0.01, W / 2 + 0.01], [L - e, W / 2 + 0.01], [L + 0.01, W / 2 - e]]);
}

// Středy rovnoměrně rozložených výřezů šířky sw s žebry šířky sb v intervalu [x0, x1].
function spread(x0, x1, sw, sb) =
  x1 - x0 < sw ? [] :
  let (n = floor((x1 - x0 - sw) / (sw + sb)) + 1)
    [for (k = [0 : n - 1]) (x0 + x1) / 2 + (k - (n - 1) / 2) * (sw + sb)];

// Výřezy v bočních stěnách. Šikmé výřezy mají na protilehlé stěně opačný
// sklon, takže z vnějšku vypadají obě stěny stejně a díl zůstává souměrný
// při otočení (kvůli slučování stejných dílů do jednoho STL).
module side_slots(part, len, arm, w, h, t, f, sw, sb, m, ang) {
  W = w + 2 * t;
  z0 = f + m;
  z1 = f + h - lip_d - m;
  zc = (z0 + z1) / 2;
  k = tan(ang);
  off = abs(k) * (z1 - z0);
  if (z1 > z0) {
    for (sg = free_segments(part, len, arm, W)) rotate(sg[0])
      for (side = [1, -1])
        for (x = spread(sg[1] + m + off / 2, sg[2] - m - off / 2, sw, sb))
          shear_xz(side * k, zc)
            translate([x - sw / 2, side > 0 ? w / 2 - 1 : -W / 2 - 1, z0]) cube([sw, t + 2, z1 - z0]);
    // Plochy středu, ze kterých nevede rameno (vnější roh zatáčky).
    if (part != "straight")
      for (a = [0, 90, 180, 270])
        if (len([for (r = arms(part, len, arm)) if (r[0] == a) 1]) == 0)
          rotate(a) for (y = spread(-w / 2 + m + off / 2, w / 2 - m - off / 2, sw, sb))
            shear_yz(-k, zc) translate([w / 2 - 1, y - sw / 2, z0]) cube([t + 2, sw, z1 - z0]);
  }
}

// Výřezy skrz dno.
module floor_slots_cut(part, len, arm, w, t, f, sw, sb, m, ang) {
  W = w + 2 * t;
  k = tan(ang);
  off = abs(k) * (w - 2 * m);
  for (sg = free_segments(part, len, arm, W)) rotate(sg[0])
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
                  genders = "FM", ch = 0, cj = 0,
                  slots = false, slot_w = 6, slot_bar = 4, slot_m = 2, slot_a = 45,
                  floor_slots = false, floor_slot_w = 4, floor_slot_bar = 6, floor_slot_m = 4, floor_slot_a = 45,
                  lid = false) {
  $fn = 32; // i při `use <cable.scad>`, kde se globální $fn nepřebírá
  A = arms(part, len, arm);
  W = w + 2 * t;
  H = f + h;
  e = chamfer(ch, t);
  zc = (tab_z0(f, c) + tab_z1(f, h, c)) / 2;
  difference() {
    union() {
      difference() {
        for (a = A) rotate(a[0]) arm_block(a[1], W, H, e);
        translate([0, 0, f]) for (a = A) rotate(a[0]) bar(-w / 2, a[1] + 1, w, h + 1);
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
      for (s = lid_snaps(part, len, arm, W))
        rotate(s[0]) translate([s[1], 0, H - lid_bump_z])
          rotate([90, 0, 0]) cylinder(r = lid_bump_r + c, h = W + 2, center = true);
    for (a = A) rotate(a[0]) joint_chamfer(a[1], W, H, chamfer(cj, t));
    if (slots) side_slots(part, len, arm, w, h, t, f, slot_w, slot_bar, slot_m, slot_a);
    if (floor_slots) floor_slots_cut(part, len, arm, w, t, f, floor_slot_w, floor_slot_bar, floor_slot_m, floor_slot_a);
  }
}

module footprint(A, W) for (a = A) rotate(a[0]) bar2d(-W / 2, a[1], W);
module channel2d(A, w, ext) for (a = A) rotate(a[0]) bar2d(-w / 2, a[1] + ext, w);

// Kryt v poloze na dílu: deska z = 0..lid_t, límec pod ní (z < 0).
module cable_lid(part, len = 80, arm = 40, w = 30, t = 2, c = 0.2, lid_bump = 0.6, lid_t = 2, ch = 0, cj = 0,
                 lid_slots = false, lid_slot_w = 6, lid_slot_bar = 6, lid_slot_m = 2, lid_slot_a = 45) {
  $fn = 32;
  A = arms(part, len, arm);
  W = w + 2 * t;
  inner = w / 2 - c - lip_w; // vnitřní líc límce
  half = inner - lid_slot_m;
  k = tan(lid_slot_a);
  off = abs(k) * 2 * half;
  difference() {
    for (a = A) rotate(a[0]) arm_block(a[1], W, lid_t, chamfer(ch, lid_t));
    for (a = A) rotate(a[0]) joint_chamfer(a[1], W, lid_t, chamfer(cj, t));
    if (lid_slots && half > 0)
      for (sg = free_segments(part, len, arm, W)) rotate(sg[0])
        for (x = spread(sg[1] + lid_slot_m + off / 2, sg[2] - lid_slot_m - off / 2, lid_slot_w, lid_slot_bar))
          shear_xy(k) translate([x - lid_slot_w / 2, -half, -1]) cube([lid_slot_w, 2 * half, lid_t + 2]);
  }
  translate([0, 0, -lip_d]) linear_extrude(lip_d + 0.01) intersection() {
    footprint(A, W);
    difference() {
      offset(delta = -c) channel2d(A, w, 5);
      offset(delta = -c - lip_w) channel2d(A, w, 5);
    }
  }
  // Čepy na vnější straně límce.
  for (s = lid_snaps(part, len, arm, W)) rotate(s[0])
    for (m = [0, 1]) mirror([0, m, 0])
      translate([s[1], w / 2 - c - 0.01, -lid_bump_z])
        rotate([-90, 0, 0]) cylinder(h = lid_bump + 0.01, r1 = lid_bump_r, r2 = lid_bump_r * 0.55);
}
