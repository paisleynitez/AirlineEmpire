# End Turn Calendar Recovery v1.1.9

## Problem
End Turn processed employee-status notifications, but the visible date did not advance. The calendar increment occurred after several optional monthly subsystem ticks. A JavaScript exception in any one of those ticks aborted the handler before `STATE.month` and `STATE._absMonth` were incremented.

## Change
Added `runEndTurnStep(label, fn)` in `game/js/core/game.js`. Employee, maintenance, alliance, investment, insurance, lease, gate-bid, timed-effect, and world-event processing now run in isolated error boundaries.

A failed optional subsystem:

- Writes the full error to the browser console.
- Adds a warning to the in-game event log when possible.
- Does not stop the remaining End Turn pipeline.
- Allows the calendar, UI refresh, financial history, and next timer cycle to complete.

## Architecture
No inline JavaScript was added to `game/index.html`. The loader/module structure remains unchanged. Economy formulas and timer durations were not modified.
