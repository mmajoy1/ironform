# Ironform Forge — morning plan

The live app is a Monday–Sunday workout reference for notebook logging. Each exercise shows a starting weight, exact sets, exact reps, and rest. There is no daily digital set logging or effort-rating workflow. The orange Forge visual direction is retained.

## Current plan

Starting loads come from the November 19 live plan. The user explicitly reconfirmed 62 lb goblet squats, 35 lb supported split squats/lunges, and 175 lb RDLs. Bench starts at 205 lb; overhead press at 115 lb. All loads remain adjustable in Settings. The morning window defaults to 40 minutes pending a more specific user preference; estimates include warm-up, prescribed rest, working reps, and setup. These are estimates, not timed guarantees. Bell deloads reduce sets without inventing unavailable bell sizes.

The six-week phases repeat while calendar dates continue forward. Day 1 is always Monday and Day 7 Sunday. An existing start date is aligned to its preceding Monday without rewriting old records. Reopening an old workout URL on a later day advances the workout and reading; deliberate history browsing remains possible.

## Sunday check-in

The check-in opens on Sunday after the Day 7 workout. The user reports sessions completed, back response, time fit, and notebook results. Completed upper-body barbell work with a comfortable back suggests +5 lb. Missed reps repeat the reported weight. Bells, plates, and lower-body work do not automatically increase. The user reviews the displayed next-week weights and explicitly saves them. Re-saving does not compound increases. The lighter week preserves normal working baselines; a worse-back response holds lighter loads rather than restoring heavier loads automatically.

The copy button produces a plain-text check-in for the user to paste into their conversation. It does not send a message or connect to an AI coach. A download fallback works when clipboard access is unavailable.

## Scripture and data

Scripture selects a different chapter by calendar date across all 66 books, using a 1,189-chapter permutation before any chapter repeats. The verse comes from the actual API.Bible verse list for that chapter. Training blocks do not reset readings. The existing API.Bible key and Bible selection are preserved. The latest 90 fetched readings are cached for offline use; new readings need a connection and NKJV access. Verse text is rendered as text, not HTML.

Weekly settings and reviews use `ironform:forge:weekly:v1`. Original daily set records remain untouched in `ironform:forge:v1` and are downloadable through Settings. Weekly export/import excludes Scripture credentials. Invalid saved weekly data is not overwritten. Failed saves remain in memory with an export warning.

## Development and release

Run `npm ci`, `npm run preview`, and `npm test`. The current suite is `tests/morning*.spec.js`; the other spec files document the superseded digital-logging workflow. `forge/morning.html` is the entry source. Run `node tests/prepare-release.cjs` to regenerate both `forge/index.html` and the root entry. `node tests/live-check.cjs` verifies the deployed site in an isolated browser.

The root manifest retains the installed-app identity and launch URL. Both workers cache the new modules for offline use. The root worker only cleans up its own obsolete caches. Existing local storage and unrelated caches survive updates. The original app source remains in Git.

Visual assets: original Magnific equipment image `fH3hD62CDY`, local Barlow Condensed and DM Sans fonts under the included SIL Open Font Licenses. Native HTML/CSS controls retain keyboard access and reduced-motion support.
