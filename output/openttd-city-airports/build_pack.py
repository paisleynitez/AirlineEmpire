"""Build three city airports using existing artwork, plus one preserved major airport.

No files outside this project are changed. Requires Python, Pillow and NML 0.9.0.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / '.tools'
if TOOLS.exists():
    sys.path.insert(0, str(TOOLS))
from PIL import Image
from nml import main as nml_main

ORIGINAL = Path('C:/Users/paisl/OneDrive/Documents/OpenTTD/newgrf/airports')
OPENTTD_SOURCE = Path('C:/Users/paisl/OneDrive/Documents/Claude/OpenTTD-service-inspector/OpenTTD-15.3')
SOURCE = ROOT / 'source'
DELIVERY = ROOT / 'package'
GRFS = DELIVERY / 'newgrf' / 'airports'
REFERENCE = SOURCE / 'reference'
for folder in (SOURCE, GRFS, REFERENCE):
    folder.mkdir(parents=True, exist_ok=True)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

for filename in ('airport_defaults.h', 'airporttile_ids.h'):
    dest = REFERENCE / filename
    if not dest.exists():
        shutil.copy2(OPENTTD_SOURCE / 'src' / 'table' / filename, dest)
if not (REFERENCE / 'COPYING.md').exists():
    shutil.copy2(OPENTTD_SOURCE / 'COPYING.md', REFERENCE / 'COPYING.md')

tile_names = re.findall(r'^\s*(APT_[A-Z0-9_]+),', (REFERENCE / 'airporttile_ids.h').read_text(), re.M)
tile_ids = {name: i for i, name in enumerate(tile_names)}
defaults = (REFERENCE / 'airport_defaults.h').read_text()

def default_layout(key):
    section = re.search(r'_tile_table_' + key + r'_0\s*=\s*\{(.*?)\n\};', defaults, re.S).group(1)
    return [(int(x), int(y), name) for x, y, name in re.findall(r'MK\((\d+),\s*(\d+),\s*(APT_\w+)\)', section)]

CITY_REUSE = {
    (0, 0): (4, 4), (0, 1): (4, 5), (0, 2): (4, 6),
    (2, 1): (4, 7), (5, 3): (3, 3), (0, 3): (7, 2),
}
INTERNATIONAL_REUSE = {
    (0, 2): (1, 5), (3, 2): (4, 4), (3, 3): (4, 6),
    (3, 4): (3, 3), (6, 5): (0, 0),
    (0, 1): (7, 2),
}
AIRPORTS = [
    dict(key='city_metro', theme='metro', name='Metro City Airport', grfid='HCA1', base='city', override=1,
         size=[6, 6], runways=1, terminals=3, helipads=0, hangars=1, catchment=5, noise=5, maintenance=24,
         description='Modern white terminal and blue glazing. One runway, three aircraft stands.', mapping=CITY_REUSE),
    dict(key='city_grand', theme='grand', name='Grand City Metropolitan Airport', grfid='HCA2', base='metropolitan', override=3,
         size=[6, 6], runways=2, terminals=3, helipads=0, hangars=1, catchment=6, noise=8, maintenance=28,
         description='Classic copper-roof terminal. Separate arrival and departure runways, three stands.', mapping=CITY_REUSE),
    dict(key='city_skyline', theme='skyline', name='Skyline City International Airport', grfid='HCA3', base='international', override=4,
         size=[7, 7], runways=2, terminals=6, helipads=2, hangars=2, catchment=8, noise=17, maintenance=42,
         description='White peaked terminal and teal glazing. Two runways, six stands and two helipads.', mapping=INTERNATIONAL_REUSE),
]

manifest = dict(name='Hunninghall City and Major Airports', version='1.0.0', airports=[],
                compiler='NML 0.9.0', layout_reference='OpenTTD 15.3',
                architecture='Functional airports using original flight state machines and runway/stand/hangar coordinates.',
                original_files_unchanged=True, changes=[])

for a in AIRPORTS:
    folder = SOURCE / a['key']
    for sub in ('gfx', 'lang'):
        (folder / sub).mkdir(parents=True, exist_ok=True)
    original_folder = ORIGINAL / 'source' / ('airport_' + a['theme'])
    original_sheet = original_folder / 'gfx' / ('airport_' + a['theme'] + '.png')
    sheet = folder / 'gfx' / original_sheet.name
    if not sheet.exists():
        shutil.copy2(original_sheet, sheet)
    assert sha(sheet) == sha(original_sheet), 'Existing artwork must be preserved byte-for-byte'
    with Image.open(sheet) as im:
        assert im.mode == 'P' and im.size == (584, 168)
    original_nml = (original_folder / ('airport_' + a['theme'] + '.nml')).read_text()
    source_crops = {}
    for x, y, params in re.findall(r'spriteset\(spr_tile_(\d+)_(\d+),[^\n]+?\{\s*\[([^]]+)\]', original_nml):
        source_crops[(int(x), int(y))] = params
    layout = default_layout(a['base'])
    assert len(layout) == a['size'][0] * a['size'][1]
    assert len({(x, y) for x, y, _ in layout}) == len(layout)
    assert all(pos in {(x, y) for x, y, _ in layout} for pos in a['mapping'])
    lines = [f'''grf {{
    grfid: "{a['grfid']}";
    name: string(STR_GRF_NAME);
    desc: string(STR_GRF_DESC);
    version: 1;
    min_compatible_version: 1;
}}
''']
    for x, y, original_tile in layout:
        if (x, y) not in a['mapping']:
            continue
        assert not any(s in original_tile for s in ('RUNWAY', 'STAND', 'DEPOT', 'HELIPAD', 'APRON', 'PIER'))
        crop = source_crops[a['mapping'][(x, y)]]
        name = f'tile_{x}_{y}'
        lines += [f'''spriteset(sprite_{name}, "gfx/{sheet.name}") {{ [{crop}] }}
spritelayout layout_{name} {{
    ground {{ sprite: 2634; }}
    building {{ sprite: sprite_{name}; xoffset: 0; yoffset: 0; zoffset: 0; xextent: 16; yextent: 16; zextent: 40; }}
}}
item(FEAT_AIRPORTTILES, {name}) {{
    property {{ substitute: {tile_ids[original_tile]}; }}
    graphics {{ default: layout_{name}; }}
}}
''']
    lines.append('tilelayout airport_layout {\n    rotation: DIRECTION_NORTH;')
    for x, y, original_tile in layout:
        tile = f'tile_{x}_{y}' if (x, y) in a['mapping'] else str(tile_ids[original_tile])
        lines.append(f'    {x}, {y}: {tile};')
    lines.append('}\n')
    lines.append(f'''item(FEAT_AIRPORTS, {a['key']}) {{
    property {{
        override: {a['override']};
        name: string(STR_AIRPORT_NAME);
        layouts: [airport_layout];
        years_available: [1960, 65535];
        ttd_airport_type: AIRPORTTYPE_LARGE;
        catchment_area: {a['catchment']};
        noise_level: {a['noise']};
        maintenance_cost: {a['maintenance']};
    }}
    graphics {{ additional_text: string(STR_ADDITIONAL); }}
}}
''')
    nml = folder / (a['key'] + '.nml')
    nml.write_text('\n'.join(lines), encoding='utf-8')
    lang = ('##grflangid 0x01\n'
            f"STR_GRF_NAME :Hunninghall {a['name']} 1.0\n"
            f"STR_GRF_DESC :{a['description']} Replaces the default {a['base']} airport. Original aircraft movement and airside layout retained. Available from 1960.\n"
            f"STR_AIRPORT_NAME :{a['name']}\n"
            f"STR_ADDITIONAL :{a['description']}\n")
    (folder / 'lang' / 'english.lng').write_text(lang, encoding='utf-8')
    target = GRFS / (a['key'] + '.grf')
    result = subprocess.run([sys.executable, str(ROOT / 'compile_nml.py'), str(target), nml.name], cwd=folder, capture_output=True, text=True)
    (folder / 'build.log').write_text(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    data = {k: v for k, v in a.items() if k != 'mapping'}
    data.update(file='newgrf/airports/' + target.name, sha256=sha(target), bytes=target.stat().st_size,
                artwork_sha256=sha(sheet), reused_tiles=len(a['mapping']), modified_movement_tiles=0,
                artwork_origin=str(original_sheet), available_from=1960,
                all_original_flight_routes_preserved=True)
    manifest['airports'].append(data)
    manifest['changes'].append(f"Built {target.name}: {a['size'][0]}x{a['size'][1]}, {a['runways']} runway(s), {a['terminals']} aircraft stands.")
    print(f"BUILT {target.name}: {target.stat().st_size} bytes", flush=True)

# Reuse the existing major airport exactly; do not regenerate it or change its GRFID.
major = ORIGINAL / 'airport_grand.grf'
shutil.copy2(major, GRFS / major.name)
shutil.copytree(ORIGINAL / 'source' / 'airport_grand', SOURCE / 'airport_grand', dirs_exist_ok=True)
assert sha(major) == sha(GRFS / major.name)
manifest['airports'].append(dict(key='airport_grand', name='Grand Union Air Terminal', grfid_hex='48544102',
    file='newgrf/airports/airport_grand.grf', sha256=sha(major), bytes=major.stat().st_size,
    size=[9, 11], base='intercontinental', override=7, runways=4, terminals=8, helipads=2, hangars=2,
    available_from=1960, catchment=10, noise=25, maintenance=72, reused_existing_grf=True,
    original_path=str(major), all_original_flight_routes_preserved=True))
manifest['changes'].append('Reused airport_grand.grf unchanged as the major airport; preserved all installed originals.')
assert len(manifest['airports']) == 4
assert len({a['file'] for a in manifest['airports']}) == 4
(DELIVERY / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('COMPLETE: exactly four GRFs, three new city airports and one preserved major airport.', flush=True)
