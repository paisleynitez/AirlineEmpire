# QA — Home Layout Correction v1.0.3

## Installation
- Confirm v1.0.2 is installed.
- Run `APPLY_PATCH.bat`.
- Confirm the installer reports success and `version.dat` is `1.0.3`.

## Landing screen at 100% browser zoom
- Airline Empire title is fully visible and not clipped at the top.
- New Game, Continue, Daily Challenge, and Records are fully visible.
- Four cards appear in one centered row on a normal desktop display.
- No card text is cropped, blurred, or covered by hub glows.
- Cards and title are vertically balanced with no oversized empty lower half.
- Welcome Back/status chip is absent.
- Top-right settings control is absent.

## Animated background
- Lavender route lines animate behind the interface.
- A small number of restrained gold routes remain.
- Hub glows are small and do not wash over menu cards.
- Dots and routes remain decorative and never block clicks.

## Functionality
- New Game opens setup.
- Continue works when a save exists.
- Daily Challenge opens normally.
- Records opens normally.
- Cinematic intro still animates and transitions to the home menu.
- Direct double-click launch works without npm.
