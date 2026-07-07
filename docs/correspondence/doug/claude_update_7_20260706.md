---
title: Project Review Outline
author: Douglas Becker
received: 2026-07-06
source: Email
document_type: Creative Memo
---

## claude update 7.6

## Here's where Airline Empire stands as a project:

## The game in one paragraph

Airline Empire is a management/tycoon sim where the player builds a carrier from scratch: opening routes, buying and assigning aircraft, acquiring hubs, setting ticket prices, and managing finances (loans, bankruptcy risk) against competitor airlines — with a turn/sim-speed hybrid loop (continuous sim time plus an END TURN day advance, as reflected in the prototype).
## Accomplished so far
Event & analytics design. You've defined the core trackable event vocabulary: flight completions (load factor, revenue, delays), route opens/closes, aircraft purchases/sales, price changes, hub acquisitions, loans/bankruptcy, competitor events, incidents, and upgrade unlocks. You also split analytics into two audiences — player-facing stats (total passengers, fleet over time, most profitable route, on-time %, valuation charts) and internal balancing metrics (profit margin by aircraft model, time-to-first-profit pacing curves).
UI direction locked in. The command center prototype is now a working shell: world map with animated flights and clickable hubs, live ops feed and flight board, ticking sim clock with speed controls, live-updating KPIs, dynamic alerts, and a functional END TURN. Crucially, the feed's pushEvent(type, payload) pattern is a de facto dry run of your event system — the event types in the sim match your design list almost exactly.
Genre framing established. Sidebar structure (Overview, Operations, Fleet, Routes, Airports, Finance, HR, Reports, Growth) effectively sketches the game's full feature map, even where systems don't exist yet.
Open questions / not yet decided
## Event schema — intentionally deferred; no formal JSON spec yet. The prototype now gives you concrete field candidates to formalize when ready.
## Core economy model — how revenue, costs, demand, and pricing actually interact isn't designed yet; the sim currently fakes it with random values.
## Time model — the prototype mixes continuous sim speed with END TURN days; whether the real game is turn-based, real-time, or hybrid needs a decision, since it shapes everything downstream.
## Competitor AI — competitors appear as events and map legend entries but have no behavior model.
## Depth of each sidebar section — Fleet, HR, Growth, Airports are placeholders; which ones are core systems vs. flavor is open.
## Scope of the map — 10 cities and 13 routes hand-placed; a real route network needs data (airports, distances, demand pairs).
## Suggested next steps
## Decide the time model first — it constrains the economy, event cadence, and UI, and the prototype makes the tradeoff tangible now.
## Formalize the event schema when you feel ready, using the prototype's feed events as the starting field list — this was already flagged as on the horizon.
## Design the economy loop on paper (demand → pricing → load factor → revenue → costs → profit) before coding, since your balancing metrics (time-to-first-profit) depend on it.
## Wire one real system into the command center — e.g., replace random revenue with an actual per-route calculation — to convert the prototype from mockup to playable slice.
## Pick the first "deep dive" system (economy, routing, or fleet) for the next design session, per your plan to drill into systems as the design matures.
