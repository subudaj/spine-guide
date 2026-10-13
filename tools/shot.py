import sys, asyncio
from playwright.sync_api import sync_playwright
url, out = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 900
h = int(sys.argv[4]) if len(sys.argv) > 4 else 1100
full = len(sys.argv) > 5 and sys.argv[5] == 'full'
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
    errs = []
    pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
    pg.goto(url)
    pg.wait_for_timeout(int(sys.argv[6]) if len(sys.argv) > 6 else 800)
    pg.screenshot(path=out, full_page=full)
    for e in errs: print(e)
    b.close()
