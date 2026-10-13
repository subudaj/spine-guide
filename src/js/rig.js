/* Фигуры для анимации упражнений: вид сбоку (с позвоночником внутри), вид сзади/спереди, вид «со стороны головы». */
'use strict';
const RIG = (() => {
  const S = U.s, CV = U.curve, f = U.f;
  const HL = { work: '#ff3b2f', stretch: '#2f8cff', relax: '#17a673' };

  /* ---------- вид сбоку ---------- */
  function ik(base, target, a, b, sign) { // двухзвенная кинематика: возвращает углы звеньев
    const d = U.clamp(U.dist(base, target), Math.abs(a - b) + 0.01, a + b - 0.01);
    const ang = U.angle(base, target);
    const off = Math.acos(U.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) / U.RAD;
    const a1 = ang + sign * off;
    const j = U.add(base, U.mul(U.dir(a1), a));
    return [a1, U.angle(j, target)];
  }
  const norm180 = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };

  function contactPts(sk, keys) {
    const H = sk.head.F, Fp = sk.Fp, out = [];
    const has = k => keys.includes(k);
    if (has('back')) { for (const id of ['T2', 'T4', 'T6', 'T8', 'T10', 'T12', 'L2', 'L4']) out.push(SIDE.backPt(sk, id)); out.push(sk.s1.F(-5.4, -3.5), Fp(-11.4, -2.5)); }
    if (has('front')) for (const id of ['T4', 'T6', 'T8', 'T10', 'L1', 'L3', 'L5']) out.push(SIDE.frontPt(sk, id));
    if (has('head')) out.push(H(-9.4, 5.4), H(-7.2, 11.7), H(-0.6, 14.8), H(6.4, 12.9), H(10.1, 5.7), H(12, 1.8), H(9.8, -5.4), H(-8.8, 2.6));
    if (has('pelvF')) out.push(Fp(9.6, 3.5), Fp(8.6, -2.0));
    if (has('butt')) out.push(Fp(-11.6, -3), Fp(-9.8, -7.8), Fp(-6.0, -9.2));
    for (const lg of [sk.leg, sk.leg2]) {
      if (has('knee')) { const d = U.dir(lg.a3); out.push(U.add(lg.k, U.mul(d, 4.6)), U.add(lg.a, U.mul(d, 3.0))); }
      if (has('foot')) { const up = U.dir(lg.a3 + 90); out.push(lg.heel, lg.toe, U.add(lg.sole, U.mul(up, 0))); }
      if (has('thighF')) { const n = U.dir(lg.a1 + 90); out.push(U.add(U.mid(lg.h, lg.k, 0.5), U.mul(n, 6.5)), U.add(lg.k, U.mul(n, 4.6))); }
      if (has('thigh')) { const n = U.dir(lg.a1 - 90); out.push(U.add(U.mid(lg.h, lg.k, 0.5), U.mul(n, 6.5)), U.add(lg.k, U.mul(n, 4.6))); }
    }
    if (has('hand')) for (const a of [sk.arm, sk.arm2]) { out.push(U.add(a.w, U.mul(U.dir(a.a2 - 90), 2.2)), U.add(a.h, U.mul(U.dir(a.a2 - 90), 1.2))); }
    if (has('elbow')) for (const a of [sk.arm, sk.arm2]) out.push(U.add(a.e, U.mul(U.dir(a.a1 - 90), 3.4)), U.add(U.mid(a.e, a.w, 0.5), U.mul(U.dir(a.a2 - 90), 3.0)));
    return out;
  }

  function solveSide(p0) {
    const p = Object.assign({}, p0);
    if (p0.thighAbs !== undefined) { p.hp = p0.thighAbs + 90 - p.pel; if (p0.shinAbs !== undefined) p.kn = p0.thighAbs - p0.shinAbs; }
    if (p0.thighAbs2 !== undefined) { p.hp2 = p0.thighAbs2 + 90 - p.pel; if (p0.shinAbs2 !== undefined) p.kn2 = p0.thighAbs2 - p0.shinAbs2; }
    if (!isFinite(p.y)) p.y = 0;
    let sk = SPINE.build(p);
    if (p.ground) {
      const keys = p.ground.split(',');
      const m = Math.min(...contactPts(sk, keys).map(q => q[1]));
      p.y += (p.floor || 0) - m;
      sk = SPINE.build(p);
    }
    let again = false;
    const legIK = (tgt, dirK, sfx) => {
      if (!tgt) return;
      const [a1, a2] = ik(sk.hip, tgt, SPINE.LIMB.th, SPINE.LIMB.sh, -1);
      const [b1, b2] = ik(sk.hip, tgt, SPINE.LIMB.th, SPINE.LIMB.sh, 1);
      const kn1 = norm180(a1 - a2), kn2 = norm180(b1 - b2);
      const [t1, t2] = kn1 >= 0 ? [a1, a2] : [b1, b2];
      p['hp' + sfx] = t1 + 90 - p.pel; p['kn' + sfx] = norm180(t1 - t2);
      if (p0[dirK] !== undefined) p['an' + sfx] = norm180(t2 + 90 - p0[dirK]);
      again = true;
    };
    legIK(p0.footAt, 'footDir', ''); legIK(p0.footAt2 || p0.footAt, p0.footDir2 !== undefined ? 'footDir2' : 'footDir', '2');
    const armIK = (tgt, sfx) => {
      if (!tgt) return;
      const [a1, a2] = ik(sk.shoulder, tgt, SPINE.LIMB.ua, SPINE.LIMB.fa, 1);
      const [b1, b2] = ik(sk.shoulder, tgt, SPINE.LIMB.ua, SPINE.LIMB.fa, -1);
      const e1 = norm180(a2 - a1), e2 = norm180(b2 - b1);
      let pick = (p0.elbowOut ? e1 <= 0 : e1 >= 0);
      if (p0.elbow === 'up' || p0.elbow === 'down') { // выбрать решение, где локоть выше/ниже
        const ea = U.add(sk.shoulder, U.mul(U.dir(a1), SPINE.LIMB.ua)), eb = U.add(sk.shoulder, U.mul(U.dir(b1), SPINE.LIMB.ua));
        pick = p0.elbow === 'up' ? ea[1] >= eb[1] : ea[1] <= eb[1];
      }
      const [t1, t2] = pick ? [a1, a2] : [b1, b2];
      p['sh' + sfx] = norm180(t1 - sk.aTrunk - 180); p['el' + sfx] = norm180(t2 - t1);
      if (p0.handDir !== undefined) p['wr' + sfx] = norm180(p0.handDir - t2);
      again = true;
    };
    armIK(p0.handAt, ''); armIK(p0.handAt2 || p0.handAt, '2');
    if (again) sk = SPINE.build(p);
    return sk;
  }

  /* зоны подсветки (вид сбоку) — замкнутые пути */
  function sideZones(sk) {
    const H = sk.head.F, Fp = sk.Fp, Fs = sk.s1.F, V = sk.V;
    const pr = id => SPINE.parts(V[id]);
    const backIn = id => V[id].F(pr(id).cb - 0.5, V[id].h * 0.5);
    const band = (ids, t0, t1) => {
      const a = ids.map(id => U.mid(backIn(id), SIDE.backPt(sk, id), t0)), b = ids.map(id => U.mid(backIn(id), SIDE.backPt(sk, id), t1));
      return CV(a.concat(b.reverse()), true, 0.7);
    };
    const T = n => Array.from({ length: n[1] - n[0] + 1 }, (_, i) => 'T' + (n[0] + i));
    const sternTop = V.T2.F(SIDE.STERN.T2[0] - 0.6, V.T2.h);
    const acr = U.add(sk.shoulder, U.mul(U.dir(V.T3.a), 2.2));
    const Z = {};
    Z.erector = band(['C5', 'C7', ...T([1, 12]), 'L1', 'L2', 'L3', 'L4', 'L5'], 0.05, 0.85);
    Z.erectorT = band(T([2, 11]), 0.05, 0.85);
    Z.erectorL = band(['T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'], 0.05, 0.85);
    Z.multif = band(['L1', 'L2', 'L3', 'L4', 'L5'], 0.0, 0.45);
    Z.neckExt = CV([H(-4, 0.4), backIn('C3'), backIn('C5'), backIn('C7'), backIn('T2'), SIDE.backPt(sk, 'T2'), SIDE.backPt(sk, 'C7'), SIDE.backPt(sk, 'C5'), SIDE.backPt(sk, 'C3'), H(-7.2, 0)], true, 0.7);
    Z.midBack = band(T([1, 7]), 0.3, 1.05);
    const root = V.T4.F(pr('T4').cb - 3.0, 0);
    Z.lowerTrap = CV([SIDE.backPt(sk, 'T6'), SIDE.backPt(sk, 'T9'), SIDE.backPt(sk, 'T12'), U.mid(backIn('T10'), SIDE.backPt(sk, 'T10'), 0.4), root, U.add(root, U.mul(U.dir(V.T4.a), 3))], true, 0.6);
    Z.upperTrap = CV([H(-7.4, 1.0), SIDE.backPt(sk, 'C4'), SIDE.backPt(sk, 'C7'), U.add(acr, U.mul(U.dir(V.T3.a - 90), -1.2)), U.add(acr, U.mul(U.dir(V.T3.a), 1.4)), U.mid(H(-4, -3), acr, 0.35)], true, 0.6);
    Z.scm = CV(U.offset([H(-0.8, -0.8), U.mid(H(-0.8, -0.8), sternTop, 0.5), sternTop], [1.0, 1.2, 0.6]).concat(U.offset([sternTop, U.mid(H(-0.8, -0.8), sternTop, 0.5), H(-0.8, -0.8)], [0.6, 1.2, 1.0])), true, 0.7);
    const dn = ['T2', 'T1', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2'];
    Z.dnf = CV(dn.map(id => V[id].F(V[id].d / 2 + 0.2, V[id].h / 2)).concat([H(1.6, -0.5), H(2.8, 0)], dn.slice().reverse().map(id => V[id].F(V[id].d / 2 + 1.6, V[id].h / 2))), true, 0.7);
    const ab = ['T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
    Z.abs = CV(ab.map(id => SIDE.frontPt(sk, id, -0.6)).concat([Fp(8.6, 2.6), Fp(7.0, -3.6), Fp(5.2, -3.4), Fp(6.4, 2.6)], ab.slice().reverse().map(id => SIDE.frontPt(sk, id, -3.4))), true, 0.7);
    Z.obliques = CV([SIDE.frontPt(sk, 'T10', -2.5), V.T11.F(7, 0), V.T12.F(2, 0), V.L1.F(-4, 0), Fp(-6.5, 11.5), Fp(-2, 13.4), Fp(3, 12.4), Fp(6.2, 8)], true, 0.7);
    Z.diaph = CV([V.T9.F(SIDE.STERN.T9[0] - 1.2, 0), V.T8.F(10.5, -1.2 - (sk.pose.breath || 0) * 1.2), V.T9.F(7.0, 0.4 - (sk.pose.breath || 0) * 1.4), V.T10.F(4, 0), V.L1.F(2.0, 0), V.L1.F(2.0, -1.4), V.T10.F(4.2, -1.3), V.T9.F(7.0, -1.0 - (sk.pose.breath || 0) * 1.4), V.T8.F(10.6, -2.6 - (sk.pose.breath || 0) * 1.2), V.T9.F(SIDE.STERN.T9[0] - 1.6, -1.4)], true, 0.6);
    const L = sk.leg;
    Z.glutes = CV([Fp(-8.4, 9.4), Fs(-4.6, -3), Fs(-2.6, -10), Fp(-11.2, -2.6), Fp(-9.6, -7.8), U.add(U.add(L.h, U.mul(U.dir(L.a1), 13)), U.mul(U.dir(L.a1 - 90), 6.4)), U.add(U.add(L.h, U.mul(U.dir(L.a1), 9)), U.mul(U.dir(L.a1 - 90), 1.6)), Fp(-1.5, -1.0), Fp(-5, 5)], true, 0.6);
    const thigh = (lg, side, r0, r1) => { const n = U.dir(lg.a1 + side * 90); const a = U.add(U.add(lg.h, U.mul(U.dir(lg.a1), 8)), U.mul(n, r0)), b = U.add(lg.k, U.mul(n, r1)); const a2 = U.add(U.add(lg.h, U.mul(U.dir(lg.a1), 8)), U.mul(n, 7)), b2 = U.add(lg.k, U.mul(n, 4.6)); return CV([a, U.mid(a, b), b, b2, U.mid(a2, b2), a2], true, 0.6); };
    Z.hams = thigh(sk.leg, -1, 0.5, 0.5); Z.hams2 = thigh(sk.leg2, -1, 0.5, 0.5);
    Z.quads = thigh(sk.leg, 1, 0.5, 0.5);
    Z.hipflex = CV([V.L2.F(V.L2.d / 2, 1), V.L4.F(V.L4.d / 2 + 1.4, 1), Fp(4.2, 4.5), Fp(3.4, -0.6), U.add(L.h, U.mul(U.dir(L.a1), 6)), Fp(1.0, 1.0), Fp(1.0, 4.4), V.L4.F(V.L4.d / 2 - 0.6, 1), V.L2.F(V.L2.d / 2 - 1.4, 1)], true, 0.6);
    Z.pecs = CV([sternTop, V.T4.F(SIDE.STERN.T4[0] + 0.4, 0), V.T6.F(SIDE.STERN.T6[0] + 0.2, 0), V.T6.F(SIDE.STERN.T6[0] - 2.5, 0), U.add(sk.shoulder, U.mul(U.dir(sk.arm.a1), 4)), U.add(sk.shoulder, U.mul(U.dir(V.T3.a - 90), 1.0))], true, 0.6);
    Z.lats = CV([SIDE.backPt(sk, 'T8'), SIDE.backPt(sk, 'T12'), SIDE.backPt(sk, 'L3'), U.mid(backIn('L2'), SIDE.backPt(sk, 'L2'), 0.4), V.T10.F(3, 0), U.add(sk.arm.s, U.mul(U.dir(sk.arm.a1), 6)), U.add(sk.arm.s, U.mul(U.dir(sk.arm.a1), 2))], true, 0.6);
    Z.serratus = CV([V.T4.F(5.5, 0), V.T8.F(7.5, 0), V.T8.F(2.0, 0), V.T5.F(0.5, 0)], true, 0.6);
    Z.ql = CV([V.T12.F(-2.5, 0), V.L1.F(-5.0, 0), Fp(-6.4, 11.6), Fp(-3.5, 12.6), V.L3.F(1.2, 0), V.T12.F(1.0, 0)], true, 0.6);
    Z.delt = CV(U.offset([U.add(sk.shoulder, U.mul(U.dir(V.T3.a), 2.5)), U.add(sk.shoulder, U.mul(U.dir(sk.arm.a1), 6)), U.add(sk.shoulder, U.mul(U.dir(sk.arm.a1), 13))], [3.2, 3.8, 1.4]).concat(U.offset([U.add(sk.shoulder, U.mul(U.dir(sk.arm.a1), 13)), U.add(sk.shoulder, U.mul(U.dir(sk.arm.a1), 6)), U.add(sk.shoulder, U.mul(U.dir(V.T3.a), 2.5))], [1.4, 3.8, 3.2])), true, 0.7);
    // седалищный нерв
    Z.nervePath = CV([V.L5.F(-1.2, 0), Fs(1.2, -4), Fp(-5.6, 0.5), Fp(-4.4, -5.5), ...[0.35, 0.65, 0.95].map(t => U.add(U.add(L.h, U.mul(U.dir(L.a1), 43 * t)), U.mul(U.dir(L.a1 - 90), 2.6 - t))), U.add(L.k, U.mul(U.dir(L.a2), 12)), U.add(L.k, U.mul(U.dir(L.a2), 30))]);
    return Z;
  }

  function hlLayer(Z, hl, eff, pulse) {
    if (!hl) return '';
    let s = '';
    for (const kind of ['stretch', 'work', 'relax']) {
      for (const z of hl[kind] || []) {
        if (!Z[z]) continue;
        const op = kind === 'relax' ? 0.85 : U.clamp(0.25 + 0.6 * eff, 0.2, 0.9) * (kind === 'work' ? (0.85 + 0.15 * pulse) : 1);
        if (kind === 'relax') s += `<path d="${Z[z]}" fill="${HL.relax}" fill-opacity="0.18" stroke="${HL.relax}" stroke-width="0.45" stroke-dasharray="1.2 .8"/>`;
        else s += `<path d="${Z[z]}" fill="${HL[kind]}" fill-opacity="${f(op * 0.75)}" stroke="${HL[kind]}" stroke-width="0.3" stroke-opacity="${f(op)}" filter="url(#fGlow)"/>`;
      }
    }
    return s;
  }

  function spineChain(sk, hot) {
    let s = '';
    for (const dk of sk.discs) s += `<path class="rg-disc" d="${U.poly([dk.pa, dk.ua, dk.up_, dk.pp])}"/>`;
    for (const v of sk.verts) {
      const F = v.F, d = v.d, h = v.h, pr = SPINE.parts(v);
      const cls = hot && hot.includes(v.id) ? 'rg-vert hot' : 'rg-vert';
      if (v.id !== 'C1') s += `<path class="${cls}" d="${U.poly([F(d / 2, 0.05), F(d / 2, h - 0.05), F(-d / 2, h - 0.05), F(-d / 2, 0.05)])}"/>`;
      const tip = pr.tipW, root = F(pr.cb, h * 0.5);
      s += `<path d="M${S(F(-d / 2, h * 0.5))}L${S(root)}L${S(tip)}" class="${cls}" style="fill:none;stroke-width:${v.region === 'L' ? 0.9 : 0.55};stroke-linecap:round;stroke:${hot && hot.includes(v.id) ? '#ff9a4a' : '#d9c7a1'}"/>`;
    }
    const Fs = sk.s1.F;
    s += `<path class="rg-vert" d="${CV([[2.0, 0], [1.8, -5], [0.6, -9.8], [-0.3, -13.5], [-1.2, -13.3], [-3.2, -6.5], [-4.1, -1.2], [-3.4, 0.3]].map(q => Fs(q[0], q[1])), true, 0.6)}"/>`;
    return s;
  }

  function headDetails(sk, far) {
    const H = sk.head.F;
    const eye = H(8.0, 5.0), ear = H(0.0, 3.0);
    let s = `<path class="rg-hair" d="${CV([H(-9.0, 4.5), H(-8.8, 9), H(-6.8, 12.2), H(-3.5, 14.4), H(1, 15.0), H(5.4, 13.8), H(8.0, 11.6), H(6.0, 12.0), H(2, 12.6), H(-1.5, 11.2), H(-5, 9.6), H(-7.0, 6.0)], true, 0.8)}"/>`;
    s += `<ellipse cx="${f(ear[0])}" cy="${f(-ear[1])}" rx="1.3" ry="2.2" class="rg-face" transform="rotate(${f(90 - sk.head.a)} ${f(ear[0])} ${f(-ear[1])})" style="fill:#eec0a6"/>`;
    s += `<circle cx="${f(eye[0])}" cy="${f(-eye[1])}" r="0.55" fill="#3b2c25"/>`;
    s += `<path class="rg-face" d="M${S(H(7.0, 6.6))}L${S(H(9.2, 6.9))}M${S(H(9.2, -1.6))}L${S(H(10.0, -1.7))}"/>`;
    return s;
  }

  function limb(a, b, r1, r2, cls) { return `<path class="${cls}" d="${U.capsule(a, b, r1, r2)}"/>`; }
  function footPath(lg) {
    const d = U.dir(lg.a3), up = U.dir(lg.a3 + 90);
    return CV([U.add(lg.a, U.mul(d, -3.0)), U.add(lg.heel, U.mul(up, 1.2)), U.add(lg.heel, U.mul(d, 0.6)), U.add(lg.sole, U.mul(d, 8)), U.add(lg.toe, U.mul(up, 0.3)), U.add(lg.toe, U.mul(up, 2.0)), U.add(lg.sole, U.mul(up, 4.8)), U.add(lg.a, U.mul(d, 3.0))], true, 0.8);
  }
  function handPath(a) {
    return U.capsule(a.w, a.h, 2.1, 1.3);
  }

  function sideBody(sk, o) {
    let s = '';
    const legs = [[sk.leg2, 'rg-skin far'], [sk.leg, 'rg-skin']];
    const arms = [[sk.arm2, 'rg-skin far'], [sk.arm, 'rg-skin']];
    // дальние конечности
    s += limb(sk.leg2.h, sk.leg2.k, 7.2, 5.0, legs[0][1]) + limb(sk.leg2.k, sk.leg2.a, 5.0, 3.0, legs[0][1]) + `<path class="${legs[0][1]}" d="${footPath(sk.leg2)}"/>`;
    s += limb(sk.arm2.s, sk.arm2.e, 4.4, 3.4, arms[0][1]) + limb(sk.arm2.e, sk.arm2.w, 3.4, 2.3, arms[0][1]) + `<path class="${arms[0][1]}" d="${handPath(sk.arm2)}"/>`;
    // туловище и голова
    const sp = SIDE.skinPaths(sk);
    s += `<g class="rg-torsoG"><path class="rg-torso" d="${sp[1]}"/><path class="rg-skin" d="${sp[0]}"/></g>`;
    s += headDetails(sk);
    s += o.hlBelow || '';
    s += `<g opacity="0.95">${spineChain(sk, o.hot)}</g>`;
    // ближние конечности
    s += limb(sk.leg.h, sk.leg.k, 7.2, 5.0, legs[1][1]) + limb(sk.leg.k, sk.leg.a, 5.0, 3.0, legs[1][1]) + `<path class="${legs[1][1]}" d="${footPath(sk.leg)}"/>`;
    s += limb(sk.arm.s, sk.arm.e, 4.4, 3.4, arms[1][1]) + limb(sk.arm.e, sk.arm.w, 3.4, 2.3, arms[1][1]) + `<path class="${arms[1][1]}" d="${handPath(sk.arm)}"/>`;
    if (o.nerve) s += `<path d="${o.Z.nervePath}" style="fill:none;stroke:#fff6;stroke-width:1.6;stroke-linecap:round"/><path class="rg-nerve" d="${o.Z.nervePath}" stroke-dasharray="${o.nerveDash || ''}"/>`;
    return s;
  }

  function sideRig(pose, o = {}) {
    const sk = solveSide(pose);
    const Z = sideZones(sk);
    const hlU = hlLayer(Z, o.hl, o.eff || 0, o.pulse || 0);
    let s = '';
    s += sideBody(sk, { hot: o.hot, Z, nerve: o.nerve, nerveDash: o.nerveDash });
    s += `<g class="rg-hl">${hlU}</g>`;
    return { svg: s, sk };
  }

  /* ---------- вид сзади / спереди ---------- */
  const CW = { C: 1.4, T: 1.8, L: 2.4 };
  function buildBack(p) {
    const q = Object.assign({ x: 0, y: 0, ang: 90, lat: 0, head: 0, aL: 8, aR: 8, eL: 0, eR: 0, lL: 4, lR: 4, kL: 0, kR: 0, fL: 1, fR: 1,
      elL: 0, elR: 0, retL: 0, retR: 0, rotL: 0, rotR: 0, view: 'back' }, p);
    const sk = SPINE.build({ y: 0 });
    const chain = [];
    let P = U.add([q.x, q.y], U.mul(U.dir(q.ang), 10)), a = q.ang;
    const segs = sk.verts.map(v => v.h + v.disc);
    for (const v of sk.verts) {
      const w = (v.region === 'C' ? 0.5 : 1) * q.lat / 20;
      a += w;
      const c = U.add(P, U.mul(U.dir(a), v.disc + v.h / 2));
      chain.push({ id: v.id, c, a, h: v.h, w: CW[v.region] });
      P = U.add(P, U.mul(U.dir(a), v.disc + v.h));
    }
    const C = Object.fromEntries(chain.map(c => [c.id, c]));
    const F = (id, x, y) => U.frame(C[id].c, C[id].a)(x, y); // x — вбок (вправо на экране), y — вдоль позвоночника
    const Fp = U.frame([q.x, q.y], q.ang);
    const headC = U.add(C.C1.c, U.mul(U.dir(C.C1.a + q.head), 9));
    const scap = sd => { // лопатка: точки в кадре T-позвонков, затем смещение/поворот
      const el = sd > 0 ? q.elR : q.elL, ret = sd > 0 ? q.retR : q.retL, rot = sd > 0 ? q.rotR : q.rotL;
      const base = { sa: ['T2', 7.0, 1.2], root: ['T3', 7.6, 0.2], ia: ['T7', 9.2, -0.4], gl: ['T2', 14.6, -1.4], acr: ['T1', 17.6, 1.0], mid: ['T4', 10.5, 0] };
      const out = {};
      const cen = F(base.mid[0], base.mid[1] * sd, base.mid[2]);
      for (const [k, [id, x, y]] of Object.entries(base)) {
        let pt = F(id, (x - ret) * sd, y + el);
        const rel = U.sub(pt, U.add(cen, U.mul(U.dir(C.T4.a - 90), -ret * sd)));
        pt = U.add(U.add(cen, U.mul(U.dir(C.T4.a - 90), -ret * sd)), U.rot(rel, rot * sd));
        out[k] = U.add(pt, U.mul(U.dir(C.T4.a), el));
      }
      return out;
    };
    const SL = scap(-1), SR = scap(1);
    const arm = (sd, abd, el, fr) => {
      const sc = sd > 0 ? SR : SL;
      const sh = U.add(sc.gl, U.mul(U.dir(C.T2.a - 90), sd * 1.6));
      const a1 = sd > 0 ? (C.T2.a - 180) + abd : (C.T2.a + 180) - abd;
      const e = U.add(sh, U.mul(U.dir(a1), 30));
      const a2 = a1 + sd * el;
      const w = U.add(e, U.mul(U.dir(a2), 26 * fr));
      const h = U.add(w, U.mul(U.dir(a2), 17 * fr));
      return { s: sh, e, w, h, a1, a2 };
    };
    const leg = (sd, ab, kn) => {
      const hp = Fp(9 * sd, -2);
      const a1 = q.ang - 180 + sd * ab;
      const k = U.add(hp, U.mul(U.dir(a1), 43));
      const a2 = a1 + sd * kn;
      const an = U.add(k, U.mul(U.dir(a2), 42));
      return { h: hp, k, a: an, a1, a2 };
    };
    return { q, chain, C, F, Fp, headC, SL, SR, armL: arm(-1, q.aL, q.eL, q.fL), armR: arm(1, q.aR, q.eR, q.fR), legL: leg(-1, q.lL, q.kL), legR: leg(1, q.lR, q.kR) };
  }

  function backZones(b) {
    const { F, Fp, C, SL, SR } = b;
    const Z = {};
    const mid = id => C[id].c;
    for (const [sd, sc, k] of [[-1, SL, 'L'], [1, SR, 'R']]) {
      Z['lowerTrap' + k] = CV([mid('T5'), mid('T8'), mid('T12'), U.mid(sc.root, sc.ia, 0.12), sc.root], true, 0.4);
      Z['midTrap' + k] = CV([mid('C7'), mid('T2'), mid('T4'), sc.root, U.mid(sc.root, sc.acr, 0.5), sc.acr], true, 0.4);
      Z['upperTrap' + k] = CV([U.add(b.headC, U.mul(U.dir(C.C1.a), -6)), mid('C4'), mid('C7'), sc.acr, U.mid(sc.acr, F('C5', 6 * sd, 0), 0.5)], true, 0.5);
      Z['rhomb' + k] = CV([mid('C7'), mid('T5'), sc.ia, U.mid(sc.ia, sc.root, 0.5), sc.root, sc.sa], true, 0.3);
      Z['serratus' + k] = CV([U.mid(sc.gl, sc.ia, 0.35), sc.ia, F('T9', 13.6 * sd, 0), F('T6', 15.6 * sd, 0), F('T4', 15.4 * sd, 0)], true, 0.5);
      Z['lats' + k] = CV([mid('T7'), mid('L3'), Fp(5 * sd, 12), Fp(13 * sd, 11.5), F('T10', 14.6 * sd, 0), U.add(sc.gl, U.mul(U.dir(C.T3.a), -4))], true, 0.5);
      Z['ql' + k] = CV([F('T12', 2.5 * sd, -1), F('T12', 9 * sd, -1.6), Fp(12 * sd, 12), Fp(4.5 * sd, 11.5)], true, 0.5);
      Z['obliques' + k] = CV([F('T9', 14.2 * sd, 0), F('L1', 14 * sd, 0), Fp(14.5 * sd, 10), Fp(10.5 * sd, 13), F('L1', 9 * sd, 0), F('T10', 10.5 * sd, 0)], true, 0.6);
      Z['gmed' + k] = CV([Fp(8 * sd, 13), Fp(14.5 * sd, 10.5), Fp(16 * sd, 3), Fp(13.5 * sd, -1.5), Fp(10 * sd, 5)], true, 0.6);
      Z['erector' + k] = CV([Fp(2 * sd, 9), F('T1', 1.2 * sd, 0), F('T1', 4 * sd, 0), F('T8', 6.0 * sd, 0), Fp(7.0 * sd, 9)], true, 0.5);
      const ar = sd > 0 ? b.armR : b.armL;
      Z['delt' + k] = CV(U.offset([sc.acr, U.mid(ar.s, ar.e, 0.25), U.mid(ar.s, ar.e, 0.45)], [3, 3.6, 1.2]).concat(U.offset([U.mid(ar.s, ar.e, 0.45), U.mid(ar.s, ar.e, 0.25), sc.acr], [1.2, 3.6, 3])), true, 0.6);
    }
    Z.abs = CV([F('T8', -4.5, 0), F('T8', 4.5, 0), Fp(4, 6), Fp(2.2, -1), Fp(-2.2, -1), Fp(-4, 6)], true, 0.5);
    return Z;
  }

  function backRig(pose, o = {}) {
    const b = buildBack(pose), q = b.q;
    const { F, Fp, C } = b;
    let s = '';
    // контур тела
    const lv = ['T1', 'T3', 'T6', 'T9', 'T12', 'L3', 'L5'];
    const wd = { T1: 17.5, T3: 17.0, T6: 16.2, T9: 15.4, T12: 14.2, L3: 13.2, L5: 14.4 };
    const R = [F('C3', 5.4, 0), F('C6', 5.8, 0), F('C7', 9, 0.6), F('T1', 14, 1.6), U.add(b.SR.acr, U.mul(U.dir(C.T1.a), 1.6)), ...lv.slice(1).map(id => F(id, wd[id], 0)), Fp(16.6, 2), Fp(15.6, -7)];
    const L = [F('C3', -5.4, 0), F('C6', -5.8, 0), F('C7', -9, 0.6), F('T1', -14, 1.6), U.add(b.SL.acr, U.mul(U.dir(C.T1.a), 1.6)), ...lv.slice(1).map(id => F(id, -wd[id], 0)), Fp(-16.6, 2), Fp(-15.6, -7)];
    const torso = CV(R.concat([Fp(0, -9)], L.reverse()), true, 0.7);
    const limbs = (arms) => {
      let t = '';
      for (const lg of [b.legL, b.legR]) t += limb(lg.h, lg.k, 8, 5.5, 'rg-skin') + limb(lg.k, lg.a, 5.4, 3.4, 'rg-skin') + `<ellipse class="rg-skin" cx="${f(lg.a[0])}" cy="${f(-lg.a[1] + 2)}" rx="3.2" ry="4"/>`;
      return t;
    };
    const armsSvg = () => {
      let t = '';
      for (const ar of [b.armL, b.armR]) t += limb(ar.s, ar.e, 4.6, 3.6, 'rg-skin') + limb(ar.e, ar.w, 3.6, 2.4, 'rg-skin') + limb(ar.w, ar.h, 2.4, 1.6, 'rg-skin');
      return t;
    };
    s += limbs();
    if (o.armsBehind) s += armsSvg();
    s += `<path class="rg-torso" d="${torso}"/>`;
    // голова
    const hc = b.headC, ha = 90 - C.C1.a - q.head;
    s += `<ellipse class="rg-skin" cx="${f(hc[0])}" cy="${f(-hc[1])}" rx="7.6" ry="9.6" transform="rotate(${f(ha)} ${f(hc[0])} ${f(-hc[1])})"/>`;
    if (q.view === 'back') s += `<ellipse class="rg-hair" cx="${f(hc[0])}" cy="${f(-hc[1])}" rx="7.4" ry="9.2" transform="rotate(${f(ha)} ${f(hc[0])} ${f(-hc[1])}) translate(0 -0.8)"/>`;
    else { const eL = U.add(hc, U.rot([-2.6, 1.4], -ha)), eR = U.add(hc, U.rot([2.6, 1.4], -ha)), mo = U.add(hc, U.rot([0, -4], -ha)); s += `<circle cx="${f(eL[0])}" cy="${f(-eL[1])}" r="0.6" fill="#3b2c25"/><circle cx="${f(eR[0])}" cy="${f(-eR[1])}" r="0.6" fill="#3b2c25"/><path class="rg-face" d="M${S(U.add(mo, U.rot([-1.6, 0], -ha)))}L${S(U.add(mo, U.rot([1.6, 0], -ha)))}"/><path class="rg-hair" d="${CV([U.add(hc, U.rot([-7.4, 2], -ha)), U.add(hc, U.rot([-6, 7.4], -ha)), U.add(hc, U.rot([0, 9.8], -ha)), U.add(hc, U.rot([6, 7.4], -ha)), U.add(hc, U.rot([7.4, 2], -ha)), U.add(hc, U.rot([0, 6], -ha))], true, 0.7)}"/>`; }
    // позвоночник и лопатки (вид сзади)
    let sp = '';
    for (const c of b.chain) {
      const fr = U.frame(c.c, c.a), hot = o.hot && o.hot.includes(c.id);
      sp += `<path class="rg-vert${hot ? ' hot' : ''}" d="${U.poly([fr(c.w, c.h / 2), fr(-c.w, c.h / 2), fr(-c.w, -c.h / 2), fr(c.w, -c.h / 2)])}"/>`;
    }
    s += `<g opacity="${q.view === 'back' ? 0.95 : 0.35}">${sp}</g>`;
    if (q.view === 'back') for (const sc of [b.SL, b.SR]) s += `<path class="rg-vert" style="fill:#f1e4c9;opacity:.9" d="${CV([sc.sa, sc.root, sc.ia, U.mid(sc.ia, sc.gl, 0.5), sc.gl, sc.acr, U.mid(sc.sa, sc.acr, 0.5)], true, 0.4)}"/><path d="${CV([sc.root, U.mid(sc.root, sc.acr, 0.55), sc.acr])}" style="fill:none;stroke:#cdb88f;stroke-width:1"/>`;
    if (!o.armsBehind) s += armsSvg();
    const Z = backZones(b);
    s += `<g class="rg-hl">${hlLayer(Z, o.hl, o.eff || 0, o.pulse || 0)}</g>`;
    return { svg: s, b };
  }

  /* ---------- вид «со стороны головы» (лёжа на боку) ---------- */
  function axialRig(p, o = {}) {
    const q = Object.assign({ rot: 0, arm: 8, head: 0 }, p);
    const sp = [-8, 17]; // ось вращения — позвоночник
    const R = (lx, ly) => U.add(sp, U.rot([lx + 8, ly], q.rot)); // локально: x вперёд от позвоночника, y вверх
    let s = '';
    // таз (дальше от зрителя, не вращается)
    s += `<ellipse cx="${f(-0.5)}" cy="${f(-17)}" rx="10" ry="15.5" class="rg-skin far" style="opacity:.55"/>`;
    s += `<text x="0" y="5" font-size="3" class="rg-txt" text-anchor="middle">вид со стороны головы · таз и колени неподвижны</text>`;
    // колени со стороны ног (сложены вместе)
    s += `<circle cx="16" cy="-9" r="5" class="rg-skin far"/><circle cx="16" cy="-17.5" r="5" class="rg-skin far" style="opacity:.8"/>`;
    // нижняя рука вперёд по полу
    const shB = R(0, -14.5), shT = R(0, 14.5);
    s += limb(shB, [shB[0] + 42, 3.2], 3.8, 2.6, 'rg-skin far');
    // грудная клетка — эллипс
    const pts = []; for (let i = 0; i < 48; i++) { const t = i / 48 * Math.PI * 2; pts.push(R(Math.cos(t) * 10.5, Math.sin(t) * 15.5)); }
    s += `<path class="rg-torso" d="${CV(pts, true, 1)}"/>`;
    // рёбра и позвонок в разрезе
    for (const k of [0.62, 0.8]) { const r = []; for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 2; r.push(R(Math.cos(t) * 10.5 * k, Math.sin(t) * 15.5 * k)); } s += `<path d="${CV(r, true, 1)}" style="fill:none;stroke:#d9c49b;stroke-width:.5;opacity:.7"/>`; }
    const vb = R(-6.2, 0);
    s += `<circle cx="${f(vb[0])}" cy="${f(-vb[1])}" r="2.4" class="rg-vert${o.hot ? ' hot' : ''}"/><path d="M${S(R(-8, 0))}L${S(R(-11.5, 0))}" style="stroke:${o.hot ? '#ff9a4a' : '#d9c7a1'};stroke-width:1;stroke-linecap:round"/>`;
    // голова (ближе к зрителю), подушка
    s += `<rect x="-14" y="-6" width="26" height="6" rx="2.5" class="pillow"/>`;
    const hc = U.add([-1, 17], U.rot([2, 0], q.rot * 0.25));
    s += `<circle cx="${f(hc[0])}" cy="${f(-hc[1] - 0.5)}" r="8.6" class="rg-skin" style="opacity:.5;stroke-dasharray:1 .6"/>`;
    const gaze = U.dir(q.head);
    const nose = U.add([hc[0], hc[1] + 0.5], U.mul(gaze, 8.6));
    s += `<path d="M${S(U.add([hc[0], hc[1] + 0.5], U.mul(gaze, 6.4)))}L${S(U.add(nose, U.mul(gaze, 1.8)))}" class="rg-face" style="stroke-width:1.1"/>`;
    // верхняя рука описывает дугу
    const hand = U.add(shT, U.mul(U.dir(q.arm), 52));
    s += limb(shT, U.add(shT, U.mul(U.dir(q.arm), 30)), 4.2, 3.4, 'rg-skin') + limb(U.add(shT, U.mul(U.dir(q.arm), 30)), hand, 3.4, 2.2, 'rg-skin');
    const lab = R(0, 0);
    s += `<text x="${f(lab[0])}" y="${f(-lab[1] + 4.5)}" font-size="2.6" class="rg-txt" text-anchor="middle" opacity=".8">грудная клетка</text>`;
    // зоны
    const Z = {};
    const arc = (a0, a1, k0, k1) => { const A = [], B = []; for (let i = 0; i <= 12; i++) { const t = (a0 + (a1 - a0) * i / 12) * U.RAD; A.push(R(Math.cos(t) * 10.5 * k1, Math.sin(t) * 15.5 * k1)); B.push(R(Math.cos(t) * 10.5 * k0, Math.sin(t) * 15.5 * k0)); } return CV(A.concat(B.reverse()), true, 0.8); };
    Z.pecs = arc(20, 85, 0.72, 1.04);
    Z.obliques = arc(-20, 30, 0.7, 1.03);
    Z.rotators = arc(150, 210, 0.45, 0.95);
    Z.lats = arc(95, 150, 0.72, 1.04);
    s += `<g class="rg-hl">${hlLayer(Z, o.hl, o.eff || 0, o.pulse || 0)}</g>`;
    return { svg: s, shT, sp, hand };
  }

  /* высота таза, при которой выбранные точки касаются пола */
  function groundY(pose, keys, floor = 0) {
    const p = Object.assign({ y: 0 }, pose); delete p.ground;
    const sk = solveSide(p);
    return p.y + floor - Math.min(...contactPts(sk, keys.split(',')).map(q => q[1]));
  }
  return { sideRig, backRig, axialRig, solveSide, groundY, contactPts, HL };
})();
