from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent / '.tools'))
from nml.main import main
raise SystemExit(main(['--grf', sys.argv[1], sys.argv[2]]))
