#!/usr/bin/env python3
"""無雙 cut-in 用的高解析半身像：raw/*.jpg -> out/<name>_ci.webp（CI px 正方形，頭到胸）。
經原公司同意（依倉庫擁有者說明），可參考或直接使用原作的美術、音樂等素材，目標是盡量貼近原作。使用原作素材時需在 docs/美術素材來源.md 記錄來源。若無原始檔案，可依 reference/ 的截圖與影片重繪貼近原版的素材。"""
import os, sys, glob
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from art_process import key_alpha, RAW, OUT, crop_over
CI = int(os.environ.get('CI', 288)); Q = int(os.environ.get('CIQ', 70))
tot = 0; n = 0
for av in sorted(glob.glob(os.path.join(OUT, '*_av.webp'))):
    name = os.path.basename(av)[:-8]; src = os.path.join(RAW, name + '.jpg')
    if not os.path.exists(src): print('skip', name); continue
    if os.environ.get('ONLY') and name not in os.environ['ONLY'].split(): continue
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    rgba, K = key_alpha(a); al = rgba[..., 3]
    ys, xs = np.where(al > 40); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    fig = Image.fromarray(rgba).crop((x0, y0, x1 + 1, y1 + 1)); fw, fh = fig.size
    sub = (al[y0:y1 + 1, x0:x1 + 1] > 128); cov = np.convolve(sub.sum(1).astype(float), np.ones(9) / 9, 'same')
    thr = 0.16 * fw; top = int(np.argmax(cov > thr)) if (cov > thr).any() else 0
    hs = 0.40 * fh; rows = sub[top:int(top + hs)]; xs2 = np.where(rows)[1]
    cx = float(np.median(xs2)) if len(xs2) else fw / 2
    if name in crop_over: c = crop_over[name]; cx = c[0] * fw; top = c[1] * fh; hs = c[2] * fh
    size = hs * 1.55; t = top - 0.06 * fh; bx0 = cx - size / 2
    sq = Image.new('RGBA', (int(size), int(size)), (0, 0, 0, 0))
    sq.paste(fig.crop((int(bx0), int(t), int(bx0 + size), int(t + size))), (0, 0))
    out = os.path.join(OUT, name + '_ci.webp'); sq.resize((CI, CI), Image.LANCZOS).save(out, 'WEBP', quality=Q, method=6)
    tot += os.path.getsize(out); n += 1
print(n, 'cut-ins', tot, 'bytes')
