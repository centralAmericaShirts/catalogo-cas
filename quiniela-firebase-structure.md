# Quiniela CAS Firebase Structure

Season id: `world-cup-2026`

## Firestore Paths

- `quinielas/world-cup-2026/matches/{matchId}`
  - Public match data: teams, phase, group, `kickoffUtc`, and `kickoffAt`.
  - `kickoffAt` is used by Firestore Rules to lock prediction writes.
- `quinielas/world-cup-2026/admin/results`
  - One admin-owned document with official results keyed by match id.
- `quinielas/world-cup-2026/participants/{uid}`
  - Public user profile for the quiniela: display name, photo URL, total points.
- `quinielas/world-cup-2026/predictions/{uid}/matches/{matchId}`
  - One prediction document per user per match.
  - This lets Firestore Rules validate each match deadline.
- `quinielas/world-cup-2026/public/leaderboard`
  - Aggregated ranking rows so the app reads one document for ranking.
- `quinielas/world-cup-2026/admins/{uid}`
  - Admin allowlist. If this doc exists, the user can update official results.

## Minimal Read/Write Strategy

- Save predictions with one write per user action, not autosave per input.
- Store predictions per match under the user's prediction collection.
- Store leaderboard in one public document after admin updates results.
- Keep group-stage matches visible but read-only after they are final.
- Keep knockout phase as the active section once group stage is done.

## Security Rules Shape

- Any signed-in user can read matches, public participants, and leaderboard.
- A user can read/write only their own `predictions/{uid}/matches/{matchId}` before that match's `kickoffAt`.
- Only admin users can write `admin/results`.
- Only trusted/admin logic should update leaderboard and official results.

## Current Local Prototype

`quiniela.js` uses a store layer. If `firebase-config.js` has real Firebase values, the page uses email/password Auth and Firestore. If the config still has placeholders, it falls back to local storage.

## Files To Configure

- `firebase-config.js`
  - Paste the Firebase web app config from Project settings.
- `firestore.rules`
  - Copy/publish these rules in Firebase Console > Firestore Database > Rules.

## Match Locking

The UI blocks prediction edits when `kickoffUtc` is in the past. Firestore Rules also block writes to each `predictions/{uid}/matches/{matchId}` when `request.time >= matches/{matchId}.kickoffAt`.

After changing the schedule, an admin should load the deployed page once so the app can seed/update `matches/{matchId}` with the latest kickoff timestamps.
