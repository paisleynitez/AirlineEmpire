# Future Us — parked ideas

Backlog of ideas / features / refactors that came up during work and were
explicitly parked for another day. Not a task list — just a place to remember
them so nothing is lost. Doug can pull from here when planning what to tackle
next.

Format: `## <topic>` then a short description, why it was parked, and any
relevant file/line notes so whoever picks it up doesn't start from zero.

Only add entries here when the user explicitly says "park this" or equivalent.

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
