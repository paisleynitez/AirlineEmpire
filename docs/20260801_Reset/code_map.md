# Airline Empire Code Map

## Current Entry Point

- `game/index.html`

## Current State

The game is currently a single-file HTML build. The first failed extraction showed that multiple JavaScript blocks reuse identifiers, so JavaScript should not be bulk-combined automatically.

## Refactor Rule

Move one subsystem at a time. Test after every move. Commit after every successful smoke test.

## Planned Structure

```text
game/
├── index.html
├── css/
├── js/
│   ├── main.js
│   ├── ui/
│   ├── simulation/
│   ├── data/
│   ├── weather/
│   └── rendering/
└── data/

JavaScript
==========

# Airline Empire Code Map

> Last Updated: 2026-07-07

This document tracks the major JavaScript modules embedded in `game/index.html`
and their planned destination during modularization.

---

## SCENARIOS

**Location**
- `game/index.html` (~line 619)

**Type**
- Static Data

**Purpose**
Defines all game scenarios available when starting a new game.

**Dependencies**
- None

**Planned Destination**
```
game/data/scenarios.js
```

**Status**
- Identified
- Not yet extracted

---

## DEV_TUNER

**Location**
- `game/index.html` (~line 16498)

**Type**
- Developer Tool

**Purpose**
Developer tuning panel for live balancing.

Includes:
- Economy tuning
- Weather testing
- Event tuning
- Executive tuning
- Developer utilities

**Major Dependencies**
- `ECON`
- `BOARD_ROLES`
- `EVENTS_WEATHER`
- `MONTHS`
- `showFlash()`

**Planned Destination**
```
game/js/dev/dev-tuner.js
```

**Status**
- Identified
- Not yet extracted

---

## REAL_GAME_RECOVERY_V05

**Location**
- `game/index.html`
- `<script id="pn-real-game-recovery-v05-js">`

**Type**
- Gameplay Module

**Purpose**
Market Intelligence system.

Features:
- Route Opportunities
- Used Aircraft Market
- Contracts
- Trial Routes
- Heat Map
- Rival Watch
- Monthly Reports
- Decision Log

Hooks:
- `renderOpsCenter()`
- `endTurn()`
- `startGame()`
- `updateUI()`

**Planned Destination**
```
game/js/modules/market-intelligence.js
```

**Status**
- Identified
- Ready for extraction

---

## UNNAMED_BOOTSTRAP

**Location**
- `game/index.html`

**Type**
- Unknown

**Purpose**
To be determined.

**Planned Destination**
- TBD

**Status**
- Pending inspection

---

## MAIN_REDESIGN_V08

**Location**
- `<script id="pn-main-redesign-v08-js">`

**Type**
- UI Module

**Purpose**
Main interface redesign.

**Planned Destination**
```
game/js/modules/ui-redesign.js
```

**Status**
- Pending inspection

---

## FOUNDATION_POLISH_V01

**Location**
- `<script id="foundation-polish-v01-js">`

**Type**
- UI Polish

**Purpose**
Foundation polish pass (v01).

**Planned Destination**
```
game/js/modules/foundation-polish-v01.js
```

**Status**
- Pending inspection

---

## FOUNDATION_POLISH_V02

**Location**
- `<script id="foundation-polish-v02-js">`

**Type**
- UI Polish

**Purpose**
Foundation polish pass (v02).

**Planned Destination**
```
game/js/modules/foundation-polish-v02.js
```

**Status**
- Pending inspection












# Modularization Progress

## CSS
- [x] Complete

## JavaScript

- [ ] SCENARIOS
- [ ] DEV_TUNER
- [ ] REAL_GAME_RECOVERY_V05
- [ ] UNNAMED_BOOTSTRAP
- [ ] MAIN_REDESIGN_V08
- [ ] FOUNDATION_POLISH_V01
- [ ] FOUNDATION_POLISH_V02

## Data

- [ ] Airports
- [ ] Aircraft
- [ ] Cities
- [ ] Weather



## UNNAMED_BOOTSTRAP

**Location**
- `<script>...</script>` immediately before `pn-main-redesign-v08-js`

**Type**
- Bootstrap / Compatibility Patch

**Purpose**
Applies a small UI initialization pass.

Changes:
- Build tag
- Operations Center subtitle
- Left/right panel titles
- Hides stock ticker

**Dependencies**
- DOM only

**Planned Destination**
```
game/js/bootstrap.js
```

**Status**
- Ready for extraction









## MAIN_REDESIGN_V08

**Location**
- `<script id="pn-main-redesign-v08-js">`

**Type**
- UI Initialization

**Purpose**
Applies the current PaisleyNitez UI branding.

Changes:
- Build tag
- QA build marker
- Operations Center subtitle
- Hides stock ticker

**Dependencies**
- DOM only

**Planned Destination**
```
game/js/modules/ui-redesign.js
```

**Status**
- Ready for extraction












## FOUNDATION_POLISH_V01

**Location**
- `<script id="foundation-polish-v01-js">`

**Type**
- UI Polish

**Purpose**
Applies non-destructive visual polish.

Changes:
- Build badge
- Map status chip
- Hide footer
- Hide stock ticker

Runs:
- DOMContentLoaded
- +300ms
- +1200ms

**Dependencies**
- DOM only

**Planned Destination**
```
game/js/modules/foundation-polish-v01.js
```

**Status**
- Ready for extraction



## FOUNDATION_POLISH_V02

**Location**
- `<script id="foundation-polish-v02-js">`

**Type**
- UI Polish

**Purpose**
Final polish pass.

Changes:
- Updates build badge
- Re-applies branding after delayed v01 updates

Runs:
- DOMContentLoaded
- +400ms
- +1400ms

**Dependencies**
- DOM only

**Planned Destination**
```
game/js/modules/foundation-polish-v02.js
```

**Status**
- Ready for extraction


