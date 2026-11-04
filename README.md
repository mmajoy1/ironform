# IRONFORM

Permanent hosted workout app. Phase V is a six-week reset with four lifting days per week: upper strength, lower strength, recovery, upper volume, lower volume, recovery, rest.

- Week 1 recalibrates loads, Week 2 builds reps, Week 3 adds two controlled pause variations, Week 4 reduces working sets, Weeks 5–6 rebuild and pursue clean rep improvements.
- Loads follow reps in reserve (RIR), not old scheduled poundages. Add the smallest available increment only after every set reaches the top of the rep range at the required effort.
- The start date is saved on first visit and adjustable under “The reset system.” Notes are local to this browser and keyed by start date and program day. Changing the date does not delete earlier logs.
- The former program remains at `archive.html`. `refresh.html` is the isolated preview of the new default experience.
- The plan assumes the existing barbell/rack/bench and Fat Bell/kettlebell setup. Sharp pain or returning weakness remains a stop condition. No max attempts or forced reps are prescribed.

- Workout date resolves from the device local calendar.
- NKJV Scripture is delivered in-app through API.Bible.
- The API.Bible key is stored only in each browser's local storage and is not committed here.
- Add the Pages URL to your phone Home Screen for one-tap access.

Programming reference: [ACSM 2026 resistance training guidance](https://acsm.org/resistance-training-guidelines-update-2026/). The specific six-week sequence is an implementation choice, not an ACSM protocol or a claim that novelty produces superior hypertrophy.

Development: `npm ci`, then `npm test`. Production is static HTML/CSS/JavaScript and needs no build. Tests run a loopback server and Chromium, check calendar generation, interactions, persistence, responsive layout, and offline route separation. Screenshots are written to ignored `evidence/`.
