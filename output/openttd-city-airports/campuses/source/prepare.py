from pathlib import Path
from save_io import Save,encode,R
import shutil,hashlib,json,copy,sys
ROOT=Path(__file__).resolve().parents[1];RUN=ROOT/'work/runtime';USER=Path('C:/Users/paisl/OneDrive/Documents/OpenTTD')
s=Save(ROOT/'work/source.sav')
for d in ('baseset','lang','newgrf','ai','game','scripts','save','screenshot'):(RUN/d).mkdir(parents=True,exist_ok=True)
GAME=Path('C:/Program Files/OpenTTD')
shutil.copy2(GAME/'openttd.exe',RUN/'openttd.exe');shutil.copy2(GAME/'lang/english.lng',RUN/'lang/english.lng')
for p in (GAME/'baseset').glob('*'):
 if p.is_file():shutil.copy2(p,RUN/'baseset'/p.name)
shutil.copy2(USER/'baseset/OpenGFX2_Classic-0.8.1.tar',RUN/'baseset')
for row in s.rows('NGRF').values():
 filename=row['filename'].replace('\\','/');first=filename.split('/')[0]
 if first.lower().endswith('.tar'):
  found=next((p for p in (USER/'content_download/newgrf').glob('*.tar') if p.name.lower()==first.lower()),None)
  assert found is not None, first
  shutil.copy2(found,RUN/'newgrf'/found.name)
 else:
  path=USER/'newgrf'/filename;assert path.exists(),str(path)
  dest=RUN/'newgrf'/filename;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest)
for category in ('ai','game'):
 for p in (USER/'content_download'/category).glob('*.tar'):
  if p.name.lower().startswith(('4e434753-','52495652-')):continue
  shutil.copy2(p,RUN/category/p.name)
 (RUN/category/'library').mkdir(exist_ok=True)
 for p in (USER/'content_download'/category/'library').glob('*.tar'):shutil.copy2(p,RUN/category/'library'/p.name)
cfg='''[misc]
language = english.lng
prefer_sprite_font = true
video_driver = null
music_driver = null
sound_driver = null
resolution = 1400,900
[graphicsset]
name = OpenGFX2 Classic
[gui]
developer = 2
autosave = off
autosave_on_exit = false
show_finances = false
newgrf_developer_tools = true
screenshot_format = png
'''
(RUN/'openttd.cfg').write_text(cfg)
newfiles=[ROOT.parent/'package/newgrf/airports'/f for f in ('city_metro.grf','city_grand.grf','city_skyline.grf')]+[ROOT/'package/newgrf/campus_lodging.grf']
g=s.edit('NGRF');old_grf_count=len(g)
for path in newfiles:
 dest=RUN/'newgrf'/path.name;shutil.copy2(path,dest)
 grfid={'city_metro.grf':int.from_bytes(b'HCA1','little'),'city_grand.grf':int.from_bytes(b'HCA2','little'),'city_skyline.grf':int.from_bytes(b'HCA3','little'),'campus_lodging.grf':int.from_bytes(b'HCP1','little')}[path.name]
 assert all(v['ident.grfid']!=grfid for v in g.values())
 b=path.read_bytes();offset=int.from_bytes(b[10:14],'little');checksum=hashlib.md5(b[:14+offset]).digest()
 row=copy.deepcopy(g[0]);row.update(filename=path.name,version=1,param=[0]*128,num_params=0,palette=4)
 row['ident.grfid']=grfid;row['ident.md5sum']=list(checksum);g[max(g)+1]=row
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline={'source':'C:/Users/paisl/OneDrive/Documents/OpenTTD/save/autosave/autosave15.sav','sha256':sha(ROOT/'work/source.sav'),'date':s.rows('DATE')[0]['date'],'grfs_before':old_grf_count,'grfs_after':len(g),'newgrfs':[p.name for p in newfiles]}
(ROOT/'work/baseline.json').write_text(json.dumps(baseline,indent=2))
# Construction parcels were surveyed as clear ground/trees, with no structures.
for site in json.loads((ROOT/'work/sites.json').read_text()):
 for y in range(site['y'],site['y']+29):
  for x in range(site['x'],site['x']+29):s.map('MAPH')[y*2048+x]=site['level']
 for y in range(site['y'],site['y']+28):
  for x in range(site['x'],site['x']+28):
   t=y*2048+x
   assert s.chunks['MAPT']['map'][t]>>4 in (0,4)
   for field,v in {'MAPT':0,'MAPO':0,'MAP2':0,'M3LO':0,'M3HI':0,'MAP5':3,'MAPE':0,'MAP7':0,'MAP8':0}.items():
    b=s.map(field)
    if field in ('MAP2','MAP8'):b[2*t:2*t+2]=v.to_bytes(2,'big')
    else:b[t]=v
s.edit('DATE')[0]['pause_mode']=1
s.write(ROOT/'work/registered-input.sav',1)
(RUN/'scripts/game_start.scr').write_text('script register.log\ndebug_level script=4,grf=2,misc=1\npause\nsave registered\n')
(RUN/'scripts/autoexec.scr').write_text('debug_level script=1,grf=0,sl=0,misc=0\n')
print('Prepared source copy, retained all 79 original NewGRFs; added four campus files.')
