from playwright.sync_api import sync_playwright
import sys
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1360, 'height': 900})
    pg.goto(sys.argv[1]); pg.wait_for_timeout(1200)
    pg.locator('#anat').scroll_into_view_if_needed(); pg.wait_for_timeout(800)
    box = pg.locator('#anat .hit[data-d="L4-L5"]').bounding_box(); x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    print('box', box, 'vp', pg.evaluate('innerHeight'))
    print('at', pg.evaluate(f"(()=>{{const e=document.elementFromPoint({x},{y});return e?e.tagName+'.'+e.getAttribute('class')+JSON.stringify(e.dataset):'null'}})()"))
    pg.mouse.click(x, y); pg.wait_for_timeout(300); print('sel', pg.evaluate('[...APP.st.sel].join()'))
    b.close()
