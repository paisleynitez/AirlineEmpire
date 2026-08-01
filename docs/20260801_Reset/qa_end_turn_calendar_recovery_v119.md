# QA - End Turn Calendar Recovery v1.1.9

## Primary test
1. Start or load a playable airline.
2. Record the header month and year.
3. Press **End Turn**.
4. Allow employee-status and other monthly notifications to appear.
5. Confirm the header advances by one month after processing.
6. Repeat for at least six turns.

## Rollover test
1. Continue until December.
2. Press **End Turn**.
3. Confirm the date becomes January of the following year.

## Speed regression
1. Test Manual, 1x, 2x, 4x, and 8x.
2. Confirm End Turn advances the month in every mode.
3. Confirm the timer restarts in timed modes.

## Error-boundary observation
Open browser developer tools and watch the Console while testing. If an optional subsystem fails, the console should contain an `[End Turn] ... failed` entry and the date should still advance. Record the complete console error because it identifies the secondary subsystem requiring repair.

## Pass criteria
- Employee popups do not prevent month advancement.
- One End Turn press advances exactly one month in standard games.
- December rolls to January and increments the year.
- No duplicate month advances occur.
