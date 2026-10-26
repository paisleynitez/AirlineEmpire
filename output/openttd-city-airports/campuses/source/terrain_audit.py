from pathlib import Path
from save_io import Save
import json,collections
ROOT=Path(__file__).resolve().parents[1];s=Save(ROOT/'work/source.sav')
sites=json.loads((ROOT/'work/sites.json').read_text())
for q in sites:
 heights=collections.Counter(s.chunks['MAPH']['map'][y*2048+x] for y in range(q['y'],q['y']+29) for x in range(q['x'],q['x']+29))
 print(q['name'],heights)
 q['level']=3 if q['name']=='Wradtown' else 2
(ROOT/'work/sites.json').write_text(json.dumps(sites,indent=2))
