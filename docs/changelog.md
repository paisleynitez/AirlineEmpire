# Changelog

## Unreleased

### Changed

- Reorganized repository structure.
- Standardized active game entry point as `game/index.html`.
- Added CSS extraction branch work.
- Added initial developer documentation.

### Added

- `docs/CODE_MAP.md`
- `docs/DEVELOPER_SETUP.md`
- `docs/DECISIONS.md`
- Organized `assets/`, `archive/`, `game/`, `tools/`, `tests/`, and `scripts/`.

Milestone

Completed CSS modularization.

- All CSS extracted from index.html.
- game/css/main.css is now the primary stylesheet.
- Repository structure finalized.

## Refactor

- Completed extraction of all inline JavaScript from `game/index.html`.
- Added `game/js/core/game.js` as the primary application module.
- Moved remaining inline patch (`main_redesign_v07`) into its own module.
- Added a Vite development environment.
- Verified all JavaScript with `node --check`.
