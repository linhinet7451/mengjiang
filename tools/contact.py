import os,glob,sys
from PIL import Image, ImageDraw
O='src/assets/out'
names=sorted(os.path.basename(f)[:-5] for f in glob.glob(O+'/[hcegb]_*.webp') if not f.endswith('_av.webp') and not os.path.basename(f).startswith(('bf_','bg_')))
part=int(sys.argv[1]) if len(sys.argv)>1 else 0
names=names[part*50:(part+1)*50]
C,R=10,(len(names)+9)//10; cw,ch=150,230
sh=Image.new('RGB',(C*cw,R*ch),(60,110,160))
d=ImageDraw.Draw(sh)
for i,n in enumerate(names):
    x,y=(i%C)*cw,(i//C)*ch
    f=Image.open(f'{O}/{n}.webp'); s=170/f.size[1]; f=f.resize((max(1,int(f.size[0]*s)),170))
    if f.size[0]>cw: f=f.resize((cw,int(f.size[1]*cw/f.size[0])))
    sh.paste(f,(x+(cw-f.size[0])//2,y),f)
    a=Image.open(f'{O}/{n}_av.webp').resize((48,48)); sh.paste(a,(x+2,y+176),a)
    d.text((x+54,y+190),n,fill=(255,255,255))
sh.save(f'tmp/contact{part}.png')
