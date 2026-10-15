import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': int(sys.argv[2]), 'height': 900})
    pg.goto(sys.argv[1]); pg.wait_for_timeout(1200)
    pg.locator('#anat').scroll_into_view_if_needed(); pg.wait_for_timeout(800)
    for sel in ['.hit[data-v=T4]', '.hit[data-v=C5]', '.hit[data-d="L4-L5"]']:
        print(sel, pg.evaluate("""s=>{const h=document.querySelector('#anat '+s);const r=h.getBoundingClientRect();const x=r.left+r.width*0.3,y=r.top+r.height/2;const e=document.elementFromPoint(x,y);return r.width.toFixed(1)+'x'+r.height.toFixed(1)+' -> '+(e?e.tagName+'.'+e.getAttribute('class')+' '+JSON.stringify(e.dataset)+' parent:'+(e.parentElement&&e.parentElement.getAttribute('class')):'null')}""", sel))
    b.close()
