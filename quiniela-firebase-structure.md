# Quiniela CAS Firebase Structure

Season id: `world-cup-2026`

## Firestore Paths

- `quinielas/world-cup-2026/matches/{matchId}`
  - Public match data: teams, phase, group, date, lock status.
- `quinielas/world-cup-2026/admin/results`
  - One admin-owned document with official results keyed by match id.
- `quinielas/world-cup-2026/participants/{uid}`
  - Public user profile for the quiniela: display name, photo URL, total points.
- `quinielas/world-cup-2026/predictions/{uid}`
  - One document per user with all predictions keyed by match id.
- `quinielas/world-cup-2026/public/leaderboard`
  - Aggregated ranking rows so the app reads one document for ranking.
- `quinielas/world-cup-2026/admins/{uid}`
  - Admin allowlist. If this doc exists, the user can update official results.

## Minimal Read/Write Strategy

- Save predictions with one write per user action, not autosave per input.
- Store all predictions for a user in a single document.
- Store leaderboard in one public document after admin updates results.
- Keep group-stage matches visible but read-only after they are final.
- Keep knockout phase as the active section once group stage is done.

## Security Rules Shape

- Any signed-in user can read matches, public participants, and leaderboard.
- A user can read/write only `predictions/{theirUid}` before match lock.
- Only admin users can write `admin/results`.
- Only trusted/admin logic should update leaderboard and official results.

## Current Local Prototype

`quiniela.js` uses a store layer. If `firebase-config.js` has real Firebase values, the page uses Google Auth and Firestore. If the config still has placeholders, it falls back to local storage.

## Files To Configure

- `firebase-config.js`
  - Paste the Firebase web app config from Project settings.
- `firestore.rules`
  - Copy/publish these rules in Firebase Console > Firestore Database > Rules.

## Match Locking

The UI blocks prediction edits when `match.date + match.time` is in the past. That protects normal users. For strict anti-tamper enforcement at database level, the final production version should either:

- save predictions per match and validate `request.time` against each match lock time in rules, or
- route prediction saves through a trusted Cloud Function.

The current minimal version keeps one prediction document per user to reduce reads/writes.
