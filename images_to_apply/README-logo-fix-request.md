# Airline logo fix request — 36 identities still need clean source art

UPDATE 2026-08-30: Pass 1 regenerated 82 of the original 118 from `assets\logos\airlines`
(crop offsets corrected: speed-motion & nature-sky were shifted by 6; mythological, stars-cosmos
and budget-LCC were correctly named). Apply `airline-logo-fix-pass1.zip` for those.
The 36 below have no usable source art anywhere in the repo — these DO need regeneration.

Verified 2026-08-30 against `assets/airline-identities/approved-250` (250 entries, all files present, 512×512).
The 132 procedural marks are correct. The 118 marks flagged `reused-existing` were cut from the original
ChatGPT contact sheets at the wrong offset: each file shows the NEIGHBOURING card's wordmark and only the top
~60% of a logo (e.g. `radiance_air.png` reads "Haboob Air", `swift_air.png` reads "Velocity Airlines").
The same crops were carried into `runtime-logos/`, `logos/` and `cards/`, so this can't be fixed with CSS or by
re-mapping files — it needs the clean per-airline images.

## What to drop into `images_to_apply/logos/`
One image per airline, square (1024×1024 or 512×512), the mark only — NO name text baked in (the game
prints the name under the card). Transparent or dark background. File name = id below, `.png` or `.webp`.
I'll build runtime/presentation/card variants and update `catalog.js` / `manifest.json` from there.

## STILL NEEDED — Group 03 · Speed / Motion — 6 files  (`speed-motion/`)
- `swift_air.png` — Swift Air
- `dash_airways.png` — Dash Airways
- `sprint_airlines.png` — Sprint Airlines
- `torque_air.png` — Torque Air
- `flux_airlines.png` — Flux Airlines
- `rapid_wings.png` — Rapid Wings

## STILL NEEDED — Group 04 · Nature / Sky — 6 files  (`nature-sky/`)
- `tramontane_air.png` — Tramontane Air
- `etesian_airlines.png` — Etesian Airlines
- `thermal_airways.png` — Thermal Airways
- `radiance_air.png` — Radiance Air
- `luminos_airlines.png` — Luminos Airlines
- `crestwave_air.png` — Crestwave Air

## STILL NEEDED — Group 05 · Bold / Modern — 6 files  (`bold-modern/`)
- `nova_airlines.png` — Nova Airlines
- `zenith_air.png` — Zenith Air
- `apex_global.png` — Apex Global
- `nexus_airways.png` — Nexus Airways
- `vertex_airlines.png` — Vertex Airlines
- `axis_air.png` — Axis Air

## STILL NEEDED — Group 07 · Colors / Visual — 18 files  (`colors-visual/`)
- `cobalt_airlines.png` — Cobalt Airlines
- `crimson_air.png` — Crimson Air
- `indigo_wings.png` — Indigo Wings
- `amber_airways.png` — Amber Airways
- `ivory_airlines.png` — Ivory Airlines
- `scarlet_air.png` — Scarlet Air
- `teal_sky_airlines.png` — Teal Sky Airlines
- `obsidian_airways.png` — Obsidian Airways
- `jade_air.png` — Jade Air
- `vermillion_airlines.png` — Vermillion Airlines
- `saffron_airways.png` — Saffron Airways
- `cerulean_air.png` — Cerulean Air
- `magenta_airlines.png` — Magenta Airlines
- `onyx_airways.png` — Onyx Airways
- `umber_air.png` — Umber Air
- `viridian_airlines.png` — Viridian Airlines
- `goldenrod_air.png` — Goldenrod Air
- `alabaster_airways.png` — Alabaster Airways

Total still needed: 36 files. (Groups 06, 08 and 09 were fully recovered in pass 1;
the remaining Group 03/04 entries listed above had no art in their source crops.)
