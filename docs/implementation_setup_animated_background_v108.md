# Setup Animated Background v1.0.8

## Summary

The existing animated lavender route-network background from the home screen is now reused behind the setup flow.

## Scope

- Applies to Game Type / Difficulty.
- Applies to Scenario Selection.
- Applies to Found Airline.
- Reuses the existing `setup-bg` SVG already populated by `buildIntroBg()`.
- Adds lavender animated route arcs, city nodes, hub glows, and restrained gold accent routes.
- Keeps setup cards and controls above the animation through explicit stacking order.
- Preserves direct local launch through `game/index.html`.

## Files

- `game/css/main.css`
- `docs/implementation_setup_animated_background_v108.md`
- `docs/qa_setup_animated_background_v108.md`
- `docs/changelog.md`
- `version.dat`
