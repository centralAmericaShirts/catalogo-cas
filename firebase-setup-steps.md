# Firebase Setup Steps For Quiniela CAS

## 1. Create Firebase Project

1. Go to Firebase Console.
2. Create a project.
3. Add a Web app.
4. Copy the Firebase web config.
5. Paste it into `firebase-config.js`.

## 2. Enable Email Login

1. Open Authentication.
2. Go to Sign-in method.
3. Enable Email/Password.
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
8. Stay signed in as admin and refresh once more. The app will seed/update:
   `quinielas/world-cup-2026/matches/{matchId}`
   with `kickoffAt` timestamps used by Firestore Rules to lock predictions.

## 5. Testing Checklist

1. Create/sign in with a normal email/password account.
2. Save predictions.
3. Confirm Firestore creates:
   - `participants/{uid}`
   - `predictions/{uid}/matches/{matchId}`
4. Add admin document for your admin account.
5. Refresh and enter official results from `Admin resultados`.
6. Confirm Firestore updates:
   - `admin/results`
   - `public/leaderboard`
7. Open Ranking and verify points.
8. Confirm a non-admin user cannot write `admin/results`, `public/leaderboard`, or `matches`.
9. To test match locking before real kickoff, temporarily set a match `kickoffUtc` in `quiniela.js` to a past time, reload as admin to seed the changed match, then confirm a normal user cannot edit/save that match.

## Important

Match locking is enforced in both the UI and Firestore Rules. Rules depend on `matches/{matchId}.kickoffAt`, so an admin must load the deployed app once after schedule changes to seed/update those match documents.
