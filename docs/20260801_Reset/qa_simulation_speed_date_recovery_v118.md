# QA — Simulation Speed and Date Recovery v1.1.8

## Baseline Verification

- [ ] Checkout is `recovery/ui-reconstruction`.
- [ ] Locked baseline branch is unchanged.
- [ ] Starting baseline commit was `5a27a8c`.

## Startup

- [ ] Launch the game using the existing project start method.
- [ ] Main menu loads without a console error.
- [ ] Start or continue a playable airline.
- [ ] Header remains usable at 100% browser zoom.

## Speed Controls

- [ ] Manual, 1×, 2×, 4×, and 8× controls are all visible.
- [ ] Exactly one selected speed is highlighted.
- [ ] Manual stops the countdown and displays `MANUAL`.
- [ ] 1× starts a 210-second month timer.
- [ ] 2× starts a 120-second month timer.
- [ ] 4× starts a 60-second month timer.
- [ ] 8× starts a 25-second month timer.
- [ ] Selecting a speed produces a brief confirmation message.
- [ ] Play/Pause pauses the selected timed mode.
- [ ] The status reads `PAUSED · <speed>` while paused.
- [ ] Play/Pause resumes at the same selected speed.
- [ ] Play/Pause in Manual tells the player to select a timed speed.

## Date and End Turn Feedback

- [ ] Record the displayed month and year.
- [ ] Press End Turn once.
- [ ] The date advances by exactly one month in a standard game.
- [ ] The date area visibly pulses after the turn resolves.
- [ ] A confirmation message names both the completed month and the new month.
- [ ] December advances to January of the next year correctly.
- [ ] Eras mode still advances by its existing three-month increment.

## Regression

- [ ] End Turn still resolves route revenue and expenses.
- [ ] Timer expiry still waits for End Turn rather than auto-resolving.
- [ ] Opening a modal still pauses the countdown progression as before.
- [ ] Map aircraft animation changes speed when simulation speed changes.
- [ ] Save and reload preserve the timer mode correctly.
- [ ] No duplicate-element-ID warnings or JavaScript errors appear.
- [ ] Header does not overlap at common desktop resolutions.

## Static Checks Completed

- [x] `node --check game/js/core/game.js`
- [x] Full replacement files generated from baseline archive.
