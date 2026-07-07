# Decisions

## 2026-07-06 — Use WSL as the Development Environment

Decision: Development happens inside Ubuntu WSL.

Reason: Provides a consistent Linux command-line environment, avoids Windows path issues, and works cleanly with VS Code.

## 2026-07-06 — Git Replaces Versioned Filenames

Decision: The active game entry point is `game/index.html`.

Reason: Version history belongs in Git, not filenames.

## 2026-07-06 — Treat Warnings as Bugs

Decision: Console errors, warnings, missing assets, and HTTP errors are treated as defects until investigated.

Reason: Clean logs make real issues visible.

## 2026-07-06 — Refactor Incrementally

Decision: Move one subsystem at a time and test after every change.

Reason: The game currently has script dependencies that make bulk extraction risky.