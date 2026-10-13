/* Общие помощники: векторы, пути SVG, сглаживание, анимация.
   Мировые координаты — сантиметры, ось Y вверх; в SVG Y переворачивается. */
'use strict';
var U = (() => {
  const RAD = Math.PI / 180;
  const f = n => (Math.round(n * 100) / 100).toString();
  const U = {
    RAD,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    ease: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    smooth: t => t * t * (3 - 2 * t),
    dir: a => [Math.cos(a * RAD), Math.sin(a * RAD)],
    add: (p, q) => [p[0] + q[0], p[1] + q[1]],
    sub: (p, q) => [p[0] - q[0], p[1] - q[1]],
    mul: (p, k) => [p[0] * k, p[1] * k],
    mid: (p, q, t = 0.5) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t],
    len: p => Math.hypot(p[0], p[1]),
    dist: (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]),
    norm: p => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] / l, p[1] / l]; },
    rot: (p, a) => { const c = Math.cos(a * RAD), s = Math.sin(a * RAD); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; },
    angle: (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) / RAD,
    f,
    /* точка в SVG-строку (с переворотом Y) */
    s: p => f(p[0]) + ',' + f(-p[1]),
    /* локальный кадр: начало o, ось «вверх» под углом a; lx — вперёд (анатомически кпереди), ly — вверх */
    frame: (o, a) => {
      const u = U.dir(a), v = [u[1], -u[0]];
      return (lx, ly) => [o[0] + v[0] * lx + u[0] * ly, o[1] + v[1] * lx + u[1] * ly];
    },
    poly: (pts, close = true) => 'M' + pts.map(U.s).join('L') + (close ? 'Z' : ''),
    /* сглаженный путь через точки (Catmull-Rom → кривые Безье) */
    curve: (pts, close = false, k = 1) => {
      const n = pts.length;
      if (n < 2) return '';
      if (n === 2) return 'M' + U.s(pts[0]) + 'L' + U.s(pts[1]);
      const P = i => close ? pts[(i + n) % n] : pts[U.clamp(i, 0, n - 1)];
      let d = 'M' + U.s(pts[0]);
      const last = close ? n : n - 1;
      for (let i = 0; i < last; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k];
        d += 'C' + U.s(c1) + ' ' + U.s(c2) + ' ' + U.s(p2);
      }
      return d + (close ? 'Z' : '');
    },
    /* капсула (конечность) от p1 до p2 с радиусами r1, r2 */
    capsule: (p1, p2, r1, r2) => {
      const a = U.angle(p1, p2), d = U.dist(p1, p2) || 0.001;
      const da = Math.asin(U.clamp((r1 - r2) / d, -0.99, 0.99)) / RAD;
      const n1 = U.dir(a + 90 + da), n2 = U.dir(a - 90 - da);
      const A = U.add(p1, U.mul(n1, r1)), B = U.add(p2, U.mul(n1, r2));
      const C = U.add(p2, U.mul(n2, r2)), D = U.add(p1, U.mul(n2, r1));
      return 'M' + U.s(A) + 'L' + U.s(B) + 'A' + f(r2) + ',' + f(r2) + ' 0 0 0 ' + U.s(C) +
        'L' + U.s(D) + 'A' + f(r1) + ',' + f(r1) + ' 0 0 0 ' + U.s(A) + 'Z';
    },
    /* смещённая кривая: для каждой точки pts сдвиг по нормали на off[i] (влево от направления) */
    offset: (pts, off) => pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const t = U.norm(U.sub(b, a)), n = [-t[1], t[0]];
      const o = typeof off === 'function' ? off(i, pts.length) : (Array.isArray(off) ? off[i] : off);
      return [p[0] + n[0] * o, p[1] + n[1] * o];
    }),
    /* точка на ломаной по доле длины */
    along: (pts, t) => {
      let L = 0; const seg = [];
      for (let i = 1; i < pts.length; i++) { const l = U.dist(pts[i - 1], pts[i]); seg.push(l); L += l; }
      let target = U.clamp(t, 0, 1) * L;
      for (let i = 0; i < seg.length; i++) {
        if (target <= seg[i] || i === seg.length - 1) return U.mid(pts[i], pts[i + 1], seg[i] ? Math.min(1, target / seg[i]) : 0);
        target -= seg[i];
      }
      return pts[pts.length - 1];
    },
    resample: (pts, n) => Array.from({ length: n }, (_, i) => U.along(pts, i / (n - 1))),
    esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    $: (sel, root = document) => root.querySelector(sel),
    $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    h: (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; },
    /* смешивание объектов-поз */
    mix: (a, b, t) => {
      const o = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const va = a[k], vb = b[k];
        if (typeof va === 'number' && typeof vb === 'number') o[k] = va + (vb - va) * t;
        else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length) o[k] = va.map((x, i) => x + (vb[i] - x) * t);
        else if (typeof va === 'number' && vb === undefined) o[k] = va;
        else if (va === undefined && typeof vb === 'number') o[k] = vb;
        else o[k] = t < 0.5 ? (va !== undefined ? va : vb) : (vb !== undefined ? vb : va);
      }
      return o;
    },
  };
  return U;
})();
