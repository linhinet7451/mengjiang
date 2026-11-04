#!/usr/bin/env python3
"""Original AI-generated icons (src/assets/iraw/i_*.jpg) -> chroma-keyed square WebP (src/assets/out/i_*.webp).
gem / soul are neutral grey and get colour-tinted variants. Also processes UI textures + pagoda from bgraw."""
import os, sys, json, glob
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from art_process import key_alpha, OUT, ROOT
IRAW = os.path.join(ROOT, 'iraw'); BG = os.path.join(ROOT, 'bgraw')
S = int(os.environ.get('ICON', 88))
GEM = ['e53935', '43a047', '8d6e63', '1e88e5', '8e24aa', 'fb8c00']
SOUL = ['e0e0e0', '66bb6a', '42a5f5', 'ba68c8', 'ffb300']

def square(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    rgba, K = key_alpha(a)
    al = rgba[..., 3]; ys, xs = np.where(al > 40)
    im = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w, h = im.size; m = max(w, h); pad = int(m * 0.04)
    sq = Image.new('RGBA', (m + 2 * pad, m + 2 * pad), (0, 0, 0, 0))
    sq.paste(im, ((m - w) // 2 + pad, (m - h) // 2 + pad))
    return sq.resize((S, S), Image.LANCZOS)

def tint(im, hexc):
    a = np.asarray(im).astype(np.float32) / 255
    c = np.array([int(hexc[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255
    L = (a[..., :3] @ np.array([.3, .59, .11], np.float32))[..., None]
    # dark->colour*0.35, mid->colour, bright->white
    lo = c * 0.3; out = np.where(L < .6, lo + (c - lo) * (L / .6), c + (1 - c) * ((L - .6) / .4) ** 1.4)
    return Image.fromarray((np.dstack([np.clip(out, 0, 1), a[..., 3:]]) * 255).astype(np.uint8))

meta = json.load(open(os.path.join(OUT, 'meta.json')))
tot = 0
for f in sorted(glob.glob(os.path.join(IRAW, 'i_*.jpg'))):
    n = os.path.splitext(os.path.basename(f))[0]; im = square(f)
    outs = [(n, im)]
    # art3：護體石 #8d6e63 飽和度太低、上色後看起來像灰色，改用較濃的赭褐色上色（key 不變）
    TINT = {'8d6e63': 'a0601f'}
    if n == 'i_gem': outs = [(n + '_' + h, tint(im, TINT.get(h, h))) for h in GEM] + [(n, im)]
    if n == 'i_soul': outs = [(n + '_q' + str(i), tint(im, h)) for i, h in enumerate(SOUL)]
    for k, v in outs:
        p = os.path.join(OUT, k + '.webp'); v.save(p, 'WEBP', quality=80, method=6); meta[k] = {'w': S, 'h': S}; tot += os.path.getsize(p)
for n, w, q in [('t_wood', 256, 70), ('t_paper', 256, 70), ('bg_pagoda', 300, 74)]:
    im = Image.open(os.path.join(BG, n + '.jpg')).convert('RGB'); h = int(im.size[1] * w / im.size[0])
    im = im.resize((w, h), Image.LANCZOS); p = os.path.join(OUT, n + '.webp'); im.save(p, 'WEBP', quality=q, method=6)
    meta[n] = {'w': w, 'h': h}; tot += os.path.getsize(p); print(n, os.path.getsize(p))
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=0, sort_keys=True)
print('icons+tex bytes', tot)
