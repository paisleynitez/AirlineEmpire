"""Create deterministic isometric lodging sprites and a functional campus GRF."""
from pathlib import Path
import sys,re,subprocess,json,shutil
ROOT=Path(__file__).resolve().parents[1];TOOLS=ROOT.parent/'.tools';sys.path.insert(0,str(TOOLS))
from PIL import Image
ORIGINAL=Path('C:/Users/paisl/OneDrive/Documents/OpenTTD/newgrf')
renderer=(ORIGINAL/'airports/source/make_airports.py').read_text().split("exec(open(os.path.join")[0]
renderer=renderer.replace('HMAX = 40;', 'HMAX = 96;')
(ROOT/'source/isometric.py').write_text(renderer)
ns={};exec(renderer,ns)
box=ns['box'];disc=ns['disc'];sh=ns['sh'];render=ns['render_tile'];sheet_for=ns['sheet_for']
OUT=ROOT/'package/newgrf';OUT.mkdir(parents=True,exist_ok=True)
FOLDER=ROOT/'source/campus_lodging';(FOLDER/'gfx').mkdir(parents=True,exist_ok=True);(FOLDER/'lang').mkdir(exist_ok=True)
WHITE=(232,232,222);GLASS=(76,143,174);BRICK=(178,112,75);ROOF=(94,149,133);PATH=(196,185,166);GREEN=(75,128,65)
def building(x0,y0,x1,y1,z,height,wall=WHITE,glass=GLASS):
    out=[box(x0,y0,x1,y1,z,height,WHITE,wall,sh(wall,.72))]
    for floor in range(int(z)+5,int(height)-2,6):
        out += [box(x0,y1-.5,x1,y1,floor,floor+3,glass,glass,glass),box(x1-.5,y0,x1,y1,floor,floor+3,glass,glass,sh(glass,.7))]
    out += [box(x0-.4,y0-.4,x1+.4,y1+.4,height,height+1.8,ROOF)]
    return out
def scene(kind):
    sizes={'skyline_hotel':(4,4),'grand_hotel':(6,4),'lagoon_resort':(6,6),'campus_mail':(2,2)}
    w,h=sizes[kind];boxes=[];things=[]
    def ground(x,y):
        if kind=='lagoon_resort' and 32<x<66 and 32<y<64:
            if 35<x<62 and 35<y<60:return (65,160,188) if int(x+y)%7 else (137,203,222)
            return (214,206,179)
        if x<3 or y<3 or x>w*16-3 or y>h*16-3:return GREEN
        return PATH if int(x+y)%6 else (185,174,155)
    if kind=='skyline_hotel':
        boxes+=building(8,8,56,52,0,12,WHITE)
        boxes+=building(9,9,28,35,12,72,WHITE)
        boxes+=building(36,10,54,34,12,60,WHITE)
        boxes += [box(22,48,43,58,0,7,GLASS),box(19,46,46,60,7,8.5,WHITE)]
        things += [(9,57,'tree'),(54,57,'tree'),(30,58,'flag'),(4,22,'car0'),(4,35,'car2')]
    elif kind=='grand_hotel':
        boxes+=building(8,8,87,27,0,45,BRICK)
        boxes+=building(8,27,29,49,0,33,BRICK)
        boxes+=building(69,27,87,49,0,33,BRICK)
        boxes+=building(36,34,61,51,0,14,WHITE)
        boxes+=[box(40,49,57,60,0,6,WHITE),box(36,48,63,60,6,8,ROOF)]
        things += [(33,34,'jet'),(63,34,'jet'),(31,58,'flag'),(67,58,'flag'),(5,42,'tree'),(91,40,'tree')]
    elif kind=='lagoon_resort':
        boxes+=building(8,8,87,27,0,42,WHITE)
        boxes+=building(8,27,27,79,0,30,WHITE)
        boxes+=building(70,27,87,79,0,30,WHITE)
        boxes+=building(34,70,65,88,0,16,WHITE)
        for x in (31,43,55,65):
            things += [(x,66,'bench'),(x,30,'tree')]
        things += [(4,4,'pine'),(91,4,'pine'),(4,89,'tree'),(91,89,'tree'),(32,80,'flag'),(68,80,'flag')]
    else:
        boxes+=building(4,4,28,24,0,18,(195,196,188))
        boxes+=[box(8,23,25,29,1,5,GLASS),box(3,2,29,25,18,20,(165,71,54))]
        things += [(6,26,'car1'),(15,26,'car2')]
    return w,h,(w,ground,boxes,things)
items=[('skyline_hotel','Skyline Airport Hotel',14,4),('grand_hotel','Grand Conference Hotel',18,5),('lagoon_resort','Lagoon Airport Resort',24,6),('campus_mail','Airport Mail and Logistics Centre',3,12)]
lines=['grf { grfid: "HCP1"; name: string(STR_GRF_NAME); desc: string(STR_GRF_DESC); version: 1; min_compatible_version: 1; }','cargotable { PASS, MAIL, GOOD }']
lang=['##grflangid 0x01','STR_GRF_NAME :Hunninghall Airport Campus Lodging 1.0','STR_GRF_DESC :Large airport hotels, conference hotel, pool resort, mail logistics and passenger-facing campus buildings.']
for local,(key,name,passrate,mailrate) in enumerate(items):
    w,h,sc=scene(key);tiles=[render(sc,x,y) for y in range(h) for x in range(w)]
    sheet,pos=sheet_for(tiles);sheet.save(FOLDER/'gfx'/f'{key}.png')
    for n,(x,y) in enumerate([(x,y) for y in range(h) for x in range(w)]):
        ox,oy=pos[n];sid=f'{key}_{x}_{y}'
        lines.append(f'''spriteset(spr_{sid}, "gfx/{key}.png") {{ [{ox},{oy},64,128,-31,-96] }}
spritelayout lay_{sid} {{ ground {{ sprite: GROUNDSPRITE_NORMAL; }} building {{ sprite: spr_{sid}; xextent: 16; yextent: 16; zextent: 90; }} }}
item(FEAT_INDUSTRYTILES, tile_{sid}) {{ property {{ substitute: 0; accepted_cargos: [[PASS,8],[MAIL,8],[GOOD,4]]; }} graphics {{ default: lay_{sid}; }} }}''')
    layout='\n'.join(f' {x},{y}: tile_{key}_{x}_{y};' for y in range(h) for x in range(w))
    lines.append(f'tilelayout layout_{key} {{\n{layout}\n}}')
    lines.append(f'produce(tick_{key}, [], [PASS: {passrate}; MAIL: {mailrate};], 0)')
    lines.append(f'produce(arrival_{key}, [PASS: incoming_cargo_waiting("PASS"); MAIL: incoming_cargo_waiting("MAIL"); GOOD: incoming_cargo_waiting("GOOD");], [PASS: incoming_cargo_waiting("PASS");], 0)')
    lines.append(f'''item(FEAT_INDUSTRIES, {key}, {local}) {{ property {{ substitute: 0; life_type: IND_LIFE_TYPE_PROCESSING; layouts: [layout_{key}];
 cargo_types: [accept_cargo("PASS"),accept_cargo("MAIL"),accept_cargo("GOOD"),produce_cargo("PASS",0),produce_cargo("MAIL",0)]; min_cargo_distr: 1;
 spec_flags: 0; name: string(STR_{key.upper()}); nearby_station_name: string(STR_{key.upper()}); fund_cost_multiplier: 40; remove_cost_multiplier: 0; prob_map_gen: 0; prob_in_game: 0; map_colour: 0x8A;
 }} graphics {{ produce_cargo_arrival: arrival_{key}; produce_256_ticks: tick_{key}; monthly_prod_change: CB_RESULT_IND_PROD_NO_CHANGE; random_prod_change: CB_RESULT_IND_PROD_NO_CHANGE; }} }}''')
    lang.append(f'STR_{key.upper()} :{name}')
# Reuse the user's existing retail and restaurant sprite sheets without redraws.
for local,(key,name) in enumerate([('deptstore','Airport Concourse Shops'),('grill','Airport Dining Pavilion')],start=4):
    old=ORIGINAL/'town_buildings_source'/key
    shutil.copy2(old/'gfx'/f'{key}.png',FOLDER/'gfx'/f'{key}.png')
    text=(old/f'{key}.nml').read_text()
    text=re.sub(r'grf\s*\{.*?\}\s*','',text,count=1,flags=re.S)
    text=re.sub(r'cargotable\s*\{.*?\}\s*','',text,count=1,flags=re.S)
    text=re.sub(r'\b(tmpl_tile|spr_\w+|lay_\w+|tile_\w+|main_layout|on_arrival|on_monthly)\b',lambda m:key+'_'+m[1],text)
    text=text.replace(f'item(FEAT_INDUSTRIES, {key})',f'item(FEAT_INDUSTRIES, {key}, {local})')
    text=text.replace('bitmask(IND_FLAG_ONLY_IN_TOWNS)','0').replace('prob_map_gen: 4','prob_map_gen: 0')
    text=text.replace('STR_IND_NAME','STR_'+key.upper()).replace('STR_STATION_NAME','STR_'+key.upper())
    lines.append(text);lang.append(f'STR_{key.upper()} :{name}')
(FOLDER/'campus_lodging.nml').write_text('\n'.join(lines))
(FOLDER/'lang/english.lng').write_text('\n'.join(lang)+'\n')
if __name__=='__main__':
    import os
    os.chdir(FOLDER)
    from nml import main
    main.main(['-c','--grf',str(OUT/'campus_lodging.grf'),'campus_lodging.nml'])
