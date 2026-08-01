# QA — AE v1.1.9 UI Polish and Center Alignment

1. Launch the existing game entry point.
2. On the main menu, verify the three action cards are slightly smaller and centered as one row at desktop width.
3. Start a new game.
4. Verify Game Type and Difficulty frames are centered horizontally.
5. Verify each row contains three balanced cards at desktop width.
6. Verify selected cards retain clear teal selection treatment.
7. Click `Next — Choose Scenario`.
8. Verify Scenario Selection is centered horizontally.
9. Verify no Back button is visible on Scenario Selection.
10. Verify the Next button is centered.
11. Scroll or resize the window and verify there is no background color seam between screen sections.
12. Select a scenario and confirm Next still advances to Found Airline.
13. Verify the existing plane transition still runs.
14. At narrow width, confirm cards stack without horizontal overflow.
15. Run `REVERSE_PATCH.bat` and verify version 1.1.8 is restored.
