import sys
from playwright.sync_api import sync_playwright
url, out, js = sys.argv[1], sys.argv[2], sys.argv[3]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    pg.goto(url); pg.wait_for_timeout(1200); pg.evaluate(js); pg.wait_for_timeout(1500)
    pg.screenshot(path=out); b.close()
