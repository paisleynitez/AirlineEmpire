# Airline Logo Picker and Readable Typography — v1.1.5 Revised

## Baseline and purpose

This revision supersedes the earlier v1.1.5 test ZIP. It combines the complete v1.1.4 readable-typography pass with the v1.1.5 streamlined Airline Logo picker.

Accepted installed versions: `1.1.2`, `1.1.3`, `1.1.4`, and the earlier `1.1.5` test build.

## Full replacement behavior

`APPLY_PATCH.bat` copies every file from `PATCH_FILES` using overwrite mode. Existing destination files with the same project-relative path are replaced. Before replacement, the installer creates a timestamped backup of the primary working files.

## Included typography changes

- Plus Jakarta Sans is the primary user-interface font.
- DM Mono is reserved for airport codes, money, statistics, and operational values.
- Bebas Neue remains limited to major display branding.
- Excessive letter spacing is reduced.
- Card descriptions, labels, buttons, and airport subtitles use clearer hierarchy and line spacing.

## Included logo-picker changes

- The dice is inside the airline-name field, immediately left of the validation checkmark.
- The section title is `AIRLINE LOGO`.
- The former identity preview and brand-library box are removed.
- Contact-sheet metadata, badges, color circles, and card subtitles are removed.
- Logo cards begin directly beneath the Shuffle and Random Preview controls.
- Desktop uses four columns with a maximum of four visible rows in the internal scrolling region.
- Cards and spacing are slightly reduced.
- Shuffle 34 and Random Preview remain available.

## Architecture

`game/index.html` remains a loader and markup shell. Behavior remains in JavaScript modules and styling remains in `game/css/main.css`.
