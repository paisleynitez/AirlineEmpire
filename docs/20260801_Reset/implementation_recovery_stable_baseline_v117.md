# AE Recovery — Stable Baseline 1.1.7

## Purpose

This recovery package restores the exact files captured immediately before the v1.1.8 UI CTA patch was installed. It is a rollback, not a new feature patch.

## Restored files

- `game/index.html`
- `game/css/main.css`
- `game/js/core/game.js`
- `game/js/cities/cityProfileManager.js`
- `game/js/cities/cityRenderer.js`
- `version.dat`

## Removed v1.1.8-only files

- `docs/implementation_ui_cta_plane_fly_v118.md`
- `docs/qa_ui_cta_plane_fly_v118.md`

## Why this baseline

The repository backup created immediately before v1.1.8 contains version 1.1.7 and preserves the accepted nine-logo picker, global font pass, readable logo naming, and THCityscape work. Later full-file patch layering introduced regressions.

## New patch policy

Future patches must be built from a freshly supplied repository snapshot, validate SHA-256 hashes of every overwritten baseline file, and never use a prior patch archive as the implementation baseline.
