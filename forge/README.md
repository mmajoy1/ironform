# Forge review prototype

Approved orange Forge direction and seven-day, six-week workout plan. This is isolated under `forge/`; the current root app and its service worker are unchanged. No production deployment is part of this branch.

Run `npm ci` and `npm run preview`, then open `http://127.0.0.1:8767/forge/`. Run `npm test` for browser and programming checks. The static app has no build step, account, or backend. After the first successful load, its own scoped service worker caches its assets for offline use.

Training logs use `ironform:forge:v1`. Start-date changes preserve previous blocks. Export/import moves training data, never API.Bible credentials. Existing Scripture keys/cache retain their original names for compatibility when this preview eventually shares the original origin.

The first bench trial is 245 lb only if 6 reps leave about two clean reps (235 lb or less otherwise). The overhead-press trial is 135 lb. Other unknown loads remain blank for effort-based selection. The heaviest Fat Bell is 62 lb; kettlebell is 40 lb. Lower-body work stays light and receives no automatic load increase. Day 7 can become recovery-only. Weeks 3 and 5 use explicit accessory variants with separate exercise identities; Week 4 reduces sets and keeps at least 4 reps in reserve.

Progression is derived from actual sets: all prescribed sets must reach the upper rep target at the required RIR, at the same load, without symptom flags. Reload-week and incomplete entries never earn increases. Suggested increases remain suggestions, not auto-applied logged weights. The session back-response field can be updated afterward or the next morning.

Visual assets: original Magnific equipment image created for this conversation (`fH3hD62CDY`, 0 reported credits). Local Barlow Condensed and DM Sans fonts use their included SIL Open Font Licenses. The project uses native DOM/CSS and accessible HTML controls. No decorative layers intercept controls.

Deployment review: the legacy root service worker caches every navigation as the old index page. Before hosting this route under the existing live origin, that legacy worker must be scoped to exclude `forge/` and its cache deletion narrowed. Do not publish this branch without addressing that integration and the user's review of the prototype.
