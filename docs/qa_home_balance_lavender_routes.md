# QA — v1.0.2 Home Balance and Lavender Routes

## Setup
1. Apply v1.0.1 first.
2. Run `APPLY_PATCH.bat` for v1.0.2.
3. Double-click the repository's `game/index.html`.
4. Press `Ctrl+0` once to confirm browser zoom is 100%.

## Landing menu
- [ ] Welcome Back / Empire Status is absent from the top-right.
- [ ] Settings gear is absent from the top-right.
- [ ] Airline Empire title is centered and lavender.
- [ ] Title panel and game-card row have even spacing.
- [ ] Four cards appear in one row on wide displays.
- [ ] At medium widths, three cards appear with Records centered below.
- [ ] Cards remain clickable and their labels are readable.

## Animated background
- [ ] Lavender route network is visibly denser than v1.0.1.
- [ ] Route dashes visibly flow along the lines.
- [ ] Lavender hub glows remain visible.
- [ ] Gold appears only on occasional accent routes.
- [ ] Background remains generated SVG, not a flat image.
- [ ] Reduced-motion mode disables route-flow animation.

## Regression
- [ ] New Game opens setup.
- [ ] Continue opens an existing save.
- [ ] Daily Challenge opens normally.
- [ ] Records opens normally.
- [ ] Animated cinematic still plays before the landing menu.
- [ ] Direct local `file://` launch works without npm.
