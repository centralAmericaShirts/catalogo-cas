import { CAS_FIREBASE_CONFIG, isFirebaseConfigReady } from './firebase-config.js';

const FIREBASE_SDK_VERSION = '12.14.0';
const PREDICTION_BATCH_LIMIT = 6;

export async function createFirebaseQuinielaStore({ paths, createBlankState, hydrateState, matches = [] }) {
  if (!isFirebaseConfigReady()) return null;

  const [{ initializeApp, getApp, getApps }, authSdk, firestoreSdk] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`)
  ]);

  const {
    createUserWithEmailAndPassword,
    getAuth,
    getIdToken,
    browserLocalPersistence,
    onAuthStateChanged,
    reload,
    sendEmailVerification,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
  } = authSdk;

  const {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    serverTimestamp,
    setDoc,
    writeBatch
  } = firestoreSdk;

  const app = getApps().length ? getApp() : initializeApp(CAS_FIREBASE_CONFIG);
  const auth = getAuth(app);
  auth.languageCode = 'es';
  const db = getFirestore(app);
  await setPersistence(auth, browserLocalPersistence);
  await waitForInitialAuth(onAuthStateChanged, auth);

  const docRef = path => doc(db, ...path.split('/'));
  const collectionRef = path => collection(db, ...path.split('/'));
  let seededMatches = false;
  let touchedParticipantSession = false;

  async function getIsAdmin(uid) {
    if (!uid) return false;
    const snapshot = await getDoc(docRef(paths.adminUser(uid)));
    return snapshot.exists();
  }

  async function readResults() {
    const snapshot = await getDoc(docRef(paths.results));
    if (!snapshot.exists()) return {};
    return snapshot.data().results || {};
  }

  async function readLeaderboard() {
    const snapshot = await getDoc(docRef(paths.leaderboard));
    if (!snapshot.exists()) return createBlankState().leaderboard;
    return snapshot.data();
  }

  async function seedMatchesForAdmin(isAdminUser) {
    if (!isAdminUser || seededMatches || !matches.length || !paths.match) return;
    const batch = writeBatch(db);
    matches.forEach(match => {
      batch.set(docRef(paths.match(match.id)), {
        seasonId: 'world-cup-2026',
        id: match.id,
        stage: match.stage || '',
        round: match.round || '',
        home: match.home || '',
        away: match.away || '',
        venue: match.venue || '',
        kickoffUtc: match.kickoffUtc || '',
        kickoffAt: match.kickoffUtc ? new Date(match.kickoffUtc) : null,
        knockout: Boolean(match.knockout),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
    seededMatches = true;
  }

  async function readPredictionsForUser(user) {
    const predictions = {};
    if (paths.predictionMatches) {
      const matchesSnapshot = await getDocs(collectionRef(paths.predictionMatches(user.uid)));
      matchesSnapshot.forEach(snapshot => {
        const data = snapshot.data();
        predictions[snapshot.id] = {
          home: data.home ?? '',
          away: data.away ?? '',
          advances: data.advances || '',
          updatedAt: data.updatedAt || ''
        };
      });
    }

    if (Object.keys(predictions).length) return predictions;

    const predictionSnapshot = await getDoc(docRef(paths.prediction(user.uid)));
    if (!predictionSnapshot.exists()) return {};
    return predictionSnapshot.data().predictions || {};
  }

  async function readParticipants() {
    if (!paths.participants) return {};
    const participants = {};
    const snapshot = await getDocs(collectionRef(paths.participants));
    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const uid = data.uid || docSnapshot.id;
      participants[uid] = {
        id: uid,
        name: data.name || data.displayName || data.email || 'Jugador CAS',
        email: data.email || '',
        photoURL: data.photoURL || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || ''
      };
    });
    return participants;
  }

  async function readAllPredictions(participants) {
    const predictions = {};
    await Promise.all(Object.keys(participants).map(async uid => {
      predictions[uid] = await readPredictionsForUser({ uid });
    }));
    return predictions;
  }

  function authMetadataForUser(user) {
    return {
      authCreationTime: user.metadata?.creationTime || '',
      authLastSignInTime: user.metadata?.lastSignInTime || '',
      emailVerified: Boolean(user.emailVerified)
    };
  }

  async function ensureParticipantDoc(user, options = {}) {
    if (!user) return null;
    const ref = docRef(paths.participant(user.uid));
    const snapshot = await getDoc(ref);
    const participant = {
      seasonId: 'world-cup-2026',
      uid: user.uid,
      id: user.uid,
      displayName: user.displayName || user.email || 'Jugador CAS',
      name: user.displayName || user.email || 'Jugador CAS',
      email: user.email || '',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString()
    };
    const metadata = authMetadataForUser(user);

    if (!snapshot.exists()) {
      await setDoc(ref, {
        ...participant,
        ...metadata,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      touchedParticipantSession = true;
    } else if (options.touch && !touchedParticipantSession) {
      await setDoc(ref, {
        seasonId: 'world-cup-2026',
        uid: user.uid,
        id: user.uid,
        email: user.email || '',
        photoURL: user.photoURL || '',
        ...metadata,
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      touchedParticipantSession = true;
    }

    return {
      ...participant,
      ...metadata,
      ...(snapshot.exists() ? snapshot.data() : {})
    };
  }

  async function load() {
    const state = createBlankState();
    const user = auth.currentUser;
    const [results, leaderboard] = await Promise.all([
      readResults(),
      readLeaderboard()
    ]);

    const isAdminUser = user ? await getIsAdmin(user.uid) : false;

    state.auth = {
      provider: 'firebase',
      configured: true,
      uid: user?.uid || '',
      email: user?.email || '',
      displayName: user?.displayName || '',
      emailVerified: Boolean(user?.emailVerified),
      photoURL: user?.photoURL || '',
      isAdmin: isAdminUser
    };
    state.results = results;
    state.leaderboard = leaderboard;

    if (!user) return hydrateState(state);

    await seedMatchesForAdmin(isAdminUser);

    const participant = await ensureParticipantDoc(user, { touch: true });
    if (participant) {
      state.activeParticipantId = user.uid;
      state.participants[user.uid] = {
        id: user.uid,
        name: participant.name || participant.displayName || user.displayName || user.email || 'Jugador CAS',
        email: participant.email || user.email || '',
        photoURL: participant.photoURL || user.photoURL || '',
        createdAt: participant.createdAt || '',
        updatedAt: participant.updatedAt || ''
      };
    }

    state.predictions[user.uid] = await readPredictionsForUser(user);

    return hydrateState(state);
  }

  async function loadAdminScoringData() {
    const user = auth.currentUser;
    if (!user || !(await getIsAdmin(user.uid))) throw new Error('Solo Admin CAS puede cargar datos de puntuacion.');
    const participants = await readParticipants();
    const predictions = await readAllPredictions(participants);
    return { participants, predictions };
  }

  async function signIn(email, password) {
    try {
      await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
    if (auth.currentUser) await ensureParticipantDoc(auth.currentUser, { touch: true });
  }

  async function signUp({ email, password, name }) {
    try {
      const displayName = String(name || '').trim();
      const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
      if (displayName) await updateProfile(credential.user, { displayName });
      await sendEmailVerification(credential.user);
      await ensureParticipantDoc({
        uid: credential.user.uid,
        displayName: displayName || credential.user.displayName,
        email: credential.user.email,
        photoURL: credential.user.photoURL
      });
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }

  async function sendVerification() {
    const user = auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión.');
    try {
      await sendEmailVerification(user);
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }

  async function refreshUser() {
    if (!auth.currentUser) return;
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await getIdToken(auth.currentUser, true);
    }
  }

  async function sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email));
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }

  async function signOutUser() {
    touchedParticipantSession = false;
    await signOut(auth);
  }

  async function saveParticipant(participant) {
    const user = auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión.');
    await setDoc(docRef(paths.participant(user.uid)), {
      seasonId: 'world-cup-2026',
      uid: user.uid,
      id: user.uid,
      name: participant.name,
      displayName: participant.name,
      email: user.email || participant.email || '',
      photoURL: user.photoURL || participant.photoURL || '',
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  async function savePredictions(participantId, predictionDoc, changes = {}) {
    const user = auth.currentUser;
    if (!user || participantId !== user.uid) throw new Error('Debes iniciar sesión.');
    await reload(user);
    if (!user.emailVerified) throw new Error('Debes verificar tu correo antes de guardar.');
    await getIdToken(user, true);
    try {
      const upserts = changes.upserts || [];
      const deletes = changes.deletes || [];
      if (!paths.predictionMatch) {
        await setDoc(docRef(paths.prediction(user.uid)), {
          ...predictionDoc,
          uid: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return;
      }

      if (!upserts.length && !deletes.length) return;

      const operations = [
        ...upserts.map(({ matchId, prediction }) => ({
          type: 'upsert',
          matchId,
          prediction
        })),
        ...deletes.map(matchId => ({
          type: 'delete',
          matchId
        }))
      ];

      for (let index = 0; index < operations.length; index += PREDICTION_BATCH_LIMIT) {
        const batch = writeBatch(db);
        operations.slice(index, index + PREDICTION_BATCH_LIMIT).forEach(operation => {
          const ref = docRef(paths.predictionMatch(user.uid, operation.matchId));
          if (operation.type === 'delete') {
            batch.delete(ref);
            return;
          }

          batch.set(ref, {
            seasonId: 'world-cup-2026',
            uid: user.uid,
            matchId: operation.matchId,
            home: operation.prediction.home ?? '',
            away: operation.prediction.away ?? '',
            advances: operation.prediction.advances || '',
            updatedAt: serverTimestamp()
          }, { merge: true });
        });
        await batch.commit();
      }
    } catch (error) {
      if (error?.code === 'permission-denied') {
        throw new Error('Firebase rechazó tus pronósticos. Si tu correo ya está verificado, revisa que el calendario de partidos esté preparado y que el partido no haya iniciado.');
      }
      throw error;
    }
  }

  async function saveResults(resultsDoc, leaderboardDoc) {
    const user = auth.currentUser;
    if (!user || !(await getIsAdmin(user.uid))) throw new Error('Solo Admin CAS puede editar resultados.');
    try {
      await Promise.all([
        setDoc(docRef(paths.results), {
          ...resultsDoc,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        setDoc(docRef(paths.leaderboard), {
          ...leaderboardDoc,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]);
    } catch (error) {
      if (error?.code === 'permission-denied') {
        throw new Error('Firebase rechazó la actualización. Revisa que firestore.rules esté publicado y que tu UID exista en quinielas/world-cup-2026/admins.');
      }
      throw error;
    }
  }

  return {
    provider: 'firebase',
    isConfigured: true,
    load,
    loadAdminScoringData,
    save() {},
    saveParticipant,
    savePredictions,
    saveResults,
    signIn,
    signUp,
    sendPasswordReset,
    sendVerification,
    refreshUser,
    signOut: signOutUser
  };
}

function waitForInitialAuth(onAuthStateChanged, auth) {
  return new Promise(resolve => {
    let settled = false;
    let unsubscribe = () => {};
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    };
    const timeout = setTimeout(finish, 5000);
    try {
      unsubscribe = onAuthStateChanged(auth, finish, finish);
    } catch (_) {
      finish();
    }
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function authErrorMessage(error) {
  const code = error?.code || '';
  if (code.includes('auth/email-already-in-use')) return 'Ese correo ya tiene cuenta. Intenta entrar o recuperar contraseña.';
  if (code.includes('auth/invalid-email')) return 'Escribe un correo válido.';
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) return 'Correo o contraseña incorrectos.';
  if (code.includes('auth/weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code.includes('auth/too-many-requests')) return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
  if (code.includes('auth/missing-password')) return 'Escribe tu contraseña.';
  return error?.message || 'No se pudo completar la acción.';
}
