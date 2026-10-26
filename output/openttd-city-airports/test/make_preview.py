"""Crop genuine in-game screenshots and assemble a labeled contact sheet."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'.tools'))
from PIL import Image, ImageDraw, ImageFont
OUT = ROOT/'package/previews'
world = Image.open(ROOT/'test/runtime/screenshot/all-airports-world.png').convert('RGB')
airports = [
    ('city_metro','Metro City Airport','6 x 6  |  1 runway  |  3 stands',27,27),
    ('city_grand','Grand City Metropolitan','6 x 6  |  2 runways  |  3 stands',53,27),
    ('city_skyline','Skyline City International','7 x 7  |  2 runways  |  6 stands',27.5,53.5),
    ('airport_grand','Grand Union Air Terminal','9 x 11  |  4 runways  |  8 stands',54.5,55.5),
]
board = Image.new('RGB',(1680,1180),'#121c29')
d = ImageDraw.Draw(board)
font = lambda size: ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',size)
bold = lambda size: ImageFont.truetype('C:/Windows/Fonts/seguisb.ttf',size)
d.text((32,20),'CITY + MAJOR AIRPORTS',font=bold(34),fill='#f0f5fa')
d.text((32,65),'Four functional OpenTTD airports  |  Actual in-game screenshots',font=font(21),fill='#a9bfd1')
for i,(key,title,detail,x,y) in enumerate(airports):
    cx = round(4032+(y-x)*32)
    cy = round((x+y)*16-8+126-20)
    crop = world.crop((cx-400,cy-210,cx+400,cy+230))
    crop.save(OUT/(key+'.png'))
    bx,by = 20+(i%2)*830, 110+(i//2)*525
    d.rectangle((bx,by,bx+809,by+509),fill='#1c2b3d')
    d.text((bx+15,by+9),title,font=bold(25),fill='#ffffff')
    d.text((bx+15,by+43),detail,font=font(18),fill='#9cbed4')
    board.paste(crop,(bx+5,by+69))
d.text((32,1160),'Existing terminal artwork preserved. Airports shown with OpenGFX2 Classic.',font=font(13),fill='#90a5b7')
board.save(OUT/'airports-preview.png')
extra = OUT/'all-airports-world.png'
if extra.exists(): extra.unlink()
print('Four genuine game crops + one contact sheet saved.')
