/* Карточки упражнений: анимация, ошибка-«призрак», тексты. */
'use strict';
const EXUI = (() => {
  const f = U.f;
  const GOAL = { mob: 'подвижность', str: 'укрепление', ctrl: 'контроль', relax: 'снятие напряжения', nerve: 'нерв' };
  const REGN = { C: 'шея', T: 'грудной отдел', L: 'поясница' };

  function renderPose(ex, pose, fr, extra = {}) {
    const o = { hl: fr.hl, eff: fr.eff || 0, pulse: extra.pulse || 0, hot: fr.hot };
    if (ex.view === 'side') {
      const r = RIG.sideRig(pose, { ...o, nerve: fr.nerve, nerveDash: fr.nerve ? '2 1.2' : '' });
      return { svg: r.svg, g: { sk: r.sk } };
    }
    if (ex.view === 'back') { const r = RIG.backRig(pose, o); return { svg: r.svg, g: { b: r.b } }; }
    const r = RIG.axialRig(pose, { ...o, hot: !!fr.hot }); return { svg: r.svg, g: r };
  }

  /* одна картинка ключевой позы (для плана и превью) */
  function still(ex, i = 1) {
    const fr = ex.frames[Math.min(i, ex.frames.length - 1)];
    const r = renderPose(ex, fr.pose, fr);
    const base = renderPose(ex, ex.frames[0].pose, ex.frames[0]);
    const g = Object.assign({}, r.g, { sk0: base.g.sk, b0: base.g.b });
    const props = ex.props ? ex.props(g) : '';
    return { svg: props + (ex.fprops ? ex.fprops(g) : '') + r.svg, vb: ex._vb };
  }

  class Player {
    constructor(ex, root) {
      this.ex = ex; this.root = root; this.t = 0; this.playing = true; this.speed = 1; this.ghost = false; this.showHL = true;
      this.svg = root.querySelector('svg'); this.cap = root.querySelector('.cap');
      this.total = ex.frames.reduce((a, fr) => a + fr.d + fr.hold, 0);
      const r0 = renderPose(ex, ex.frames[0].pose, ex.frames[0]);
      this.g0 = r0.g;
      this.computeVB();
      this.last = null;
      this.draw(0);
    }
    computeVB() {
      const ex = this.ex;
      if (ex._vb) { this.svg.setAttribute('viewBox', ex._vb.join(' ')); this.svg.style.aspectRatio = String(ex.ar || 1.6); return; }
      const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.svg.appendChild(tmp);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const poses = ex.frames.map(fr => [fr.pose, fr]).concat(ex.ghost ? [[ex.ghost.pose, {}]] : []);
      for (const [p, fr] of poses) {
        tmp.innerHTML = renderPose(ex, p, fr).svg;
        const b = tmp.getBBox();
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      }
      tmp.remove();
      // добавляем место под подпись снизу и поля
      let w = x1 - x0 + 16, h = y1 - y0 + 10;
      const capH = h * 0.22;
      h += capH;
      const ar = ex.ar || 16 / 10;
      if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h) * 0.55; h = nh; }
      ex._vb = [x0 - 8, y0 - 5, w, h].map(v => +v.toFixed(2));
      this.svg.setAttribute('viewBox', ex._vb.join(' '));
      this.svg.style.aspectRatio = String(ex.ar || 1.6);
    }
    at(t) { // поза в момент t
      const ex = this.ex, F = ex.frames;
      let acc = 0;
      for (let i = 0; i < F.length; i++) {
        const fr = F[i], prev = F[(i - 1 + F.length) % F.length];
        if (t < acc + fr.d) { const k = U.ease((t - acc) / fr.d); return { pose: U.mix(prev.pose, fr.pose, k), fr, eff: U.lerp(prev.eff || 0, fr.eff || 0, k), i, k, holdLeft: null }; }
        acc += fr.d;
        if (t < acc + fr.hold) return { pose: fr.pose, fr, eff: fr.eff || 0, i, k: 1, holdLeft: acc + fr.hold - t };
        acc += fr.hold;
      }
      const fr = F[F.length - 1];
      return { pose: fr.pose, fr, eff: fr.eff || 0, i: F.length - 1, k: 1 };
    }
    draw(t) {
      const ex = this.ex, st = this.at(t);
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      const fr = Object.assign({}, st.fr, { eff: st.eff, hl: this.showHL ? st.fr.hl : null });
      const r = renderPose(ex, st.pose, fr, { pulse });
      const g = Object.assign({}, r.g, { sk0: this.g0.sk, b0: this.g0.b });
      let s = ex.props ? ex.props(g) : '';
      if (ex.fprops) s += ex.fprops(g);
      if (this.ghost && ex.ghost) {
        const gr = renderPose(ex, ex.ghost.pose, { hl: ex.ghost.hl, eff: 0.8 });
        s += `<g class="rg-ghost">${gr.svg}</g>`;
      }
      s += r.svg;
      if (st.fr.arrow && st.k < 1 && !this.ghost) s += st.fr.arrow(g);
      if (st.fr.nerve) {
        const off = (t * 6) % 3.2;
        s = s.replace('class="rg-nerve"', `class="rg-nerve" style="stroke-dashoffset:${f(off)}"`);
      }
      this.svg.innerHTML = s;
      // подпись
      let cap = st.fr.cap, ph = st.fr.ph;
      if (this.ghost && ex.ghost) { cap = ex.ghost.cap; ph = '✗ Ошибка'; }
      if (this.last !== cap + ph) {
        this.cap.innerHTML = `<span class="ph">${ph}</span><span>${cap}</span>`;
        this.last = cap + ph;
      }
      const bar = this.root.querySelector('.prog i');
      if (bar) bar.style.width = (t / this.total * 100).toFixed(1) + '%';
    }
    tick(dt) { if (!this.playing) return; this.t = (this.t + dt * this.speed) % this.total; this.draw(this.t); }
  }

  function card(ex) {
    const regs = ex.reg.map(r => `<span class="tag">${REGN[r]}</span>`).join('') + ex.goal.map(g => `<span class="tag">${GOAL[g]}</span>`).join('');
    const dose = ex.dose;
    const src = (ex.src || []).map(k => DATA.SOURCES[k] ? `<a href="${DATA.SOURCES[k].u}" target="_blank" rel="noopener">${DATA.SOURCES[k].t.split('.')[0]}</a>` : '').join('; ');
    return `<article class="card ex" id="ex-${ex.id}" data-reg="${ex.reg.join(' ')}" data-goal="${ex.goal.join(' ')}">
      <div class="head"><div><h3>${ex.title}</h3><div class="sub">${ex.sub}</div></div></div>
      <div>${regs}</div>
      <div class="stage"><svg viewBox="0 0 160 100" role="img" aria-label="${U.esc(ex.title)}"></svg><div class="cap"></div><div class="prog" style="position:absolute;left:0;right:0;top:0;height:3px;background:#0001"><i style="display:block;height:100%;width:0;background:var(--warm)"></i></div></div>
      <div class="ctrl">
        <button class="chip on" data-act="play" title="Остановить или продолжить анимацию">⏸ пауза</button>
        <button class="chip tog" data-act="slow" title="Анимация в 2 раза медленнее">🐢 медленно</button>
        <button class="chip tog on" data-act="hl" title="Цветная подсветка мышц">🎨 подсветка мышц</button>
        ${ex.ghost ? '<button class="chip" data-act="ghost">✗ показать ошибку</button>' : ''}
      </div>
      <div class="legend"><span><i class="sw" style="background:${RIG.HL.work}"></i>работает</span><span><i class="sw" style="background:${RIG.HL.stretch}"></i>растягивается</span><span><i class="sw" style="background:#fff;border:1.5px dashed ${RIG.HL.relax}"></i>должно быть расслаблено</span><span><i class="sw" style="background:#ffc690"></i>здесь движение</span></div>
      <div><b>Ключевые слова:</b><div class="kw">${ex.kw.map(k => `<span>${k}</span>`).join('')}</div></div>
      ${ex.caution ? `<div class="note red">⚠️ ${ex.caution}</div>` : ''}
      <div class="feel"><div class="yes"><h4>✅ Что должно ощущаться</h4><ul>${ex.feel.map(x => `<li>${x}</li>`).join('')}</ul></div><div class="no"><h4>⛔ Чего быть не должно</h4><ul>${ex.notFeel.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
      <details open><summary>Как делать — по шагам</summary><ol>${ex.steps.map(x => `<li>${x}</li>`).join('')}</ol></details>
      <details><summary>Частые ошибки</summary><ul>${ex.mistakes.map(x => `<li>${x}</li>`).join('')}</ul></details>
      <div class="dose"><b>Сколько:</b><br>• обострение: ${dose.acute}<br>• основной период: ${dose.main}<br>• профилактика: ${dose.prev}</div>
      ${ex.yt ? `<div class="ytl">▶ Видео: ${ex.yt.map(q => `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}" target="_blank" rel="noopener">«${q}»</a>`).join(' · ')}</div>` : ''}
      <details><summary>Почему это работает (наука)</summary><p>${ex.why}</p><p class="ev">Источники: ${src}</p></details>
    </article>`;
  }

  const players = new Map();
  function mount(container) {
    container.innerHTML = EX.L.map(card).join('');
    for (const ex of EX.L) {
      const el = container.querySelector('#ex-' + ex.id);
      const pl = new Player(ex, el);
      players.set(el, pl);
      el.querySelector('.ctrl').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const a = b.dataset.act;
        if (a === 'play') { pl.playing = !pl.playing; b.classList.toggle('on', pl.playing); b.textContent = pl.playing ? '⏸ пауза' : '▶ играть'; }
        if (a === 'slow') { pl.speed = pl.speed === 1 ? 0.5 : 1; b.classList.toggle('on', pl.speed < 1); }
        if (a === 'hl') { pl.showHL = !pl.showHL; b.classList.toggle('on', pl.showHL); }
        if (a === 'ghost') { pl.ghost = !pl.ghost; b.classList.toggle('on', pl.ghost); b.textContent = pl.ghost ? '✓ показать правильно' : '✗ показать ошибку'; }
        pl.last = null; pl.draw(pl.t);
      });
    }
    // анимируем только видимые карточки
    const vis = new Set();
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)), { rootMargin: '100px' });
    players.forEach((_, el) => io.observe(el));
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      vis.forEach(el => players.get(el).tick(dt));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function filter(container, reg, goal) {
    container.querySelectorAll('.ex').forEach(el => {
      const okR = !reg || el.dataset.reg.split(' ').includes(reg);
      const okG = !goal || el.dataset.goal.split(' ').includes(goal);
      el.style.display = okR && okG ? '' : 'none';
    });
  }
  function focus(id) {
    const el = document.getElementById('ex-' + id); if (!el) return;
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2500);
    const pl = players.get(el); if (pl) { pl.t = 0; pl.playing = true; }
  }

  return { mount, filter, focus, still, renderPose, Player };
})();
