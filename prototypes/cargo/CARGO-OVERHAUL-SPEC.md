# Cargo Overhaul — Design Spec (prototype stage, nothing applied to the game)

Companion to the five window concepts in this folder (cargo-a … cargo-e). This describes the model
behind them so a concept can be picked and then built as modular files (data + engine patch + window + CSS).

## 1. What exists today

Cargo is one form window: pick a hub, an "economic hub" city (econ ≥ 60), any spare passenger jet and a
flights-per-week slider. Income is a flat function of the two cities' econ scores. The Cargo Hub airport
upgrade pays passive belly income. There are no freighters, no cargo types, no contracts, no market, no
events, and nothing to grow into over a campaign.

## 2. Aircraft

### 2a. Dedicated freighters (new roster entries, `js/data/`)
Payload in tonnes replaces seats. Everything else (range, cost, fuel, era, type, hero image, identity name)
works exactly like the passenger roster so Buy Aircraft, Fleet, maintenance, crews and saves need no
special cases beyond `payload` instead of `seats`.

| Model | Identity | Payload | Range mi | Cost $M | Era | Notes |
|---|---|---|---|---|---|---|
| B747-8F | Titan 8F | 137 t | 5,100 | 190 | 2011 | Nose door — oversize loads |
| B777F | Horizon F | 102 t | 5,600 | 160 | 2009 | Long-haul workhorse |
| A330-200F | Meridian F | 65 t | 4,600 | 95 | 2010 | Mid-size widebody |
| B767-300F | Voyager F | 52 t | 3,800 | 60 | 1995 | Regional widebody, express favourite |
| B737-800BCF | Comet BCF | 23 t | 2,300 | 22* | 2018 | Conversion only |
| A321P2F | Falcon P2F | 27 t | 2,500 | 26* | 2020 | Conversion only |
| B747-200F | (vintage) | 110 t | 6,000 | 90 | 1972 | Eras campaign |
| DC-10-30F | (vintage) | 70 t | 5,500 | 62 | 1980 | Eras campaign |
| B707-320C | (vintage) | 40 t | 3,700 | 32 | 1963 | Eras campaign |

\* used-market price; normally reached through conversion below. Hero images reuse the base type's
existing artwork until freighter art exists (no regeneration of current assets).

### 2b. Passenger-to-freighter conversion
Send an owned, unassigned passenger jet to a conversion programme: pay a fee, the aircraft leaves the fleet
for N months, and returns as the freighter variant with age carried over.

| From | To | Fee $M | Months | Payload |
|---|---|---|---|---|
| B737-800 | B737-800BCF | 12 | 4 | 23 t |
| A321XLR | A321P2F | 16 | 5 | 27 t |
| B767-300ER | B767-300BCF | 18 | 5 | 52 t |
| A330-300 | A330-300P2F | 30 | 6 | 61 t |
| B747-400 | B747-400BCF | 35 | 6 | 113 t |

State: `STATE.cargo.conversions = [{plane, to, monthsLeft, total}]`, ticked in the month step. A converted
aircraft gets 8 % higher maintenance cost than a factory freighter (older airframe).

### 2c. Belly cargo (passenger fleet)
Every passenger route now carries freight in the hold: belly capacity per flight by type —
short 1.5 t, medium 2.5 t, long 12 t, jumbo 18 t (supersonic 0). Belly freight sells at 85 % of lane yield
and is capped by the demand of the city pair, so it is meaningful on trunk routes and small on thin ones.
This replaces the flat Cargo Hub income; the Cargo Hub upgrade instead raises hub throughput (see 5).

## 3. Demand model

For each ordered city pair (A → B), monthly freight demand in tonnes:

```
base   = (econA × econB)^0.5 × 6.0            // corridor size
dist   = 1 / (1 + distance / 9000)             // gentler than passenger distance decay
demand = base × dist × industry(A,B) × season × events × macro
```

`industry(A,B)` comes from a per-city industry profile (new data file, defaults derived from region and
econ so existing cities need no hand-editing): shares of eight commodity types —

| Key | Type | Base $/kg | Volatility | Needs |
|---|---|---|---|---|
| gen | General freight | 1.6 | low | — |
| exp | E-commerce / express | 3.4 | med | night ops slot |
| per | Perishables | 2.6 | high, seasonal | — |
| pha | Pharma / cold chain | 5.8 | low | research: Cold Chain |
| aut | Automotive / parts | 2.1 | med | — |
| hvy | Heavy / oversize | 4.2 | med | main-deck freighter, research: Main-deck Loader |
| mail | Mail | 1.9 | none | — |
| dg | Dangerous goods | 4.9 | low | research: DG Certification |

Yield on a lane = Σ(share × rate) × spot factor (0.85–1.20, random-walks monthly) × contract mix.
Types the player is not certified for are unsold demand (shown hatched in the Market view).

Lane revenue = min(capacity, demand) × yield. Capacity = payload × flights/week × 4.33 × 0.90 (ULD tare).
Costs reuse the existing fuel / crew / handling formulas per flight; freighters use 1 pilot pair and no
cabin crew.

Order of magnitude: a B777F five times a week Frankfurt → Shanghai carries ~430 t/mo at ~$2.90/kg ≈
$1.2M gross, ~$0.55M net. That matches the scale of the game's passenger route economics.

## 4. Contracts and opportunities (the "function")

A board of offers regenerated monthly (4–8 offers, weighted toward the player's hubs and fleet). Each:

```
{ kind: 'fwd'|'chr'|'int'|'mail', who, from, to, tons/mo, term (months; 1 = one-off), rate $/kg,
  requirement (aircraft class / certification), expiresIn, penalty $M, note }
```

| Kind | Term | Yield | Behaviour |
|---|---|---|---|
| Forwarder block space | 6–24 mo | market ±5 % | Guaranteed tonnes at a fixed rate; insulates from spot swings. Renewal offer at end. |
| Charter | one-off | 1.5–2.2× market | Hard deadline (1–2 months), single or double lift, prestige on completion, big penalty on miss. |
| Integrator feeder | 18–36 mo | +15 % | Steady, large, demanding: night departures, on-time ≥ 95 % or rate steps down. Volume grows yearly. |
| Mail | 24–48 mo | low | Small, never fails; ideal belly filler. |

Accepting reserves tonnes on the matching lane (or prompts to open one). Each month: delivered =
min(reserved, lane capacity − other commitments); shortfall × rate × 1.5 is charged as penalty; three
consecutive shortfalls cancel the contract and cost reputation with that shipper (fewer offers from them).

Events (reuse `STATE.timedEffects`): port strike (+40 % air demand on a corridor group), harvest peak
(perishables +35 % on a region), e-commerce festival (express +25 % China → US/EU), recession (−15 % general,
−30 % automotive), pandemic (passenger −40 %, cargo +25 % — cargo becomes the hedge), factory boom
(+30 % on one city). Events surface as market rows tagged Hot and as a feed on the Overview.

## 5. Hubs and research tie-ins

Cargo Hub upgrade levels set monthly hub freight throughput (L0 200 t, L1 700 t, L2 1,400 t, L3 3,000 t);
lanes touching a saturated hub lose 25 % load until upgraded. Research board additions (aircraft /
process / hangars only, in keeping with the existing rule): ULD Systems (+8 % capacity), Cold Chain
(unlocks pharma), Main-deck Loader (unlocks heavy/oversize), Dangerous Goods Certification (unlocks DG),
Cargo Hub Automation (+20 % hub throughput), Night Ops Certification (unlocks integrator offers),
Freighter Conversion Line (−25 % conversion fee and −1 month).

## 6. Window

One Cargo Network window on the sitewide skin, fixed frame like Fleet / Buy / Research, with tabs
Overview · Lanes · Contracts · Freighters · Market. Concepts A–E each show one tab as the lead view;
the recommended build is E as the landing tab with A, B, D and C behind the other tabs.

## 7. Save compatibility

Existing `STATE.cargoRoutes` entries are migrated on load into lanes with a default general-freight mix;
old saves keep their income within ±10 %. New state lives under `STATE.cargo` (lanes, contracts, offers,
conversions, certifications). Nothing in game.js changes; the engine is a patch that wraps
`processCargoRoutes`, the month tick and `openModal('cargo')`.
