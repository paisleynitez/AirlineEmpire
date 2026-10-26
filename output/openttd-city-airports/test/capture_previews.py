from pathlib import Path
import subprocess
import time
import shutil
ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / 'test/runtime'
OUT = ROOT / 'package/previews'
OUT.mkdir(parents=True, exist_ok=True)
shots = [('all-airports-world',0,0)]
for name, x, y in shots:
    dest = RUN / 'screenshot' / (name + '.png')
    if dest.exists():
        shutil.copy2(dest, OUT / dest.name)
        continue
    script = f'script preview-{name}.log\npause\nscreenshot giant {name}\n'
    (RUN / 'scripts/game_start.scr').write_text(script)
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = 0
    with (ROOT / 'test' / (name + '-render.log')).open('w') as log:
        p = subprocess.Popen([str(RUN/'openttd.exe'),'-X','-x','-c',str(RUN/'openttd.cfg'),
            '-g',str(RUN/'save/airport-flight-test.sav'),'-v','win32','-b','32bpp-anim','-r','1000x700',
            '-s','null','-m','null'],cwd=RUN,stdout=log,stderr=subprocess.STDOUT,startupinfo=startup)
        try:
            end = time.monotonic()+45
            while time.monotonic()<end:
                if dest.exists() and dest.stat().st_size>1000:
                    time.sleep(1)
                    break
                if p.poll() is not None:
                    raise RuntimeError(f'{name}: renderer exited {p.returncode}')
                time.sleep(0.3)
            else:
                raise RuntimeError(f'{name}: screenshot timeout')
        finally:
            if p.poll() is None:
                p.terminate()
                p.wait(timeout=10)
    shutil.copy2(dest, OUT / dest.name)
    print('CAPTURED', name, dest.stat().st_size, flush=True)
