# QA — Direct Launch Asset and Dev Tuner Recovery v1.1.11

1. Open `game/index.html` directly from the WSL path.
2. Start a new game and select Nova Airlines or another image logo.
3. Confirm no `GET file://wsl.localhost/assets/... ERR_FILE_NOT_FOUND` error appears.
4. Confirm the selected airline logo renders in setup and the game UI.
5. Complete airline creation and enter the main game.
6. Confirm no `Cannot set properties of null (setting routeOffers)` error appears.
7. Open Market Intelligence from the Ops Center or Dev Tuner.
8. Refresh Market Intelligence and confirm route offers populate.
9. Run one End Turn and confirm Market Intelligence refresh does not block date advancement.
10. Recheck speed, pause, modal hold, and End Turn behavior from v1.1.10.

A Chromium `file://` unique-origin warning may remain. Record it only if it causes a visible feature failure.
