from pathlib import Path
from save_io import Save
import json
ROOT=Path(__file__).resolve().parents[1];s=Save(ROOT/'work/source.sav');W=2048
M={k:c['map'] for k,c in s.chunks.items() if 'map'in c};sites=[]
for sid,name in [(0,'Hunninghall'),(113,'Pedingworth'),(177,'Wradtown')]:
 st=s.rows('STNN')[sid]['normal'][0];t=st['airport.tile'];cx,cy=t%W,t//W;candidates=[]
 for y in range(cy-110,cy+111,2):
  for x in range(cx-110,cx+111,2):
   if any(abs(x-q['x'])<32 and abs(y-q['y'])<32 for q in sites):continue
   tiles=[yy*W+xx for yy in range(y-3,y+31) for xx in range(x-3,x+31)]
   if any(M['MAPT'][q]>>4 not in (0,4) or M['MAPE'][q]&192 for q in tiles):continue
   hs=[M['MAPH'][yy*W+xx] for yy in range(y,y+29) for xx in range(x,x+29)]
   if min(hs)==0:continue
   score=abs(x+14-cx)+abs(y+14-cy)+(max(hs)-min(hs))*3
   candidates.append((score,x,y,min(hs),max(hs)))
 if not candidates:raise RuntimeError('No safe campus parcel '+name)
 _,x,y,low,high=min(candidates)
 item=dict(name=name,x=x,y=y,w=28,h=28,level=(low+high)//2,source_airport=sid,town=st['base'][0]['town']-1,airport_type=[1,3,4][len(sites)])
 sites.append(item);print(item)
(ROOT/'work/sites.json').write_text(json.dumps(sites,indent=2))
