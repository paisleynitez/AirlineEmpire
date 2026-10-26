from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys
import zipfile
ROOT = Path(__file__).resolve().parents[1]
dest = ROOT / 'test/package-rebuild'
dest.mkdir(exist_ok=True)
with zipfile.ZipFile(ROOT / 'City-and-Major-Airports-1.0.0.zip') as z:
    for name in z.namelist():
        assert (dest / name).resolve().is_relative_to(dest.resolve())
    z.extractall(dest)
env = dict(os.environ, PYTHONPATH=str(ROOT / '.tools'))
result = subprocess.run([sys.executable, str(dest / 'source/rebuild.py')], cwd=dest,
                        env=env, capture_output=True, text=True)
(ROOT / 'test/packaged-source-build.log').write_text(result.stdout + result.stderr)
assert result.returncode == 0, result.stderr
manifest = json.loads((dest / 'manifest.json').read_text())
matches = []
for airport in manifest['airports']:
    path = dest / airport['file']
    same = hashlib.sha256(path.read_bytes()).hexdigest() == airport['sha256']
    matches.append({'file': airport['file'], 'rebuild_exact_match': same})
    assert same, airport['file']
report = ROOT / 'release-verification.json'
data = json.loads(report.read_text())
data['packaged_source_rebuild'] = matches
report.write_text(json.dumps(data, indent=2))
print('PASS: extracted package source rebuilds all four GRFs byte-for-byte.')
