"""Rebuild the four GRFs from this package's sources; does not install anything.

Requires Python and NML 0.9.0 available in the selected Python environment.
Run: python source/rebuild.py
"""
from pathlib import Path
import subprocess
import sys

SOURCE = Path(__file__).resolve().parent
OUTPUT = SOURCE.parent / 'newgrf' / 'airports'
KEYS = ('city_metro', 'city_grand', 'city_skyline', 'airport_grand')

if len(sys.argv) == 4 and sys.argv[1] == '--compile-one':
    from nml import main
    options = ['-c'] if sys.argv[3] == 'airport_grand.nml' else []
    raise SystemExit(main.main(options + ['--grf', sys.argv[2], sys.argv[3]]))

OUTPUT.mkdir(parents=True, exist_ok=True)
for key in KEYS:
    subprocess.run([sys.executable, str(Path(__file__).resolve()), '--compile-one',
                    str(OUTPUT / (key + '.grf')), key + '.nml'], cwd=SOURCE / key, check=True)
    print('Built ' + key + '.grf')
