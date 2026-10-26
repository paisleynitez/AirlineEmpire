from pathlib import Path
from save_io import Save
from collections import Counter
ROOT=Path(__file__).resolve().parents[1];old=Save(ROOT/'work/source.sav');new=Save(ROOT/'work/builder-input.sav');oh=old.chunks['MAPH']['map'];nh=new.chunks['MAPH']['map'];types=old.chunks['MAPT']['map'];affected={}
for v,(a,b) in enumerate(zip(oh,nh)):
 if a==b:continue
 for t in (v,v-1,v-2048,v-2049):
  if t<0:continue
  ty=types[t]>>4
  if ty not in (0,4):affected[t]=ty
print('Protected structures with changed terrain',Counter(affected.values()), [(t%2048,t//2048,ty) for t,ty in affected.items()][:50])
assert not affected,'Existing structures must keep their terrain'
