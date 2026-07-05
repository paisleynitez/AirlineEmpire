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
