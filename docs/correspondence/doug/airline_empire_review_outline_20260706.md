---
title: Project Review Outline
author: Douglas Becker
received: 2026-07-06
source: Email
document_type: Creative Memo
---

GPT
---
## Airline Empire Review Outline
1. Current game direction
Airline Empire is now best described as:
A dark premium airline management / strategy sim where the player builds an airline network, manages aircraft, hubs, routes, finances, staff, reports, and growth systems.
The strongest current direction is:
“Build. Connect. Dominate.”
The game should feel like a serious airline ops center, not a toy webpage and not a retro NASA terminal.
## Core fantasy:
You are running an airline from a live operations dashboard. Every decision should feel like it affects a real network.
---
2. Current stable working version
The safest QA version remains:
working_airline-empire-v6_23_4_55__AIRCRAFT_IDENTITY__v03.html
Use this as the stable QA build for now.
Do not treat the later experimental patch/build files as the master yet unless they are manually reviewed and merged cleanly.
Current recommended file roles
File / Version	Role
AIRCRAFT_IDENTITY__v03.html	Current stable QA master
MARKET_INTEL_002__v01.html	Feature donor / rollback checkpoint
AIRCRAFT_IDENTITY_MARKET_INTEL__v04.html	Intended next merged version, but needs verification
HOME_BEAUTY__v05.html	Home screen visual experiment
HOME_BEAUTY_CONTINUE_FIXED__v06.html	Continue/modal fix experiment
DIRECT_FIXED_HOME_CONTINUE__v06.html	Experimental direct-built file; reverted / not trusted
Patch kits	Useful reference only, not master
---
3. Major accomplishments so far
A. Game foundation recovered
We got back under control after several messy visual/prototype passes.
Accomplished:
•	Identified a stable v55 base.
•	Established AIRCRAFT_IDENTITY__v03 as the clean working master.
•	Avoided using broken visual experiments as the master.
•	Started separating feature donors from stable master files.
•	Created a rollback mindset: no more blindly overwriting working builds.
This is important. The project was starting to drift, and now there is a cleaner version hierarchy.
---
B. Aircraft identity layer added
The game now has a stronger aircraft identity system layered on top of the existing aircraft data.
Accomplished:
•	Preserved original aircraft keys for save compatibility.
•	Added aircraft names, IDs, themes, colors, icons, and role descriptions.
•	Kept base AIRCRAFT data intact.
•	Added aircraft identity guide concept.
•	Improved the fleet’s personality without breaking old saves.
This is one of the best structural wins so far because it improves flavor while avoiding save damage.
---
C. Market Intel system designed
A Market Intel companion layer was designed as the “what should I do next?” helper.
Planned / partially packaged features:
•	Route opportunity board
•	Used aircraft market
•	Contract board
•	Advisor report
•	Monthly market report
•	Decision log
•	QA/docs tab
•	Isolated save namespace: STATE.marketIntelV04
Important rule established:
Market Intel should recommend. It should not auto-buy, auto-route, or rewrite player state.
This system should eventually become one of the most useful gameplay layers.
---
D. Home screen direction clarified
We rejected the ugly home screen direction.
Problems identified:
•	Too much old terminal/NASA look.
•	Not enough premium airline ops identity.
•	Too much clutter.
•	Weak first impression.
New target:
•	Cinematic title.
•	Clean launch desk.
•	Strong dark aviation theme.
•	Big readable launch cards.
•	Minimal noise.
•	No retro control-room junk.
The home screen is still open work, but the desired direction is now clear.
---
E. Continue modal problem isolated
The Continue window has been a repeated pain point.
Problem:
•	Save cards stack vertically.
•	Text becomes narrow and broken.
•	Continue layout keeps reverting.
•	Modal feels ugly and unstable.
Temporary fix approach:
•	Add a freeze patch that watches for the old Continue window and rebuilds it.
Better final solution needed:
Stop patching the modal from outside. Replace the actual Continue modal source directly in the game code.
This is still open.
---
F. Sidebar / menu style direction clarified
A lot of the confusion came from mixed instructions around collapse behavior.
Final current preference:
Keep all original menu pieces visible.
You do not want:
•	icon-only rail as the default
•	fake collapsed layout
•	half-hidden text
•	sidebar changing back and forth unpredictably
Current desired sidebar:
•	Full menu visible
•	Original sections preserved
•	Icons visible
•	Labels visible
•	Badges visible
•	Clean premium polish
•	No collapse behavior fighting the layout
Polish direction:
•	Soft active glow
•	Better hover response
•	Cleaner section hierarchy
•	Dark premium ops style
---
G. QA tester handoff created
A QA handoff packet was created around the stable v03 build.
QA tester focus:
•	Can they start a new game?
•	Can they select logo/home hub?
•	Can they reach main game?
•	Can they open fleet/routes?
•	Can they save and continue?
•	Does anything get stuck?
•	Does anything look broken or ugly?
This is the right next discipline: test stable behavior before adding more systems.
---
4. What is still open / unresolved
A. True master file needs to be rebuilt cleanly
Right now, the safest master is v03, but newer ideas exist as patches or donor files.
Open task:
Create one clean file:
working_airline-empire-v6_23_4_55__QA_MASTER_v07.html
This file should include only verified improvements:
•	Aircraft Identity v03
•	Stable full sidebar polish
•	Fixed Continue modal
•	Optional Market Intel only after tested
•	No direct-builder junk
•	No broken collapse behavior
---
B. Continue window needs permanent source fix
The repeated Continue modal issue should not be solved by more visual patches.
Needed:
•	Find the actual openContinueMenu() or modal renderer.
•	Replace that section directly.
•	Make save cards use proper grid/flex layout.
•	Ensure card content cannot collapse into one-character-wide columns.
•	Test empty save, quicksave, autosave, imported save.
This is high priority because it affects QA immediately.
---
C. Home screen needs a final approved design
The home screen still needs final lock.
Needs:
•	Better title area
•	New Game / Continue / Daily / Records / Import Save grouped clearly
•	Better background
•	No old terminal look
•	No clutter
•	16:9 composition
•	Proper focus on “Start Airline Empire”
This is a first-impression screen, so it matters.
---
D. Sidebar needs to be directly implemented, not mocked
The menu should be built directly into the game code using the chosen structure.
Final desired rule:
Full sidebar by default. Do not collapse unless we later add a clean, deliberate collapse mode.
Open decisions:
•	Should collapse be removed entirely for now?
•	Should collapse button be hidden?
•	Should it become a later feature?
Recommendation:
Remove collapse for QA. Add it later only if needed.
---
E. Market Intel needs verification
Market Intel has good gameplay value, but it should not be merged into the QA build until it passes basic testing.
Needs testing:
•	Opens and closes cleanly.
•	Does not duplicate buttons.
•	Does not break new game.
•	Does not change money/fleet/routes unless confirmed.
•	Works after save/load.
•	Does not create modal conflicts.
Recommendation:
Keep Market Intel out of the immediate QA build unless we have time to test it.
---
F. Save/load stability must be protected
Because aircraft identity was layered onto existing aircraft keys, we have a good save compatibility strategy.
Still needs:
•	Old save test
•	New save test
•	Continue menu test
•	Autosave/Quicksave test
•	Imported save test
•	Aircraft purchased before identity layer should still display safely
---
G. Visual consistency is not fully locked
Some screens still likely look mismatched.
Open screens likely needing polish:
•	Home screen
•	Continue modal
•	Main dashboard
•	Fleet screen
•	Routes screen
•	Airports screen
•	Finance
•	Reports
•	Setup/logo/hub flow
•	Airline preview
•	Any event/alert modals
The current style target is good, but the whole game needs one shared UI language.
---
5. Recommended next steps
Step 1 — Freeze the stable QA master
Use:
working_airline-empire-v6_23_4_55__AIRCRAFT_IDENTITY__v03.html
Make a copy named:
working_airline-empire-v6_23_4_55__QA_MASTER_v07.html
Do all further direct edits into that copy only.
---
Step 2 — Fix Continue modal directly
Priority #1.
Goal:
No more patch-on-patch behavior.
The Continue modal should become:
•	Wide enough
•	Clean save cards
•	Proper rows
•	Clear “Load” buttons
•	Clear close button
•	Import save button at bottom
•	No text stacking ever
QA after change:
•	Open Continue with no saves.
•	Open Continue with one save.
•	Open Continue with quicksave + autosave.
•	Load save.
•	Close modal.
•	Reopen modal.
•	Refresh game and reopen modal.
---
Step 3 — Restore/polish the full sidebar
Priority #2.
Goal:
Keep original pieces:
•	Overview
•	Operations
•	Fleet
•	Routes
•	Airports
•	Finance
•	Human Resources
•	Reports
•	Growth
With:
•	Icons
•	Labels
•	Badges
•	Section headers
•	Active state
•	Hover polish
Do not add collapse yet.
---
Step 4 — Replace home screen presentation
Priority #3.
Goal:
Make the first screen feel like Airline Empire.
Home screen should include:
•	Logo/title
•	Tagline
•	New Game
•	Continue
•	Daily Challenge
•	Records
•	Import Save
•	What’s New
•	Version/build label
•	Strong 16:9 composition
Avoid:
•	ugly terminal blocks
•	narrow cards
•	overbuilt NASA retro styling
•	too many small links
---
Step 5 — Run QA tester pass
Give your QA tester only one file:
Airline_Empire_QA_Test_Build_v07.html
Ask them to test:
1.	Start game.
2.	Pick logo.
3.	Pick hub.
4.	Preview airline.
5.	Enter game.
6.	Open each menu.
7.	Save.
8.	Continue.
9.	Screenshot anything ugly or broken.
10.	Write what confused them.
---
Step 6 — Merge Market Intel only after QA
Once the base UI and Continue modal are stable, then merge Market Intel.
Market Intel should become:
•	Advisor/helper layer
•	Route opportunity recommender
•	Aircraft deal board
•	Contract board
•	Monthly report
But it should not be part of QA until the basics are stable.
---
6. Suggested build roadmap
v07 — QA Master Stabilization
Focus:
•	Continue modal fixed
•	Full sidebar restored/polished
•	Home screen improved
•	No collapse weirdness
•	No Market Intel unless already stable
Output:
working_airline-empire-v6_23_4_55__QA_MASTER_v07.html
---
v08 — Market Intel Merge
Focus:
•	Market Intel added cleanly
•	No state corruption
•	No modal conflicts
•	Decision log
•	Monthly report
•	Route/aircraft/contract recommendations
Output:
working_airline-empire-v6_23_4_55__MARKET_INTEL_MERGED_v08.html
---
v09 — Visual Consistency Pass
Focus:
•	Every screen uses same cards/buttons/badges
•	Fleet/routes/airports/finance get consistent styling
•	Modal library cleaned up
•	Sidebar active state tied to actual screen
Output:
working_airline-empire-v6_23_4_55__VISUAL_UNITY_v09.html
---
v10 — QA Candidate
Focus:
•	Bug fixes from husband QA
•	Save/load check
•	New game check
•	Basic balance check
•	No broken navigation
•	No stuck modals
Output:
Airline_Empire_QA_Candidate_v10.html
---
7. Immediate recommendation
Do this next:
Build v07 directly from the stable v03 master.
v07 should only include:
1.	Permanent Continue modal fix.
2.	Full sidebar restored and polished.
3.	Home screen beauty pass, but carefully implemented.
4.	Documentation comment block at top of file.
5.	QA checklist included in a companion .md.
Do not merge Market Intel into the QA tester file yet.
That keeps the game stable enough for review and prevents another spiral of patch chaos.



