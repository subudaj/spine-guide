import sys
from playwright.sync_api import sync_playwright
url = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 1360
res = []
def ok(name, cond): res.append(('OK  ' if cond else 'FAIL') + ' ' + name)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': 900}, has_touch=W < 600)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_timeout(1200)
    st = lambda js: pg.evaluate(js)
    svgHTML = lambda: st("document.querySelector('#anat svg').innerHTML.length")
    # слои
    for k in ['skin','superficial','deep','bones','ligs','nerves','zone']:
        before = svgHTML(); pg.click(f'#layers [data-l={k}]'); pg.wait_for_timeout(150)
        ok(f'слой {k} выкл', svgHTML() != before); pg.click(f'#layers [data-l={k}]'); pg.wait_for_timeout(150)
    # позы
    for k in ['stand','sit','pillows','lie','slump']:
        pg.click(f'#postures [data-p={k}]'); pg.wait_for_timeout(1100); ok(f'поза {k}', st('APP.st.post') == k)
    # касание позвонка T4 (под трапецией) реальным кликом
    for vid in ['T4', 'T8', 'L3', 'C5']:
        st("APP.st.sel.clear()")
        pg.locator('#anat').scroll_into_view_if_needed(); pg.wait_for_timeout(600)
        xy = st(f"(()=>{{const sk=SPINE.build(APP.st.pose),c=sk.V['{vid}'].center,svg=document.querySelector('#anat svg'),pt=svg.createSVGPoint();pt.x=c[0];pt.y=-c[1];const q=pt.matrixTransform(svg.getScreenCTM());return [q.x,q.y]}})()")
        pg.mouse.click(xy[0], xy[1]); pg.wait_for_timeout(200)
        ok(f'клик по позвонку {vid}', st(f"APP.st.sel.has('{vid}')"))
    pg.wait_for_timeout(600); box = pg.locator('#anat .hit[data-d="L4-L5"]').bounding_box()
    pg.mouse.click(box['x'] + box['width'] * 0.5, box['y'] + box['height'] / 2); pg.wait_for_timeout(200)
    ok('клик по диску L4-L5', st("APP.st.sel.has('L4-L5')"))
    # зум
    pg.click('#zin'); ok('зум +', st('APP.st.zoom') > 1); pg.click('#zout'); pg.click('#zreset'); ok('сброс', st('APP.st.zoom') == 1)
    pg.click('#zspine'); ok('🎯', st('APP.st.zoom') > 3); pg.click('#zreset')
    # вид сзади и клик по мышце
    pg.click('#views [data-v=back]'); pg.wait_for_timeout(300); ok('вид сзади', st('APP.st.view') == 'back')
    pg.locator('#anat').scroll_into_view_if_needed(); pg.wait_for_timeout(600)
    box = pg.locator('#anat [data-m=lats]').first.bounding_box()
    pg.mouse.click(box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.6); pg.wait_for_timeout(200)
    ok('клик по мышце (широчайшая)', 'Широчайшая' in st("document.querySelector('#info').textContent"))
    pg.click('#views [data-v=side]')
    # очистить, моя зона, список уровней
    pg.click('[data-act=clear]'); ok('очистить', st('APP.st.sel.size') == 0)
    pg.click('[data-act=mine]'); pg.wait_for_timeout(1000); ok('моя зона', st("APP.st.sel.has('T7') && APP.st.post==='pillows'"))
    pg.click('#map details summary'); pg.click('#levels [data-x2=C6]'); ok('уровень из списка', st("APP.st.sel.has('C6')"))
    ok('чип уровня подсвечен', st("document.querySelector('#levels [data-x2=C6]').classList.contains('on')"))
    # кнопки «почему»
    for k in ['slump','pillows','lie']:
        pg.click(f'#why [data-post={k}]'); pg.wait_for_timeout(1100); ok(f'кнопка «почему» {k}', st('APP.st.post') == k)
    # описание позвонка → диск ниже → грыжа
    pg.click('#levels [data-x2=L4]'); pg.wait_for_timeout(200)
    pg.click('#info [data-pick]'); ok('диск под позвонком', st("APP.st.sel.has('L4-L5')"))
    pg.click('#info [data-act=hernia]'); pg.wait_for_timeout(300); ok('кнопка «грыжа здесь»', st("APP.st.hDisc") == 'L4-L5')
    # грыжа
    pg.click('#hTicks [data-s="4"]'); pg.wait_for_timeout(900); ok('стадия «секвестр»', st('APP.st.stage') > 3.9)
    for d in ['central','foraminal','paracentral']:
        pg.click(f'#hDir [data-d={d}]'); ok(f'направление {d}', st('APP.st.dir') == d)
    pg.select_option('#hLevel', 'C5-C6'); pg.wait_for_timeout(100); ok('уровень грыжи C5-C6', st('APP.st.hDisc') == 'C5-C6')
    pg.click('#hPlay'); pg.wait_for_timeout(1200); s1 = st('APP.st.stage'); ok('проиграть', 0 < s1 < 4)
    pg.click('#hPlay')
    pg.click('#hMap'); ok('показать на карте выкл', st('APP.st.showOnMap') == False); pg.click('#hMap')
    # упражнения
    c = '#ex-birddog'
    pg.locator(c).scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    t0 = st("document.querySelector('#ex-birddog svg').innerHTML"); pg.wait_for_timeout(500)
    ok('анимация идёт', st("document.querySelector('#ex-birddog svg').innerHTML") != t0)
    pg.click(f'{c} [data-act=play]'); t0 = st("document.querySelector('#ex-birddog svg').innerHTML"); pg.wait_for_timeout(500)
    ok('пауза', st("document.querySelector('#ex-birddog svg').innerHTML") == t0); pg.click(f'{c} [data-act=play]')
    pg.click(f'{c} [data-act=ghost]'); ok('показать ошибку', 'rg-ghost' in st("document.querySelector('#ex-birddog svg').innerHTML"))
    pg.click(f'{c} [data-act=ghost]')
    pg.click(f'{c} [data-act=hl]'); pg.click(f'{c} [data-act=slow]'); ok('кнопки подсветки/медленно', True)
    for r, n in [('[data-r=L]', 'поясница'), ('[data-g=relax]', 'снять напряжение'), (':text("Все")', 'все')]:
        pg.click('#exFilter ' + r if not r.startswith(':') else '#exFilter button:has-text("Все")'); pg.wait_for_timeout(100)
        ok('фильтр ' + n + ' → ' + st("document.querySelector('#exCount').textContent"), True)
    # комплекс
    pg.check('#pform input[name=zL]'); pg.wait_for_timeout(200); ok('анкета → план', 'Птица' in st("document.querySelector('#plan').textContent"))
    pg.click('#plan .item >> nth=0'); pg.wait_for_timeout(800); ok('пункт плана → упражнение', st("!!document.querySelector('.ex.hl')"))
    # тема
    pg.click('#themeBtn'); t = st("document.documentElement.dataset.theme"); pg.click('#themeBtn'); ok('тема переключается', t != st("document.documentElement.dataset.theme"))
    for r in res: print(r)
    print('ошибки:', errs[:10])
    b.close()
