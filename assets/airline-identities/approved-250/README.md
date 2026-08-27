# Airline Empire Approved 250 Identity Package

This package contains the authoritative Groups 1–10 roster in the approved #4 visual direction.

- 250 normalized transparent runtime emblems (`512×512` PNG)
- 250 controlled-polish presentation logos (`1200×600` WebP)
- 250 standalone themed cards (`1600×900` WebP)
- 250 transparent source marks (`640×640` PNG)
- 10 Step 1 group contact sheets and one master preview
- 10 Step 2 group contact sheets and one master preview
- JSON and CSV manifests with stable IDs and exact display names
- Package-owned runtime catalog: `assets/airline-identities/approved-250/catalog.js`
- Direct loader integration: `game/index.html`

The replacement Group 10 runs from Aurelius Air through Sanctum Air. The obsolete Luminary Air through Finesse Air roster is excluded.

Existing standalone artwork was reused for 122 active identities. The 128 missing/replacement marks were completed as deterministic, project-native identity emblems. Runtime consumers use the transparent emblem path; presentation logos and cards remain packaged separately.

## Runtime integration

`game/index.html` loads this package's `catalog.js` directly. The catalog registers `window.AIRLINE_LOGOS`, `window.AIRLINE_LOGO_GROUPS`, and the existing lookup helpers consumed by the logo picker and identity generator. The runtime picker uses normalized transparent emblems; presentation logos, cards, and source marks remain separate packaged production assets.

## Regional identity coverage

All 25 Geographic/Regional identities carry explicit region, code, motif, and palette metadata. The remaining 225 category-led identities use the `Global` region scope until a separate authoritative home-region roster is provided.

## Controlled polish

The 250 presentation logos and 250 cards use a restrained accent bloom, a single flight-path flourish, badge depth, and compact identity-code tabs. These details add energy while preserving the simple dark-background system and fixed production geometry.

## Game-native runtime split

Each identity includes a normalized transparent 512x512 emblem under `runtime-logos/`. The catalog's `image` field points to that emblem for small in-game UI use, while `presentationLogo` points to the polished 1200x600 identity presentation and `card` points to the 1600x900 identity card.
