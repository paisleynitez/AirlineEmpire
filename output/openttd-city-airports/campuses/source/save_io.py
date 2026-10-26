from pathlib import Path
import lzma,json,copy,hashlib
from pathlib import Path
import json
class R:
 def __init__(self,b): self.b=b; self.p=0
 def read(self,n):
  b=self.b[self.p:self.p+n]; self.p+=n; assert len(b)==n; return b
 def u(self,n=1): return int.from_bytes(self.read(n),'big')
 def g(self):
  a=self.u(); n=0; mask=128
  while a&mask and n<4: a^=mask; n+=1; mask>>=1
  if n==4: a=0
  return (a<<(n*8))|self.u(n)
 def s(self): return self.read(self.g()).decode('utf-8',errors='replace')
 def header(self):
  h=[]
  while (t:=self.u()): h.append([self.s(),t,None])
  for f in h:
   if f[1]&15==11: f[2]=self.header()
  return h
 def obj(self,h):
  d={}
  for name,t,sub in h:
   base=t&15; n=self.g() if t&16 else 1
   if base==10: v=self.read(n).decode('utf-8',errors='replace')
   else:
    vals=[]
    for _ in range(n):
     if base==11: v=self.obj(sub)
     else: v=int.from_bytes(self.read({1:1,2:1,3:2,4:2,5:4,6:4,7:8,8:8,9:2}[base]),'big',signed=base in (1,3,5,7))
     vals.append(v)
    v=vals if t&16 else vals[0]
   d[name]=v
  return d

ROOT=Path('OpenTTD-expansion')
def gamma(i):
 if i<128:return bytes([i])
 if i<16384:return (i|0x8000).to_bytes(2,'big')
 if i<2097152:return (i|0xc00000).to_bytes(3,'big')
 if i<268435456:return (i|0xe0000000).to_bytes(4,'big')
 return b'\xf0'+i.to_bytes(4,'big')
def encode(d,h):
 b=bytearray()
 for name,t,sub in h:
  val=d[name];base=t&15
  if base==10:
   v=val.encode('utf8');b+=gamma(len(v))+v;continue
  vs=val if t&16 else [val]
  if t&16:b+=gamma(len(vs))
  for v in vs:
   b+=encode(v,sub) if base==11 else int(v).to_bytes({1:1,2:1,3:2,4:2,5:4,6:4,7:8,8:8,9:2}[base],'big',signed=base in (1,3,5,7))
 return bytes(b)
class Save:
 def __init__(self,path):
  self.source=Path(path).read_bytes();self.data=lzma.decompress(self.source[8:]);r=R(self.data);self.chunks={}
  while True:
   start=r.p;name=r.read(4)
   if name==b'\0'*4:break
   name=name.decode(); mode=r.u(); c={'mode':mode,'rows':{},'rawrows':{},'modified':False}; self.chunks[name]=c
   if mode&15==0:
    n=((mode>>4)<<24)|r.u(3);c['map']=bytearray(r.read(n))
   else:
    header=True;idx=0
    while(n:=r.g()):
     raw=r.read(n-1);rr=R(raw)
     if header and mode in (3,4):
      c['headerbytes']=raw;c['header']=rr.header();assert rr.p==len(raw);header=False;continue
     i=rr.g() if mode in (2,4) else idx;idx+=1
     c['rawrows'][i]=raw
     if rr.p==len(raw):continue
     if name in ['AIPL','GSDT']:continue
     v=rr.obj(c['header']);assert rr.p==len(raw),(name,i,rr.p,len(raw));c['rows'][i]=v
     assert (gamma(i) if mode in (2,4) else b'')+encode(v,c['header'])==raw,('roundtrip',name,i)
   c['raw']=self.data[start:r.p]
 def rows(self,n):return self.chunks[n]['rows']
 def edit(self,n):self.chunks[n]['modified']=True;return self.rows(n)
 def map(self,n):self.chunks[n]['modified']=True;return self.chunks[n]['map']
 def write(self,path,compression=6):
  out=bytearray()
  for name,c in self.chunks.items():
   if not c['modified']:out+=c['raw'];continue
   mode=c['mode'];out+=name.encode()
   if mode&15==0:
    b=c['map'];n=len(b);out+=((n&0xffffff)|((n>>24)<<28)).to_bytes(4,'big')+b;continue
   out+=bytes([mode])+gamma(len(c['headerbytes'])+1)+c['headerbytes']
   ids=sorted(set(c['rows'])|set(c['rawrows']))
   if mode in (1,3):ids=range(max(ids)+1) if ids else []
   for i in ids:
    if i in c['rows']:b=(gamma(i) if mode in (2,4) else b'')+encode(c['rows'][i],c['header'])
    else:b=c['rawrows'].get(i,b'')
    out+=gamma(len(b)+1)+b
   out+=b'\0'
  out+=b'\0'*4
  Path(path).write_bytes(self.source[:8]+lzma.compress(out,preset=compression))
  check=Save(path)
  for n,c in self.chunks.items():
   if c['modified']:assert check.chunks[n].get('rows')==c.get('rows') and check.chunks[n].get('map')==c.get('map'),n
   else:assert check.chunks[n]['raw']==c['raw'],n
  return check

