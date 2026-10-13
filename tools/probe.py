import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 800})
    pg.goto(sys.argv[1]); pg.wait_for_timeout(1200)
    print(pg.evaluate(sys.argv[2]))
    b.close()
