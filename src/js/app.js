/* Связка всех частей страницы. */
'use strict';
const APP = (() => {
  const $ = U.$, $$ = U.$$;
  const POST = {
    stand: { t: 'Стоя', pose: { y: 91.5 }, props: 'stand',
      txt: '<b>Нейтральная стойка.</b> Три естественных изгиба (шейный и поясничный лордоз, грудной кифоз) распределяют нагрузку, мышцы работают поочерёдно и немного.' },
    sit: { t: 'Сидя ровно', pose: { y: 54.5, pel: -2, lum: -6, hp: 92, kn: 92, sh: 32, el: 72, screen: 'high' }, props: 'sit',
      txt: '<b>Сидя с опорой на седалищные бугры</b>, экран на уровне глаз. Хорошо — но тоже ненадолго: через 30–45 минут любая поза становится статической нагрузкой.' },
    slump: { t: 'Сидя ссутулившись', pose: { y: 54.5, pel: 14, lum: -26, tho: -10, cer: -6, nod: 12, pro: 2.5, hp: 76, kn: 88, sh: 36, el: 70 }, props: 'sit',
      txt: '<b>Ссутулившись у компьютера:</b> таз откатился назад, поясница и грудной отдел согнуты, голова уехала вперёд. Вершина изгиба — как раз <b>ниже лопаток</b> (подсвечено). Мышцы-разгибатели и связки сзади натянуты без перерыва.' },
    pillows: { t: 'Полулёжа на 2 подушках', pose: { x: 0, y: 20, pel: 90, lum: -6, tho: -12, tf: 3, tfa: -12, cer: -26, nod: -10, hp: 0, kn: 5, sh: 35, el: 110, pillows: 2 }, props: 'bed',
      txt: '<b>Голова на двух подушках</b> (часто ещё и с телефоном): шея и верх груди согнуты на 30–45°, а поясница лежит ровно. Перегиб приходится на <b>средний грудной отдел</b> — вашу зону. Руки с телефоном на весу добавляют работы мышцам лопаток.' },
    lie: { t: 'Лёжа на 1 подушке', pose: { x: 0, y: 20, pel: 90, lum: -3, tho: 0, cer: -6, nod: -3, hp: 0, kn: 5, sh: 60, el: 95, pillows: 1 }, props: 'bed',
      txt: '<b>Лучше:</b> одна невысокая подушка под голову и шею, телефон или книгу поднимите к глазам (локти на подушке). И всё равно — меняйте позу каждые 20–30 минут.' },
  };
  const st = {
    sel: new Set(['T7', 'T8']), last: 'T8', view: 'side', post: 'slump', pose: null, layers: { skin: 1, deep: 1, superficial: 1, bones: 1, nerves: 1, ligs: 1, labels: innerWidth >= 900 ? 1 : 0 },
    zone: true, stage: 2.6, dir: 'paracentral', hDisc: 'L4-L5', showOnMap: true, zoom: 1, center: null, box: null,
  };
  const EXFOR = {
    trapL: ['ytw', 'angel', 'micro'], trapM: ['row', 'ytw'], rhomb: ['row', 'ytw'], trapU: ['breath', 'chin'], levator: ['breath', 'chin'], erector: ['birddog', 'catcamel', 'micro'],
    multif: ['birddog'], dnf: ['chin', 'micro'], scm: ['chin', 'breath'], splen: ['chin'], rectus: ['curlup'], transv: ['curlup', 'breath'], oblique: ['sideplank', 'curlup'], diaph: ['breath'],
    pfloor: ['breath'], ql: ['sideplank'], gmax: ['bridge', 'hinge'], gmed: ['sideplank'], hams: ['hinge', 'nerve'], psoas: ['mckenzie'], pec: ['openbook', 'thext'], serr: ['angel'],
    lats: ['row'], sciatic: ['nerve'], root: ['mckenzie', 'nerve'], cauda: ['mckenzie'], cord: ['chin'], PLL: ['mckenzie', 'hinge'], annulus: ['hinge', 'birddog'], nucleus: ['mckenzie', 'hinge'],
    flav: ['catcamel'], inters: ['micro', 'thext'], nuchal: ['chin'], tlf: ['birddog', 'sideplank'], infra: ['ytw'], teres: ['row'], delt: ['angel'], supra: ['angel'], piri: ['bridge'], quads: ['walk'],
  };

  /* ---------- карта ---------- */
  const anat = () => $('#anat svg');
  function sideBox(sk) {
    // кадр «голова — таз»: позвоночник крупно, ноги частично
    const H = sk.head.F, Fp = sk.Fp;
    const pts = [H(0, 15.2), H(12.4, 2), H(-9.8, 5), H(9.5, -7.5), SIDE.frontPt(sk, 'T7'), SIDE.frontPt(sk, 'L3'), SIDE.backPt(sk, 'T7'), SIDE.backPt(sk, 'L3'), sk.s1.F(-5.5, -4), Fp(-12, -6), Fp(9, -6), Fp(-6, -10)];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, -p[1]); y1 = Math.max(y1, -p[1]); }
    const b = [x0, y0, x1 - x0, y1 - y0];
    const lab = labelsOn() ? 30 : 5;
    const box = [b[0] - lab, b[1] - 4, b[2] + lab * 2, b[3] + 8];
    const ar = box[2] > box[3] * 1.2 ? 1.5 : 0.85; // ширина/высота
    if (box[2] / box[3] < ar) { const nw = box[3] * ar; box[0] -= (nw - box[2]) / 2; box[2] = nw; }
    else { const nh = box[2] / ar; box[1] -= (nh - box[3]) / 2; box[3] = nh; }
    return box;
  }
  function labelsOn() { return !!st.layers.labels && !(st.view === 'side' && POST[st.post].props === 'bed'); }
  function backBox() {
    const B = BACKV.BOX, lab = st.layers.labels ? 26 : 2;
    return [B[0] - lab, B[1], B[2] + lab * 2, B[3]];
  }
  function viewBox(box) {
    if (st.zoom <= 1.001) return box;
    const c = st.center || [box[0] + box[2] / 2, box[1] + box[3] / 2];
    const w = box[2] / st.zoom, h = box[3] / st.zoom;
    return [c[0] - w / 2, c[1] - h / 2, w, h];
  }
  function drawAnat() {
    const svg = anat();
    const stage = {};
    if (st.showOnMap && st.stage > 0) stage[st.hDisc] = st.stage;
    let html, box;
    if (st.view === 'side') {
      const sk = SPINE.build(st.pose);
      box = st.boxOverride || sideBox(sk);
      html = SIDE.render(sk, { layers: Object.assign({}, st.layers, { labels: labelsOn() }), sel: st.sel, stage, props: POST[st.post].props, zone: st.zone, box });
    } else {
      box = backBox();
      html = BACKV.render({ layers: st.layers, sel: st.sel, zone: st.zone, box });
    }
    st.box = box;
    svg.setAttribute('viewBox', viewBox(box).map(v => v.toFixed(2)).join(' '));
    svg.innerHTML = html;
    $('#anat').classList.toggle('zoomed', st.zoom > 1.001);
  }
  let anim = null;
  function setPosture(key, instant) {
    const near = Object.fromEntries(Object.entries(SPINE.NEUTRAL).filter(([k]) => !/2$/.test(k)));
    const from = st.pose || POST[key].pose, to = Object.assign({}, near, POST[key].pose);
    const fromBox = st.box;
    st.post = key;
    $$('#postures button').forEach(b => b.classList.toggle('on', b.dataset.p === key));
    $('#postureTxt').innerHTML = POST[key].txt + loadText(to);
    if (instant || !fromBox || st.view !== 'side') { st.pose = to; st.boxOverride = null; drawAnat(); return; }
    const toBox = sideBox(SPINE.build(to));
    const fromPose = Object.assign({}, near, from);
    const t0 = performance.now(), D = 900;
    cancelAnimationFrame(anim);
    const step = now => {
      const k = U.ease(Math.min(1, (now - t0) / D));
      st.pose = U.mix(fromPose, to, k);
      st.boxOverride = fromBox.map((v, i) => U.lerp(v, toBox[i], k));
      drawAnat();
      if (k < 1) anim = requestAnimationFrame(step); else { st.boxOverride = null; st.pose = to; drawAnat(); }
    };
    anim = requestAnimationFrame(step);
  }
  function loadText(pose) {
    const sk = SPINE.build(pose), L = SIDE.load(sk);
    if (pose.pel >= 60) {
      return `<div class="stat"><div><b>${Math.round(L.neck)}°</b>дополнительное сгибание шеи</div><div><b>${Math.round(L.thor)}°</b>дополнительное сгибание груди</div></div>`;
    }
    const a = U.clamp(L.headAng, 0, 60);
    const tbl = [[0, 5], [15, 12], [30, 18], [45, 22], [60, 27]];
    let kg = 5; for (let i = 1; i < tbl.length; i++) if (a <= tbl[i][0]) { const [x0, y0] = tbl[i - 1], [x1, y1] = tbl[i]; kg = y0 + (y1 - y0) * (a - x0) / (x1 - x0); break; }
    return `<div class="stat"><div><b>≈${Math.round(kg)} кг</b>нагрузка на шею (модель Hansraj)</div><div><b>${Math.round(L.thor)}°</b>дополнительное сгибание груди</div></div>`;
  }

  function nameOf(el) {
    if (!el) return '';
    if (el.dataset.v) return el.dataset.v === 'S1' ? 'Крестец' : 'Позвонок ' + el.dataset.v;
    if (el.dataset.d) return 'Диск ' + el.dataset.d.replace('-', '–');
    if (el.dataset.m && DATA.MUSCLES[el.dataset.m]) return DATA.MUSCLES[el.dataset.m].n;
    return '';
  }
  function hit(e) { return e.target.closest('[data-v],[data-d],[data-m]'); }

  function toggleSel(id) {
    const nm = id === 'S1' ? 'крестец' : (id.includes('-') ? 'диск ' : 'позвонок ') + id.replace('-', '–');
    if (st.sel.has(id)) { st.sel.delete(id); if (st.last === id) st.last = [...st.sel].pop() || null; toast(`Выбор снят: ${nm}`); }
    else { st.sel.add(id); st.last = id; toast(`Выбран ${nm}`, narrow() ? ['Описание ↓', toInfo] : null); }
    if (id.includes('-') && st.sel.has(id)) setHernia(id, true);
    afterSel();
  }
  function afterSel() {
    drawAnat(); renderChips(); renderInfo();
    if (window._prog) window._prog.setZones(st.sel);
  }
  function renderChips() {
    const ids = [...st.sel];
    $$('#levels [data-x2]').forEach(b => b.classList.toggle('on', st.sel.has(b.dataset.x2)));
    $('#selList').innerHTML = ids.length ? ids.map(id => `<button class="chip on" data-x="${id}">${id.replace('-', '–')} ✕</button>`).join('') : '<span class="hint">Ничего не выбрано — коснитесь позвонка или диска на рисунке.</span>';
  }
  function renderInfo(muscle) {
    const box = $('#info');
    let h = '';
    if (muscle) {
      const m = DATA.MUSCLES[muscle];
      h += `<h3>${m.n}</h3><p class="hint"><i>${m.l}</i></p><p>${m.t}</p>`;
      const ex = (EXFOR[muscle] || []).filter(id => EX.BY[id]);
      if (ex.length) h += `<p><b>Упражнения:</b></p><div class="selbar">${ex.map(id => `<button class="chip" data-go="${id}">▶ ${EX.BY[id].title}</button>`).join('')}</div>`;
      box.innerHTML = h; return;
    }
    const id = st.last;
    if (!id) { box.innerHTML = '<h3>Выберите позвонок или диск</h3><p>Коснитесь позвонка на рисунке или выберите его в строке ниже. Можно выбрать несколько соседних. Коснитесь мышцы или связки — появится её описание.</p>'; return; }
    if (id.includes('-')) {
      const d = DATA.discInfo(id);
      h += `<h3>${d.title.replace('-', '–')}</h3>${d.html}`;
      h += `<div class="selbar"><button class="btn small" data-act="hernia">Как выглядит грыжа здесь →</button><button class="btn small ghost" data-act="prog">Подобрать упражнения →</button></div>`;
    } else {
      const v = DATA.vertInfo(id);
      h += `<h3>${v.title}</h3>${v.html}`;
      if (id !== 'S1') {
        const dId = SPINE.discId(id);
        if (id !== 'C1') h += `<p>Диск под позвонком: <button class="chip" data-pick="${dId}">${dId.replace('-', '–')}</button></p>`;
      }
      h += `<div class="selbar"><button class="btn small" data-act="prog">Подобрать упражнения для выбранного →</button></div>`;
    }
    box.innerHTML = h;
  }

  function initMap() {
    const fig = $('#anat');
    const tip = $('#tip');
    fig.addEventListener('pointermove', e => {
      const el = hit(e), n = nameOf(el);
      if (!n || e.pointerType === 'touch') { tip.style.opacity = 0; return; }
      const r = fig.getBoundingClientRect();
      tip.textContent = n; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.style.opacity = 1;
    });
    fig.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
    let drag = null;
    fig.addEventListener('pointerdown', e => { if (st.zoom > 1.001 && !e.target.closest('.zoomer')) { drag = { x: e.clientX, y: e.clientY, c: (st.center || [st.box[0] + st.box[2] / 2, st.box[1] + st.box[3] / 2]).slice(), moved: false }; } });
    fig.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = fig.getBoundingClientRect(), k = (st.box[2] / st.zoom) / r.width;
      const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) drag.moved = true;
      st.center = [drag.c[0] - dx, drag.c[1] - dy]; anat().setAttribute('viewBox', viewBox(st.box).join(' '));
    });
    window.addEventListener('pointerup', () => { setTimeout(() => { drag = null; }, 0); });
    fig.addEventListener('click', e => {
      if (drag && drag.moved) return;
      if (e.target.closest('.zoomer')) return;
      const el = hit(e); if (!el) return;
      if (el.dataset.v) toggleSel(el.dataset.v);
      else if (el.dataset.d) toggleSel(el.dataset.d);
      else if (el.dataset.m && DATA.MUSCLES[el.dataset.m]) { renderInfo(el.dataset.m); flash(el); toast(DATA.MUSCLES[el.dataset.m].n, narrow() ? ['Описание ↓', toInfo] : null); }
    });
    fig.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e); }, { passive: false });
    $('#zin').onclick = () => zoomAt(1.4); $('#zout').onclick = () => zoomAt(1 / 1.4); $('#zreset').onclick = () => { st.zoom = 1; st.center = null; drawAnat(); toast('Весь рисунок'); };
    $('#zspine').onclick = () => { // приблизить к выбранному позвонку
      const id = st.last && !st.last.includes('-') ? st.last : (st.last ? st.last.split('-')[0] : 'T7');
      const el = anat().querySelector(`[data-v="${id}"]`) || anat().querySelector(`[data-d="${st.last}"]`);
      if (!st.last) { toast('Сначала выберите позвонок или диск на рисунке'); return; }
      if (el) { const b = el.getBBox(); st.center = [b.x + b.width / 2, b.y + b.height / 2]; st.zoom = 3.2; drawAnat(); toast('Крупно: ' + st.last.replace('-', '–') + '. Рисунок можно двигать, ⟲ — вернуть'); }
    };
    $('#views').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; setView(b.dataset.v); drawAnat(); toast(st.view === 'side' ? 'Вид сбоку: разрез по середине тела' : 'Вид сзади: слева поверхностные мышцы, справа глубокие'); });
    $('#postures').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.zoom = 1; st.center = null; setPosture(b.dataset.p); if (b.dataset.p !== 'stand') toast('Поза: ' + POST[b.dataset.p].t + '. Пояснение — под рисунком' + (narrow() ? ' ↓' : ' справа')); });
    $('#layers').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const k = b.dataset.l;
      if (k === 'zone') st.zone = !st.zone; else st.layers[k] = st.layers[k] ? 0 : 1;
      const on = k === 'zone' ? st.zone : !!st.layers[k];
      b.classList.toggle('on', on);
      drawAnat();
      if (k === 'labels' && on && !labelsOn()) toast('В позах лёжа подписи не помещаются — касайтесь деталей рисунка или выберите позу «Стоя»');
      else toast((on ? 'Показано: ' : 'Скрыто: ') + b.textContent.trim().toLowerCase());
    });
    $$('#layers button').forEach(b => b.classList.toggle('on', b.dataset.l === 'zone' ? st.zone : !!st.layers[b.dataset.l]));
    // строка выбора уровней
    $('#levels').innerHTML = SPINE.ORDER_TOP.concat(['S1']).map(id => `<button class="chip" data-x2="${id}">${id === 'S1' ? 'крестец' : id}</button>`).join('');
    document.addEventListener('click', e => {
      const x = e.target.closest('[data-x]'); if (x) { toggleSel(x.dataset.x); return; }
      const x2 = e.target.closest('[data-x2]'); if (x2) { toggleSel(x2.dataset.x2); return; }
      const pk = e.target.closest('[data-pick]'); if (pk) { if (!st.sel.has(pk.dataset.pick)) toggleSel(pk.dataset.pick); else { st.last = pk.dataset.pick; renderInfo(); } return; }
      if (e.target.closest('a')) return; // обычные ссылки (YouTube, источники)
      const go = e.target.closest('[data-go]'); if (go) { EXUI.focus(go.dataset.go); return; }
      const pb = e.target.closest('[data-post]');
      if (pb) { setView('side'); setPosture(pb.dataset.post); drawAnat(); $('#map').scrollIntoView({ behavior: 'smooth' }); toast('Поза: ' + POST[pb.dataset.post].t); return; }
      const a = e.target.closest('[data-act]'); if (!a || a.closest('.ex')) return;
      if (a.dataset.act === 'hernia') { setHernia(st.last); $('#hernia').scrollIntoView({ behavior: 'smooth' }); }
      if (a.dataset.act === 'prog') { window._prog.setZones(st.sel); $('#program').scrollIntoView({ behavior: 'smooth' }); }
      if (a.dataset.act === 'clear') { st.sel.clear(); st.last = null; afterSel(); toast('Выбор очищен'); }
      if (a.dataset.act === 'mine') { st.sel = new Set(['T7', 'T8', 'T7-T8']); st.last = 'T8'; setView('side'); setPosture('pillows'); afterSel(); $('#anat').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Выбраны T7, T8 и диск между ними. Поза — на 2 подушках: оранжевым подсвечена зона перегрузки'); }
    });
  }
  function zoomAt(k, e) {
    const z = U.clamp(st.zoom * k, 1, 6);
    if (e && st.box) {
      const r = anat().getBoundingClientRect(), vb = viewBox(st.box);
      const px = vb[0] + (e.clientX - r.left) / r.width * vb[2], py = vb[1] + (e.clientY - r.top) / r.height * vb[3];
      const c = st.center || [st.box[0] + st.box[2] / 2, st.box[1] + st.box[3] / 2];
      st.center = [px + (c[0] - px) * st.zoom / z, py + (c[1] - py) * st.zoom / z];
    }
    st.zoom = z; if (z <= 1.001) st.center = null;
    drawAnat();
  }
  let toastT = null;
  function toast(msg, action) { // action: [текст кнопки, функция]
    const t = $('#toast'); if (!t) return;
    t.innerHTML = `<span>${msg}</span>` + (action ? `<button class="btn small">${action[0]}</button>` : '');
    if (action) t.querySelector('button').onclick = () => { action[1](); t.classList.remove('show'); };
    t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), action ? 4500 : 2600);
  }
  const narrow = () => innerWidth < 900;
  const toInfo = () => $('#info').scrollIntoView({ behavior: 'smooth', block: 'start' });
  function setView(v) {
    st.view = v; st.zoom = 1; st.center = null;
    $$('#views button').forEach(x => x.classList.toggle('on', x.dataset.v === v));
    $('#postBar').style.display = v === 'side' ? '' : 'none';
    $('#postureTxt').parentElement.style.display = v === 'side' ? '' : 'none';
  }
  function flash(el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2800); }

  /* ---------- грыжа ---------- */
  function setHernia(id, quiet) {
    if (!id) return;
    if (!id.includes('-')) id = id === 'S1' ? 'L5-S1' : id === 'C1' ? 'C2-C3' : SPINE.discId(id);
    st.hDisc = id; $('#hLevel').value = id;
    if (!quiet && st.stage < 0.5) st.stage = 3;
    drawHernia(); if (!quiet) drawAnat();
  }
  function drawHernia() {
    const id = st.hDisc, reg = id[0] === 'S' ? 'L' : id[0];
    const ax = HERNIA.axial(reg, st.stage, st.dir), sg = HERNIA.sagittal(reg, st.stage, st.dir);
    $('#hAx').setAttribute('viewBox', ax.view.join(' ')); $('#hAx').innerHTML = ax.svg;
    $('#hSg').setAttribute('viewBox', sg.view.join(' ')); $('#hSg').innerHTML = sg.svg;
    const si = Math.round(st.stage);
    $('#hStage').value = st.stage;
    $$('#hTicks span').forEach((s, i) => s.classList.toggle('on', i === si));
    const S = DATA.STAGES[si];
    const d = DATA.discInfo(id);
    const rootNote = reg === 'L' ? (st.dir === 'paracentral' ? `Заднебоковая грыжа ${id.replace('-', '–')} обычно задевает <b>проходящий</b> корешок нижнего позвонка${DATA.ROOT[id] ? ' (' + DATA.ROOT[id][0] + ')' : ''}.` : st.dir === 'foraminal' ? 'Фораминальная (боковая) грыжа задевает <b>выходящий</b> корешок верхнего позвонка — он проходит в отверстии над диском.' : 'Центральная грыжа давит на дуральный мешок с «конским хвостом»; большая центральная грыжа — риск синдрома конского хвоста.')
      : reg === 'T' ? (st.dir === 'foraminal' ? 'Боковая грыжа в грудном отделе раздражает межрёберный нерв — боль опоясывает по ходу ребра.' : 'В грудном отделе канал узкий, а в нём — <b>спинной мозг</b>. Центральная грыжа здесь опаснее: следите за признаками сдавления мозга.')
        : (st.dir === 'central' ? 'Центральная шейная грыжа может давить на <b>спинной мозг</b> (миелопатия): неуклюжесть рук, шаткая походка — повод срочно к неврологу.' : 'Шейная грыжа чаще задевает корешок в отверстии — боль и онемение уходят в руку.');
    $('#hText').innerHTML = `<h3>${S.k}: ${S.short}</h3>${S.html}<p>${rootNote}</p><details><summary><b>Об уровне ${id.replace('-', '–')}</b></summary>${d.html}</details>`;
    if (st.showOnMap) drawAnat();
  }
  let hAnim = null;
  function initHernia() {
    const discs = SPINE.LEVELS.filter(l => l.id !== 'C1').slice().reverse().map(l => SPINE.discId(l.id));
    $('#hLevel').innerHTML = discs.map(d => `<option value="${d}">${d.replace('-', '–')}</option>`).join('');
    $('#hLevel').value = st.hDisc;
    $('#hLevel').onchange = e => { st.hDisc = e.target.value; drawHernia(); };
    $('#hStage').oninput = e => { st.stage = +e.target.value; cancelAnimationFrame(hAnim); $('#hPlay').textContent = '▶ проиграть'; drawHernia(); };
    $('#hTicks').onclick = e => { const s = e.target.closest('span'); if (!s) return; animateStage(+s.dataset.s); };
    $('#hDir').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.dir = b.dataset.d; $$('#hDir button').forEach(x => x.classList.toggle('on', x === b)); drawHernia(); };
    $('#hPlay').onclick = () => {
      if (hAnim) { cancelAnimationFrame(hAnim); hAnim = null; $('#hPlay').textContent = '▶ проиграть'; return; }
      st.stage = 0; $('#hPlay').textContent = '⏸ стоп';
      let t0 = performance.now();
      const step = now => { st.stage = Math.min(4, (now - t0) / 2500); drawHernia(); if (st.stage < 4) hAnim = requestAnimationFrame(step); else { hAnim = null; $('#hPlay').textContent = '▶ проиграть'; } };
      hAnim = requestAnimationFrame(step);
    };
    $('#hMap').onchange = e => {
      st.showOnMap = e.target.checked; drawAnat();
      toast(st.showOnMap ? `Диск ${st.hDisc.replace('-', '–')} с этой стадией показан на карте (вид сбоку)` : 'Грыжа на карте скрыта', st.showOnMap ? ['К карте ↑', () => { setView('side'); drawAnat(); $('#anat').scrollIntoView({ behavior: 'smooth', block: 'center' }); }] : null);
    };
    drawHernia();
  }
  function animateStage(to) {
    cancelAnimationFrame(hAnim);
    const from = st.stage, t0 = performance.now();
    const step = now => { const k = U.ease(Math.min(1, (now - t0) / 700)); st.stage = U.lerp(from, to, k); drawHernia(); if (k < 1) hAnim = requestAnimationFrame(step); else hAnim = null; };
    hAnim = requestAnimationFrame(step);
  }

  /* ---------- нагрузка на шею: диаграмма ---------- */
  function bars() {
    const data = [[0, 5], [15, 12], [30, 18], [45, 22], [60, 27]];
    const W = 520, H = 200, bw = 70;
    let s = `<svg class="bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Нагрузка на шею при наклоне головы">`;
    data.forEach(([a, kg], i) => {
      const x = 40 + i * 95, h = kg * 5.2, y = H - 40 - h;
      s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="6" fill="${i === 0 ? '#9cc3f0' : i < 3 ? '#ffb36b' : '#ff7a4d'}"/>`;
      s += `<text x="${x + bw / 2}" y="${y - 7}" text-anchor="middle" font-size="16" font-weight="700" fill="#18202b" class="bv">${kg} кг</text>`;
      s += `<text x="${x + bw / 2}" y="${H - 18}" text-anchor="middle" font-size="14" fill="#4a5566" class="bl">${a}°</text>`;
    });
    s += `<text x="${W / 2}" y="${H - 1}" text-anchor="middle" font-size="12" fill="#4a5566" class="bl">наклон головы вперёд</text></svg>`;
    return s;
  }

  /* ---------- три зоны ---------- */
  function zItem(id, kind) {
    const ex = EX.BY[id]; if (!ex) return '';
    const st0 = EXUI.still(ex, ex.frames.length > 2 ? 2 : 1);
    const yt = ex.yt ? `<a class="zyt" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.yt[0])}" target="_blank" rel="noopener" title="Поиск видео">▶ YouTube</a>` : '';
    return `<div class="item" data-go="${id}"><svg viewBox="${(st0.vb || [-60, -100, 160, 100]).join(' ')}">${st0.svg}</svg><div><div class="t">${ex.title}</div><div class="d">${kind === 'r' ? ex.dose.main : ex.dose.main}</div>${yt}</div></div>`;
  }
  function renderZones() {
    $('#zDaily').innerHTML = `<h3>⭐ Универсальный минимум на каждый день — для всех трёх зон</h3><p class="hint">Если делать только это — уже большая часть пользы. Микропауза и прогиб стоя — каждые 30–45 минут сидения; остальное — один раз в день (~15 минут) и прогулка.</p><div class="items">${DATA.DAILY.map(id => zItem(id, 'r')).join('')}</div>`;
    $('#zList').innerHTML = DATA.ZONES.map((z, i) => `<article class="card zone-card" id="zone-${z.id}">
      <div class="zhead"><span class="znum">${i + 1}</span><div><h3>${z.t}</h3><div class="hint">${z.lv}</div></div></div>
      <button class="btn small" data-zone="${z.id}">Показать на карте</button>
      <p>${z.why}</p>
      <p><b>Мышцы и ткани этой зоны</b> <span class="hint">(нажмите — описание на карте)</span>:</p>
      <div class="selbar">${z.muscles.map(m => `<button class="chip" data-mus="${m}">${DATA.MUSCLES[m].n}</button>`).join('')}</div>
      <h4>🧊 Разгрузить</h4><div class="items">${z.relief.map(id => zItem(id, 'r')).join('')}</div>
      <h4>💪 Укрепить</h4><div class="items">${z.strength.map(id => zItem(id, 's')).join('')}</div>
    </article>`).join('');
    $('#zones').addEventListener('click', e => {
      if (e.target.closest('a')) return; // ссылка YouTube
      const zb = e.target.closest('[data-zone]');
      if (zb) {
        const z = DATA.ZONES.find(x => x.id === zb.dataset.zone);
        st.sel = new Set(z.sel); st.last = z.sel[z.sel.length - 1]; setView('side'); setPosture(z.post); afterSel();
        $('#anat').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(`${z.t}: выбраны ${z.sel.slice(0, 2).join(' и ')}`); return;
      }
      const mb = e.target.closest('[data-mus]');
      if (mb) { renderInfo(mb.dataset.mus); $('#info').scrollIntoView({ behavior: 'smooth', block: 'start' }); toast(DATA.MUSCLES[mb.dataset.mus].n); }
    });
  }
  function exCount() {
    const all = $$('#exList .ex'), vis = all.filter(e => e.style.display !== 'none');
    $('#exCount').textContent = `Показано упражнений: ${vis.length} из ${all.length}`;
  }
  function init() {
    document.body.insertAdjacentHTML('afterbegin', SVG_DEFS);
    $('#bars').innerHTML = bars();
    $('#redList').innerHTML = DATA.RED_FLAGS.map(r => `<li><b>${r.t}.</b> ${r.a}</li>`).join('');
    $('#srcList').innerHTML = Object.values(DATA.SOURCES).map(s => `<li><a href="${s.u}" target="_blank" rel="noopener">${s.t}</a></li>`).join('');
    initMap();
    setPosture(st.post, true);
    renderChips(); renderInfo();
    initHernia();
    EXUI.mount($('#exList'));
    $('#exFilter').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#exFilter button').forEach(x => x.classList.toggle('on', x === b));
      EXUI.filter($('#exList'), b.dataset.r || '', b.dataset.g || '');
      exCount();
    });
    exCount();
    renderZones();
    const tb = $('#themeBtn');
    const paint = () => { const d = document.documentElement.dataset.theme === 'dark'; tb.textContent = d ? '☀️' : '🌙'; tb.title = d ? 'Светлая тема' : 'Тёмная тема'; };
    tb.onclick = () => { const d = document.documentElement.dataset.theme === 'dark'; document.documentElement.dataset.theme = d ? 'light' : 'dark'; try { localStorage.setItem('spine-theme', d ? 'light' : 'dark'); } catch (e) { } paint(); toast(d ? 'Светлая тема' : 'Тёмная тема'); };
    paint();
    window._prog = PROG.mount($('#pform-root'), $('#plan'));
    window._prog.setZones(st.sel);
    $('#print').onclick = () => window.print();
    // подсветка пункта меню
    const secs = $$('section[id]');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
  }
  return { init, st };
})();
document.addEventListener('DOMContentLoaded', APP.init);
