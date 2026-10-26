CITY + MAJOR AIRPORTS 1.0.0
Three city airports and one major airport for OpenTTD.

AIRPORTS

Metro City Airport                 6 x 6    1 runway     3 aircraft stands
Grand City Metropolitan Airport    6 x 6    2 runways    3 aircraft stands
Skyline City International Airport 7 x 7    2 runways    6 aircraft stands, 2 helipads
Grand Union Air Terminal           9 x 11   4 runways    8 aircraft stands, 2 helipads

All four accept large planes and helicopters and become available in 1960.
Metro City and Grand City use aircraft stands for helicopters.
The airports retain the standard City, Metropolitan, International and
Intercontinental runway, taxi, hangar and aircraft movement layouts respectively.
Their custom terminals, towers and other buildings reuse your existing artwork.
The major Grand Union airport is the existing, unchanged GRF.

INSTALL

1. Copy the FOUR files from newgrf\airports in this package to:
   C:\Users\paisl\OneDrive\Documents\OpenTTD\newgrf\airports\

   city_metro.grf
   city_grand.grf
   city_skyline.grf
   airport_grand.grf

   If airport_grand.grf is already present from the existing airport set, it is
   identical to this copy and does not need replacing.

2. In OpenTTD's main menu, open NewGRF Settings, rescan if needed, and add:
   Hunninghall Metro City Airport 1.0
   Hunninghall Grand City Metropolitan Airport 1.0
   Hunninghall Skyline City International Airport 1.0
   Hunninghall Grand Union Air Terminal 1.0

3. Apply the selection and start a NEW game in 1960 or later. Open the airport
   construction window to choose the airports. The four replace the corresponding
   standard airports; their standard selection thumbnails may still be shown.

Use only one override for each airport type. The older Metro International and
Skyline Gateway GRFs also replace the Intercontinental airport, so leave those
disabled when using Grand Union as the major airport in this pack.

Do not change an established saved game's NewGRF list to add this pack. Use a new
game with the files enabled from the start. Existing saves and installed files
were not modified during creation and testing.

INCLUDED

newgrf\airports\    Exactly four installable GRF files
previews\          Four actual in-game screenshots and a labeled overview
source\            Editable NML, language files, original sprite sheets and rebuild notes
manifest.json      Airport specifications, hashes, provenance and validation results

VALIDATION PERFORMED

The three new GRFs compiled with NML 0.9.0 without compiler warnings. The major
GRF was verified byte-for-byte against the installed original. All four loaded
together in an isolated copy of the installed OpenTTD executable and were built
on a separate test map. A fleet of eight large planes, two small planes and two
helicopters ran orders among the airports. Each airport recorded at least ten
arrivals during the flight run. Save/reload restored all four airports and all
twelve aircraft. The four airports' graphics were inspected in actual game
screenshots using OpenGFX2 Classic. ZIP integrity and packaged GRF hashes were
also verified. Multiplayer and every combination of other NewGRFs were not tested.

SOURCE REFERENCES

https://newgrf-specs.tt-wiki.net/wiki/NML:Airports
https://newgrf-specs.tt-wiki.net/wiki/NML:Tilelayout
https://wiki.openttd.org/en/Manual/Airports
https://wiki.openttd.org/en/Manual/NewGRF

OpenTTD layout reference files are GPL-2.0; their license is included in
source\reference\COPYING.md. Existing airport sprite sheets are preserved
unchanged from your local airport source set; this package makes no new
licensing claim over that artwork.
