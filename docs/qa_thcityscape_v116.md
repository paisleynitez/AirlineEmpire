# QA — AE v1.1.6 THCityscape

## Installation and rollback

1. Confirm `version.dat` is `1.1.5`.
2. Run `APPLY_PATCH.bat`.
3. Confirm every verification line reports PASS and `version.dat` becomes `1.1.6`.
4. To roll back, run `REVERSE_PATCH.bat` from the same extracted patch folder.
5. Confirm the repository returns to `1.1.5`.

## Visual checks

1. Open `game/index.html` and reach Found Airline.
2. Confirm the home-hub panel uses the darker navy/teal/lavender theme.
3. Confirm New York, Chicago, Los Angeles, Dallas, Washington DC, Houston, San Francisco, Atlanta, and Phoenix do not share the same skyline.
4. Verify recognizable cues:
   - Chicago: tall Willis-style tower and lake tone.
   - San Francisco: bridge and hills/bay.
   - Dallas: Reunion-style sphere tower.
   - Washington DC: monument silhouette.
   - Phoenix: desert/mountain profile.
5. Switch regions and confirm every airport still receives a cityscape.
6. Select a hub and confirm selection, expansion, and navigation still work.
7. Confirm the logo picker remains 3 × 3, no-scroll, and number-free.

## Regression checks

- Direct local launch works without npm.
- No browser console syntax errors.
- Hub selection persists into Airline Preview.
- Region filters remain clickable.
- No broken images or blank hub cards.
