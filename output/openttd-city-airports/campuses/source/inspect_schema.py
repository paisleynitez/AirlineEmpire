from pathlib import Path
from save_io import Save,R
ROOT=Path(__file__).resolve().parents[1];s=Save(ROOT/'work/source.sav')
for n,idx in [('STNN',0),('PLYR',0),('INDY',0),('VEHS',0),('VIEW',0)]:
 row=s.rows(n).get(idx,next(iter(s.rows(n).values())));print(n,repr(row)[:5000])
print('GS header',s.chunks['GSDT']['header']);print('GS config',R(s.chunks['GSDT']['rawrows'][0]).obj(s.chunks['GSDT']['header']))
