from pathlib import Path
import json,copy,re,collections
from save_io import Save,encode,gamma
ROOT=Path(__file__).resolve().parents[1];RUN=ROOT/'work/runtime'
s=Save(RUN/'save/registered.sav')
original=Save(ROOT/'work/source.sav')
for chunk in ('AIPL','GSDT'):s.chunks[chunk]=copy.deepcopy(original.chunks[chunk])
print('Registered GRFs',len(s.rows('NGRF')))
print('Settings',{k:v for k,v in s.rows('PATS')[0].items() if any(w in k for w in ('station_spread','industry','infinite_money','town_council','noise','vehicle_limit','max_','plane_crash','breakdown'))})
print('Airports',[(k,v['airport.type']) for k,v in s.rows('STNN').items() if 'airport.type' in v and v.get('airport.tile',0)])
print('Industry new mappings',[(k,v) for k,v in s.rows('IIDS').items() if v['grfid']==int.from_bytes(b'HCP1','little')])
s.edit('PLYR')[0]['is_ai']=1
a=s.chunks['AIPL'];a['modified']=True
name='CampusBuilder';a['rawrows'][0]=encode({'name':name,'settings':'','version':1},a['header'])+gamma(len(name))+name.encode()+b'\0'+(1).to_bytes(4,'big')+b'\0'
s.edit('PLYR')[1]['is_ai']=0
r=__import__('save_io').R(a['rawrows'][1]);config=r.obj(a['header']);a['rawrows'][1]=encode(config,a['header'])
gs=s.chunks['GSDT'];gs['modified']=True;gs['rawrows'][0]=encode({'name':'','settings':'','version':4294967295},gs['header'])+b'\0'
p=s.edit('PATS')[0]
for k,v in {'station.station_spread':32,'economy.station_noise_level':0,'difficulty.town_council_tolerance':3,'difficulty.infinite_money':1,'economy.multiple_industry_per_town':1,'industry.allow_multiple_industry_per_town':1,'economy.town_growth_rate':0}.items():
 if k in p:p[k]=v
s.edit('DATE')[0]['pause_mode']=0
d=RUN/'ai/CampusBuilder';d.mkdir(parents=True,exist_ok=True)
(d/'info.nut').write_text('''class CampusBuilderInfo extends AIInfo {
 function GetAuthor(){return "Campus pack";}
 function GetName(){return "CampusBuilder";}
 function GetDescription(){return "Temporary isolated save builder";}
 function GetVersion(){return 1;}
 function GetDate(){return "2026-10-08";}
 function CreateInstance(){return "CampusBuilder";}
 function GetShortName(){return "HCAB";}
 function GetAPIVersion(){return "15";}
}
RegisterAI(CampusBuilderInfo());
''')
sites=json.loads((ROOT/'work/sites.json').read_text())
for site in sites:
 starts=[(site['y']+dy)*2048+site['x']+dx for dx,dy in [(0,j) for j in range(1,27)]+[(26,j) for j in range(1,27)]+[(j,1) for j in range(27)]+[(j,26) for j in range(27)]]
 q=collections.deque(starts);parents={t:None for t in starts};goal=None
 while q:
  t=q.popleft();x=t%2048;y=t//2048;ty=s.chunks['MAPT']['map'][t]>>4
  if ty==2 and s.chunks['MAP5']['map'][t]<64:
   ht=s.chunks['MAPH']['map']
   if {ht[v] for v in (t,t+1,t+2048,t+2049)}=={site['level']}:goal=t;break
  if ty==2:continue
  for n in (t-1,t+1,t-2048,t+2048):
   nx=n%2048;ny=n//2048
   if n in parents or abs(nx-site['x'])>150 or abs(ny-site['y'])>150:continue
   if site['x']<nx<site['x']+28 and site['y']<ny<site['y']+28:continue
   if any(other is not site and other['x']<=nx<other['x']+28 and other['y']<=ny<other['y']+28 for other in sites):continue
   if s.chunks['MAPT']['map'][n]>>4 not in (0,4,2) or s.chunks['MAPE']['map'][n]&192:continue
   if s.chunks['MAPT']['map'][n]>>4 in (0,4):
    blocked=False
    for yy in range(ny-1,ny+2):
     for xx in range(nx-1,nx+2):
      z=yy*2048+xx;typ=s.chunks['MAPT']['map'][z]>>4
      if typ in (0,4):continue
      if typ==2 and s.chunks['MAP5']['map'][z]<64 and {s.chunks['MAPH']['map'][v] for v in (z,z+1,z+2048,z+2049)}=={site['level']}:continue
      blocked=True
    if blocked:continue
   ht=s.chunks['MAPH']['map'];heights=[ht[n],ht[n+1],ht[n+2048],ht[n+2049]]
   if min(heights)==0 or max(heights)-min(heights)>1:continue
   parents[n]=t;q.append(n)
 assert goal is not None,site
 path=[];t=goal
 while parents[t] is not None:path.append([parents[t],t]);t=parents[t]
 site['connection']=list(reversed(path));print(site['name'],'city connection tiles',len(path),'to',goal%2048,goal//2048)
 # Grade only the clear/tree approach corridor; keep existing-road vertices fixed.
 ht=s.map('MAPH');mt=s.chunks['MAPT']['map'];protected={goal,goal+1,goal+2048,goal+2049}
 endpoint=ht[goal]
 for pair in site['connection']:
  for t in pair:
   for v in (t,t+1,t+2048,t+2049):
    if v in protected:continue
    near=min(abs(v%2048-p%2048)+abs(v//2048-p//2048) for p in protected)
    level=max(endpoint-near,min(site['level'],endpoint+near))
    if all(mt[n]>>4 in (0,4) for n in (v,v-1,v-2048,v-2049)):ht[v]=level
 # Smooth raised terrain into surrounding open ground.
 seeds=[(site['y']+dy)*2048+site['x']+dx for dy in range(29) for dx in range(29)]
 seeds.extend(v for pair in site['connection'] for t in pair for v in (t,t+1,t+2048,t+2049))
 queue=collections.deque(seeds)
 while queue:
  v=queue.popleft()
  for n in (v-1,v+1,v-2048,v+2048):
   if abs(ht[n]-ht[v])<=1 or n in protected:continue
   if not all(mt[t]>>4 in (0,4) for t in (n,n-1,n-2048,n-2049)):continue
   ht[n]=max(ht[v]-1,min(ht[n],ht[v]+1));queue.append(n)
(ROOT/'work/build-sites.json').write_text(json.dumps(sites,indent=2))
(d/'sites.nut').write_text('CAMPUS_SITES <- '+re.sub(r'"(\w+)" =',r'\1 =',json.dumps(sites).replace(':',' ='))+';\n')
(d/'main.nut').write_text('require("sites.nut");\n'+(ROOT/'source/campus_builder.nut').read_text())
s.write(ROOT/'work/builder-input.sav',1)
print('Builder staged')
