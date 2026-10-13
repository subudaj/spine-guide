import sys
from playwright.sync_api import sync_playwright
url = sys.argv[1]; w = int(sys.argv[2]); pref = sys.argv[3]; sels = sys.argv[4].split(',')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': w, 'height': 900}, device_scale_factor=1)
    errs = []
    pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
    pg.goto(url); pg.wait_for_timeout(1200)
    for s in sels:
        if ':' in s:
            s, act = s.split(':', 1)
            pg.evaluate(act); pg.wait_for_timeout(1300)
        el = pg.query_selector(s)
        el.scroll_into_view_if_needed(); pg.wait_for_timeout(700)
        el.screenshot(path=f'/tmp/{pref}_{s.strip("#.").replace(" ","_")}.png')
    for e in errs[:20]: print(e)
    b.close()
