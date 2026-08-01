# Setup Compact Layout — v1.1.3

## Changes

The Game Type and Difficulty page has been reduced and centered horizontally. The Found Airline name panel has also been simplified.

## Implementation

- Reduced the page frame to a 1080px responsive maximum.
- Reduced panel padding and spacing.
- Reduced Game Type and Difficulty card heights.
- Reduced icon rings, headings, body copy, and selection indicators proportionally.
- Reduced the Next bar height.
- Removed the visible “Great name” feedback line.
- Moved the random-name dice button into the airline-name input field.
- Preserved the validation checkmark inside the input.
- Kept the hidden feedback element so existing name-validation code remains compatible.
- Preserved the existing three-column desktop layout and single-column mobile behavior.

## Files

- `game/index.html`
- `game/css/main.css`
- `version.dat`
- `docs/implementation_setup_compact_layout_v113.md`
- `docs/qa_setup_compact_layout_v113.md`
