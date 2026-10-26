from pathlib import Path
import shutil
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools'))
from PIL import Image

RUN = ROOT / 'test' / 'runtime'
GAME = Path('C:/Program Files/OpenTTD')
for sub in ('baseset', 'lang', 'newgrf/airports', 'ai/AirportPackTest', 'scripts', 'save', 'screenshot'):
    (RUN / sub).mkdir(parents=True, exist_ok=True)
for name in ('openttd.exe', 'COPYING.md'):
    shutil.copy2(GAME / name, RUN / name)
shutil.copy2(GAME / 'lang' / 'english.lng', RUN / 'lang' / 'english.lng')
for p in (GAME / 'baseset').glob('*'):
    if p.is_file(): shutil.copy2(p, RUN / 'baseset' / p.name)
shutil.copy2(Path('C:/Users/paisl/OneDrive/Documents/OpenTTD/baseset/OpenGFX2_Classic-0.8.1.tar'), RUN / 'baseset')
for p in (ROOT / 'package' / 'newgrf' / 'airports').glob('*.grf'):
    shutil.copy2(p, RUN / 'newgrf' / 'airports' / p.name)
for p in (ROOT / 'test' / 'airport_test').glob('*.nut'):
    shutil.copy2(p, RUN / 'ai' / 'AirportPackTest' / p.name)
Image.new('L', (128, 128), 128).save(RUN / 'flat.png')
(RUN / 'openttd.cfg').write_text('''[misc]
display_opt = SHOW_TOWN_NAMES | SHOW_STATION_NAMES | SHOW_SIGNS | FULL_ANIMATION | FULL_DETAIL | WAYPOINTS
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

[difficulty]
max_no_competitors = 0
number_towns = 5
industry_density = 0
max_loan = 20000000
infinite_money = true
vehicle_breakdowns = 0
disasters = false
town_council_tolerance = 3
terrain_type = 0
quantity_sea_lakes = 0

[economy]
inflation = false
station_noise_level = false
town_growth_rate = 0

[station]
station_spread = 20

[vehicle]
plane_crashes = 0
plane_speed = 1
never_expire_vehicles = true
no_servicing_if_no_breakdowns = true

[game_creation]
starting_year = 1985
landscape = temperate
map_x = 7
map_y = 7
heightmap_height = 2
custom_town_number = 1
custom_industry_number = 0
tree_placer = 0
amount_of_rivers = 0

[ai]
ai_in_multiplayer = true

[newgrf]
airports/city_metro.grf =
airports/city_grand.grf =
airports/city_skyline.grf =
airports/airport_grand.grf =
''', encoding='utf-8')
(RUN / 'scripts' / 'game_start.scr').write_text('script flight-console.log\ndebug_level script=4,grf=1,misc=1\nstart_ai AirportPackTest\nunpause\nschedule on-next-calendar-month scripts/month1.scr\n')
for i in range(1, 121):
    if i == 120:
        content = 'save airport-flight-test\nquit\n'
    else:
        content = f'schedule on-next-calendar-month scripts/month{i + 1}.scr\n'
    (RUN / 'scripts' / f'month{i}.scr').write_text(content)
print(RUN)
