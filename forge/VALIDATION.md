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
