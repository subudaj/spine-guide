#!/usr/bin/env python3
"""Сборка: src/ → dist/index.html (один файл: стили и скрипты внутри)."""
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
ORDER = ['util', 'spine', 'data', 'anatomy-side', 'anatomy-back', 'hernia', 'rig', 'exercises', 'exui', 'program', 'app']
html = (SRC / 'index.html').read_text(encoding='utf-8')
css = (SRC / 'css' / 'style.css').read_text(encoding='utf-8')
js = '\n'.join(f'/* ---- {n}.js ---- */\n' + (SRC / 'js' / f'{n}.js').read_text(encoding='utf-8') for n in ORDER)
assert '</script' not in js.lower(), 'в JS встретилось </script'
html = html.replace('<!--CSS-->', '<style>\n' + css + '\n</style>').replace('<!--JS-->', '<script>\n' + js + '\n</script>')
out = ROOT / 'dist' / 'index.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'{out} — {out.stat().st_size // 1024} КБ')
# копия для GitHub Pages (папка docs/)
docs = ROOT / 'docs' / 'index.html'
docs.parent.mkdir(exist_ok=True)
docs.write_text(html, encoding='utf-8')
