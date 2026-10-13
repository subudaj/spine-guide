/* Вид сзади: слева (на экране) — поверхностный слой мышц, справа — глубокий слой. */
'use strict';
const BACKV = (() => {
  const S = U.s, P = U.poly, CV = U.curve;
  const sk = SPINE.build({ y: 91.5 });
  const Y = {}; // вертикальные координаты центров позвонков стоя
  for (const v of sk.verts) Y[v.id] = v.center[1];
  const H = {}; for (const v of sk.verts) H[v.id] = v.h;
  Y.S1 = sk.s1.c[1] - 3; Y.S2 = Y.S1 - 3; Y.hip = sk.hip[1];
  const headY = sk.head.o[1];
  const crest = (Y.L4 + Y.L5) / 2 + 1.5;

  const TP = { C1: 4.0, C2: 2.6, C3: 2.6, C4: 2.7, C5: 2.8, C6: 2.9, C7: 3.4, T1: 3.6, T2: 3.4, T3: 3.2, T4: 3.0, T5: 2.9, T6: 2.8, T7: 2.7, T8: 2.6, T9: 2.5, T10: 2.4, T11: 2.1, T12: 1.8, L1: 3.0, L2: 3.6, L3: 4.1, L4: 3.8, L5: 3.6 };
  const BW = id => id[0] === 'C' ? 1.2 : id[0] === 'T' ? 1.45 + (+id.slice(1)) * 0.06 : 2.4; // полуширина тела
  const RIBW = [0, 6.5, 9, 11, 12.5, 13.5, 14, 14.3, 14.3, 14, 13.4, 11.2, 8.4];

  /* веер мышцы: начало → прикрепление, с волокнами */
  function fan(id, orig, ins, opt = {}) {
    const n = opt.n || 14;
    const o = U.resample(orig, n), i = U.resample(ins, n);
    const body = CV(o.concat(i.slice().reverse()), true, opt.k !== undefined ? opt.k : 0.35);
    let fib = '';
    for (let k = 1; k < n - 1; k++) {
      const a = o[k], b = i[k], m = U.mid(a, b);
      const bend = opt.bend ? U.add(m, opt.bend) : m;
      fib += `M${S(a)}Q${S(bend)} ${S(b)}`;
    }
    let ten = '';
    if (opt.tendonIns) { // сухожильная часть у прикрепления
      const t = opt.tendonIns;
      const a = o.map((p, k) => U.mid(i[k], p, t));
      ten = `<path class="tendon" d="${CV(a.concat(i.slice().reverse()), true, 0.3)}"/>`;
    }
    return `<g class="musg" data-m="${id}"><path class="mus ${opt.cls || ''}" d="${body}"/><path class="fib" d="${fib}"/>${ten}</g>`;
  }
  const mir = (pts, sd) => pts.map(p => [p[0] * sd, p[1]]);

  /* ---------- кости ---------- */
  function spineCol(o) {
    let s = '';
    // диски (видны по бокам тел)
    for (const dk of sk.discs) {
      const lo = dk.low === 'S1' ? null : dk.low;
      const y0 = lo ? Y[lo] + H[lo] / 2 : Y.S1 + 2.4, y1 = Y[dk.up] - H[dk.up] / 2;
      const w = BW(dk.up) + 0.25;
      const sel = o.sel && o.sel.has(dk.id);
      s += `<g class="dk${sel ? ' sel' : ''}" data-d="${dk.id}"><path class="dsc" d="${P([[-w, y0 + 0.05], [w, y0 + 0.05], [w + 0.15, (y0 + y1) / 2], [w, y1 - 0.05], [-w, y1 - 0.05], [-w - 0.15, (y0 + y1) / 2]])}"/></g>`;
    }
    for (const v of sk.verts) {
      const id = v.id, y = Y[id], h = H[id], w = BW(id), tp = TP[id];
      const sel = o.sel && o.sel.has(id);
      let g = `<g class="vt${sel ? ' sel' : ''}" data-v="${id}">`;
      g += `<path class="vb faintb" d="${P([[-w, y - h / 2], [w, y - h / 2], [w, y + h / 2], [-w, y + h / 2]])}"/>`;
      // поперечные отростки
      const ty = id[0] === 'T' ? y + h * 0.15 : y;
      g += `<path class="vp" d="${CV([[-0.6, ty + 0.45], [-tp, ty + 0.35], [-tp - 0.3, ty], [-tp, ty - 0.4], [-0.6, ty - 0.45]], false)}Z"/>`;
      g += `<path class="vp" d="${CV([[0.6, ty + 0.45], [tp, ty + 0.35], [tp + 0.3, ty], [tp, ty - 0.4], [0.6, ty - 0.45]], false)}Z"/>`;
      // дужка
      const lw = id[0] === 'L' ? 1.9 : id[0] === 'T' ? 1.5 : 1.4;
      g += `<path class="vp" d="${CV([[-lw, y + h * 0.55], [0, y + h * 0.62], [lw, y + h * 0.55], [lw * 0.8, y - h * 0.45], [0, y - h * 0.3], [-lw * 0.8, y - h * 0.45]], true, 0.5)}"/>`;
      // остистый отросток (вид сзади: идёт вниз)
      const sl = id[0] === 'T' ? (+id.slice(1) >= 3 && +id.slice(1) <= 9 ? h * 1.25 : h * 0.9) : id[0] === 'L' ? h * 0.55 : h * 0.6;
      const sw = id[0] === 'L' ? 0.75 : 0.45;
      if (id !== 'C1') g += `<path class="vp sp" d="${CV([[-sw, y + 0.1], [-sw * 0.8, y - sl], [0, y - sl - 0.35], [sw * 0.8, y - sl], [sw, y + 0.1]], true, 0.6)}"/>`;
      g += '</g>';
      s += g;
    }
    return s;
  }
  function bones(o) {
    let s = '';
    // рёбра (задние отделы)
    let r = '';
    for (let k = 1; k <= 12; k++) {
      const id = 'T' + k, y = Y[id] + H[id] * 0.15, w = RIBW[k], drop = 2.2 + k * 0.42;
      for (const sd of [-1, 1]) {
        const pts = [[TP[id] * sd, y], [(TP[id] + 2.0) * sd, y - 0.3], [w * 0.8 * sd, y - drop * 0.55], [w * sd, y - drop], [(w - (k > 10 ? 1.2 : 0.4)) * sd, y - drop - (k > 10 ? 1.2 : 3.0)]];
        r += CV(k > 10 ? pts.slice(0, 4) : pts);
      }
    }
    s += `<path class="rib" d="${r}"/>`;
    // таз и крестец
    for (const sd of [-1, 1]) {
      const il = mir([[4.0, Y.S2 - 1], [5.2, Y.L5 - 0.5], [8.5, crest + 0.4], [12.5, crest - 0.2], [14.8, crest - 3.5], [13.5, Y.hip + 3.5], [11.6, Y.hip + 1.5], [11.3, Y.hip - 2.2], [9.0, Y.hip - 4.6], [6.6, Y.hip - 7.6], [4.6, Y.hip - 7.0], [5.0, Y.hip - 3.5], [6.6, Y.hip + 1.6], [5.3, Y.S2 - 4.0]], sd);
      s += `<path class="bone" d="${CV(il, true, 0.6)}"/>`;
      // бедренная кость
      const hh = [9 * sd, Y.hip], gt = [14.0 * sd, Y.hip - 1.2];
      s += `<circle class="bone" cx="${U.f(hh[0])}" cy="${U.f(-hh[1])}" r="2.3"/>`;
      s += `<path class="bone" d="${U.capsule(hh, gt, 1.6, 2.0)}"/><path class="bone" d="${U.capsule(gt, [10.5 * sd, Y.hip - 30], 1.9, 1.5)}"/>`;
      // лопатка
      const sa = [7.0 * sd, Y.T2 + 1.2], root = [7.6 * sd, Y.T3 + 0.2], ia = [9.2 * sd, Y.T7 - 0.4], gl = [14.6 * sd, Y.T2 - 1.4], sn = [11.4 * sd, Y.T1 + 0.2];
      s += `<path class="bone scap" d="${CV([sa, root, [8.2 * sd, Y.T5], ia, [11.8 * sd, Y.T5 + 1], gl, [14.2 * sd, Y.T1 - 0.2], sn], true, 0.5)}"/>`;
      // ость лопатки и акромион
      const acr = [17.6 * sd, Y.T1 + 1.0];
      s += `<path class="spineScap" d="${CV([root, [11.5 * sd, Y.T2 + 0.6], [15.5 * sd, Y.T1 + 1.3], acr])}"/>`;
      // плечевая кость
      const hum = [16.4 * sd, Y.T2 - 0.4];
      s += `<circle class="bone" cx="${U.f(hum[0])}" cy="${U.f(-hum[1])}" r="2.5"/><path class="bone" d="${U.capsule(hum, [19.3 * sd, Y.T2 - 29], 1.4, 1.2)}"/>`;
      // ключица (вид сзади — край)
      s += `<path class="clav" d="${CV([[3.0 * sd, Y.T1 + 2.6], [10 * sd, Y.T1 + 3.2], acr])}"/>`;
    }
    // крестец и копчик
    const sc = [[-5.4, Y.S1 + 2.0], [5.4, Y.S1 + 2.0], [4.4, Y.S1 - 3.5], [2.2, Y.S1 - 8.0], [0.8, Y.S1 - 10.6], [0, Y.S1 - 13.2], [-0.8, Y.S1 - 10.6], [-2.2, Y.S1 - 8.0], [-4.4, Y.S1 - 3.5]];
    s += `<g class="vt${o.sel && o.sel.has('S1') ? ' sel' : ''}" data-v="S1"><path class="vb" d="${CV(sc, true, 0.4)}"/>`;
    for (let k = 0; k < 4; k++) { const yy = Y.S1 - k * 2.3, xx = 2.4 - k * 0.45; s += `<circle class="hole" cx="${U.f(-xx)}" cy="${U.f(-yy)}" r="0.45"/><circle class="hole" cx="${U.f(xx)}" cy="${U.f(-yy)}" r="0.45"/>`; }
    s += '</g>';
    // череп
    const hy = headY;
    s += `<path class="bone skull" d="${CV([[0, hy + 14.6], [5.4, hy + 13.4], [7.6, hy + 9.5], [7.4, hy + 4.5], [5.6, hy + 0.6], [3.4, hy - 0.6], [0, hy - 0.2], [-3.4, hy - 0.6], [-5.6, hy + 0.6], [-7.4, hy + 4.5], [-7.6, hy + 9.5], [-5.4, hy + 13.4]], true, 0.9)}"/>`;
    s += `<path class="ep" d="${CV([[-6.2, hy + 3.8], [-3, hy + 2.6], [0, hy + 3.1], [3, hy + 2.6], [6.2, hy + 3.8]])}"/>`;
    for (const sd of [-1, 1]) s += `<path class="bone" d="${CV([[4.6 * sd, hy + 0.4], [5.6 * sd, hy - 1.8], [4.8 * sd, hy - 4.6], [3.6 * sd, hy - 5.0]])}" style="fill:none"/>`;
    return s;
  }

  /* ---------- поверхностный слой (слева на экране, sd = -1) ---------- */
  function superficial() {
    const sd = -1, m = p => mir([p], sd)[0];
    let s = '';
    const hy = headY;
    // подостная и большая круглая (видны частично)
    s += fan('infra', mir([[8.2, Y.T4], [8.6, Y.T5 + 1], [9.0, Y.T6]], sd), mir([[15.6, Y.T2 - 0.5], [15.8, Y.T3], [15.6, Y.T3 - 1]], sd), { n: 8, tendonIns: 0.25 });
    s += fan('teres', mir([[9.4, Y.T7], [10.8, Y.T6 - 0.2]], sd), mir([[16.0, Y.T4 - 1], [16.2, Y.T3 - 1.2]], sd), { n: 6 });
    // наружная косая на боку
    s += fan('oblique', mir([[13.6, Y.T10], [14.4, Y.T12], [14.6, Y.L2]], sd), mir([[12.5, crest - 0.4], [13.4, crest - 1.2], [14.6, crest - 2.6]], sd), { n: 6 });
    // большая ягодичная и средняя под апоневрозом
    s += fan('gmed', mir([[8.5, crest + 0.2], [12.5, crest - 0.3], [14.6, crest - 3.2]], sd), mir([[12.6, Y.hip + 0.3], [13.6, Y.hip - 0.4], [14.4, Y.hip - 1.0]], sd), { n: 8, cls: 'apon' });
    s += fan('gmax', mir([[5.0, Y.S2 + 1.5], [5.0, Y.S1 - 5.0], [2.8, Y.S1 - 9.5], [1.2, Y.S1 - 12.6]], sd), mir([[15.6, Y.hip - 2.0], [15.4, Y.hip - 6], [14.4, Y.hip - 10], [13.0, Y.hip - 14]], sd), { n: 14, tendonIns: 0.18 });
    // широчайшая + пояснично-грудная фасция
    const latO = [[0, Y.T7], [0, Y.T9], [0, Y.T11], [0, Y.L1], [0, Y.L3], [0.6, Y.L5], [3.5, crest + 0.1], [8.5, crest + 0.3], [12.6, crest + 0.1], [14.4, Y.L1], [14.4, Y.T11]];
    const latI = [[15.0, Y.T4 + 0.6], [15.2, Y.T4 + 0.3], [15.4, Y.T4], [15.6, Y.T4 - 0.4], [15.8, Y.T4 - 0.8], [16.0, Y.T4 - 1.2], [16.2, Y.T4 - 1.5], [16.4, Y.T4 - 1.8], [16.5, Y.T4 - 2.0], [16.6, Y.T4 - 2.2], [16.6, Y.T4 - 2.4]];
    s += fan('lats', mir(latO, sd), mir(latI, sd), { n: 16, k: 0.4, tendonIns: 0.08 });
    const tlf = mir([[0, Y.T10], [0, Y.L5], [0.8, Y.S2], [4.4, Y.S2], [5.0, crest - 0.5], [8.0, crest + 0.2], [6.4, Y.L3], [4.0, Y.L1], [2.0, Y.T11]], sd);
    s += `<path class="tendon apon2" data-m="tlf" d="${CV(tlf, true, 0.5)}"/>`;
    // трапециевидная — три части
    const nuc = y => [0, y];
    const ins = { clav: [13.0, Y.T1 + 3.4], acr: [17.4, Y.T1 + 1.4], sp1: [14.0, Y.T1 + 0.9], sp2: [11.0, Y.T2 + 0.3], root: [7.8, Y.T3 + 0.2] };
    s += fan('trapU', mir([[3.4, hy + 2.6], [1.5, hy + 2.9], [0, hy + 2.8], nuc(Y.C3), nuc(Y.C5), nuc(Y.C7)], sd), mir([[5.5, hy - 3.5], [8.0, Y.C5], [11.0, Y.C7 + 1.0], ins.clav, [15.5, Y.T1 + 2.6], ins.acr], sd), { n: 14, k: 0.5 });
    s += fan('trapM', mir([nuc(Y.C7), nuc(Y.T1), nuc(Y.T2), nuc(Y.T3), nuc(Y.T4)], sd), mir([ins.acr, ins.sp1, ins.sp2, [9.2, Y.T2 - 0.1], ins.root], sd), { n: 10 });
    s += fan('trapL', mir([nuc(Y.T4), nuc(Y.T6), nuc(Y.T8), nuc(Y.T10), nuc(Y.T12)], sd), mir([ins.root, [7.9, Y.T3 - 0.1], [8.0, Y.T3 - 0.4], [8.1, Y.T3 - 0.7], [8.2, Y.T3 - 1.0]], sd), { n: 12, tendonIns: 0.15 });
    // сухожильный «ромб» трапеции у C7–T2
    s += `<path class="tendon" d="${CV(mir([[0, Y.C6], [1.6, Y.C7 - 0.2], [2.0, Y.T1 - 0.4], [1.4, Y.T2 - 0.4], [0, Y.T3]], sd), true, 0.6)}"/>`;
    // задняя дельтовидная
    s += fan('delt', mir([[9.5, Y.T2 + 0.5], [13.5, Y.T1 + 1.0], [17.6, Y.T1 + 1.2], [19.4, Y.T1 - 0.6]], sd), mir([[18.4, Y.T2 - 12], [18.6, Y.T2 - 12.6], [19.0, Y.T2 - 13], [19.6, Y.T2 - 12.6]], sd), { n: 10, tendonIns: 0.12 });
    return s;
  }

  /* ---------- глубокий слой (справа на экране, sd = +1) ---------- */
  function deep() {
    const sd = 1;
    let s = '';
    const hy = headY;
    // квадратная мышца поясницы
    s += fan('ql', mir([[3.6, Y.T12 - 0.6], [6.0, Y.T12 - 1.6], [8.4, Y.T12 - 2.0]], sd), mir([[5.2, crest], [8.0, crest + 0.4], [11.0, crest + 0.2]], sd), { n: 7 });
    // средняя ягодичная, грушевидная
    s += fan('gmed', mir([[7.0, crest + 0.4], [11.5, crest + 0.1], [14.6, crest - 3.0]], sd), mir([[12.4, Y.hip + 0.4], [13.4, Y.hip - 0.2], [14.2, Y.hip - 0.8]], sd), { n: 10, tendonIns: 0.12 });
    s += fan('piri', mir([[3.2, Y.S1 - 3.0], [3.0, Y.S1 - 5.5]], sd), mir([[13.2, Y.hip + 0.2], [13.4, Y.hip - 0.6]], sd), { n: 5, tendonIns: 0.2 });
    // надостная, подостная, большая круглая
    s += fan('supra', mir([[7.4, Y.T2 + 1.2], [8.2, Y.T3 + 0.8]], sd), mir([[15.4, Y.T1 + 0.6], [15.6, Y.T2 + 0.4]], sd), { n: 5, tendonIns: 0.2 });
    s += fan('infra', mir([[7.9, Y.T3 - 0.4], [8.5, Y.T5], [9.0, Y.T6 + 0.2]], sd), mir([[15.8, Y.T2 + 0.2], [16.0, Y.T2 - 1], [15.8, Y.T3 - 0.4]], sd), { n: 10, tendonIns: 0.2 });
    s += fan('teres', mir([[9.3, Y.T7 + 0.2], [10.6, Y.T6]], sd), mir([[16.2, Y.T4], [16.4, Y.T3 - 1]], sd), { n: 6 });
    // мышца, поднимающая лопатку
    s += fan('levator', mir([[TP.C1, Y.C1], [TP.C2 + 0.2, Y.C2], [TP.C3 + 0.2, Y.C3], [TP.C4 + 0.2, Y.C4]], sd), mir([[6.6, Y.T1 + 1.0], [6.8, Y.T1 + 0.4], [7.0, Y.T2 + 1.6], [7.1, Y.T2 + 1.2]], sd), { n: 6 });
    // ромбовидные
    s += fan('rhomb', mir([[0.4, Y.C7], [0.4, Y.T1]], sd), mir([[7.2, Y.T2 + 1.0], [7.6, Y.T3 + 0.3]], sd), { n: 5 });
    s += fan('rhomb', mir([[0.4, Y.T2], [0.4, Y.T3], [0.4, Y.T4], [0.4, Y.T5]], sd), mir([[7.7, Y.T3 - 0.4], [8.1, Y.T5], [8.6, Y.T6], [9.1, Y.T7 - 0.2]], sd), { n: 10 });
    // разгибатели: подвздошно-рёберная, длиннейшая, остистая
    const col = (id, pts, w) => {
      const inner = mir(pts.map(p => [p[0] - w(p[1]) / 2, p[1]]), sd), outer = mir(pts.map(p => [p[0] + w(p[1]) / 2, p[1]]), sd);
      let fib = ''; for (let k = 1; k < 5; k++) fib += CV(inner.map((p, j) => U.mid(p, outer[j], k / 5)));
      return `<g class="musg" data-m="${id}"><path class="mus" d="${CV(inner.concat(outer.slice().reverse()), true, 0.5)}"/><path class="fib" d="${fib}"/></g>`;
    };
    s += col('erector', [[6.4, Y.S2 + 1], [6.6, Y.L4], [6.4, Y.L1], [6.0, Y.T10], [5.6, Y.T6], [5.0, Y.T2], [4.0, Y.C6]], y => U.clamp(1.2 + (y - Y.C6) / (Y.S2 - Y.C6) * 2.4, 1.0, 3.6));
    s += col('erector', [[3.3, Y.S2 + 2], [3.4, Y.L3], [3.2, Y.T12], [2.9, Y.T6], [2.6, Y.T1], [3.0, Y.C4], [4.4, hy + 0.2]], y => U.clamp(1.0 + (y - hy) / (Y.S2 - hy) * 2.2, 1.0, 2.6));
    s += col('erector', [[1.25, Y.L1], [1.25, Y.T10], [1.2, Y.T6], [1.15, Y.T2]], () => 1.0);
    // сухожильная часть разгибателей внизу и многораздельные
    s += `<path class="tendon apon2" data-m="tlf" d="${CV(mir([[0.6, Y.L2], [4.6, Y.L2 - 0.5], [8.0, Y.L4], [7.2, crest + 0.4], [5.0, Y.S2 - 1.5], [1.0, Y.S1 - 4]], sd), true, 0.5)}"/>`;
    let mf = '';
    for (const id of ['L5', 'L4', 'L3', 'L2', 'L1', 'T12', 'T11', 'T10']) {
      const yy = Y[id];
      mf += `M${S([TP[id] * 0.75, yy - 0.2])}L${S([0.7, yy + H[id] * 2.2])}M${S([TP[id] * 0.65, yy - 0.6])}L${S([0.7, yy + H[id] * 3.2])}`;
    }
    mf += `M${S([3.0, Y.S1 - 3])}L${S([0.7, Y.L5])}M${S([2.4, Y.S1 - 5])}L${S([0.7, Y.L4])}`;
    s += `<path class="multif" data-m="multif" d="${mf}"/>`;
    // ременная мышца головы
    s += fan('splen', mir([[0.4, Y.C7], [0.4, Y.T1], [0.4, Y.T2], [0.4, Y.T3]], sd), mir([[5.6, hy + 1.4], [5.4, hy + 0.4], [5.0, hy - 0.6], [4.6, hy - 1.4]], sd), { n: 8 });
    // седалищный нерв выходит под грушевидной мышцей
    s += `<path class="sciatic" data-m="sciatic" d="${CV(mir([[4.0, Y.S1 - 6.0], [8.8, Y.hip - 2.5], [10.4, Y.hip - 9], [10.2, Y.hip - 26]], sd))}"/>`;
    return s;
  }

  function skin() {
    const hy = headY;
    const half = [[0, hy + 15.4], [6.0, hy + 14.0], [8.3, hy + 9.6], [8.0, hy + 4.2], [6.6, hy + 0.6], [5.6, Y.C4], [5.8, Y.C6], [9.0, Y.C7 + 1.2], [14.5, Y.T1 + 2.4], [18.6, Y.T1 + 1.6], [21.0, Y.T2 - 1.5], [21.4, Y.T4 - 3], [21.6, Y.T2 - 20], [21.0, Y.T2 - 29], [20.4, Y.T2 - 40], [19.6, Y.T2 - 54], [17.4, Y.T2 - 55.5], [16.6, Y.T2 - 40], [16.6, Y.T2 - 30], [16.2, Y.T6], [15.0, Y.T10], [14.2, Y.L2], [15.2, crest - 1], [17.0, Y.hip - 1], [16.8, Y.hip - 8], [15.8, Y.hip - 28], [0.8, Y.hip - 28], [0.6, Y.hip - 13]];
    const all = half.concat(mir(half, -1).reverse());
    return `<path d="${CV(all, true, 0.7)}"/>`;
  }

  function labels(box) {
    const hy = headY;
    const Lft = [['Трапециевидная: верхняя часть', [-6, Y.C7 + 1], 'trapU'], ['Трапециевидная: средняя часть', [-5, Y.T2], 'trapM'], ['Трапециевидная: нижняя часть', [-4, Y.T7], 'trapL'],
      ['Дельтовидная', [-18.6, Y.T2 - 5], 'delt'], ['Подостная', [-11.5, Y.T5], 'infra'], ['Широчайшая', [-11, Y.T11], 'lats'], ['Пояснично-грудная фасция', [-3, Y.L3], 'tlf'],
      ['Наружная косая', [-14, Y.L2], 'oblique'], ['Большая ягодичная', [-9, Y.hip - 4], 'gmax'], ['Средняя ягодичная (под фасцией)', [-11, crest - 2], 'gmed']];
    const Rgt = [['Ременная мышца головы', [3.0, Y.C6], 'splen'], ['Поднимающая лопатку', [4.6, Y.C4], 'levator'], ['Ромбовидные', [4.4, Y.T4], 'rhomb'], ['Надостная', [11, Y.T2 + 0.8], 'supra'],
      ['Лопатка', [12.2, Y.T4], null], ['Разгибатели спины (3 тяжа)', [5.8, Y.T9], 'erector'], ['Квадратная мышца поясницы', [8.6, Y.T12 - 2.3], 'ql'], ['Многораздельные', [1.8, Y.L4], 'multif'],
      ['Крестец', [1.6, Y.S1 - 6], null], ['Грушевидная', [9, Y.hip], 'piri'], ['Седалищный нерв', [10.3, Y.hip - 14], 'sciatic'], ['Остистые отростки', [0.4, Y.T9], null]];
    let s = '';
    const fs = 1.75, gap = fs * 1.4;
    const put = (arr, side) => {
      const items = arr.map(([t, p, m]) => ({ t, x: p[0], y: -p[1], m })).sort((a, b) => a.y - b.y);
      let y = box[1] + 2; for (const it of items) { it.ly = Math.max(it.y, y); y = it.ly + gap; }
      const lx = side < 0 ? box[0] + 0.5 : box[0] + box[2] - 0.5;
      for (const it of items) {
        const ex = side < 0 ? lx + it.t.length * fs * 0.52 + 0.6 : lx - it.t.length * fs * 0.52 - 0.6;
        s += `<g class="lbl"${it.m ? ` data-m="${it.m}"` : ''}><path d="M${U.f(it.x)},${U.f(it.y)}L${U.f(ex)},${U.f(it.ly - fs * 0.35)}"/><circle cx="${U.f(it.x)}" cy="${U.f(it.y)}" r="0.35"/><text x="${U.f(lx)}" y="${U.f(it.ly)}" font-size="${fs}" text-anchor="${side < 0 ? 'start' : 'end'}">${it.t}</text></g>`;
      }
    };
    put(Lft, -1); put(Rgt, 1);
    return s;
  }

  const BOX = [-26, -(headY + 17), 52, headY + 17 - (Y.hip - 27)];

  function render(o) {
    const L = o.layers;
    let s = '';
    if (L.skin) s += `<g class="skin" opacity="0.55">${skin()}</g>`;
    if (L.bones) s += `<g class="bones">${bones(o)}</g>`;
    if (L.deep) s += `<g class="muscles deep backdeep">${deep()}</g>`;
    if (L.superficial) s += `<g class="muscles superficial backsup">${superficial()}</g>`;
    if (L.bones) s += `<g class="spine">${spineCol(o)}</g>`;
    if (o.zone) s += `<ellipse class="zone" cx="0" cy="${U.f(-(Y.T7 + Y.T9) / 2)}" rx="5.5" ry="6.5" fill="url(#gZone)"/>`;
    if (L.labels && o.box) s += `<g class="labels">${labels(o.box)}</g>`;
    // подписи сторон
    s += `<text class="sideTag" x="-24" y="${U.f(-(headY + 15))}" font-size="1.7">← поверхностный слой</text><text class="sideTag" x="24" y="${U.f(-(headY + 15))}" font-size="1.7" text-anchor="end">глубокий слой →</text>`;
    return s;
  }
  return { render, BOX, Y };
})();
