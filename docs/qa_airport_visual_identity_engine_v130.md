# QA — Airport Visual Identity Engine v1.3.0

## Installation

1. Confirm root `version.dat` reads `1.2.0`.
2. Run `APPLY_PATCH.bat`.
3. Confirm SUCCESS and `version.dat` = `1.3.0`.

## Visual checks

Open New Game and reach Choose Your Home Hub.

- New York displays a harbor-oriented skyline with a Liberty silhouette.
- Chicago displays a dense lakeside skyline with a Willis-style tower.
- San Francisco displays water, hills, and a bridge silhouette.
- Seattle displays water/mountains and a Space Needle silhouette.
- Phoenix displays a warm desert/mountain scene.
- Washington DC displays a low skyline and monument silhouette.
- London, Paris, Tokyo, Dubai, Sydney, and Singapore use distinct landmark scenes.
- Unprofiled major cities still display a valid region-based scene.
- No broken images or empty skyline areas appear.

## Interaction checks

- City cards remain selectable.
- Region tabs still work.
- Expanded hub details still open.
- Selection checkmark remains visible.
- Hover treatment does not shift the card layout.

## Regression

- Direct `game/index.html` launch works offline.
- Airline identity selection remains functional.
- AI lifecycle state remains present.
- Browser console remains free of errors.
