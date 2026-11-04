#!/usr/bin/env python3
"""Chroma-key generated character art (raw/*.jpg) -> transparent WebP figure + avatar.
Usage: art_process.py [names...]  (default: all c_/h_/e_ raw files)
Overrides for avatar crop in src/assets/crop.json: {"name": [cx_frac, top_frac, size_frac]} relative to figure bbox."""
import sys, os, json, glob
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')
RAW, OUT = os.path.join(ROOT, 'raw'), os.path.join(ROOT, 'out')
FIG_H, AV = int(os.environ.get('FIG_H', 400)), 128
crop_over = {}
cp = os.path.join(ROOT, 'crop.json')
if os.path.exists(cp): crop_over = json.load(open(cp))

def key_alpha(a):
    h, w, _ = a.shape
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    K = np.median(border, axis=0)
    d = np.sqrt(((a - K) ** 2).sum(-1))
    # chroma-aware distance: also use hue difference for saturated keys
    t0, t1 = 70.0, 150.0
    al = np.clip((d - t0) / (t1 - t0), 0, 1)
    # despill / un-premultiply on edges
    am = np.maximum(al, 1e-3)[..., None]
    col = (a - (1 - am) * K) / am
    col = np.clip(col, 0, 255)
    # kill residual key tint on fully-opaque-ish pixels near key hue
    if K[1] > K[0] and K[1] > K[2]:  # green key
        lim = np.maximum(col[..., 0], col[..., 2])
        col[..., 1] = np.where(al < 1, np.minimum(col[..., 1], lim + 10), col[..., 1])
    else:  # magenta key
        lim = col[..., 1]
        m = np.minimum(col[..., 0], col[..., 2])
        sp = np.clip(m - lim - 20, 0, None)
        col[..., 0] = np.where(al < 1, col[..., 0] - sp * 0.8, col[..., 0])
        col[..., 2] = np.where(al < 1, col[..., 2] - sp * 0.8, col[..., 2])
    # remove tiny speckles: alpha below .08 -> 0
    al[al < 0.08] = 0
    return np.dstack([col, al * 255]).astype(np.uint8), K

def process(path):
    name = os.path.splitext(os.path.basename(path))[0]
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    rgba, K = key_alpha(a)
    al = rgba[..., 3]
    ys, xs = np.where(al > 40)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    fig = Image.fromarray(rgba).crop((x0, y0, x1 + 1, y1 + 1))
    fw, fh = fig.size
    if name.startswith('k_'):  # building sprite: width-based, no avatar
        BW = int(os.environ.get('BW', 380)); s = BW / fw
        figs = fig.resize((BW, max(1, int(fh * s))), Image.LANCZOS)
        figs.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=int(os.environ.get('Q', 76)), method=6)
        return name, {'w': BW, 'h': figs.size[1], 'key': [int(v) for v in K]}
    # head detection: first row whose opaque coverage is wide
    sub = (al[y0:y1 + 1, x0:x1 + 1] > 128)
    cov = sub.sum(1).astype(float)
    cov = np.convolve(cov, np.ones(9) / 9, 'same')
    thr = 0.16 * fw
    top = int(np.argmax(cov > thr)) if (cov > thr).any() else 0
    size = 0.40 * fh
    rows = sub[top:int(top + size)]
    cols = np.where(rows.any(0))[0]
    xs2 = np.where(rows)[1]
    cx = float(np.median(xs2)) if len(xs2) else fw / 2
    if name in crop_over:
        c = crop_over[name]; cx = c[0] * fw; top = c[1] * fh; size = c[2] * fh
    top = top - 0.03 * fh
    bx0 = cx - size / 2
    av = Image.new('RGBA', (int(size), int(size)), (0, 0, 0, 0))
    av.paste(fig.crop((int(bx0), int(top), int(bx0 + size), int(top + size))), (0, 0))
    av = av.resize((AV, AV), Image.LANCZOS)
    # figure scaled
    s = FIG_H / fh
    figs = fig.resize((max(1, int(fw * s)), FIG_H), Image.LANCZOS)
    figs.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=int(os.environ.get('Q', 76)), method=6)
    av.save(os.path.join(OUT, name + '_av.webp'), 'WEBP', quality=80, method=6)
    meta = {'w': figs.size[0], 'h': FIG_H, 'key': [int(v) for v in K]}
    return name, meta

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:]
    files = [os.path.join(RAW, n + '.jpg') for n in names] if names else sorted(glob.glob(os.path.join(RAW, '[hcegbk]_*.jpg')))
    mp = os.path.join(OUT, 'meta.json')
    meta = json.load(open(mp)) if os.path.exists(mp) else {}
    for f in files:
        n, m = process(f); meta[n] = m
        print(n, m, os.path.getsize(os.path.join(OUT, n + '.webp')))
    json.dump(meta, open(mp, 'w'), indent=0, sort_keys=True)
