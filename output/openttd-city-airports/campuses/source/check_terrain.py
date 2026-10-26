from pathlib import Path
from save_io import Save
import json
ROOT=Path(__file__).resolve().parents[1];s=Save(ROOT/'work/builder-input.sav');ht=s.chunks['MAPH']['map'];bad=[]
for q in json.loads((ROOT/'work/sites.json').read_text()):
 for y in range(q['y']-10,q['y']+40):
  for x in range(q['x']-10,q['x']+40):
   t=y*2048+x
   for n in (t+1,t+2048):
    if abs(ht[t]-ht[n])>1:bad.append((x,y,ht[t],ht[n],s.chunks['MAPT']['map'][t]>>4))
print('Terrain adjacent height violations',bad[:30], 'count',len(bad))
assert not bad
