# Firebase Setup Steps For Quiniela CAS

## 1. Create Firebase Project

1. Go to Firebase Console.
2. Create a project.
3. Add a Web app.
4. Copy the Firebase web config.
5. Paste it into `firebase-config.js`.

## 2. Enable Google Login

1. Open Authentication.
2. Go to Sign-in method.
3. Enable Google.
4. Add authorized domains:
   - `centralamericashirts.com`
   - `localhost`
   - `127.0.0.1`

## 3. Create Firestore

1. Open Firestore Database.
2. Create database.
3. Start in production mode.
4. Publish the rules from `firestore.rules`.

## 4. First Admin User

1. Open `quiniela.html`.
2. Sign in with the Google account that will be admin.
3. In Firestore, go to:
   `quinielas/world-cup-2026/participants`
4. Copy the document id for that Google account. That is the Firebase `uid`.
5. Create this document:
   `quinielas/world-cup-2026/admins/{uid}`
6. Suggested fields:
   - `email`: admin email
   - `role`: `admin`
   - `createdAt`: current date
7. Refresh `quiniela.html`. The `Admin resultados` tab should appear.

## 5. Testing Checklist

1. Sign in with a normal Google account.
2. Save predictions.
3. Confirm Firestore creates:
   - `participants/{uid}`
   - `predictions/{uid}`
4. Add admin document for your admin account.
5. Refresh and enter official results from `Admin resultados`.
6. Confirm Firestore updates:
   - `admin/results`
   - `public/leaderboard`
7. Open Ranking and verify points.
8. To test match locking before real kickoff, temporarily set a match date/time in `quiniela.js` to a past time, reload, and confirm its inputs are disabled.

## Important

Current match locking is enforced in the UI and save logic. That blocks normal users. For stricter anti-tamper database enforcement, use a Cloud Function or store predictions per match so Firestore Rules can validate each match lock time.
