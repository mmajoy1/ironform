# Forge prototype review

Status: interaction verified; visual review performed against the selected Forge mock. User approved the release on November 3, 2026.

- Browser checks: 7 core checks plus 3 targeted edge checks passed in Chromium. The self-contained HTML review copy also passed logging, reload persistence, and Progress checks.
- Viewports: 320×844, 390×844, 768×844, and 1280×844 CSS pixels, DPR 1. Repeated resize and primary-button hit testing passed. Screenshots were inspected for clipping, overlap, font loading, and contrast.
- Keyboard: Enter/Space actions, radio-style effort selection, modal focus return and Escape, visible focus outlines, and reduced-motion behavior verified.
- Data: real sets persist across refresh; only all prescribed sets at matching load/reps/RIR can earn upper-body increases. Incomplete, varied-load, lower-RIR, reload-week and symptom-marked entries do not. Lower-body history with worse symptoms does not prefill its previous load.
- Timer: pause, resume, add time, skip, reload, and offline persistence verified. Countdown updates only while a timer exists; idle UI is still.
- Backups: valid imports preserve existing sessions on collisions; malformed imports are rejected. Exports exclude Scripture keys. Quota failures keep changes in memory with an explicit export warning; corrupted saved data is not overwritten automatically.
- Scripture: mocked API connection, text-only rendering, cache, and clearing its own keys passed. No real API.Bible credential or entitlement was used or tested.
- Offline: the isolated Forge worker caches the page, code, artwork, and fonts. Offline refresh retains logs. No cross-device/cloud sync is claimed.
- Visual evidence: `../evidence/forge-today.png`, `forge-train.png`, `forge-rest.png`, `forge-progress.png`, `forge-narrow.png`, and `forge-desktop.png`; `visual-comparison.html` includes the approved concept, current rendering, 50% overlay and visual difference view.
- Intentional differences from the concept: real calendar dates, a Progress tab and settings, actual prescriptions and effort targets, and expandable notes/back review. Typography, orange accent, artwork, and primary interaction style retain the selected direction.
- Protected files: legacy `index.html`, root `sw.js`, original `data-*.js`, and root manifest match the restored live version. Existing Scripture keys are preserved; Forge logs use a separate key. No production push/deployment was performed.

## Approved production cutover

The preceding evidence describes the isolated prototype. The approved release replaces the root entry and worker, retains the original installed-app ID and launch URL, and leaves existing local storage and original workout data files intact. The root worker only caches app resources and removes obsolete root Ironform caches; it preserves unrelated caches and the nested Forge cache.

All 12 checks passed across the core and targeted release runs. Two additional release tests use the real legacy worker and a production-shaped `/ironform/` path to verify upgrade, Scripture-key preservation, training-log persistence, timer persistence, offline reload with the old launch query, manifest identity, asset loading, and navigation. The root release was captured and visually inspected at 390×844 CSS pixels, DPR 1 (`../evidence/forge-release-mobile.png`). A resize-dependent test assertion now waits for the chart's replacement DOM before measuring its font; app behavior is unchanged.

## November 19 morning-workout rework

The morning entry replaces the daily-logging workflow at the user's request. This section supersedes the earlier programming, logging, and guardrail details above.

- Eleven current checks passed: Monday/Sunday alignment and continued dates, all fixed prescriptions, all 1,189 chapters visited once and all 66 books covered, weekly weight rules, repeat-save idempotence, lighter-week recovery and symptom safeguards, legacy data preservation, settings/backup validation, quota failures, Scripture API selection/cache/offline, date rollover, clipboard summary, and production service-worker upgrade.
- Browser interactions exercised Workout, The Week, Sunday Check-in, notes, bridge alternative, Settings, Scripture connection, backup import/export, keyboard Enter/Escape and focus return, and reduced motion. No new page errors were observed.
- Screenshots inspected at 390×844 CSS pixels, DPR 1; resize checks at 320, 390, 768, and 1280 pixels. Evidence: `../evidence/morning-workout.png`, `morning-week.png`, `morning-checkin.png`, and `morning-release-mobile.png`.
- Visual changes are intentional: prominent numeric prescription columns replace set-entry forms, and a weekly review replaces Progress. The approved type, artwork, orange accent, and dark shell remain.
- Scripture tests use API fixtures; no real user credential was read or sent during testing. The user's existing connection remains local to their browser. New readings require network access; cached readings and workouts work offline.
- Morning time remains a configurable 40-minute default because no specific duration was supplied. Workout estimates range from about 23–32 minutes, plus the shorter Sunday session. No cloud sync or autonomous coaching is claimed.
