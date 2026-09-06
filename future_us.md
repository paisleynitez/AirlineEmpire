# Future Us — parked ideas

Backlog of ideas / features / refactors that came up during work and were
explicitly parked for another day. Not a task list — just a place to remember
them so nothing is lost. Doug can pull from here when planning what to tackle
next.

Format: `## <topic>` then a short description, why it was parked, and any
relevant file/line notes so whoever picks it up doesn't start from zero.

Only add entries here when the user explicitly says "park this" or equivalent.

---

## Research subsystem — handed to Scotty

Make the existing `RESEARCH_HUB_CARDS` (game.js:10951) actually grant game-math
bonuses instead of just being navigation. Bones already in place:

- 8 categories (Fuel, Pricing, Routes, Cabin, Maintenance, Brand, Digital, Sustainable)
- Each card has `level` (1–5), `cost` (research points), `progress %`, `benefits` array
- `STATE.researchPoints` already exists (defaults to 2450)
- `researchHubAction(id)` currently opens other panels — needs to become real research

### Paisley's design decision (recorded 2026-09-06)

**Progression model: time-gated queue.** Pick a tech, it takes N months to
complete. Progress bar fills over months. One or two techs in parallel (Scotty
to decide exact concurrency).

**Time-to-complete scales with level/newness.** Level 1 = shortest, each next
level takes progressively longer. Paisley's phrasing: "when someone orders a
level 1 they take the least amount of time, level 2 is a little longer so when
we get to like modern or 'futuristic' planes they'll take longer."

Interpretation to confirm with Paisley — could be either:
1. **Simple:** research level itself governs duration (level 1: 2mo, level 2: 4mo,
   level 3: 6mo, level 4: 8mo, level 5: 12mo — apply to every category).
2. **Aircraft-linked:** research topics tied to newer aircraft eras take longer
   than legacy-era research. Requires adding era metadata to each research node
   and probably reshaping the tree.

Simple is likely what was meant; ask before building Aircraft-linked.

### What making it real means, minimally

1. `STATE.research = { fuel:{level:0, active:null, monthsLeft:0}, ... }` — persistent
   level per category + in-progress state
2. Clicking RESEARCH spends `researchPoints`, sets `active`, kicks off `monthsLeft`
3. Monthly tick in `endTurn`: decrement `monthsLeft`; on 0, advance level and clear active
4. Wherever the game math runs (`processRoute`, `calcCargo`, maintenance, etc.),
   read completed levels and apply the bonus. Bonus values come from parsing (or
   restructuring) the existing `benefits` string array.

### Related: unlocks `wx_routing` mitigation

Once the framework exists, add a `wx_routing` node that halves
`AEWX.OVERFLIGHT_MOD` (patch: `game/js/patches/weather_paths_v01.js`) — pushes
overflight cut from 15% down to 7.5% for the player when researched. Trivial
one-liner once research effects can be read.

---

## User-remappable hotkeys

Let players change the default hotkey bindings (R = Routes, F = Fleet, C = Close,
? = Help, etc.). Add a "Keyboard" section in the Settings modal with a row per
shortcut showing the current key and a "Change" button that captures the next
keypress.

- Existing patch: `game/js/patches/hotkeys_v01.js`
- Public API already exposes `window.AEHK.SHORTCUTS` (single source of truth) —
  making these user-editable means storing per-shortcut overrides in
  `localStorage` (use the safe `LS.get/set` pattern) and reading them at keydown
  dispatch.
- Also: guard against binding a key that would shadow browser shortcuts, and
  provide a "Reset to defaults" action.
