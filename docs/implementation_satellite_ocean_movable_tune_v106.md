# v1.0.6 Satellite Ocean and Movable Tune Launcher

## Changes

- Removed the heavy flat-blue ocean wash introduced in v1.0.4.
- Preserved the existing satellite raster and visible ocean-floor bathymetry.
- Applied restrained deep-water multiplication plus modest saturation, brightness, and contrast correction for a richer satellite appearance.
- Reduced the global night tint so larger seas retain natural tonal variation.
- Made the `Tune` launcher draggable anywhere within the browser viewport.
- Stored the launcher position in local storage and restored it on the next launch.
- Kept all existing Dev Tuner open/close behavior.

## Files

- `game/css/main.css`
- `game/js/tools/dev_tuner.js`
- `version.dat`
