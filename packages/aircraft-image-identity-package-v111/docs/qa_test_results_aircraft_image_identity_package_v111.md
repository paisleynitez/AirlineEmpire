# QA Test Results — Aircraft Image and Identity Package v1.1.11

Date: 2026-08-08
Branch inspected: doug/v1.1.11-baseline

## Automated results

- PASS — 37 AIRCRAFT records, 37 AIRCRAFT_IDENTITY records, and 37 AC_ART records match one-to-one.
- PASS — fictional aircraft IDs are unique.
- PASS — 37 source SVG cards, 37 WebP cards, and 37 runtime WebP hero images exist.
- PASS — every card and hero reports 1600 × 900 dimensions and WebP format.
- PASS — runtime manifest contains one existing hero path for every aircraft model.
- PASS — contact sheet and copy-ready path-mirroring package were generated from the standalone files.

## Repository build

PASS — npm.cmd run build completed with Vite 8.1.4. The project's existing classic-script bundling notices remained non-fatal, and production output was created successfully.

## Rendered runtime inspection

PASS — The contact sheet and representative short-haul, jumbo, and supersonic cards were inspected at full resolution with clear image, title, code, and data zones. The local game completed new-airline setup and reached the Operations Center without browser console errors. The runtime manifest script appears before game.js, and an aircraft hero served successfully as 1600 × 900. The owned-fleet accordion state now matches the existing .bp-card.open CSS path.

## Preserved behavior

The AIRCRAFT object keys and values were not renamed or moved. Existing saves continue to use the original model keys, while visual lookup data is loaded separately.
