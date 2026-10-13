/* Конструктор личного комплекса. */
'use strict';
const PROG = (() => {
  const MIN = { chin: 2.5, thext: 2, catcamel: 1.5, openbook: 3, ytw: 5, row: 4, angel: 2, breath: 2, micro: 1, mckenzie: 3, curlup: 3, sideplank: 3, birddog: 4, bridge: 3, hinge: 2, nerve: 2, walk: 20 };
  const KEY = 'spine-guide-form-v1';
  const DEF = { zC: false, zT: true, zL: false, diag: 'tension', rad: 'none', phase: 'prev', pain: 3, worse: 'unclear', sit: 'mid', time: '20', flags: [] };

  function formHTML() {
    const rf = DATA.RED_FLAGS.map(r => `<label><input type="checkbox" name="flags" value="${r.id}"> <span>${r.t}</span></label>`).join('');
    return `<form class="form" id="pform" onsubmit="return false">
      <div class="q"><h4>1. Где беспокоит?</h4>
        <label><input type="checkbox" name="zC"> <span>Шея, надплечья</span></label>
        <label><input type="checkbox" name="zT"> <span>Грудной отдел: между и под лопатками</span></label>
        <label><input type="checkbox" name="zL"> <span>Поясница</span></label>
        <p class="hint">Отметки подставляются из выбранных на карте позвонков.</p></div>
      <div class="q"><h4>2. Что известно?</h4>
        <label><input type="radio" name="diag" value="tension"> <span>Усталость, напряжение от позы; грыжи нет или не знаю</span></label>
        <label><input type="radio" name="diag" value="hernia"> <span>Грыжа или протрузия подтверждена МРТ</span></label>
        <p class="hint" id="herniaLvl"></p></div>
      <div class="q"><h4>3. Отдаёт ли боль?</h4>
        <label><input type="radio" name="rad" value="none"> <span>Нет, только в спине</span></label>
        <label><input type="radio" name="rad" value="arm"> <span>В руку (боль, онемение, покалывание)</span></label>
        <label><input type="radio" name="rad" value="leg"> <span>В ногу ниже колена или в ягодицу</span></label></div>
      <div class="q"><h4>4. Сейчас</h4>
        <label><input type="radio" name="phase" value="acute"> <span>Обострение: сильная боль, первые дни–недели</span></label>
        <label><input type="radio" name="phase" value="sub"> <span>Терпимо, хочу восстановиться</span></label>
        <label><input type="radio" name="phase" value="prev"> <span>Почти не болит — профилактика и тонус</span></label>
        <div style="margin-top:6px">Боль сейчас: <b id="painV">3</b>/10<input type="range" name="pain" min="0" max="10" step="1"></div></div>
      <div class="q"><h4>5. От чего хуже?</h4>
        <label><input type="radio" name="worse" value="flex"> <span>Сидение, наклоны вперёд, утром</span></label>
        <label><input type="radio" name="worse" value="ext"> <span>Долго стоять или идти, прогиб назад</span></label>
        <label><input type="radio" name="worse" value="unclear"> <span>Одинаково / не знаю / от статичной позы</span></label></div>
      <div class="q"><h4>6. Режим дня</h4>
        <label><input type="radio" name="sit" value="low"> <span>Сижу меньше 4 часов в день</span></label>
        <label><input type="radio" name="sit" value="mid"> <span>4–8 часов</span></label>
        <label><input type="radio" name="sit" value="high"> <span>Больше 8 часов (или много лёжа с телефоном)</span></label>
        <h4 style="margin-top:8px">Время на основное занятие</h4>
        <label><input type="radio" name="time" value="10"> <span>10 минут</span></label>
        <label><input type="radio" name="time" value="20"> <span>20 минут</span></label>
        <label><input type="radio" name="time" value="30"> <span>30 минут</span></label></div>
      <div class="q" style="grid-column:1/-1"><h4>7. «Красные флаги» — отметьте, если есть</h4>${rf}</div>
    </form>`;
  }

  function read(form) {
    const fd = new FormData(form), o = { ...DEF };
    o.zC = !!fd.get('zC'); o.zT = !!fd.get('zT'); o.zL = !!fd.get('zL');
    for (const k of ['diag', 'rad', 'phase', 'worse', 'sit', 'time']) o[k] = fd.get(k) || DEF[k];
    o.pain = +fd.get('pain'); o.flags = fd.getAll('flags');
    return o;
  }
  function write(form, o) {
    for (const k of ['zC', 'zT', 'zL']) form.elements[k].checked = !!o[k];
    for (const k of ['diag', 'rad', 'phase', 'worse', 'sit', 'time']) { const el = form.querySelector(`input[name=${k}][value="${o[k]}"]`); if (el) el.checked = true; }
    form.elements.pain.value = o.pain;
    form.querySelectorAll('input[name=flags]').forEach(el => { el.checked = (o.flags || []).includes(el.value); });
  }

  /* --- логика подбора --- */
  function build(o) {
    const C = o.zC, T = o.zT, Lm = o.zL || o.rad === 'leg';
    const acute = o.phase === 'acute' || o.pain >= 7;
    const ph = acute ? 'acute' : o.phase === 'sub' ? 'main' : 'prev';
    const extPref = o.worse === 'flex'; // боль от сгибания → разгибание часто помогает
    const flexPref = o.worse === 'ext';
    const plan = { morning: [], day: [], main: [], evening: [], walk: null, notes: [] };
    const add = (arr, id, note) => { if (!arr.some(x => x.id === id)) arr.push({ id, note }); };
    const any = !C && !T && !Lm ? true : false;
    const useT = T || any, useC = C, useL = Lm;

    // утро
    if (useL || useT) add(plan.morning, 'catcamel', acute ? 'только в безболезненной части' : '');
    if (useT) add(plan.morning, 'openbook');
    if (useL && extPref && (o.diag === 'hernia' || o.rad === 'leg' || acute)) add(plan.morning, 'mckenzie', 'только если боль уменьшается или «собирается» к центру');
    if (acute || useC || useT) add(plan.morning, 'breath');
    // в течение дня
    const every = o.sit === 'high' || acute ? '20–30' : o.sit === 'mid' ? '30–45' : '45–60';
    add(plan.day, 'micro', `каждые ${every} минут`);
    if (useC || useT) add(plan.day, 'chin', 'сидя: 5 × 5 с');
    if (useT) add(plan.day, 'thext', '5 повторов через спинку');
    if (useL && extPref) add(plan.day, 'mckenzie', 'после долгого сидения (стоя — прогиб с руками на пояснице)');
    // основное занятие
    const pool = [];
    if (useT || useC) { pool.push('chin', 'ytw', 'row', 'angel'); if (!plan.day.some(x => x.id === 'thext')) pool.push('thext'); }
    if (useL) { pool.push('curlup', 'birddog', 'sideplank', 'bridge', 'hinge'); }
    if (o.rad === 'leg') pool.splice(useL ? 3 : 0, 0, 'nerve');
    if (o.rad === 'arm' && !pool.includes('chin')) pool.unshift('chin');
    let budget = +o.time;
    if (acute) budget = Math.min(budget, 15);
    let used = 0;
    // разминка
    const warm = useL ? 'catcamel' : 'openbook';
    if (!plan.morning.some(x => x.id === warm)) { add(plan.main, warm, 'разминка'); used += MIN[warm]; }
    for (const id of pool) {
      if (used + MIN[id] > budget + 1) continue;
      let note = '';
      if (acute && id === 'sideplank') note = 'с колен';
      if (acute && id === 'ytw') note = 'только сведение лопаток без подъёма рук';
      if (flexPref && id === 'thext') note = 'поясницу держать неподвижной';
      add(plan.main, id, note); used += MIN[id];
    }
    plan.mainMin = Math.round(used);
    // вечер
    if (useT) add(plan.evening, 'openbook');
    add(plan.evening, 'breath');
    if (useL && extPref && !acute) add(plan.evening, 'mckenzie', 'если помогает');
    plan.walk = 'walk';
    // заметки
    if (useL && (extPref || o.diag === 'hernia')) plan.notes.push('Первые 30–60 минут после сна избегайте глубоких наклонов вперёд и подъёма тяжестей: диски в это время наиболее «наполнены» (Snook, 1998).');
    if (flexPref && useL) plan.notes.push('Боль усиливается от прогиба и долгого стояния — разгибания по МакКензи не для вас. Облегчение часто дают положения с лёгким сгибанием: лёжа на спине с подтянутыми к груди коленями, сидя с наклоном вперёд. Это повод обсудить со специалистом возможный стеноз канала.');
    if (o.rad === 'arm') plan.notes.push('Боль отдаёт в руку: упражнения выполняйте так, чтобы симптомы в руке не усиливались. Если онемение или слабость в руке нарастают — к неврологу.');
    if (o.rad === 'leg') plan.notes.push('Главный ориентир при боли в ноге: хорошо, если боль «собирается» к пояснице (централизуется); плохо, если спускается ниже по ноге. Второе — сигнал уменьшить нагрузку и обратиться к специалисту.');
    if (useT && !o.zL && o.diag !== 'hernia') plan.notes.push('Боль ниже лопаток от сидения и лежания на высоких подушках — почти всегда перегрузка мышц, связок и мелких суставов, а не грыжа. Решающее — смена позы каждые 30–45 минут и укрепление мышц, удерживающих лопатки и грудной отдел.');
    if (o.sit === 'high') plan.notes.push('Лёжа с телефоном: одна невысокая подушка, телефон поднимите к глазам (локти на подушке), а не голову к телефону. Каждые 20–30 минут меняйте позу.');
    return { plan, ph, acute, every };
  }

  function itemHTML(it, ph) {
    const ex = EX.BY[it.id];
    const st = EXUI.still(ex, ex.frames.length > 2 ? 2 : 1);
    const dose = ex.dose[ph];
    return `<div class="item" data-ex="${ex.id}" title="Открыть технику"><svg viewBox="${(st.vb || [-60, -100, 160, 100]).join(' ')}" preserveAspectRatio="xMidYMid meet">${st.svg}</svg><div><div class="t">${ex.title}</div><div class="d">${dose}${it.note ? ' — <i>' + it.note + '</i>' : ''}</div></div></div>`;
  }

  function render(o, out) {
    const { plan, ph, acute, every } = build(o);
    let h = '';
    const flags = DATA.RED_FLAGS.filter(r => o.flags.includes(r.id));
    if (flags.length) h += `<div class="note red"><b>Сначала — к врачу.</b><ul>${flags.map(r => `<li>${r.a}</li>`).join('')}</ul>Упражнения ниже — только после осмотра и с разрешения врача.</div>`;
    const zones = [o.zC && 'шея', o.zT && 'грудной отдел', (o.zL || o.rad === 'leg') && 'поясница'].filter(Boolean).join(', ') || 'грудной отдел';
    h += `<div class="note green">Ваш профиль: <b>${zones}</b>; ${o.diag === 'hernia' ? 'грыжа/протрузия по МРТ' : 'перегрузка без подтверждённой грыжи'}; ${acute ? '<b>фаза обострения</b> — мягкий объём' : o.phase === 'sub' ? 'восстановление' : 'профилактика'}. Основное занятие ≈ <b>${plan.mainMin} мин</b>, микропаузы каждые ${every} мин.</div>`;
    const block = (title, when, arr, extra = '') => arr.length ? `<div class="block"><h3>${title} <span class="when">${when}</span></h3>${extra}<div class="items">${arr.map(it => itemHTML(it, ph)).join('')}</div></div>` : '';
    h += block('☀️ Утро', '5–8 минут', plan.morning, '<p class="hint">Спокойно, без усилия — «смазать» суставы после ночи.</p>');
    h += block('💻 В течение дня', `каждые ${every} мин`, plan.day, '<p class="hint">Поставьте таймер. Это самое важное для зоны «под лопатками»: она устаёт от неподвижности.</p>');
    const freq = (plan.main.some(x => ['ytw', 'row'].includes(x.id)) ? 'укрепление лопаток — 3 раза в неделю (через день); ' : '') + (plan.main.some(x => ['curlup', 'birddog', 'sideplank'].includes(x.id)) ? '«большая тройка» МакГилла — ежедневно; ' : '') + 'остальное — ежедневно';
    h += block('🏋️ Основное занятие', `≈ ${plan.mainMin} мин`, plan.main, `<p class="hint">${freq}. Лучшее время — днём или вечером, не сразу после сна.</p>`);
    h += block('🌙 Вечер', '5 минут', plan.evening, '<p class="hint">Снять накопленное за день напряжение перед сном.</p>');
    h += block('🚶 Каждый день', EX.BY.walk.dose[ph], [{ id: 'walk' }]);
    if (plan.notes.length) h += `<div class="block"><h3>📝 Важно именно вам</h3><ul>${plan.notes.map(n => `<li>${n}</li>`).join('')}</ul></div>`;
    h += `<div class="block"><h3>🚦 Как понять, что нагрузка правильная</h3><div class="light">
      <div class="g"><b>Зелёный: 0–2 из 10.</b> Продолжайте и постепенно добавляйте.</div>
      <div class="y"><b>Жёлтый: 3–5 из 10</b> во время упражнения — допустимо, если к следующему утру боль возвращается к обычному уровню и не уходит дальше в руку/ногу.</div>
      <div class="r"><b>Красный: больше 5</b>, боль растёт с каждым повтором, спускается по ноге/руке или держится на следующий день выше обычного — уменьшите объём вдвое или уберите упражнение.</div></div>
      <p class="hint">Принцип «модели допустимой боли» (Silbernagel, 2007): лёгкий дискомфорт не означает вреда; ориентир — реакция через 24 часа.</p></div>`;
    h += `<div class="block"><h3>📈 План по неделям</h3><div class="week">
      <div><b>Недели 1–2.</b> Освоить технику и ощущения, 50–70% усилия. Дозировка — как указано. Микропаузы с первого дня.</div>
      <div><b>Недели 3–4.</b> +20–30%: дольше удержания, больше повторов, плотнее резина. Ходьба +5 минут в неделю.</div>
      <div><b>Недели 5–8.</b> Усложнения: боковая планка с ног, Y–T–W с гантелями 0,5–1 кг, мост на одной ноге, ходьба 30–45 минут.</div>
      <div><b>Дальше.</b> Поддержка: основное занятие 2–3 раза в неделю, микропаузы и ходьба — каждый день, навсегда.</div></div>
      <p class="hint">Мышцы и связки адаптируются к нагрузке за 6–12 недель регулярных занятий. Напряжение от позы часто заметно уменьшается уже за 1–2 недели микропауз. При грыже симптомы у большинства уменьшаются за 6–12 недель, а сама грыжа на МРТ может уменьшаться месяцами.</p></div>`;
    out.innerHTML = h;
  }

  function mount(root, out) {
    root.innerHTML = formHTML();
    const form = root.querySelector('#pform');
    let o = DEF;
    try { o = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { }
    write(form, o);
    const upd = () => {
      const v = read(form);
      root.querySelector('#painV').textContent = v.pain;
      try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { }
      render(v, out);
    };
    form.addEventListener('input', upd);
    form.addEventListener('change', upd);
    out.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) EXUI.focus(it.dataset.ex); });
    upd();
    return {
      setZones(sel) { // подстановка из выбранных позвонков
        const ids = [...sel];
        const has = r => ids.some(id => id[0] === r || (r === 'L' && id === 'S1'));
        if (!ids.length) return;
        form.elements.zC.checked = has('C'); form.elements.zT.checked = has('T'); form.elements.zL.checked = has('L');
        const discs = ids.filter(x => x.includes('-'));
        root.querySelector('#herniaLvl').textContent = discs.length ? 'Выбранные диски: ' + discs.join(', ') : '';
        upd();
      },
    };
  }
  return { mount, build };
})();
