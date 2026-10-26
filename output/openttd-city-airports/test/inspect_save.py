"""Read-only verification of the isolated OpenTTD test save."""
from pathlib import Path
import lzma
import json
import sys
ROOT = Path(__file__).resolve().parents[1]
parser = Path('C:/Users/paisl/OneDrive/Documents/Claude/OpenTTD-expansion/read_save.py')
namespace = {}
exec(parser.read_text().split("r=R(Path(")[0], namespace)
R = namespace['R']
source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'test/runtime/save/airport-flight-test.sav'
data = source.read_bytes()
assert data[:4] == b'OTTX'
r = R(lzma.decompress(data[8:]))
chunks = {}
while True:
    name = r.read(4)
    if name == b'\0'*4: break
    name = name.decode()
    mode = r.u()
    c = {'mode': mode, 'entries': {}}
    chunks[name] = c
    if mode & 15 == 0:
        size = ((mode >> 4) << 24) | r.u(3)
        r.read(size)
        continue
    header = True
    idx = 0
    while (size := r.g()):
        rr = R(r.read(size - 1))
        if header and mode in (3, 4):
            c['header'] = rr.header()
            header = False
            continue
        i = rr.g() if mode in (2, 4) else idx
        idx += 1
        if not rr.b or name in ('AIPL', 'GSDT'): continue
        if 'header' in c:
            c['entries'][i] = rr.obj(c['header'])
summary = {}
for name in ('NGRF', 'STNN', 'VEHS', 'PLYR', 'DATE'):
    c = chunks.get(name, {})
    rows = c.get('entries', {})
    print(name, len(rows))
    summary[name] = rows
(ROOT / 'test' / (source.stem + '.json')).write_text(json.dumps(summary, indent=2))
print('Saved decoded test data; no source file changes.')
