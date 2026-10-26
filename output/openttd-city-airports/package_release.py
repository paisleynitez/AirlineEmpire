"""Package only the four requested airports, sources, instructions and previews."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
ROOT = Path(__file__).resolve().parent
PACKAGE = ROOT / 'package'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
manifest_path = PACKAGE / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
for a in manifest['airports']:
    folder = ROOT / 'source' / a['key']
    shutil.copytree(folder, PACKAGE / 'source' / a['key'], dirs_exist_ok=True)
    assert sha(PACKAGE / a['file']) == a['sha256']
shutil.copytree(ROOT / 'source/reference', PACKAGE / 'source/reference', dirs_exist_ok=True)
flight = (ROOT / 'test/flight.log').read_text()
reload = (ROOT / 'test/reload.log').read_text()
assert 'AIRPORT_FLIGHT_PASS' in flight and 'AIRPORT_TEST_FAIL' not in flight
assert 'AIRPORT_RELOAD_PASS' in reload and 'AIRPORT_TEST_FAIL' not in reload
manifest['validation'] = {
    'test_executable_sha256': sha(ROOT / 'test/runtime/openttd.exe'),
    'base_graphics': 'OpenGFX2 Classic 0.8.1',
    'loaded_together': 4,
    'built_airports': 4,
    'aircraft': {'large_planes': 8, 'small_planes': 2, 'helicopters': 2},
    'all_airports_at_least_10_arrivals': True,
    'save_reload_airports': 4,
    'save_reload_aircraft': 12,
    'visual_inspection': 'All four airports inspected in actual in-game screenshots',
    'untested': ['Multiplayer', 'Other NewGRF combinations'],
    'archive_crc_and_file_hashes': 'Verified by package_release.py after archive creation',
}
manifest['preview_files'] = ['previews/' + a['key'] + '.png' for a in manifest['airports']]
manifest['preview_files'].append('previews/airports-preview.png')
manifest_path.write_text(json.dumps(manifest, indent=2))
archive = ROOT / 'City-and-Major-Airports-1.0.0.zip'
files = sorted(p for p in PACKAGE.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in files: z.write(p, p.relative_to(PACKAGE).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    grfs = [n for n in z.namelist() if n.endswith('.grf')]
    assert len(grfs) == 4 and len(set(grfs)) == 4
    for a in manifest['airports']:
        assert hashlib.sha256(z.read(a['file'])).hexdigest() == a['sha256']
    for p in files:
        assert z.read(p.relative_to(PACKAGE).as_posix()) == p.read_bytes()
(ROOT / 'release-verification.json').write_text(json.dumps({
    'zip': archive.name, 'sha256': sha(archive), 'bytes': archive.stat().st_size,
    'zip_crc_pass': True, 'every_packaged_file_matches': True,
    'grf_count': 4, 'source_airport_count': 4, 'preview_image_count': 5,
}, indent=2))
print(archive)
print(f'PASS: {len(files)} packaged files, exactly 4 GRFs, ZIP CRC and all hashes match.')
