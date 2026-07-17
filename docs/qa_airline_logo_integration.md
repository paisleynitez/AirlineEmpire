# Airline Logo Integration QA v02

## Automated checks completed

- [x] Catalog contains 193 unique IDs.
- [x] Every catalog path exists in the patch.
- [x] `game/js/data/airline-logos.js` passes syntax validation.
- [x] Modified `game/js/core/game.js` passes syntax validation.
- [x] Loader order places the logo catalog before `game.js`.

## Doug test checklist

- [ ] Start a new game and reach Choose Your Logo.
- [ ] Confirm image cards and airline names are visible.
- [ ] Scroll through the full catalog.
- [ ] Select several logos and confirm the check/selected state moves correctly.
- [ ] Confirm the setup preview shows the selected image.
- [ ] Continue, launch the game, and confirm the header/CEO logo displays.
- [ ] Quick-save, reload, and confirm the same logo returns.
- [ ] Confirm no new browser console errors.
