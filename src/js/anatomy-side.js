/* Анатомический вид сбоку (срединный разрез): кости, диски, нервы, связки, мышцы, кожа. */
'use strict';
const COLORS = {
  bone: '#efe3c8', boneS: '#9c8a6a', disc: '#d3e4ee', discS: '#6f97ad', cord: '#f6dca6', cordS: '#c4923c',
  nerve: '#f3c537', nerveS: '#a77a07', lig: '#e6edf2', ligS: '#7f98ae', flav: '#efcd55', muscle: '#bb4a42',
  muscleS: '#7a2620', fiber: '#8c2c26', tendon: '#f5f2ea', tendonS: '#c9c1ae', skin: '#f2cbb2', skinS: '#b9846a',
  brain: '#eec3bd', sel: '#ff8a1f', work: '#ff3b2f', stretch: '#2f8cff', relax: '#22b07d',
};

/* общие определения (паттерны, градиенты, фильтры) — один раз на страницу */
const SVG_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <pattern id="pBone" width="0.7" height="0.7" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
    <rect width="0.7" height="0.7" fill="#f3e8cf"/>
    <circle cx="0.18" cy="0.2" r="0.11" fill="#e2d1ad"/><circle cx="0.52" cy="0.48" r="0.09" fill="#e6d6b4"/>
    <path d="M0 0.62 L0.7 0.55" stroke="#e0cda6" stroke-width="0.05"/>
  </pattern>
  <radialGradient id="gNuc" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#e9f6ff"/><stop offset="0.6" stop-color="#9fcbe9"/><stop offset="1" stop-color="#6fa6cf"/></radialGradient>
  <radialGradient id="gNucDry" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#f1ead6"/><stop offset="0.7" stop-color="#cdbf98"/><stop offset="1" stop-color="#ad9c70"/></radialGradient>
  <linearGradient id="gMuscle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9564d"/><stop offset="1" stop-color="#a53b34"/></linearGradient>
  <linearGradient id="gSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f5d4bf"/><stop offset="1" stop-color="#eec0a5"/></linearGradient>
  <radialGradient id="gZone"><stop offset="0" stop-color="#ff7a1a" stop-opacity="0.75"/><stop offset="0.55" stop-color="#ff7a1a" stop-opacity="0.28"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
  <radialGradient id="gInfl"><stop offset="0" stop-color="#ff4d2e" stop-opacity="0.65"/><stop offset="1" stop-color="#ff4d2e" stop-opacity="0"/></radialGradient>
  <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="fSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
  <marker id="mArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1d6fe0"/></marker>
  <marker id="mArrowR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e0352b"/></marker>
</defs></svg>`;

const SIDE = (() => {
  const C = COLORS;
  const P = U.poly, S = U.s, CV = U.curve;

  /* ---------- голова ---------- */
  const SKULL = [[-4.2, -0.8], [-6.6, 0.6], [-8.0, 2.6], [-8.6, 5.2], [-8.2, 8.2], [-6.6, 11.0], [-4.0, 13.0], [-0.6, 14.0], [3.0, 13.7], [6.0, 12.2], [8.1, 9.6], [9.0, 7.0], [9.3, 5.6], [8.8, 4.6], [9.6, 3.4], [10.1, 2.2], [9.2, 1.6], [9.4, 0.4], [9.0, -0.8], [8.4, -1.4], [7.6, -0.9], [6.0, -0.4], [4.0, 0.2], [2.6, 0.4], [1.2, -0.2], [-0.4, 0.4], [-2.0, 0.0]];
  const MANDIBLE = [[1.6, -0.6], [1.0, -2.6], [1.3, -4.3], [2.6, -5.4], [5.6, -6.0], [7.6, -6.6], [8.7, -6.2], [8.9, -4.6], [8.6, -2.4], [8.0, -1.9], [6.5, -2.7], [4.5, -3.6], [2.9, -3.4], [2.6, -1.0]];
  const BRAIN = [[-6.0, 2.6], [-7.0, 5.0], [-6.8, 8.0], [-5.3, 10.6], [-3.0, 12.3], [0, 13.0], [3.2, 12.6], [5.8, 11.0], [7.4, 8.6], [7.8, 6.6], [5.5, 5.6], [3.5, 4.6], [1.0, 3.8], [-1.0, 3.6], [-3.5, 2.9]];
  const CEREB = [[-6.0, 2.6], [-6.3, 1.6], [-4.8, 0.9], [-2.6, 1.0], [-1.4, 2.0], [-2.8, 2.7]];
  const HEADSKIN = [[-4.6, -1.6], [-7.4, 0.2], [-8.8, 2.6], [-9.4, 5.4], [-9.0, 8.6], [-7.2, 11.7], [-4.3, 13.8], [-0.6, 14.8], [3.2, 14.5], [6.4, 12.9], [8.7, 10.2], [9.7, 7.4], [10.1, 5.7], [9.7, 4.6], [10.6, 3.4], [12.0, 1.8], [11.6, 1.2], [10.4, 1.0], [10.6, 0.0], [10.9, -0.9], [10.3, -1.5], [10.6, -2.3], [10.0, -3.4], [9.8, -5.4], [9.0, -6.8], [7.4, -7.6], [5.6, -7.6], [3.0, -6.0], [0, -3.5]];

  /* передние отступы кожи и грудины от центра тела позвонка */
  const FRONT = { C3: 5.6, C4: 5.8, C5: 5.2, C6: 5.0, C7: 5.4, T1: 6.4, T2: 7.2, T3: 9.0, T4: 11.2, T5: 12.8, T6: 13.6, T7: 14.0, T8: 14.0, T9: 13.8, T10: 13.6, T11: 13.4, T12: 13.0, L1: 12.4, L2: 12.0, L3: 11.8, L4: 11.4, L5: 10.4 };
  const BACK = { C3: 2.8, C4: 2.6, C5: 2.4, C6: 2.1, C7: 1.5, L1: 1.6, L2: 1.8, L3: 2.0, L4: 2.0, L5: 1.9 };
  const STERN = { T2: [6.2, 1], T3: [7.9, 0.5], T4: [9.8, 0.5], T5: [11.0, 0.5], T6: [11.8, 0.5], T7: [12.3, 0.5], T8: [12.5, 0.5], T9: [12.4, 0.2] };

  function frontPt(sk, id, extra = 0) {
    const v = sk.V[id], br = sk.pose.breath || 0;
    let o = FRONT[id] + extra;
    if (/^T([5-9]|10)$/.test(id)) o += br * 0.7;
    if (/^L[1-3]$/.test(id)) o += br * 1.1;
    return v.F(o, v.h / 2);
  }
  function backPt(sk, id) {
    const v = sk.V[id], pr = SPINE.parts(v);
    const off = BACK[id] !== undefined ? BACK[id] : 1.25;
    const t = pr.tip;
    return v.F(Math.min(t[0], pr.cb - 1.0) - off, id[0] === 'C' ? v.h * 0.5 : t[1] + 0.3);
  }

  /* ---------- контуры кожи ---------- */
  function skinPaths(sk) {
    const H = sk.head.F, Fp = sk.Fp, Fs = sk.s1.F, p = sk.pose;
    const out = [];
    out.push(CV(HEADSKIN.map(q => H(q[0], q[1])), true, 0.9));
    // туловище: сзади сверху вниз, затем спереди снизу вверх
    const back = [H(-6.8, -0.6)];
    ['C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'].forEach(id => back.push(backPt(sk, id)));
    back.push(Fs(-5.4, -3.5), Fs(-4.4, -9.0), Fp(-11.2, 2.0), Fp(-11.6, -3.0), Fp(-9.8, -7.8));
    const L = sk.leg, ta = L.a1;
    const thighBack = U.add(U.add(L.h, U.mul(U.dir(ta), 13)), U.mul(U.dir(ta - 90), 7.6));
    const thighFront = U.add(U.add(L.h, U.mul(U.dir(ta), 13)), U.mul(U.dir(ta + 90), 7.6));
    back.push(thighBack);
    const front = [thighFront, Fp(7.4, -5.6), Fp(8.6, -2.0), Fp(9.6, 3.5)];
    ['L5', 'L4', 'L3', 'L2', 'L1', 'T12', 'T11', 'T10', 'T9', 'T8', 'T7', 'T6', 'T5', 'T4', 'T3', 'T2', 'T1', 'C7', 'C6', 'C5', 'C4', 'C3'].forEach(id => front.push(frontPt(sk, id)));
    front.push(H(5.6, -7.4), H(2.4, -4.0));
    out.push(CV(back.concat(front), true, 0.85));
    // ноги и руки
    for (const lg of [sk.leg2, sk.leg]) {
      out.push(U.capsule(lg.h, lg.k, 7.6, 5.0), U.capsule(lg.k, lg.a, 5.0, 3.0));
      const d = U.dir(lg.a3), up = U.dir(lg.a3 + 90);
      out.push(CV([U.add(lg.a, U.mul(d, -3.2)), U.add(lg.heel, U.mul(up, 1.2)), U.add(lg.heel, U.mul(d, 0.6)), U.add(lg.sole, U.mul(d, 8)), U.add(lg.toe, U.mul(up, 0.3)), U.add(lg.toe, U.mul(up, 2.0)), U.add(lg.sole, U.mul(up, 5.0)), U.add(lg.a, U.mul(d, 3.2))], true, 0.8));
    }
    return out;
  }
  function armSkin(a) {
    return [U.capsule(a.s, a.e, 4.6, 3.6), U.capsule(a.e, a.w, 3.6, 2.4), U.capsule(a.w, a.h, 2.6, 1.6)];
  }

  /* ---------- позвонки ---------- */
  function bodyLocal(v) {
    const d = v.d, h = v.h, r = Math.min(0.25, h * 0.12);
    if (v.id === 'C1') return null;
    const pts = [[d / 2 - r, 0], [d / 2 - 0.06 * d, h * 0.5], [d / 2 - r, h], [-d / 2 + r, h], [-d / 2, h - r], [-d / 2, r], [-d / 2 + r, 0]];
    pts.splice(1, 0, [d / 2, r]); pts.splice(3, 0, [d / 2, h - r]);
    if (v.id === 'C2') { pts.splice(4, 0, [d * 0.25, h + 0.1], [d * 0.15, h + 1.25], [-d * 0.2, h + 1.25], [-d * 0.3, h + 0.1]); }
    return pts;
  }
  function postLocal(v) {
    const g = v.g, h = v.h, pr = SPINE.parts(v);
    const sa = g.spA * U.RAD, nUp = [-Math.sin(sa), Math.cos(sa)];
    const tT = U.add(pr.tip, U.mul(nUp, g.spT / 2)), tB = U.add(pr.tip, U.mul(nUp, -g.spT / 2));
    const rT = U.add(pr.spRoot, U.mul(nUp, g.spT * 0.75)), rB = U.add(pr.spRoot, U.mul(nUp, -g.spT * 0.75));
    if (v.id === 'C1') return [[pr.cb + 0.1, h * 0.85], [pr.cb - 0.9, h * 0.75], [pr.cb - 0.9, h * 0.05], [pr.cb + 0.1, h * 0.15]];
    return [[pr.cb, h * 0.92], rT, tT, tB, rB, [pr.cb, h * 0.06]];
  }

  function renderVerts(sk, o) {
    let s = '';
    for (const v of sk.verts) {
      const F = v.F, sel = o.sel && o.sel.has(v.id);
      const body = bodyLocal(v), post = postLocal(v);
      let g = `<g class="vt${sel ? ' sel' : ''}" data-v="${v.id}">`;
      // суставной столб (проекция, позади разреза)
      const pr = SPINE.parts(v);
      g += `<path class="facet" d="${P([[pr.back - 0.15, v.h * 0.78], [pr.cb + 0.2, v.h * 1.12], [pr.cb - 0.2, v.h * 1.12], [pr.cb - 0.1, v.h * 0.15], [pr.back - 0.25, -0.15], [pr.back - 0.1, v.h * 0.25]].map(q => F(q[0], q[1])))}"/>`;
      if (body) g += `<path class="vb" d="${P(body.map(q => F(q[0], q[1])))}"/>`;
      else { // атлант: передняя и задняя дуги
        g += `<ellipse class="vb" cx="${U.f(F(v.d / 2 - 0.2, v.h / 2)[0])}" cy="${U.f(-F(v.d / 2 - 0.2, v.h / 2)[1])}" rx="0.55" ry="0.6"/>`;
      }
      g += `<path class="vp" d="${P(post.map(q => F(q[0], q[1])))}"/>`;
      // замыкательные пластинки
      if (body && v.id !== 'C2') g += `<path class="ep" d="M${S(F(-v.d / 2 + 0.1, 0.08))}L${S(F(v.d / 2 - 0.1, 0.08))}M${S(F(-v.d / 2 + 0.1, v.h - 0.08))}L${S(F(v.d / 2 - 0.1, v.h - 0.08))}"/>`;
      g += '</g>';
      s += g;
    }
    return s;
  }

  /* диск: стадия грыжи st (0..4) и направление выпячивания назад */
  function discPath(dk, st) {
    const aM = dk.aMid, n = U.dir(aM - 90); // n — вперёд
    const b = st >= 2 ? U.clamp((st - 1.6) * 0.45, 0, 0.9) : 0;
    const shrink = st >= 1 ? Math.min(1, st) * 0.12 : 0;
    const pa = dk.pa, ua = dk.ua, up_ = dk.up_, pp = dk.pp;
    const mb = U.add(U.mid(up_, pp), U.mul(n, -b));
    return { d: CV([pa, U.mid(pa, ua), ua, U.mid(ua, up_, 0.25), U.mid(up_, mb, 0.6), mb, U.mid(pp, mb, 0.6), U.mid(pp, pa, 0.75)], true, 0.6), shrink, b, n };
  }
  function renderDiscs(sk, o) {
    let s = '';
    for (const dk of sk.discs) {
      const st = (o.stage && o.stage[dk.id]) || 0, sel = o.sel && o.sel.has(dk.id);
      const dp = discPath(dk, st);
      const c = U.add(dk.c, U.mul(dp.n, -0.12 * dk.d - dp.b * 0.55));
      const rx = 0.22 * dk.d * (1 - dp.shrink) + dp.b * 0.3, ry = Math.max(0.12, 0.3 * dk.h * (1 - dp.shrink * 1.5));
      let g = `<g class="dk${sel ? ' sel' : ''}${st > 0.5 ? ' herniated' : ''}" data-d="${dk.id}"><path class="dsc" d="${dp.d}"/>`;
      g += `<ellipse cx="${U.f(c[0])}" cy="${U.f(-c[1])}" rx="${U.f(rx)}" ry="${U.f(ry)}" transform="rotate(${U.f(90 - dk.aMid)} ${U.f(c[0])} ${U.f(-c[1])})" fill="${st >= 1 ? 'url(#gNucDry)' : 'url(#gNuc)'}" class="nuc"/>`;
      if (st >= 3) { // выпавший фрагмент
        const m = U.add(U.mid(dk.up_, dk.pp), U.mul(dp.n, -(dp.b + 0.35)));
        const drift = st >= 4 ? U.mul(U.dir(dk.aMid), -(st - 3) * 1.3) : [0, 0];
        const q = U.add(m, drift);
        g += `<circle cx="${U.f(q[0])}" cy="${U.f(-q[1])}" r="${U.f(0.38 + (st - 3) * 0.05)}" fill="url(#gNucDry)" stroke="#9a8650" stroke-width="0.06"/>`;
        g += `<circle cx="${U.f(q[0])}" cy="${U.f(-q[1])}" r="1.3" fill="url(#gInfl)" class="infl"/>`;
      }
      s += g + '</g>';
    }
    return s;
  }

  /* крестец, таз, грудная клетка, конечности */
  const SACRUM = [[2.0, 0], [2.1, -2.5], [1.8, -5.0], [1.2, -7.5], [0.6, -9.8], [0.4, -11.2], [0.2, -12.4], [-0.3, -13.5], [-1.2, -13.3], [-1.0, -12.0], [-1.3, -10.8], [-2.2, -9.2], [-3.2, -6.5], [-3.8, -3.8], [-4.1, -1.2], [-3.4, 0.3], [-1.9, 0.1]];
  const ILIUM = [[5.5, 7.5], [3.5, 11.5], [-1, 13.5], [-5.5, 12.5], [-8.5, 9], [-8.8, 6.5], [-6, 3.5], [-6.5, 0], [-5, -3], [-5.2, -6.5], [-3, -7.8], [2.5, -6.5], [6.0, -5.2], [6.0, -3.5], [4.0, -2], [3, 0.5], [5.5, 4.2], [4.6, 5.5]];

  function bonesExtra(sk, o) {
    const H = sk.head.F, Fs = sk.s1.F, Fp = sk.Fp;
    let s = '';
    // таз (проекция)
    s += `<path class="bone faint" d="${CV(ILIUM.map(q => Fp(q[0] * SPINE.K, q[1] * SPINE.K)), true, 0.7)}"/>`;
    const ob = Fp(0.8, -4.3);
    s += `<ellipse cx="${U.f(ob[0])}" cy="${U.f(-ob[1])}" rx="2.2" ry="1.5" class="hole" transform="rotate(${U.f(-sk.pose.pel)} ${U.f(ob[0])} ${U.f(-ob[1])})"/>`;
    // крестец (разрез)
    s += `<g class="vt${o.sel && o.sel.has('S1') ? ' sel' : ''}" data-v="S1"><path class="vb" d="${CV(SACRUM.map(q => Fs(q[0], q[1])), true, 0.6)}"/>`;
    s += `<path class="canal" d="${CV([Fs(-1.9, 0.1), Fs(-1.8, -3), Fs(-1.6, -6), Fs(-1.2, -9.5)], false)}"/>`;
    for (const y of [-2.6, -5.0, -7.2, -9.2]) s += `<path class="ep" d="M${S(Fs(1.9 + y * 0.08, y))}L${S(Fs(-1.5 + y * 0.03, y + 0.2))}"/>`;
    s += '</g>';
    // бедро, голень, стопа, руки — кости полупрозрачно
    for (const [lg, far] of [[sk.leg2, 1], [sk.leg, 0]]) {
      s += `<g class="limbbone${far ? ' far' : ''}"><circle cx="${U.f(lg.h[0])}" cy="${U.f(-lg.h[1])}" r="2.3" class="bone"/>`;
      s += `<path class="bone" d="${U.capsule(U.add(lg.h, U.mul(U.dir(lg.a1), 3)), U.add(lg.k, U.mul(U.dir(lg.a1), -2)), 1.35, 1.6)}"/>`;
      s += `<circle cx="${U.f(lg.k[0])}" cy="${U.f(-lg.k[1])}" r="2.4" class="bone"/>`;
      const pat = U.add(lg.k, U.mul(U.dir(lg.a1 + 90), 2.9));
      s += `<ellipse cx="${U.f(pat[0])}" cy="${U.f(-pat[1])}" rx="0.9" ry="1.6" class="bone" transform="rotate(${U.f(90 - lg.a1)} ${U.f(pat[0])} ${U.f(-pat[1])})"/>`;
      s += `<path class="bone" d="${U.capsule(U.add(lg.k, U.mul(U.dir(lg.a2), 1.5)), lg.a, 1.6, 1.1)}"/>`;
      const d = U.dir(lg.a3), up = U.dir(lg.a3 + 90);
      s += `<path class="bone" d="${CV([U.add(lg.a, U.mul(up, 0.6)), U.add(lg.heel, U.mul(up, 2.0)), U.add(lg.heel, U.mul(up, 0.4)), U.add(lg.sole, U.mul(d, 4)), U.add(lg.toe, U.mul(up, 0.9)), U.add(lg.sole, U.mul(up, 2.2)), U.add(lg.a, U.mul(d, 1.4))], true, 0.7)}"/></g>`;
    }
    // грудина
    const st = []; const sb = [];
    Object.entries(STERN).forEach(([id, [x, yl]]) => { const v = sk.V[id]; st.push(v.F(x + (sk.pose.breath || 0) * 0.5, v.h * yl)); sb.push(v.F(x - 1.2 + (sk.pose.breath || 0) * 0.5, v.h * yl)); });
    // рёбра
    let ribs = '';
    for (let n = 1; n <= 12; n++) {
      const v = sk.V['T' + n], pr = SPINE.parts(v);
      const a0 = v.F(-v.d / 2 - 0.15, v.h * 0.85), ang = v.F(pr.cb - 2.6, v.h * 0.4);
      let end, cart = n <= 10;
      if (n <= 7) { const tv = sk.V['T' + (n + 1)]; end = tv.F(STERN['T' + (n + 1)] ? STERN['T' + (n + 1)][0] - 1.0 : 12, tv.h * 0.5); }
      else if (n <= 10) { const tv = sk.V[n + 2 <= 12 ? 'T' + (n + 2) : 'L' + (n + 2 - 12)]; end = tv.F(12.2 - (n - 8) * 1.4, tv.h * 0.5); }
      else { const tv = sk.V[n === 11 ? 'L1' : 'L2']; end = tv.F(n === 11 ? 6.5 : 2.6, tv.h * 0.6); }
      const dn = U.dir(v.a + 180), mid = U.add(U.mid(ang, end), U.mul(dn, 2.2 + n * 0.12));
      const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; const q = U.add(U.add(U.mul(ang, (1 - t) * (1 - t)), U.mul(mid, 2 * t * (1 - t))), U.mul(end, t * t)); pts.push(q); }
      const k = cart ? 10 : 15;
      ribs += `<path class="rib" d="${CV([a0, ...pts.slice(0, k)])}"/>`;
      if (cart) ribs += `<path class="cart" d="${CV(pts.slice(9))}"/>`;
    }
    s += `<g class="ribs">${ribs}</g>`;
    s += `<path class="bone" d="${CV(st.concat(sb.slice().reverse()), true, 0.5)}"/>`;
    // ключица и лопатка
    const sh = sk.shoulder, t3 = sk.V.T3, t2 = sk.V.T2, t7 = sk.V.T7;
    const acr = U.add(sh, U.mul(U.dir(t3.a), 2.2));
    s += `<path class="clav" d="${CV([st[0], U.mid(st[0], acr, 0.5), acr])}"/>`;
    const pr2 = SPINE.parts(t2), pr7 = SPINE.parts(t7);
    const scap = [t2.F(pr2.cb - 3.4, t2.h * 1.2), U.add(acr, U.mul(U.dir(t3.a - 90), -1.6)), U.add(sh, U.mul(U.dir(t3.a - 90), -1.4)), t7.F(pr7.cb - 1.6, t7.h * 0.6), t7.F(pr7.cb - 3.6, 0), t2.F(pr2.cb - 4.2, 0)];
    s += `<path class="bone faint scap" d="${CV(scap, true, 0.6)}"/>`;
    // череп
    s += `<path class="bone skull" d="${CV(SKULL.map(q => H(q[0], q[1])), true, 0.8)}"/>`;
    s += `<path class="bone" d="${CV(MANDIBLE.map(q => H(q[0], q[1])), true, 0.8)}"/>`;
    const orb = H(7.2, 5.2), ear = H(0.5, 2.2);
    s += `<ellipse cx="${U.f(orb[0])}" cy="${U.f(-orb[1])}" rx="1.4" ry="1.6" class="hole"/><circle cx="${U.f(ear[0])}" cy="${U.f(-ear[1])}" r="0.55" class="hole"/>`;
    // руки
    for (const [a, far] of [[sk.arm2, 1], [sk.arm, 0]]) {
      s += `<g class="limbbone${far ? ' far' : ''}"><circle cx="${U.f(a.s[0])}" cy="${U.f(-a.s[1])}" r="2.2" class="bone"/><path class="bone" d="${U.capsule(a.s, a.e, 1.2, 1.1)}"/><path class="bone" d="${U.capsule(a.e, a.w, 0.9, 0.7)}"/><path class="bone" d="${U.capsule(a.w, a.h, 1.0, 0.5)}"/></g>`;
    }
    return { s, sternTop: st[0], sternBot: st[st.length - 1], acr };
  }

  /* ---------- связки ---------- */
  function ligaments(sk, o) {
    let s = '';
    const all = [], pll = [];
    for (const v of sk.verts) {
      if (v.id === 'C1') continue;
      all.push(v.F(v.d / 2 + 0.12, 0.1), v.F(v.d / 2 + 0.12, v.h - 0.1));
      pll.push(v.F(-v.d / 2 - 0.1, 0.1), v.F(-v.d / 2 - 0.1, v.h - 0.1));
    }
    s += `<path class="lig" data-m="ALL" d="${CV(all)}"/><path class="lig" data-m="PLL" d="${CV(pll)}"/>`;
    // жёлтая связка, межостистые
    let flav = '', inter = '';
    for (let i = 1; i < sk.verts.length; i++) {
      const lo = sk.verts[i - 1], up = sk.verts[i];
      const pl = SPINE.parts(lo), pu = SPINE.parts(up);
      flav += `M${S(lo.F(pl.cb + 0.12, lo.h * 0.9))}L${S(up.F(pu.cb + 0.12, up.h * 0.08))}`;
      const qL = postLocal(lo), qU = postLocal(up);
      if (qL.length > 4 && qU.length > 4) inter += P([lo.F(...qL[1]), lo.F(...qL[2]), up.F(...qU[3]), up.F(...qU[4])]);
    }
    s += `<path class="lig inter" data-m="inters" d="${inter}"/>`;
    s += `<path class="flav" data-m="flav" d="${flav}"/>`;
    // надостистая и выйная
    const tips = sk.verts.filter(v => v.region !== 'C' || v.n === 7).map(v => SPINE.parts(v).tipW);
    s += `<path class="lig" data-m="inters" d="${CV(tips)}" style="stroke-width:.3"/>`;
    const H = sk.head.F;
    const ctips = ['C7', 'C6', 'C5', 'C4', 'C3', 'C2'].map(id => SPINE.parts(sk.V[id]).tipW);
    const nuchalBack = [backPt(sk, 'C7'), backPt(sk, 'C5'), backPt(sk, 'C3'), H(-7.4, 1.0)].map((q, i) => U.mid(q, [ctips[0], ctips[2], ctips[4], H(-7.6, 1.4)][i], 0.55));
    s += `<path class="lig nuchal" data-m="nuchal" d="${CV(ctips.concat([H(-6.0, 0.6), H(-7.9, 2.2)]).concat(nuchalBack.reverse()), true, 0.6)}"/>`;
    return s;
  }

  /* ---------- нервы ---------- */
  function nerves(sk, o) {
    const H = sk.head.F, Fs = sk.s1.F, Fp = sk.Fp;
    let s = '';
    const cc = v => { const pr = SPINE.parts(v); return v.F((pr.back + pr.cb) / 2, v.h / 2); };
    const cordPts = [H(-1.0, 3.6), H(-1.5, 1.2)];
    const ids = SPINE.ORDER_TOP;
    for (const id of ids) { cordPts.push(cc(sk.V[id])); if (id === 'L1') break; }
    const l2 = sk.V.L2, conus = l2.F((SPINE.parts(l2).back + SPINE.parts(l2).cb) / 2, l2.h * 0.9);
    cordPts.push(conus);
    // дуральный мешок
    const duraF = [], duraB = [];
    for (const id of ids) {
      const v = sk.V[id], pr = SPINE.parts(v);
      duraF.push(v.F(pr.back - 0.25, v.h / 2)); duraB.push(v.F(pr.cb + 0.25, v.h / 2));
    }
    duraF.push(Fs(-2.0, -2.0), Fs(-1.75, -4.2)); duraB.push(Fs(-2.9, -2.0), Fs(-2.0, -4.4));
    s += `<path class="dura" d="${CV(duraF.concat(duraB.reverse()), true, 0.7)}" data-m="cord"/>`;
    // конский хвост
    let cauda = '';
    for (let k = -2; k <= 2; k++) {
      const pts = [conus];
      for (const id of ['L2', 'L3', 'L4', 'L5']) { const v = sk.V[id], pr = SPINE.parts(v); pts.push(v.F((pr.back + pr.cb) / 2 + k * 0.18, v.h / 2)); }
      pts.push(Fs(-2.3 + k * 0.12, -2), Fs(-1.6 + k * 0.08, -6));
      cauda += CV(pts);
    }
    s += `<path class="cauda" data-m="cauda" d="${cauda}"/>`;
    s += `<path class="cord" data-m="cord" d="${CV(cordPts)}"/><path class="cordIn" d="${CV(cordPts)}"/>`;
    // корешки на уровне каждого диска
    let roots = '';
    for (const dk of sk.discs) {
      const up = sk.V[dk.up], pr = SPINE.parts(up);
      const F = U.frame(dk.c, dk.aMid);
      const start = F((pr.back + pr.cb) / 2, 0.3), fo = F(pr.back - 0.55, -0.15), out = F(pr.back + 0.6, -1.4);
      roots += `<path class="root" d="${CV([start, fo, out])}"/><circle class="drg" cx="${U.f(fo[0])}" cy="${U.f(-fo[1])}" r="0.32"/>`;
    }
    s += `<g data-m="root">${roots}</g>`;
    // седалищный нерв
    const L = sk.leg, ta = L.a1;
    const sc = [sk.V.L4.F(-1.6, 0), Fs(1.4, -3), Fs(1.2, -7.2), Fp(-5.6, 0.5), Fp(-4.4, -5.5)];
    for (const t of [0.3, 0.6, 0.92]) sc.push(U.add(U.add(L.h, U.mul(U.dir(ta), 43 * t)), U.mul(U.dir(ta - 90), 2.6 - t)));
    s += `<path class="sciatic" data-m="sciatic" d="${CV(sc)}"/>`;
    // плечевое сплетение
    const bp = [sk.V.C6.F(-0.6, 0), U.mid(sk.V.C7.F(-0.4, 0), sk.shoulder, 0.6), U.add(sk.shoulder, U.mul(U.dir(sk.arm.a1), 6)), U.add(sk.arm.e, U.mul(U.dir(sk.arm.a1 + 90), 0.5)), sk.arm.w];
    s += `<path class="plexus" d="${CV(bp)}"/>`;
    return s;
  }

  /* ---------- мышцы ---------- */
  function fibers(inner, outer, n, cls = 'fib') {
    let d = '';
    for (let i = 1; i < n; i++) { const t = i / n; d += CV(inner.map((p, j) => U.mid(p, outer[j], t))); }
    return `<path class="${cls}" d="${d}"/>`;
  }
  function band(inner, outer, id, extra = '') {
    return `<path class="mus ${extra}" data-m="${id}" d="${CV(inner.concat(outer.slice().reverse()), true, 0.7)}"/>`;
  }
  function deepMuscles(sk, o, bx) {
    const H = sk.head.F, Fs = sk.s1.F, Fp = sk.Fp;
    let s = '';
    // разгибатели спины
    const ids = ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
    const inner = [H(-4.0, 0.4)], outer = [H(-6.6, 0.0)];
    for (const id of ids) {
      const v = sk.V[id], pr = SPINE.parts(v);
      inner.push(v.F(pr.cb - 0.5, v.h * 0.5));
      const bp = backPt(sk, id);
      const sp = pr.tipW;
      const depth = id[0] === 'L' ? 0.75 : id[0] === 'T' ? 0.82 : 0.75;
      outer.push(U.mid(v.F(pr.cb - 0.5, v.h * 0.5), bp, depth));
    }
    inner.push(Fs(-3.7, -2.5), Fs(-3.0, -6.5)); outer.push(Fs(-4.9, -3.0), Fs(-3.8, -7.0));
    s += band(inner, outer, 'erector');
    s += fibers(inner, outer, 6);
    // сухожильная часть внизу (апоневроз)
    const ai = inner.slice(-5), ao = outer.slice(-5);
    s += `<path class="tendon" data-m="tlf" d="${CV(ao.map((p, i) => U.mid(ai[i], p, 0.55)).concat(ao.slice().reverse()), true, 0.6)}"/>`;
    // многораздельные — короткие косые пучки
    let mf = '';
    const vs = sk.verts.filter(v => v.region !== 'C');
    for (let i = 0; i < vs.length - 3; i++) {
      const lo = vs[i], up = vs[i + 3];
      const a = lo.F(SPINE.parts(lo).cb - 0.7, lo.h * 0.4), b = SPINE.parts(up).tipW;
      const b2 = U.mid(up.F(...SPINE.parts(up).spRoot), b, 0.35);
      mf += `M${S(a)}L${S(b2)}`;
    }
    const L5 = sk.V.L5, L4 = sk.V.L4;
    mf += `M${S(Fs(-3.6, -4))}L${S(U.mid(L5.F(...SPINE.parts(L5).spRoot), SPINE.parts(L5).tipW, 0.4))}M${S(Fs(-3.5, -6))}L${S(U.mid(L4.F(...SPINE.parts(L4).spRoot), SPINE.parts(L4).tipW, 0.4))}`;
    s += `<path class="multif" data-m="multif" d="${mf}"/>`;
    // глубокие сгибатели шеи
    const fi = [], fo = [];
    for (const id of ['T3', 'T2', 'T1', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2']) { const v = sk.V[id]; fi.push(v.F(v.d / 2 + 0.25, v.h / 2)); fo.push(v.F(v.d / 2 + 0.95, v.h / 2)); }
    fi.push(H(1.6, -0.6)); fo.push(H(2.4, -0.2));
    s += band(fi, fo, 'dnf'); s += fibers(fi, fo, 3);
    // диафрагма
    const br = sk.pose.breath || 0;
    const t8 = sk.V.T8, l1 = sk.V.L1, l2 = sk.V.L2;
    const dome = [bx.sternBot, t8.F(10.5, -1.0 - br * 1.2), sk.V.T9.F(7.0, 0.6 - br * 1.5), sk.V.T10.F(4.0, 0.2 - br * 1.2), sk.V.T11.F(2.6, -0.4 - br), l1.F(2.0, 0), l2.F(1.9, 0.3)];
    s += `<path class="diaph" data-m="diaph" d="${CV(dome)}"/>`;
    const ct = U.resample(dome.slice(1, 4), 6);
    s += `<path class="diaphT" d="${CV(ct)}"/>`;
    // тазовое дно
    s += `<path class="diaph" data-m="pfloor" d="${CV([Fp(5.0, -4.6), Fp(2.0, -6.6), Fp(-2.5, -6.2), Fs(-0.4, -13.2)])}"/>`;
    // большая поясничная мышца
    const ps = [sk.V.T12.F(sk.V.T12.d / 2 - 0.2, 0.5), sk.V.L2.F(sk.V.L2.d / 2 + 0.3, 1), sk.V.L4.F(sk.V.L4.d / 2 + 0.9, 1.3), Fs(3.4, -1.0), Fp(3.6, 4.0), Fp(3.2, 0.2)];
    const lt = U.add(U.add(sk.leg.h, U.mul(U.dir(sk.leg.a1), 6)), U.mul(U.dir(sk.leg.a1 - 90), 1.4));
    ps.push(lt);
    const psO = U.offset(ps, (i, n) => (i < n - 2 ? 1.9 - i * 0.2 : 0.5));
    const psI = U.offset(ps, (i, n) => -(i < n - 2 ? 0.5 : 0.3));
    s += `<g class="lateral">${band(psI, psO, 'psoas')}${fibers(psI, psO, 3)}<path class="tendon" d="${CV([ps[ps.length - 2], lt])}" style="stroke-width:.7;fill:none;stroke:${C.tendon}"/></g>`;
    return s;
  }

  function superficialMuscles(sk, o, bx) {
    const H = sk.head.F, Fs = sk.s1.F, Fp = sk.Fp;
    let s = '';
    // прямая мышца живота с сухожильными перемычками
    const rf = [], ri = [];
    for (const id of ['T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5']) {
      const v = sk.V[id];
      rf.push(frontPt(sk, id, id === 'T9' ? -1.6 : -1.1)); ri.push(frontPt(sk, id, id === 'T9' ? -2.8 : -2.3));
    }
    rf.push(Fp(8.2, 3.0), Fp(6.6, -3.6)); ri.push(Fp(7.0, 3.0), Fp(5.6, -3.6));
    s += band(ri, rf, 'rectus'); s += fibers(ri, rf, 3);
    let ti = '';
    for (const t of [0.12, 0.3, 0.5]) { const a = U.along(ri, t), b = U.along(rf, t); ti += `M${S(a)}L${S(b)}`; }
    s += `<path class="tline" d="${ti}"/>`;
    // «корсет»: поперечная и косые (проекция сбоку)
    const top = [frontPt(sk, 'T10', -3), sk.V.T11.F(7.5, 0), sk.V.T12.F(3.0, 0), sk.V.L1.F(-4.5, 0)];
    const bot = [Fp(5.6, 7.2), Fp(2.0, 12.8), Fp(-3.5, 13.0), Fp(-7.0, 11.0)];
    const corset = CV([...top, ...bot.slice().reverse()], true, 0.6);
    let hatch = '';
    for (let i = 1; i < 7; i++) { const t = i / 7; hatch += CV(top.map((p, j) => U.mid(p, bot[j], t))); }
    s += `<g class="lateral"><path class="mus corset" data-m="transv" d="${corset}"/><path class="fib" d="${hatch}"/></g>`;
    // грудино-ключично-сосцевидная
    const m1 = H(-0.6, -0.6), m2 = bx.sternTop;
    const sc1 = U.offset([m1, U.mid(m1, m2, 0.5), m2], [0.9, 1.1, 0.5]), sc2 = U.offset([m1, U.mid(m1, m2, 0.5), m2], [-0.9, -1.1, -0.5]);
    s += `<g class="lateral">${band(sc1, sc2, 'scm')}${fibers(sc1, sc2, 3)}</g>`;
    // трапециевидная (тонкий плащ на спине и плече)
    const backline = [H(-7.8, 2.4), H(-6.8, -0.4)];
    for (const id of ['C3', 'C5', 'C7', 'T2', 'T4', 'T6', 'T8', 'T10', 'T12']) backline.push(U.mid(backPt(sk, id), SPINE.parts(sk.V[id]).tipW, 0.25));
    const acr = bx.acr, root = sk.V.T3.F(SPINE.parts(sk.V.T3).cb - 3.4, sk.V.T3.h * 0.6);
    const tr = CV([...backline, root, U.add(acr, U.mul(U.dir(sk.V.T3.a - 90), -0.6)), U.add(acr, U.mul(U.dir(sk.V.T3.a), 0.8)), U.mid(H(-3, -3), acr, 0.3)], true, 0.5);
    let tf = '';
    backline.forEach((p, i) => { const tgt = i < 4 ? acr : i < 7 ? U.mid(acr, root, 0.5) : root; tf += `M${S(p)}L${S(tgt)}`; });
    s += `<g class="lateral super"><path class="mus trap" data-m="trapL" d="${tr}"/><path class="fib" d="${tf}"/></g>`;
    // широчайшая
    const latO = [sk.V.T7.F(SPINE.parts(sk.V.T7).cb - 2.2, 0), sk.V.T10.F(SPINE.parts(sk.V.T10).cb - 2.2, 0), sk.V.L2.F(SPINE.parts(sk.V.L2).cb - 2.6, 0), Fp(-6.0, 12.4)];
    const ins = U.add(sk.arm.s, U.mul(U.dir(sk.arm.a1), 5));
    const lat = CV([...latO, Fp(-1, 13.5), sk.V.T12.F(7.0, 0), sk.V.T9.F(6.0, 0), ins], true, 0.6);
    let lf = ''; latO.forEach(p => { lf += `M${S(p)}L${S(ins)}`; });
    s += `<g class="lateral super"><path class="mus lat" data-m="lats" d="${lat}"/><path class="fib" d="${lf}"/></g>`;
    // большая ягодичная
    const L = sk.leg;
    const gIns = U.add(U.add(L.h, U.mul(U.dir(L.a1), 11)), U.mul(U.dir(L.a1 - 90), 1.0));
    const gO = [Fp(-8.4, 9.6), Fs(-4.4, -2.5), Fs(-3.6, -7.0), Fs(-1.6, -12.6)];
    const gl = CV([...gO, Fp(-10.4, -6.6), U.add(U.add(L.h, U.mul(U.dir(L.a1), 14)), U.mul(U.dir(L.a1 - 90), 5.6)), gIns, Fp(-1.2, -1.2), Fp(-5.0, 6.0)], true, 0.6);
    let gf = ''; gO.forEach((p, i) => { gf += `M${S(p)}L${S(U.mid(gIns, Fp(-2.0, -1.5), 0.25 + i * 0.15))}`; });
    s += `<g class="lateral"><path class="mus" data-m="gmax" d="${gl}"/><path class="fib" d="${gf}"/></g>`;
    // задняя и передняя поверхность бедра
    const isch = Fp(-5.0, -6.6);
    const kneeB = U.add(L.k, U.mul(U.dir(L.a1 - 90), 2.6)), kneeF = U.add(L.k, U.mul(U.dir(L.a1 + 90), 2.4));
    const hm = [isch, U.add(U.mid(isch, kneeB), U.mul(U.dir(L.a1 - 90), 2.2)), kneeB];
    s += `<g class="lateral">${band(U.offset(hm, [0.6, 2.2, 0.8]), U.offset(hm, [-0.6, -1.6, -0.6]), 'hams')}`;
    const q0 = Fp(5.3, 4.0), qm = [q0, U.add(U.mid(q0, kneeF), U.mul(U.dir(L.a1 + 90), 2.4)), kneeF];
    s += band(U.offset(qm, [0.5, 2.2, 0.6]), U.offset(qm, [-0.5, -2.4, -0.6]), 'quads') + '</g>';
    return s;
  }

  /* ---------- реквизит ---------- */
  function props(sk, kind) {
    const Fp = sk.Fp;
    const feet = Math.min(sk.leg.heel[1], sk.leg.toe[1], sk.leg2.heel[1], sk.leg2.toe[1]);
    let s = '';
    const floorY = feet - 0.3;
    if (kind === 'stand' || kind === 'sit') s += `<line x1="-60" x2="80" y1="${U.f(-floorY)}" y2="${U.f(-floorY)}" class="floor"/>`;
    if (kind === 'sit') {
      const seat = Fp(-6.0, -8.8)[1] - 0.2;
      const bx = sk.hip[0];
      s += `<path class="prop" d="M${U.f(bx - 16)},${U.f(-seat)}h34v3h-34z M${U.f(bx - 14)},${U.f(-seat + 3)}v${U.f(seat - floorY)} M${U.f(bx + 14)},${U.f(-seat + 3)}v${U.f(seat - floorY)} M${U.f(bx - 17)},${U.f(-seat)}l-2.5,-36"/>`;
      s += `<path class="prop" d="M${U.f(bx + 30)},${U.f(-72)}h40v2.5h-40z M${U.f(bx + 66)},${U.f(-69.5)}v${U.f(72 - floorY - 2.5)}"/>`;
      const eye = sk.head.F(8.5, 5);
      const mh = sk.pose.screen === 'high' ? eye[1] + 2 : 74.5;
      s += `<path class="prop screen" d="M${U.f(bx + 52)},${U.f(-72)}v-3 M${U.f(bx + 48)},${U.f(-mh)}l3,-26 l2,0 l-3,26 z"/>`;
    }
    if (kind === 'bed') {
      const H = sk.head.F;
      const backs = ['L3', 'L1', 'T10', 'T8'].map(id => backPt(sk, id)[1]);
      const top = Math.min(...backs, sk.s1.F(-4.6, -5)[1]) - 0.3;
      s += `<path class="prop bed" d="M-90,${U.f(-top)}h240v14h-240z"/>`;
      const n = sk.pose.pillows || 0;
      if (n) {
        const hb = H(-9.4, 5.4), nk = backPt(sk, 'T2');
        const h = Math.max(4, hb[1] - top - 0.3), each = h / n;
        const x0 = Math.min(hb[0], nk[0]) - 16, x1 = Math.max(hb[0], nk[0]) + 8;
        for (let i = 0; i < n; i++) {
          const y = top + i * each;
          s += `<rect class="pillow" x="${U.f(x0 + i * 2)}" y="${U.f(-(y + each))}" width="${U.f(x1 - x0 - i * 4)}" height="${U.f(each)}" rx="${U.f(Math.min(4, each / 2))}"/>`;
        }
      }
    }
    return s;
  }

  /* ---------- подписи ---------- */
  function labels(sk, bx, box) {
    const H = sk.head.F, Fs = sk.s1.F, Fp = sk.Fp, V = sk.V;
    const pc = id => { const v = V[id], pr = SPINE.parts(v); return v.F((pr.back + pr.cb) / 2, v.h / 2); };
    const L = [
      ['Головной мозг', H(2, 9), null], ['Спинной мозг', pc('T4'), 'cord'], ['Конский хвост', pc('L4'), 'cauda'],
      ['Тело позвонка', V.L3.F(0.6, V.L3.h / 2), null], ['Диск: ядро и кольцо', sk.discs[1].c, null],
      ['Остистый отросток', SPINE.parts(V.T7).tipW, null], ['Жёлтая связка', V.L1.F(SPINE.parts(V.L1).cb + 0.1, V.L1.h * 0.95), 'flav'],
      ['Передняя продольная связка', V.L2.F(V.L2.d / 2 + 0.1, V.L2.h * 0.3), 'ALL'], ['Задняя продольная связка', V.T11.F(-V.T11.d / 2 - 0.1, V.T11.h * 0.5), 'PLL'],
      ['Выйная связка', U.mid(SPINE.parts(V.C4).tipW, backPt(sk, 'C4'), 0.4), 'nuchal'], ['Корешок нерва', V.L4.F(-V.L4.d / 2 - 0.4, -0.5), 'root'],
      ['Разгибатели спины', U.mid(SPINE.parts(V.L2).tipW, backPt(sk, 'L2'), 0.0), 'erector'], ['Многораздельные', V.L4.F(SPINE.parts(V.L4).cb - 1.2, V.L4.h * 1.1), 'multif'],
      ['Трапециевидная', U.mid(backPt(sk, 'T6'), SPINE.parts(V.T6).tipW, 0.2), 'trapL'], ['Лопатка', V.T5.F(SPINE.parts(V.T5).cb - 3.4, 0), null],
      ['Глубокие сгибатели шеи', V.C5.F(V.C5.d / 2 + 0.6, V.C5.h / 2), 'dnf'], ['Грудино-ключично-сосцевидная', U.mid(H(-0.6, -0.6), bx.sternTop, 0.45), 'scm'],
      ['Грудина', V.T6.F(11.2, 0), null], ['Рёбра', V.T9.F(5, -2), null], ['Диафрагма', V.T10.F(4.2, 0.3), 'diaph'], ['Прямая мышца живота', frontPt(sk, 'L2', -1.7), 'rectus'],
      ['«Корсет»: поперечная и косые', V.L1.F(4.5, -2.5), 'transv'], ['Поясничная мышца', V.L4.F(V.L4.d / 2 + 1.3, 0.8), 'psoas'],
      ['Крестец', Fs(0, -4), null], ['Тазовое дно', Fp(-0.5, -6.4), 'pfloor'], ['Большая ягодичная', Fp(-8.2, -2.5), 'gmax'], ['Седалищный нерв', U.add(sk.leg.h, U.mul(U.dir(sk.leg.a1), 22)), 'sciatic'],
    ];
    const cx = (box[0] + box[2] / 2);
    const left = [], right = [];
    for (const [t, p, m] of L) (p[0] < cx ? left : right).push({ t, x: p[0], y: -p[1], m });
    let s = '';
    const fs = 1.75, gap = fs * 1.35;
    const place = (arr, side) => {
      arr.sort((a, b) => a.y - b.y);
      let y = box[1] + 2;
      for (const it of arr) { it.ly = Math.max(it.y, y); y = it.ly + gap; }
      const over = y - (box[1] + box[3] - 1);
      if (over > 0) { for (let i = arr.length - 1, lim = box[1] + box[3] - 1 - gap; i >= 0; i--) { if (arr[i].ly > lim) arr[i].ly = lim; lim = arr[i].ly - gap; } }
      const lx = side < 0 ? box[0] + 0.6 : box[0] + box[2] - 0.6;
      for (const it of arr) {
        const ex = side < 0 ? box[0] + 0.6 + it.t.length * fs * 0.52 + 0.8 : lx - it.t.length * fs * 0.52 - 0.8;
        s += `<g class="lbl"${it.m ? ` data-m="${it.m}"` : ''}><path d="M${U.f(it.x)},${U.f(it.y)}L${U.f(ex)},${U.f(it.ly - fs * 0.35)}"/><circle cx="${U.f(it.x)}" cy="${U.f(it.y)}" r="0.35"/>`;
        s += `<text x="${U.f(lx)}" y="${U.f(it.ly)}" font-size="${fs}" text-anchor="${side < 0 ? 'start' : 'end'}">${it.t}</text></g>`;
      }
    };
    place(left, -1); place(right, 1);
    return s;
  }

  /* габариты фигуры */
  function bbox(sk) {
    const pts = [sk.head.F(0, 15), sk.head.F(12, 2), sk.head.F(-9.5, 5), sk.leg.toe, sk.leg.heel, sk.leg2.toe, sk.leg.k, sk.arm.h, sk.arm.e, sk.Fp(-12, 0), sk.Fp(9, 0), frontPt(sk, 'T7'), frontPt(sk, 'L3'), backPt(sk, 'T7'), sk.s1.F(-4, -14)];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, -p[1]); y1 = Math.max(y1, -p[1]); }
    return [x0, y0, x1 - x0, y1 - y0];
  }

  /* нагрузка: насколько согнуты шея и верхне-средний грудной отдел относительно нейтрали */
  function load(sk) {
    const p = sk.pose;
    const thor = -(p.tho * 0.75 + Math.min(0, p.tfa));
    const neck = -(p.cer + p.nod * 0.4);
    const headAng = 90 - (sk.head.a - 3); // наклон головы от вертикали (для положения сидя/стоя)
    return { thor: Math.max(0, thor), neck: Math.max(0, neck), headAng };
  }

  function render(sk, o) {
    const L = o.layers;
    const bx = bonesExtra(sk, o);
    let s = '';
    s += `<g class="props">${props(sk, o.props)}</g>`;
    if (L.skin) {
      s += `<g class="skin" opacity="${o.skinOp || 0.55}">${skinPaths(sk).map(d => `<path d="${d}"/>`).join('')}${[sk.arm2, sk.arm].map(a => armSkin(a).map(d => `<path d="${d}"/>`).join('')).join('')}</g>`;
    }
    if (L.deep) s += `<g class="muscles deep">${deepMuscles(sk, o, bx)}</g>`;
    if (L.bones) s += `<g class="bones">${bx.s}</g>`;
    if (L.bones) s += `<g class="brainG"><path class="brain" d="${CV(BRAIN.map(q => sk.head.F(q[0], q[1])), true, 0.8)}"/><path class="brain cb" d="${CV(CEREB.map(q => sk.head.F(q[0], q[1])), true, 0.8)}"/></g>`;
    if (L.nerves) s += `<g class="nerves">${nerves(sk, o)}</g>`;
    s += `<g class="discs">${renderDiscs(sk, o)}</g>`;
    s += `<g class="spine">${renderVerts(sk, o)}</g>`;
    if (L.ligs) s += `<g class="ligs">${ligaments(sk, o)}</g>`;
    if (L.superficial) s += `<g class="muscles superficial">${superficialMuscles(sk, o, bx)}</g>`;
    if (o.zone) {
      const ld = load(sk);
      const v = sk.V.T7, pr = SPINE.parts(v), c = v.F(pr.cb - 1.5, v.h);
      const k = U.clamp(0.25 + ld.thor / 25, 0.25, 1);
      s += `<ellipse class="zone" cx="${U.f(c[0])}" cy="${U.f(-c[1])}" rx="${U.f(5.5 * (0.7 + k * 0.4))}" ry="${U.f(7 * (0.7 + k * 0.4))}" transform="rotate(${U.f(90 - v.a)} ${U.f(c[0])} ${U.f(-c[1])})" fill="url(#gZone)" opacity="${U.f(k)}"/>`;
    }
    // невидимый слой касаний: позвонки и диски всегда «сверху», даже под полупрозрачными мышцами
    let hit = '';
    for (const v of sk.verts) {
      const b = bodyLocal(v), p = postLocal(v);
      hit += `<path class="hit hv" data-v="${v.id}" d="${b ? P(b.map(q => v.F(q[0], q[1]))) : ''}${P(p.map(q => v.F(q[0], q[1])))}"/>`;
    }
    for (const dk of sk.discs) hit += `<path class="hit hd" data-d="${dk.id}" d="${discPath(dk, 0).d}"/>`;
    s += `<g class="hits">${hit}</g>`;
    if (o.box && L.labels) s += `<g class="labels">${labels(sk, bx, o.box)}</g>`;
    return s;
  }

  return { render, bbox, load, frontPt, backPt, skinPaths, armSkin, STERN };
})();
