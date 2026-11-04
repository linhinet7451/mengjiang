#!/usr/bin/env python3
"""Backgrounds (bgraw/*.jpg, no keying) -> out/NAME.webp, 1280px wide (BGW), quality BGQ."""
import os, glob, json
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')
OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
W, Q = int(os.environ.get('BGW', 1280)), int(os.environ.get('BGQ', 66))
mp = os.path.join(OUT, 'meta.json'); meta = json.load(open(mp)) if os.path.exists(mp) else {}
for f in sorted(glob.glob(os.path.join(ROOT, 'bgraw', '*.jpg'))):
    n = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert('RGB')
    w = min(W, 1280 if im.size[0] >= im.size[1] * 1.5 else 1024)
    im = im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS)
    o = os.path.join(OUT, n + '.webp'); im.save(o, 'WEBP', quality=Q, method=6)
    meta[n] = {'w': im.size[0], 'h': im.size[1]}; print(n, im.size, os.path.getsize(o))
json.dump(meta, open(mp, 'w'), indent=0, sort_keys=True)
