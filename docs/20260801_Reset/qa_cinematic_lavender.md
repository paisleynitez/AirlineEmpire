# QA — Cinematic Lavender Theme

Version: 1.0.1

## Launch

Double-click `game/index.html`. No npm or server is required.

## Visual and Functional Checks

- [ ] The animated cinematic appears before the flat home menu.
- [ ] The large `AIRLINE EMPIRE` title renders in lavender/violet.
- [ ] The title reveal, glow, and shine still animate.
- [ ] Route arcs draw across the screen normally.
- [ ] Most route arcs are lavender; a small number remain gold.
- [ ] City dots and activated regions use violet/lavender tones.
- [ ] Hub bursts remain animated and glow lavender.
- [ ] Aircraft markers and trailing dots continue moving along route paths.
- [ ] Stats count upward normally.
- [ ] `PRESS TO BEGIN` remains visible and animated.
- [ ] Clicking the cinematic exits to the existing home menu.
- [ ] The SKIP button exits to the existing home menu.
- [ ] The flat home menu has not been structurally redesigned.
- [ ] New Game, Continue, Daily Challenge, and Records still respond.

## Failure Conditions

Fail the patch if the cinematic is static, the title remains teal, route animation stops, the screen does not transition, or the browser console reports a new JavaScript error.
