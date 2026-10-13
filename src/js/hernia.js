/* Грыжа диска: поперечный срез (вид сверху) и боковой разрез двух позвонков.
   s — стадия 0..4 (норма, дегенерация, протрузия, экструзия, секвестр), dir — направление. */
'use strict';
const HERNIA = (() => {
  const f = U.f;
  const pt = p => f(p[0]) + ',' + f(p[1]);
  const pathC = (pts, close = true, k = 0.8) => U.curve(pts.map(p => [p[0], -p[1]]), close, k); // svg-координаты (y вниз)
  const lerpC = (a, b, t) => {
    const A = a.match(/\w\w/g).map(h => parseInt(h, 16)), B = b.match(/\w\w/g).map(h => parseInt(h, 16));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };

  /* параметры стадии */
  function st(s) {
    const prot = U.clamp(s - 1, 0, 1), ext = U.clamp(s - 2, 0, 1), seq = U.clamp(s - 3, 0, 1);
    return {
      s, dry: U.clamp(s, 0, 1), prot, ext, seq,
      bulge: 3.4 * prot + 0.9 * ext - 0.9 * seq,
      tongue: U.clamp((s - 0.7) / 1.4, 0, 1),
      blobR: ext > 0 ? 1.4 + 2.6 * ext - 0.4 * seq : 0,
      neck: ext > 0 ? 1.5 * (1 - seq) : 0,
      infl: U.clamp((s - 1.8) / 1.4, 0, 1) * (1 - seq * 0.35),
    };
  }

  const REG = {
    L: { w: 23, d: 16, dip: 3.6, nuc: [0, 2.5, 8.5, 6.2], view: [-46, -38, 92, 102] },
    T: { w: 15.5, d: 13.5, dip: 2.0, nuc: [0, 1.5, 6, 5], view: [-50, -38, 100, 100] },
    C: { w: 17, d: 13, dip: 1.6, nuc: [0, 2.0, 6.5, 4.6], view: [-46, -50, 92, 112] },
  };
  const DIRS = { central: 90, paracentral: 62, foraminal: 32 };

  /* контур диска в полярных координатах (svg: y вниз, 90° = назад) */
  function discR(rg, th, H, scale = 1, dirA = 90, bulgeK = 1) {
    const c = Math.cos(th), sn = Math.sin(th);
    let r = 1 / Math.sqrt((c * c) / (rg.w * rg.w) + (sn * sn) / (rg.d * rg.d));
    let dd = Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2));
    r -= rg.dip * Math.exp(-(dd * dd) / 0.22);
    if (rg === REG.T) { const df = Math.atan2(Math.sin(th + Math.PI / 2), Math.cos(th + Math.PI / 2)); r += 1.6 * Math.exp(-(df * df) / 0.15); }
    r *= scale;
    if (H) {
      const da = Math.atan2(Math.sin(th - dirA * U.RAD), Math.cos(th - dirA * U.RAD));
      r += H.bulge * bulgeK * Math.exp(-(da * da) / (2 * 0.3 * 0.3));
    }
    return r;
  }
  function outline(rg, H, scale, dirA, bulgeK) {
    const pts = [];
    for (let i = 0; i < 96; i++) { const th = i / 96 * Math.PI * 2; const r = discR(rg, th, H, scale, dirA, bulgeK); pts.push([Math.cos(th) * r, -Math.sin(th) * r]); }
    return pathC(pts, true, 1);
  }

  /* ---------- окружение по отделам (svg-координаты) ---------- */
  function contextL() {
    let s = '';
    s += `<g class="ax-mus" data-m="psoas"><ellipse cx="-27" cy="-1" rx="7.5" ry="10" transform="rotate(-25 -27 -1)"/><ellipse cx="27" cy="-1" rx="7.5" ry="10" transform="rotate(25 27 -1)"/></g>`;
    s += `<g class="ax-mus" data-m="ql"><ellipse cx="-38" cy="21" rx="4" ry="7"/><ellipse cx="38" cy="21" rx="4" ry="7"/></g>`;
    s += `<g class="ax-mus" data-m="erector"><path d="M-16,30 C-22,26 -32,26 -36,34 C-38,44 -30,52 -18,52 Z M16,30 C22,26 32,26 36,34 C38,44 30,52 18,52 Z"/></g>`;
    s += `<g class="ax-mus deepm" data-m="multif"><path d="M-3,38 L-12,33 C-16,36 -17,46 -16,52 C-11,56 -5,57 -3,56 Z M3,38 L12,33 C16,36 17,46 16,52 C11,56 5,57 3,56 Z"/></g>`;
    s += `<path class="ax-fascia" d="M-3,58 C-12,58 -22,56 -30,52 C-38,47 -42,36 -40,26"/><path class="ax-fascia" d="M3,58 C12,58 22,56 30,52 C38,47 42,36 40,26"/>`;
    s += `<circle class="ax-art" cx="7" cy="-25" r="6"/><ellipse class="ax-vein" cx="-14" cy="-23" rx="7" ry="4.6"/>`;
    // задние костные элементы на уровне диска
    s += `<g class="ax-bone"><path d="M-12,21 C-15,19 -19,20 -20,24 C-21,28 -18,31 -15,30 C-13,28 -12,25 -12,21 Z"/><path d="M12,21 C15,19 19,20 20,24 C21,28 18,31 15,30 C13,28 12,25 12,21 Z"/>`;
    s += `<path d="M-15,31 C-17,34 -15,38 -11,38 L-3,40 L-3,59 C-3,61 3,61 3,59 L3,40 L11,38 C15,38 17,34 15,31 C13,29 11,30 10,32 L4,34 L-4,34 L-10,32 C-11,30 -13,29 -15,31 Z"/></g>`;
    s += `<path class="ax-facet" d="M-14.6,30.6 C-17.6,29.2 -19.3,26.4 -18.6,23.2"/><path class="ax-facet" d="M14.6,30.6 C17.6,29.2 19.3,26.4 18.6,23.2"/>`;
    s += `<path class="ax-flav" data-m="flav" d="M-13,27 C-9,31 -4,32.5 0,32.5 C4,32.5 9,31 13,27"/>`;
    return s;
  }
  function contextT() {
    let s = '';
    s += `<g class="ax-lung"><ellipse cx="-33" cy="-8" rx="15" ry="22"/><ellipse cx="33" cy="-8" rx="15" ry="22"/></g>`;
    s += `<g class="ax-mus" data-m="erector"><path d="M-6,32 C-14,26 -26,28 -28,36 C-28,44 -18,48 -7,47 Z M6,32 C14,26 26,28 28,36 C28,44 18,48 7,47 Z"/></g>`;
    s += `<g class="ax-mus sup" data-m="trapM"><path d="M-3,52 C-16,52 -32,48 -44,40 L-44,44 C-32,53 -16,56 -3,56 Z M3,52 C16,52 32,48 44,40 L44,44 C32,53 16,56 3,56 Z"/></g>`;
    s += `<g class="ax-mus deepm" data-m="rhomb"><path d="M-3,48 C-14,49 -26,46 -38,38 L-40,41 C-28,50 -15,52 -3,51.5 Z M3,48 C14,49 26,46 38,38 L40,41 C28,50 15,52 3,51.5 Z"/></g>`;
    s += `<circle class="ax-art" cx="9" cy="-17" r="7"/><circle class="ax-vein" cx="-7" cy="-13" r="2.4"/><ellipse class="ax-eso" cx="-1" cy="-24" rx="4.6" ry="3"/>`;
    s += `<g class="ax-bone"><path d="M-9,20 C-13,18 -17,20 -19,23 L-21,27 C-19,30 -15,30 -12,28 C-10,26 -8,24 -9,20 Z M9,20 C13,18 17,20 19,23 L21,27 C19,30 15,30 12,28 C10,26 8,24 9,20 Z"/>`;
    s += `<path d="M-10,27 C-10,31 -6,33 -3,33 L-2,52 C-2,54 2,54 2,52 L3,33 C6,33 10,31 10,27 C7,29 4,29.5 0,29.5 C-4,29.5 -7,29 -10,27 Z"/></g>`;
    // рёбра: головка у диска, шейка к поперечному отростку, тело ребра вбок
    s += `<g class="ax-rib"><path d="M-15,4 C-19,10 -22,20 -24,26 C-28,34 -38,34 -46,24"/><path d="M15,4 C19,10 22,20 24,26 C28,34 38,34 46,24"/></g>`;
    s += `<path class="ax-flav" data-m="flav" d="M-8,26 C-5,29 -2,30 0,30 C2,30 5,29 8,26"/>`;
    return s;
  }
  function contextC() {
    let s = '';
    s += `<g class="ax-trach"><circle cx="0" cy="-38" r="7.5"/><circle cx="0" cy="-38" r="5.6" class="lumen"/></g><ellipse class="ax-eso" cx="0" cy="-25" rx="6.5" ry="2.8"/>`;
    s += `<g class="ax-mus" data-m="dnf"><ellipse cx="-7" cy="-16" rx="5" ry="2.8"/><ellipse cx="7" cy="-16" rx="5" ry="2.8"/></g>`;
    s += `<g class="ax-mus" data-m="scm"><ellipse cx="-34" cy="-18" rx="5" ry="8" transform="rotate(-30 -34 -18)"/><ellipse cx="34" cy="-18" rx="5" ry="8" transform="rotate(30 34 -18)"/></g>`;
    s += `<circle class="ax-art" cx="-22" cy="-24" r="3.4"/><circle class="ax-art" cx="22" cy="-24" r="3.4"/><ellipse class="ax-vein" cx="-28" cy="-26" rx="4" ry="3"/><ellipse class="ax-vein" cx="28" cy="-26" rx="4" ry="3"/>`;
    s += `<g class="ax-mus" data-m="splen"><path d="M-4,40 C-14,38 -28,38 -36,46 C-34,58 -16,60 -4,58 Z M4,40 C14,38 28,38 36,46 C34,58 16,60 4,58 Z"/></g>`;
    s += `<g class="ax-mus sup" data-m="trapU"><path d="M-4,60 C-16,62 -32,60 -42,52 L-42,56 C-32,64 -16,66 -4,64 Z M4,60 C16,62 32,60 42,52 L42,56 C32,64 16,66 4,64 Z"/></g>`;
    // поперечные отростки с отверстиями для позвоночной артерии, суставные столбы, дужки
    s += `<g class="ax-bone"><path d="M-15,-6 C-22,-9 -30,-6 -30,0 C-30,6 -24,8 -18,6 C-16,5 -15,0 -15,-6 Z M15,-6 C22,-9 30,-6 30,0 C30,6 24,8 18,6 C16,5 15,0 15,-6 Z"/>`;
    s += `<path d="M-16,14 C-22,14 -27,20 -26,26 C-25,31 -19,32 -16,29 C-14,26 -14,18 -16,14 Z M16,14 C22,14 27,20 26,26 C25,31 19,32 16,29 C14,26 14,18 16,14 Z"/>`;
    s += `<path d="M-17,29 C-14,35 -8,38 -3,40 L-4,48 L-6,51 L-2,50 L0,46 L2,50 L6,51 L4,48 L3,40 C8,38 14,35 17,29 C13,33 7,35 0,35 C-7,35 -13,33 -17,29 Z"/></g>`;
    s += `<circle class="ax-art" cx="-23" cy="-0.5" r="2.8"/><circle class="ax-art" cx="23" cy="-0.5" r="2.8"/>`;
    s += `<path class="ax-flav" data-m="flav" d="M-15,30 C-10,34 -5,35 0,35 C5,35 10,34 15,30"/>`;
    return s;
  }

  /* ---------- поперечный срез ---------- */
  function axial(region, s, dirKey, side = 1) {
    const rg = REG[region], H = st(s);
    const dirA = (180 - DIRS[dirKey]) * (side > 0 ? 1 : 0) + DIRS[dirKey] * (side > 0 ? 0 : 1);
    const da = side > 0 ? DIRS[dirKey] : 180 - DIRS[dirKey];
    const thd = da * U.RAD;
    let o = '';
    o += region === 'L' ? contextL() : region === 'T' ? contextT() : contextC();
    // диск: кольцо и пластинки
    const ann = lerpC('d3e4ee', 'd8d2bf', H.dry);
    o += `<path class="ax-ann" data-m="annulus" d="${outline(rg, H, 1, da, 1)}" style="fill:#${ann.slice(1)}"/>`;
    for (let k = 1; k <= 6; k++) o += `<path class="ax-lam" d="${outline(rg, H, 1 - k * 0.075, da, 1 - k * 0.11)}"/>`;
    // ядро
    const [nx, ny, nrx, nry] = rg.nuc;
    const sh = 1 - H.dry * 0.18;
    const outerR = discR(rg, thd, H, 1, da, 1);
    o += `<ellipse class="ax-nuc" data-m="nucleus" cx="${f(nx)}" cy="${f(ny)}" rx="${f(nrx * sh)}" ry="${f(nry * sh)}" fill="${H.dry > 0.5 ? 'url(#gNucDry)' : 'url(#gNuc)'}"/>`;
    // трещина и «язык» ядра в направлении грыжи
    const dir = [Math.cos(thd), Math.sin(thd)], nrm = [-dir[1], dir[0]];
    if (s > 0.6) {
      const r0 = Math.min(nrx, nry) * sh * 0.8, r1 = r0 + (outerR - r0) * (0.25 + 0.75 * H.tongue) - (H.ext > 0 ? 0 : 0.9);
      const c0 = [nx + dir[0] * r0, ny + dir[1] * r0];
      const w0 = 1.6 + H.tongue * 1.2, w1 = H.ext > 0 ? Math.max(0.6, H.neck) : 0.6 + H.prot * 1.4;
      const a = [c0[0] + nrm[0] * w0, c0[1] + nrm[1] * w0], b = [c0[0] - nrm[0] * w0, c0[1] - nrm[1] * w0];
      const tip = [nx + dir[0] * r1, ny + dir[1] * r1];
      const ta = [tip[0] + nrm[0] * w1, tip[1] + nrm[1] * w1], tb = [tip[0] - nrm[0] * w1, tip[1] - nrm[1] * w1];
      o += `<path class="ax-fiss" d="M${pt(a)}L${pt(ta)}L${pt(tb)}L${pt(b)}Z" fill="url(#gNucDry)" opacity="${f(U.clamp((s - 0.6) * 2, 0, 1))}"/>`;
      if (s < 1.5) o += `<path class="ax-crack" d="M${pt(tip)}l${f(dir[0] * 3 + nrm[0])},${f(dir[1] * 3 + nrm[1])}"/>`;
    }
    // задняя продольная связка
    const pll = [];
    for (let a = 58; a <= 122; a += 4) { const t = a * U.RAD; const r = discR(rg, t, H, 1, da, 1) + 0.6; pll.push([Math.cos(t) * r, -Math.sin(t) * r]); }
    o += `<path class="ax-pll" data-m="PLL" d="${pathC(pll, false)}"/>`;
    // выпавший фрагмент
    let blob = null;
    if (H.ext > 0) {
      const dist = outerR + H.blobR * 0.55 + H.seq * 5.5;
      const drift = H.seq * 3;
      blob = [nx + dir[0] * dist + nrm[0] * drift * side * -1, ny + dir[1] * dist + nrm[1] * drift * side * -1];
      if (H.neck > 0.05) {
        const base = [nx + dir[0] * (outerR - 1), ny + dir[1] * (outerR - 1)];
        o += `<path class="ax-nuc" d="M${pt([base[0] + nrm[0] * H.neck, base[1] + nrm[1] * H.neck])}L${pt([blob[0] + nrm[0] * H.neck * 0.8, blob[1] + nrm[1] * H.neck * 0.8])}L${pt([blob[0] - nrm[0] * H.neck * 0.8, blob[1] - nrm[1] * H.neck * 0.8])}L${pt([base[0] - nrm[0] * H.neck, base[1] - nrm[1] * H.neck])}Z" fill="url(#gNucDry)"/>`;
      }
      o += `<ellipse class="ax-nuc" data-m="nucleus" cx="${f(blob[0])}" cy="${f(blob[1])}" rx="${f(H.blobR * 1.15)}" ry="${f(H.blobR * 0.9)}" transform="rotate(${f(da)} ${pt(blob)})" fill="url(#gNucDry)"/>`;
    }
    const tip = blob ? [blob[0] + dir[0] * H.blobR, blob[1] + dir[1] * H.blobR] : [nx + dir[0] * outerR, ny + dir[1] * outerR];
    const tipR = blob ? H.blobR : 1.5 + H.bulge * 0.5;
    const tipC = blob || [nx + dir[0] * (outerR - 1.5), ny + dir[1] * (outerR - 1.5)];
    // мешок / спинной мозг и корешки с учётом сдавления
    const press = (c, r) => { // смещение структуры c (радиус r) грыжей
      const dv = U.sub(c, tipC), dd = U.len(dv), ov = tipR + r - dd + 0.5;
      if (ov <= 0 || s < 1.2) return { c, k: 0, sq: 1 };
      const nv = U.norm(dv);
      return { c: U.add(c, U.mul(nv, ov * 0.75)), k: U.clamp(ov / (r * 1.2), 0, 1), sq: 1 - U.clamp(ov / (r * 2.2), 0, 0.45), ang: Math.atan2(nv[1], nv[0]) / U.RAD };
    };
    const rootCol = k => lerpC('f3c537', 'ff4b2b', k);
    const roots = region === 'L'
      ? [{ c: [8 * side, 19.5], r: 1.9, n: 'travers' }, { c: [-8 * side, 19.5], r: 1.9, n: 'travers' }, { c: [17.5 * side, 14], r: 2.3, n: 'exit' }, { c: [-17.5 * side, 14], r: 2.3, n: 'exit' }]
      : region === 'T' ? [{ c: [12.5 * side, 16], r: 1.6, n: 'exit' }, { c: [-12.5 * side, 16], r: 1.6, n: 'exit' }]
        : [{ c: [16 * side, 12.5], r: 2.2, n: 'exit' }, { c: [-16 * side, 12.5], r: 2.2, n: 'exit' }];
    // мешок/мозг
    if (region === 'L') {
      const sac = press([0, 24], 7);
      o += `<g data-m="cauda"><ellipse class="ax-sac" cx="${f(sac.c[0])}" cy="${f(sac.c[1])}" rx="9" ry="${f(6.6 * sac.sq)}"/>`;
      for (let i = 0; i < 14; i++) { const a = (200 + i * 10) * U.RAD; o += `<circle class="ax-rootlet" cx="${f(sac.c[0] + Math.cos(a) * -5.6)}" cy="${f(sac.c[1] + 1.5 + Math.sin(a) * -3.2 * sac.sq)}" r="0.85"/>`; }
      o += '</g>';
      if (sac.k > 0) o += `<ellipse cx="${f(sac.c[0])}" cy="${f(sac.c[1])}" rx="9" ry="${f(6.6 * sac.sq)}" class="ax-press" style="opacity:${f(sac.k)}"/>`;
    } else {
      const cc = region === 'T' ? [0, 21] : [0, 21.5];
      const cr = region === 'T' ? [5.4, 4.2] : [10, 6.2];
      const cd = press(cc, cr[1] + 0.5);
      const dr = region === 'T' ? [7.6, 6.8] : [12.4, 8.6];
      o += `<ellipse class="ax-sac" cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${f(dr[0])}" ry="${f(dr[1])}"/>`;
      o += `<g data-m="cord" transform="translate(${pt(cd.c)}) scale(1 ${f(cd.sq)})"><ellipse class="ax-cord" rx="${f(cr[0])}" ry="${f(cr[1])}" style="fill:${lerpC('f6dca6', 'ff8f6b', cd.k)}"/>`;
      const gx = cr[0] * 0.55, gy = cr[1] * 0.6;
      o += `<path class="ax-grey" d="M${f(-gx)},${f(-gy)} C${f(-gx * 0.3)},${f(-gy * 0.2)} ${f(-gx * 0.3)},${f(gy * 0.2)} ${f(-gx)},${f(gy)} L${f(-gx * 0.2)},${f(gy * 0.2)} L${f(gx * 0.2)},${f(gy * 0.2)} L${f(gx)},${f(gy)} C${f(gx * 0.3)},${f(gy * 0.2)} ${f(gx * 0.3)},${f(-gy * 0.2)} ${f(gx)},${f(-gy)} L${f(gx * 0.2)},${f(-gy * 0.2)} L${f(-gx * 0.2)},${f(-gy * 0.2)} Z"/></g>`;
      if (cd.k > 0.05) o += `<ellipse cx="${f(cd.c[0])}" cy="${f(cd.c[1])}" rx="${f(cr[0] + 1.5)}" ry="${f(cr[1] + 1.5)}" class="ax-press" style="opacity:${f(cd.k)}"/>`;
    }
    // корешки
    for (const rt of roots) {
      const p = press(rt.c, rt.r);
      const col = rootCol(U.clamp(p.k * 1.4 + (p.k > 0 ? H.infl * 0.4 : 0), 0, 1));
      if (rt.n === 'exit') {
        const sx = Math.sign(rt.c[0]);
        if (region === 'L') o += `<path class="ax-nerve" d="M${pt(p.c)}Q${f(p.c[0] + 5 * sx)},${f(p.c[1] - 3)} ${f(p.c[0] + 9 * sx)},${f(p.c[1] - 10)}" style="stroke:${col}"/><ellipse cx="${f(p.c[0] + 2 * sx)}" cy="${f(p.c[1] - 1)}" rx="3.2" ry="2.3" style="fill:${col}" class="ax-drg"/>`;
        else if (region === 'T') o += `<path class="ax-nerve thin" d="M${pt(p.c)}C${f(p.c[0] + 6 * sx)},${f(p.c[1] + 6)} ${f(p.c[0] + 16 * sx)},${f(p.c[1] + 16)} ${f(p.c[0] + 32 * sx)},${f(p.c[1] + 10)}" style="stroke:${col}"/>`;
        else o += `<path class="ax-nerve" d="M${f(p.c[0] - 6 * sx)},${f(p.c[1] + 6)}L${pt(p.c)}L${f(p.c[0] + 10 * sx)},${f(p.c[1] - 8)}" style="stroke:${col}"/><ellipse cx="${f(p.c[0] + 4 * sx)}" cy="${f(p.c[1] - 3)}" rx="2.6" ry="2" style="fill:${col}" class="ax-drg"/>`;
      }
      o += `<g data-m="root"><ellipse cx="${f(p.c[0])}" cy="${f(p.c[1])}" rx="${f(rt.r / Math.sqrt(p.sq))}" ry="${f(rt.r * p.sq)}" class="ax-root" style="fill:${col}"${p.ang !== undefined ? ` transform="rotate(${f(p.ang + 90)} ${pt(p.c)})"` : ''}/></g>`;
      if (p.k > 0.05) o += `<circle cx="${f(p.c[0])}" cy="${f(p.c[1])}" r="${f(rt.r * 3.2)}" fill="url(#gInfl)" class="pulse" opacity="${f(0.4 + H.infl * 0.6)}"/>`;
    }
    // воспаление вокруг грыжи и иммунные клетки
    if (H.infl > 0) o += `<circle cx="${pt(tipC).split(',')[0]}" cy="${pt(tipC).split(',')[1]}" r="${f(tipR * 2.2 + 2)}" fill="url(#gInfl)" opacity="${f(H.infl * 0.8)}" class="pulse"/>`;
    if (H.ext > 0.4 && blob) {
      const n = Math.round(3 + H.seq * 7);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4; const rr = H.blobR * 1.25 + 1.2; o += `<circle class="macro" cx="${f(blob[0] + Math.cos(a) * rr)}" cy="${f(blob[1] + Math.sin(a) * rr * 0.85)}" r="0.75"/>`; }
    }
    // ориентиры
    const vb = rg.view;
    o += `<text class="ax-ori" x="0" y="${f(vb[1] + 4)}" text-anchor="middle">▲ живот (вперёд)</text><text class="ax-ori" x="0" y="${f(vb[1] + vb[3] - 2)}" text-anchor="middle">▼ спина</text>`;
    return { svg: o, view: vb };
  }

  /* ---------- боковой разрез: два позвонка и диск ---------- */
  function sagittal(region, s, dirKey) {
    const H = st(s);
    const R = region === 'L' ? { bh: 26, bd: 34, dh: 10, can: 15, cord: false } : region === 'T' ? { bh: 21, bd: 27, dh: 5.5, can: 14, cord: true } : { bh: 15, bd: 18, dh: 6, can: 15, cord: true };
    const x0 = -R.bd / 2, x1 = R.bd / 2, hd = R.dh / 2;
    let o = '';
    const body = (y0, y1) => `<path class="vb" d="M${f(x0 + 1)},${f(y0)} L${f(x1 - 1)},${f(y0)} Q${f(x1)},${f(y0)} ${f(x1)},${f(y0 + 1)} L${f(x1 - 1.2)},${f((y0 + y1) / 2)} L${f(x1)},${f(y1 - 1)} Q${f(x1)},${f(y1)} ${f(x1 - 1)},${f(y1)} L${f(x0 + 1)},${f(y1)} Q${f(x0)},${f(y1)} ${f(x0)},${f(y1 - 1)} L${f(x0)},${f(y0 + 1)} Q${f(x0)},${f(y0)} ${f(x0 + 1)},${f(y0)} Z"/>`;
    const cb = x0 - R.can;
    // задние элементы (вид сбоку): ножка, суставы, дужка, остистый
    const post = (yc) => { // ножка, суставные отростки, дужка, остистый отросток (вид сбоку)
      const y0 = yc - R.bh / 2, y1 = yc + R.bh / 2, c = R.can, bh = R.bh;
      const L = region === 'L' ? 19 : region === 'T' ? 21 : 12, drop = region === 'T' ? 13 : region === 'C' ? 3 : 1, th = region === 'L' ? bh * 0.5 : bh * 0.28;
      const ped = `M${f(x0 + 0.3)},${f(y0 + 0.1 * bh)} L${f(x0 - 0.58 * c)},${f(y0 + 0.16 * bh)} L${f(x0 - 0.58 * c)},${f(y0 + 0.5 * bh)} L${f(x0 + 0.3)},${f(y0 + 0.56 * bh)} Z`;
      const pil = `M${f(x0 - 0.48 * c)},${f(y0 - 0.24 * bh)} Q${f(x0 - 0.62 * c)},${f(y0 - 0.3 * bh)} ${f(x0 - 0.78 * c)},${f(y0 - 0.2 * bh)} L${f(x0 - 0.84 * c)},${f(y0 + 0.22 * bh)} L${f(x0 - 1.02 * c)},${f(y0 + 0.3 * bh)} L${f(x0 - 1.02 * c)},${f(y1 - 0.12 * bh)} L${f(x0 - 0.96 * c)},${f(y1 + 0.26 * bh)} Q${f(x0 - 0.84 * c)},${f(y1 + 0.32 * bh)} ${f(x0 - 0.74 * c)},${f(y1 + 0.2 * bh)} L${f(x0 - 0.72 * c)},${f(y1 - 0.14 * bh)} L${f(x0 - 0.55 * c)},${f(y0 + 0.52 * bh)} L${f(x0 - 0.5 * c)},${f(y0 + 0.1 * bh)} Z`;
      const sp = `M${f(x0 - 1.0 * c)},${f(y0 + 0.3 * bh)} C${f(x0 - c - L * 0.5)},${f(y0 + 0.32 * bh + drop * 0.4)} ${f(x0 - c - L * 0.9)},${f(y0 + 0.3 * bh + drop)} ${f(x0 - c - L)},${f(y0 + 0.36 * bh + drop)} Q${f(x0 - c - L - 1.6)},${f(y0 + 0.36 * bh + drop + th / 2)} ${f(x0 - c - L)},${f(y0 + 0.36 * bh + drop + th)} C${f(x0 - c - L * 0.7)},${f(y0 + 0.4 * bh + drop + th)} ${f(x0 - c - L * 0.3)},${f(y0 + 0.75 * bh)} ${f(x0 - 1.0 * c)},${f(y0 + 0.86 * bh)} Z`;
      return `<path class="vp" d="${ped}"/><path class="vp" d="${sp}"/><path class="vp" d="${pil}"/>`;
    };
    // фасеточный сустав между нижним отростком верхнего и верхним отростком нижнего позвонка
    const facet = () => `<path class="sg-facet" d="M${f(x0 - 0.76 * R.can)},${f(-hd - R.bh * 0.05)} L${f(x0 - 0.8 * R.can)},${f(hd + R.bh * 0.12)}"/>`;
    const yU = -hd - R.bh / 2, yL = hd + R.bh / 2;
    o += `<g class="sg-bones">${post(yU)}${post(yL)}${facet()}${body(-hd - R.bh, -hd)}${body(hd, hd + R.bh)}</g>`;
    // межпозвонковое отверстие и выходящий корешок (над диском, под ножкой верхнего позвонка)
    const fr = [x0 - R.can * 0.45, -hd - R.bh * 0.35];
    o += `<ellipse class="sg-foramen" cx="${f(fr[0])}" cy="${f(fr[1] + 2)}" rx="${f(R.can * 0.36)}" ry="${f(R.bh * 0.42)}"/>`;
    // диск
    const b = H.bulge * (dirKey === 'foraminal' ? 0.35 : 1);
    const ann = lerpC('d3e4ee', 'd8d2bf', H.dry);
    const dhh = hd * (1 - H.dry * 0.12);
    o += `<path class="ax-ann" data-m="annulus" d="M${f(x0)},${f(-hd)} L${f(x1)},${f(-hd)} Q${f(x1 + 0.8)},0 ${f(x1)},${f(hd)} L${f(x0)},${f(hd)} Q${f(x0 - b * 1.6)},${f(0)} ${f(x0)},${f(-hd)} Z" style="fill:#${ann.slice(1)}"/>`;
    for (let k = 1; k <= 4; k++) { const xa = x1 - k * 1.6, xp = x0 + k * 1.6; o += `<path class="ax-lam" d="M${f(xa)},${f(-dhh + 0.3)} Q${f(xa + 0.8)},0 ${f(xa)},${f(dhh - 0.3)} M${f(xp)},${f(-dhh + 0.3)} Q${f(xp - 0.8 - b * 1.6 * (1 - k * 0.2))},0 ${f(xp)},${f(dhh - 0.3)}"/>`; }
    const nShift = -H.tongue * R.bd * 0.18;
    o += `<ellipse class="ax-nuc" data-m="nucleus" cx="${f(-1 + nShift)}" cy="0" rx="${f(R.bd * 0.22 * (1 - H.dry * 0.15) + H.tongue * 2)}" ry="${f(Math.max(0.8, hd * 0.62 * (1 - H.dry * 0.25)))}" fill="${H.dry > 0.5 ? 'url(#gNucDry)' : 'url(#gNuc)'}"/>`;
    // замыкательные пластинки
    o += `<path class="sg-ep" d="M${f(x0 + 0.5)},${f(-hd)}L${f(x1 - 0.5)},${f(-hd)}M${f(x0 + 0.5)},${f(hd)}L${f(x1 - 0.5)},${f(hd)}"/>`;
    // связки
    o += `<path class="ax-pll" data-m="PLL" d="M${f(x0 - 0.6)},${f(-hd - R.bh)} L${f(x0 - 0.6)},${f(-hd)} Q${f(x0 - 0.6 - b * 1.7 - (H.ext ? 1.2 : 0))},0 ${f(x0 - 0.6)},${f(hd)} L${f(x0 - 0.6)},${f(hd + R.bh)}"/>`;
    o += `<path class="sg-all" data-m="ALL" d="M${f(x1 + 0.6)},${f(-hd - R.bh)}L${f(x1 + 0.6)},${f(hd + R.bh)}"/>`;
    o += `<path class="ax-flav" data-m="flav" d="M${f(cb + 0.6)},${f(yU + R.bh * 0.45)} L${f(cb + 0.6)},${f(yL - R.bh * 0.45)}"/>`;
    // фрагмент
    let blob = null;
    if (H.ext > 0) {
      const by = H.seq * (R.bh * 0.55), bx = x0 - 1.2 - H.blobR * 0.6 - b * 0.4;
      blob = [bx, by];
      if (H.neck > 0.05) o += `<path class="ax-nuc" fill="url(#gNucDry)" d="M${f(x0 + 2)},${f(-H.neck)} L${f(bx)},${f(by - H.neck)} L${f(bx)},${f(by + H.neck)} L${f(x0 + 2)},${f(H.neck)} Z"/>`;
      o += `<ellipse class="ax-nuc" cx="${f(bx)}" cy="${f(by)}" rx="${f(H.blobR * 0.8)}" ry="${f(H.blobR * 1.3)}" fill="url(#gNucDry)"/>`;
    }
    // содержимое канала
    const front = x0 - 1.4 - (blob ? H.blobR * 1.4 + b * 0.4 : b * 1.5);
    const sacF = x0 - 1.6, sacB = cb + 1.4;
    const indent = Math.max(0, front - sacF) * -1; // насколько грыжа «вдавилась»
    const ky = blob ? blob[1] : 0;
    const dent = Math.max(0, sacF - front);
    const sac = `M${f(sacF)},${f(-hd - R.bh * 1.1)} L${f(sacF)},${f(ky - 9)} Q${f(sacF - dent * 1.25)},${f(ky)} ${f(sacF)},${f(ky + 9)} L${f(sacF)},${f(hd + R.bh * 1.1)} L${f(sacB)},${f(hd + R.bh * 1.1)} L${f(sacB)},${f(-hd - R.bh * 1.1)} Z`;
    const press = U.clamp(dent / (R.cord ? 3 : 5), 0, 1) * (dirKey === 'foraminal' ? 0.25 : 1);
    o += `<path class="ax-sac" d="${sac}"/>`;
    if (R.cord) {
      const cx = (sacF + sacB) / 2, cw = R.can * 0.28;
      o += `<path class="ax-cord" data-m="cord" style="fill:${lerpC('f6dca6', 'ff8f6b', press)}" d="M${f(cx + cw)},${f(-hd - R.bh * 1.1)} L${f(cx + cw)},${f(ky - 7)} Q${f(cx + cw - dent * press * 1.1)},${f(ky)} ${f(cx + cw)},${f(ky + 7)} L${f(cx + cw)},${f(hd + R.bh * 1.1)} L${f(cx - cw)},${f(hd + R.bh * 1.1)} L${f(cx - cw)},${f(-hd - R.bh * 1.1)} Z"/>`;
    } else {
      let cd = '';
      for (let i = 0; i < 6; i++) { const xx = sacB + 1.5 + i * (sacF - sacB - 3) / 5; cd += `M${f(xx)},${f(-hd - R.bh * 1.1)}L${f(xx)},${f(hd + R.bh * 1.1)}`; }
      o += `<path class="sg-cauda" data-m="cauda" d="${cd}"/>`;
      // проходящий корешок (L5 для диска L4–L5): спускается вдоль задней стенки диска
      const rx = sacF - 1.4 - (dirKey === 'paracentral' ? dent * 0.9 : dent * 0.3);
      const rc = lerpC('f3c537', 'ff4b2b', U.clamp((dirKey === 'paracentral' ? press * 1.5 : press * 0.4) + H.infl * 0.2 * (press > 0 ? 1 : 0), 0, 1));
      o += `<path class="ax-nerve" data-m="root" style="stroke:${rc}" d="M${f(sacF - 1.4)},${f(-hd - 4)} Q${f(rx)},${f(ky)} ${f(sacF - 0.8)},${f(hd + R.bh * 0.7)} L${f(x0 - R.can * 0.4)},${f(hd + R.bh * 1.05)}"/>`;
    }
    // выходящий корешок в отверстии
    const fp = dirKey === 'foraminal' ? U.clamp(H.bulge / 3 + H.ext, 0, 1) : 0;
    o += `<g data-m="root"><ellipse class="ax-root" cx="${f(fr[0])}" cy="${f(fr[1] - fp * 1.5)}" rx="${f(2.6 * (1 - fp * 0.3))}" ry="3.2" style="fill:${lerpC('f3c537', 'ff4b2b', fp)}"/></g>`;
    if (H.infl > 0 && (press > 0 || fp > 0)) {
      const ic = fp > 0 ? [fr[0], fr[1]] : [front, ky];
      o += `<circle cx="${f(ic[0])}" cy="${f(ic[1])}" r="${f(5 + H.infl * 4)}" fill="url(#gInfl)" opacity="${f(H.infl * 0.85)}" class="pulse"/>`;
    }
    if (blob && H.ext > 0.4) { const n = Math.round(3 + H.seq * 6); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o += `<circle class="macro" cx="${f(blob[0] + Math.cos(a) * (H.blobR + 1.4))}" cy="${f(blob[1] + Math.sin(a) * (H.blobR * 1.4 + 1.4))}" r="0.7"/>`; } }
    const top = -hd - R.bh - 8, bot = hd + R.bh + 8, left = cb - (region === 'C' ? 16 : 24), right = x1 + 6;
    o += `<text class="ax-ori" x="${f(right - 1)}" y="${f(top + 3)}" text-anchor="end">живот →</text><text class="ax-ori" x="${f(left + 1)}" y="${f(top + 3)}">← спина</text>`;
    return { svg: o, view: [left, top, right - left, bot - top] };
  }

  return { axial, sagittal, st, REG };
})();
