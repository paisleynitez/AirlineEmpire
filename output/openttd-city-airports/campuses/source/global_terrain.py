from pathlib import Path
from save_io import Save
ROOT=Path(__file__).resolve().parents[1]
paths=[ROOT/'work/source.sav',ROOT/'work/builder-input.sav',max((ROOT/'work/runtime').glob('crash*.sav'),key=lambda p:p.stat().st_mtime)]
for p in paths:
 s=Save(p);h=s.chunks['MAPH']['map'];bad=[]
 for t in range(4194304-2049):
  if t%2048==2047:continue
  for n in (t+1,t+2048):
   if abs(h[t]-h[n])>1:bad.append((t%2048,t//2048,h[t],h[n],s.chunks['MAPT']['map'][t]>>4))
 print(p.name,'invalid edges',len(bad),bad[:15],flush=True)
