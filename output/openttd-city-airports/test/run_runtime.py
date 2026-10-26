from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / 'test' / 'runtime'
cfg = RUN / 'openttd.cfg'
settings = cfg.read_text()
if 'prefer_sprite_font' not in settings:
    cfg.write_text(settings.replace('[misc]', '[misc]\nprefer_sprite_font = true'))
mode = sys.argv[1] if len(sys.argv) > 1 else 'flight'
if mode == 'reload':
    (RUN / 'scripts/game_start.scr').write_text('script reload-console.log\ndebug_level script=4,grf=1,misc=1\nunpause\nschedule on-next-calendar-month scripts/reload_done.scr\n')
    (RUN / 'scripts/reload_done.scr').write_text('save airport-reloaded\npause\nquit\n')
    save = RUN / 'save/airport-flight-test.sav'
else:
    save = RUN / 'flat.png'
log = ROOT / 'test' / (mode + '.log')
console = RUN / (mode + '-console.log')
if console.exists():
    console.unlink()
with log.open('w', encoding='utf-8') as handle:
    ticks = 7000 if mode == 'reload' else 400000
    args = [str(RUN / 'openttd.exe'), '-X', '-x', '-c', str(RUN / 'openttd.cfg'), '-g', str(save),
            '-v', 'null:ticks=' + str(ticks), '-s', 'null', '-m', 'null']
    p = subprocess.Popen(args, cwd=RUN, stdout=handle, stderr=subprocess.STDOUT)
    print('Started isolated ' + mode + ' test, PID ' + str(p.pid), flush=True)
    try:
        rc = p.wait(timeout=150)
    except subprocess.TimeoutExpired:
        p.terminate()
        p.wait(timeout=10)
        raise RuntimeError('Isolated test timed out; see ' + str(log))
print('Exit code:', rc)
content = log.read_text(encoding='utf-8', errors='replace')
if console.exists():
    content += console.read_text(encoding='utf-8', errors='replace')
log.write_text(content, encoding='utf-8')
for line in content.splitlines():
    if any(word in line for word in ('AIRPORT_', 'AIRCRAFT_', 'Error', 'error', 'warning', 'Warning')):
        print(line)
required = 'AIRPORT_RELOAD_PASS' if mode == 'reload' else 'AIRPORT_FLIGHT_PASS'
if rc != 0 or 'AIRPORT_TEST_FAIL' in content or required not in content:
    print('Required validation marker:', required, '- found:', required in content)
    raise SystemExit(1)
