from pathlib import Path
import subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1];RUN=ROOT/'work/runtime'
mode=sys.argv[1] if len(sys.argv)>1 else 'register'
save=ROOT/'work'/('builder-input.sav' if mode=='build' else 'registered-input.sav')
log=ROOT/'work'/f'{mode}.log'
with log.open('w') as f:
 if mode=='build':
  (RUN/'scripts/game_start.scr').write_text('script build-console.log\ndebug_level script=4,grf=0,sl=0,misc=0\nunpause\nschedule on-next-calendar-month scripts/month.scr\n')
  (RUN/'scripts/month.scr').write_text('save campus-building\nschedule on-next-calendar-month scripts/month.scr\n')
  for pth in (RUN/'build-console.log',):
   if pth.exists():pth.unlink()
 args=[str(RUN/'openttd.exe'),'-X','-x','-c',str(RUN/'openttd.cfg'),'-g',str(save),'-v','win32' if mode=='observe' else 'null:ticks=24000' if mode=='build' else 'null:ticks=4000','-s','null','-m','null']
 startup=subprocess.STARTUPINFO();startup.dwFlags|=subprocess.STARTF_USESHOWWINDOW;startup.wShowWindow=0
 p=subprocess.Popen(args,cwd=RUN,stdout=f,stderr=subprocess.STDOUT,startupinfo=startup)
 print('Started',p.pid,flush=True)
 deadline=time.monotonic()+(55 if mode=='observe' else 180)
 while p.poll() is None and time.monotonic()<deadline:
  if mode=='build' and 'CAMPUS_FAIL' in log.read_text(errors='replace'):p.terminate();break
  time.sleep(.3)
 if p.poll() is None:p.terminate()
 rc=p.wait(timeout=10)
print('Exit',rc)
for line in log.read_text(errors='replace').splitlines():
 if any(x in line for x in ('CAMPUS_','Your script','Failed to compile','CALLSTACK','line [','error=')):print(line)
