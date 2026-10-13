/* Модель позвоночника и тела в профиль (сагиттальная плоскость).
   Размеры — сантиметры, средний взрослый. Углы сегментов — градусы, «+» = разгибание (лордоз). */
'use strict';
var SPINE = (() => {
  const K = 1.08; // общий масштаб размеров позвонков
  // снизу вверх: h — высота тела позвонка, d — глубина (спереди назад), disc — высота диска ПОД позвонком,
  // seg — естественный угол в диске под позвонком
  const LEVELS = [
    ['L5', 2.7, 3.6, 1.15, 16], ['L4', 2.7, 3.6, 1.15, 13], ['L3', 2.7, 3.5, 1.1, 9], ['L2', 2.6, 3.4, 1.0, 7], ['L1', 2.5, 3.3, 0.95, 4],
    ['T12', 2.4, 3.1, 0.75, 0], ['T11', 2.3, 3.0, 0.7, -1], ['T10', 2.2, 2.9, 0.6, -3], ['T9', 2.1, 2.8, 0.5, -4], ['T8', 2.0, 2.7, 0.45, -5],
    ['T7', 1.95, 2.6, 0.45, -5], ['T6', 1.9, 2.5, 0.45, -5], ['T5', 1.85, 2.4, 0.45, -5], ['T4', 1.8, 2.2, 0.45, -4], ['T3', 1.7, 2.0, 0.45, -4],
    ['T2', 1.7, 1.9, 0.45, -3], ['T1', 1.6, 1.8, 0.45, -2],
    ['C7', 1.45, 1.7, 0.5, 0], ['C6', 1.4, 1.65, 0.55, 4], ['C5', 1.35, 1.6, 0.55, 5], ['C4', 1.35, 1.6, 0.55, 5], ['C3', 1.35, 1.6, 0.55, 5],
    ['C2', 1.6, 1.6, 0.55, 4], ['C1', 1.0, 1.0, 0.35, 6],
  ].map(([id, h, d, disc, seg], i) => ({ id, i, h: h * K, d: d * K, disc: disc * K, seg, region: id[0], n: +id.slice(1) }));
  const BY = Object.fromEntries(LEVELS.map(l => [l.id, l]));
  const ORDER_TOP = LEVELS.slice().reverse().map(l => l.id); // C1 … L5
  const below = id => { const l = BY[id]; return l.i === 0 ? 'S1' : LEVELS[l.i - 1].id; };
  const discId = id => id + '-' + below(id); // диск под позвонком
  const W_L = { L5: .22, L4: .24, L3: .2, L2: .18, L1: .16 };
  const W_T = { T1: .04, T2: .06, T3: .08, T4: .1, T5: .11, T6: .11, T7: .11, T8: .1, T9: .09, T10: .08, T11: .06, T12: .06 };
  const W_C = { C7: .12, C6: .18, C5: .2, C4: .2, C3: .16, C2: .14 };

  /* форма задних элементов по отделам */
  function geom(l) {
    const r = l.region, n = l.n;
    let canal, spA, spL, spT, lam = 0.55 * K;
    if (r === 'C') {
      canal = 1.5 * K; spT = 0.5 * K;
      spA = n === 7 ? 18 : n === 2 ? 12 : 16; spL = (n === 7 ? 2.8 : n === 2 ? 2.2 : n === 1 ? 0.6 : 1.5) * K;
      if (n === 2) spT = 1.0 * K;
    } else if (r === 'T') {
      canal = 1.35 * K; spT = 0.6 * K;
      const A = { 1: 25, 2: 35, 3: 45, 4: 55, 5: 60, 6: 60, 7: 60, 8: 58, 9: 50, 10: 40, 11: 28, 12: 15 };
      spA = A[n]; spL = (n <= 2 ? 3.3 : n >= 11 ? 3.0 : 3.8) * K;
    } else { canal = 1.6 * K; spA = 5; spL = 3.0 * K; spT = 1.7 * K; lam = 0.7 * K; }
    return { canal, spA, spL, spT, lam };
  }

  /* поза по умолчанию: стоя */
  const NEUTRAL = { x: 0, y: 0, pel: 0, lum: 0, tho: 0, cer: 0, nod: 0, tf: 7, tfa: 0, pro: 0,
    sh: 4, el: 10, sh2: 2, el2: 8, wr: 0, wr2: 0, hp: 0, kn: 0, an: 0, hp2: 0, kn2: 0, an2: 0, breath: 0 };

  const LIMB = { ua: 31, fa: 26, hand: 18, th: 43, sh: 42, ft: 25 };

  function build(poseIn) {
    const p = Object.assign({}, NEUTRAL, poseIn);
    // дальние конечности по умолчанию повторяют ближние
    for (const [a, b] of [['sh', 'sh2'], ['el', 'el2'], ['wr', 'wr2'], ['hp', 'hp2'], ['kn', 'kn2'], ['an', 'an2']]) if (poseIn[b] === undefined && poseIn[a] !== undefined) p[b] = poseIn[a];
    const hip = [p.x, p.y];
    const Fp = U.frame(hip, 90 + p.pel); // кадр таза: lx — вперёд, ly — вверх
    const s1c = Fp(-1.8 * K, 10.3 * K);
    const s1a = 50 + p.pel;
    const sk = { pose: p, hip, Fp, s1: { c: s1c, a: s1a, F: U.frame(s1c, s1a), d: 3.7 * K }, verts: [], discs: [], V: {} };
    let P = s1c, aLow = s1a, dLow = 3.7 * K, lowId = 'S1';
    // фокус разгибания/сгибания грудного отдела (например, через спинку стула)
    const tfw = {}; let tfs = 0;
    for (let n = 1; n <= 12; n++) { const w = Math.exp(-Math.pow(n - p.tf, 2) / (2 * 1.1 * 1.1)); tfw['T' + n] = w; tfs += w; }
    for (const l of LEVELS) {
      let seg = l.seg;
      if (W_L[l.id]) seg += p.lum * W_L[l.id];
      if (W_T[l.id]) seg += p.tho * W_T[l.id] + p.tfa * tfw[l.id] / tfs;
      if (W_C[l.id]) seg += p.cer * W_C[l.id];
      if (l.id === 'C1') seg += p.nod * 0.4;
      const aUp = aLow + seg;
      const Q = U.add(P, U.mul(U.dir((aLow + aUp) / 2), l.disc));
      const top = U.add(Q, U.mul(U.dir(aUp), l.h));
      const v = { ...l, g: geom(l), base: Q, a: aUp, top, F: U.frame(Q, aUp), below: lowId };
      v.center = U.add(Q, U.mul(U.dir(aUp), l.h / 2));
      // диск под позвонком
      const Fl = U.frame(P, aLow), Fu = v.F;
      if (l.id !== 'C1') {
        sk.discs.push({ id: l.id + '-' + lowId, up: l.id, low: lowId,
          pa: Fl(dLow / 2, 0), pp: Fl(-dLow / 2, 0), ua: Fu(l.d / 2, 0), up_: Fu(-l.d / 2, 0),
          aLow, aUp, aMid: (aLow + aUp) / 2, c: U.mid(P, Q), h: l.disc, d: (l.d + dLow) / 2, lowC: P, upC: Q });
      }
      sk.verts.push(v); sk.V[l.id] = v;
      P = top; aLow = aUp; dLow = l.d; lowId = l.id;
    }
    // голова: начало — мыщелки затылочной кости над C1
    const c1 = sk.V.C1;
    const ha = c1.a + 3 + p.nod * 0.6;
    const ho = U.add(c1.top, U.mul(U.dir(ha), 0.3));
    sk.head = { o: ho, a: ha, F: U.frame(ho, ha) };
    // плечо
    const t3 = sk.V.T3;
    sk.shoulder = t3.F(t3.d / 2 + 1.6 + p.pro, 2.8);
    const aT = U.angle(hip, sk.V.T1.top); // ось туловища: руки считаются от неё
    sk.aTrunk = aT;
    const arm = (sh, el, wr) => {
      const a1 = aT + 180 + sh, a2 = a1 + el;
      const e = U.add(sk.shoulder, U.mul(U.dir(a1), LIMB.ua));
      const w = U.add(e, U.mul(U.dir(a2), LIMB.fa));
      const h = U.add(w, U.mul(U.dir(a2 + wr), LIMB.hand));
      return { s: sk.shoulder, e, w, h, a1, a2 };
    };
    sk.arm = arm(p.sh, p.el, p.wr); sk.arm2 = arm(p.sh2, p.el2, p.wr2);
    const leg = (hp, kn, an) => {
      const a1 = -90 + p.pel + hp, a2 = a1 - kn, a3 = a2 + 90 - an;
      const k = U.add(hip, U.mul(U.dir(a1), LIMB.th));
      const an_ = U.add(k, U.mul(U.dir(a2), LIMB.sh));
      const sole = U.add(an_, U.mul(U.dir(a2), 6.5));
      return { h: hip, k, a: an_, heel: U.add(sole, U.mul(U.dir(a3), -5)), toe: U.add(sole, U.mul(U.dir(a3), 19)), sole, a1, a2, a3 };
    };
    sk.leg = leg(p.hp, p.kn, p.an); sk.leg2 = leg(p.hp2, p.kn2, p.an2);
    return sk;
  }

  /* точки задних элементов позвонка в мировых координатах */
  function parts(v) {
    const F = v.F, g = v.g, d = v.d, h = v.h;
    const back = -d / 2, cb = back - g.canal; // задняя стенка тела, задняя граница канала
    const spRoot = [cb - g.lam * 0.6, h * 0.5];
    const sa = g.spA * U.RAD;
    const tip = [spRoot[0] - Math.cos(sa) * g.spL, spRoot[1] - Math.sin(sa) * g.spL];
    return { back, cb, spRoot, tip, tipW: F(tip[0], tip[1]) };
  }

  return { LEVELS, BY, ORDER_TOP, NEUTRAL, LIMB, K, build, parts, below, discId };
})();
