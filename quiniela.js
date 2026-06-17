import { createFirebaseQuinielaStore } from './quiniela-firebase-store.js?v=20260613-admin-light';

(() => {
  const STORAGE_KEY = 'casQuinielaMundial2026V1';
  const DEFAULT_PLAYER_NAME = 'Invitado CAS';
  const QUINIELA_SEASON_ID = 'world-cup-2026';
  const LOCAL_USER_ID = 'local-demo-user';
  const GUATEMALA_TIME_ZONE = 'America/Guatemala';

  // ESTRUCTURA FIREBASE PREPARADA:
  // Al conectar Firebase, este mapa sera la guia de colecciones/documentos.
  // Mantener una prediccion por usuario reduce escrituras y lecturas.
  const FIREBASE_PATHS = {
    season: `quinielas/${QUINIELA_SEASON_ID}`,
    matches: `quinielas/${QUINIELA_SEASON_ID}/matches`,
    results: `quinielas/${QUINIELA_SEASON_ID}/admin/results`,
    leaderboard: `quinielas/${QUINIELA_SEASON_ID}/public/leaderboard`,
    adminUser: uid => `quinielas/${QUINIELA_SEASON_ID}/admins/${uid}`,
    participants: `quinielas/${QUINIELA_SEASON_ID}/participants`,
    predictions: `quinielas/${QUINIELA_SEASON_ID}/predictions`,
    participant: uid => `quinielas/${QUINIELA_SEASON_ID}/participants/${uid}`,
    match: matchId => `quinielas/${QUINIELA_SEASON_ID}/matches/${matchId}`,
    prediction: uid => `quinielas/${QUINIELA_SEASON_ID}/predictions/${uid}`,
    predictionMatches: uid => `quinielas/${QUINIELA_SEASON_ID}/predictions/${uid}/matches`,
    predictionMatch: (uid, matchId) => `quinielas/${QUINIELA_SEASON_ID}/predictions/${uid}/matches/${matchId}`
  };

  const QUINIELA_MATCHES = [
    { id: 'm001', kickoffUtc: '2026-06-11T19:00:00Z', stage: 'Grupo A', round: 'Jornada 1', home: 'Mexico', away: 'Sudafrica', venue: 'Estadio Azteca, Mexico City' },
    { id: 'm002', kickoffUtc: '2026-06-12T02:00:00Z', stage: 'Grupo A', round: 'Jornada 1', home: 'Corea del Sur', away: 'Republica Checa', venue: 'Estadio Akron, Guadalajara' },
    { id: 'm003', kickoffUtc: '2026-06-12T19:00:00Z', stage: 'Grupo B', round: 'Jornada 1', home: 'Canada', away: 'Bosnia y Herzegovina', venue: 'BMO Field, Toronto' },
    { id: 'm004', kickoffUtc: '2026-06-13T01:00:00Z', stage: 'Grupo D', round: 'Jornada 1', home: 'Estados Unidos', away: 'Paraguay', venue: 'SoFi Stadium, Los Angeles' },
    { id: 'm005', kickoffUtc: '2026-06-13T19:00:00Z', stage: 'Grupo B', round: 'Jornada 1', home: 'Qatar', away: 'Suiza', venue: "Levi's Stadium, San Francisco Bay Area" },
    { id: 'm006', kickoffUtc: '2026-06-13T22:00:00Z', stage: 'Grupo C', round: 'Jornada 1', home: 'Brasil', away: 'Marruecos', venue: 'MetLife Stadium, New York/New Jersey' },
    { id: 'm007', kickoffUtc: '2026-06-14T01:00:00Z', stage: 'Grupo C', round: 'Jornada 1', home: 'Haiti', away: 'Escocia', venue: 'Gillette Stadium, Boston' },
    { id: 'm008', kickoffUtc: '2026-06-14T04:00:00Z', stage: 'Grupo D', round: 'Jornada 1', home: 'Australia', away: 'Turquia', venue: 'BC Place, Vancouver' },
    { id: 'm009', kickoffUtc: '2026-06-14T17:00:00Z', stage: 'Grupo E', round: 'Jornada 1', home: 'Alemania', away: 'Curazao', venue: 'NRG Stadium, Houston' },
    { id: 'm010', kickoffUtc: '2026-06-14T20:00:00Z', stage: 'Grupo F', round: 'Jornada 1', home: 'Paises Bajos', away: 'Japon', venue: 'AT&T Stadium, Dallas' },
    { id: 'm011', kickoffUtc: '2026-06-14T23:00:00Z', stage: 'Grupo E', round: 'Jornada 1', home: 'Costa de Marfil', away: 'Ecuador', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 'm012', kickoffUtc: '2026-06-15T02:00:00Z', stage: 'Grupo F', round: 'Jornada 1', home: 'Suecia', away: 'Tunez', venue: 'Estadio BBVA, Monterrey' },
    { id: 'm013', kickoffUtc: '2026-06-15T16:00:00Z', stage: 'Grupo H', round: 'Jornada 1', home: 'Espana', away: 'Cabo Verde', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 'm014', kickoffUtc: '2026-06-15T19:00:00Z', stage: 'Grupo G', round: 'Jornada 1', home: 'Belgica', away: 'Egipto', venue: 'Lumen Field, Seattle' },
    { id: 'm015', kickoffUtc: '2026-06-15T22:00:00Z', stage: 'Grupo H', round: 'Jornada 1', home: 'Arabia Saudita', away: 'Uruguay', venue: 'Hard Rock Stadium, Miami' },
    { id: 'm016', kickoffUtc: '2026-06-16T01:00:00Z', stage: 'Grupo G', round: 'Jornada 1', home: 'Iran', away: 'Nueva Zelanda', venue: 'SoFi Stadium, Los Angeles' },
    { id: 'm017', kickoffUtc: '2026-06-16T19:00:00Z', stage: 'Grupo I', round: 'Jornada 1', home: 'Francia', away: 'Senegal', venue: 'MetLife Stadium, New York/New Jersey' },
    { id: 'm018', kickoffUtc: '2026-06-16T22:00:00Z', stage: 'Grupo I', round: 'Jornada 1', home: 'Irak', away: 'Noruega', venue: 'Gillette Stadium, Boston' },
    { id: 'm019', kickoffUtc: '2026-06-17T01:00:00Z', stage: 'Grupo J', round: 'Jornada 1', home: 'Argentina', away: 'Argelia', venue: 'GEHA Field at Arrowhead Stadium, Kansas City' },
    { id: 'm020', kickoffUtc: '2026-06-17T04:00:00Z', stage: 'Grupo J', round: 'Jornada 1', home: 'Austria', away: 'Jordania', venue: 'Levi\'s Stadium, San Francisco Bay Area' },
    { id: 'm021', kickoffUtc: '2026-06-17T17:00:00Z', stage: 'Grupo K', round: 'Jornada 1', home: 'Portugal', away: 'RD Congo', venue: 'NRG Stadium, Houston' },
    { id: 'm022', kickoffUtc: '2026-06-17T20:00:00Z', stage: 'Grupo L', round: 'Jornada 1', home: 'Inglaterra', away: 'Croacia', venue: 'AT&T Stadium, Dallas' },
    { id: 'm023', kickoffUtc: '2026-06-17T23:00:00Z', stage: 'Grupo L', round: 'Jornada 1', home: 'Ghana', away: 'Panama', venue: 'BMO Field, Toronto' },
    { id: 'm024', kickoffUtc: '2026-06-18T02:00:00Z', stage: 'Grupo K', round: 'Jornada 1', home: 'Uzbekistan', away: 'Colombia', venue: 'Estadio Azteca, Mexico City' },
    { id: 'm025', kickoffUtc: '2026-06-18T16:00:00Z', stage: 'Grupo A', round: 'Jornada 2', home: 'Republica Checa', away: 'Sudafrica', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 'm026', kickoffUtc: '2026-06-18T19:00:00Z', stage: 'Grupo B', round: 'Jornada 2', home: 'Suiza', away: 'Bosnia y Herzegovina', venue: 'SoFi Stadium, Los Angeles' },
    { id: 'm027', kickoffUtc: '2026-06-18T22:00:00Z', stage: 'Grupo B', round: 'Jornada 2', home: 'Canada', away: 'Qatar', venue: 'BC Place, Vancouver' },
    { id: 'm028', kickoffUtc: '2026-06-19T01:00:00Z', stage: 'Grupo A', round: 'Jornada 2', home: 'Mexico', away: 'Corea del Sur', venue: 'Estadio Akron, Guadalajara' },
    { id: 'm029', kickoffUtc: '2026-06-19T19:00:00Z', stage: 'Grupo D', round: 'Jornada 2', home: 'Estados Unidos', away: 'Australia', venue: 'Lumen Field, Seattle' },
    { id: 'm030', kickoffUtc: '2026-06-19T22:00:00Z', stage: 'Grupo C', round: 'Jornada 2', home: 'Escocia', away: 'Marruecos', venue: 'Gillette Stadium, Boston' },
    { id: 'm031', kickoffUtc: '2026-06-20T00:30:00Z', stage: 'Grupo C', round: 'Jornada 2', home: 'Brasil', away: 'Haiti', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 'm032', kickoffUtc: '2026-06-20T03:00:00Z', stage: 'Grupo D', round: 'Jornada 2', home: 'Turquia', away: 'Paraguay', venue: 'Levi\'s Stadium, San Francisco Bay Area' },
    { id: 'm033', kickoffUtc: '2026-06-20T17:00:00Z', stage: 'Grupo F', round: 'Jornada 2', home: 'Paises Bajos', away: 'Suecia', venue: 'NRG Stadium, Houston' },
    { id: 'm034', kickoffUtc: '2026-06-20T20:00:00Z', stage: 'Grupo E', round: 'Jornada 2', home: 'Alemania', away: 'Costa de Marfil', venue: 'BMO Field, Toronto' },
    { id: 'm035', kickoffUtc: '2026-06-21T00:00:00Z', stage: 'Grupo E', round: 'Jornada 2', home: 'Ecuador', away: 'Curazao', venue: 'GEHA Field at Arrowhead Stadium, Kansas City' },
    { id: 'm036', kickoffUtc: '2026-06-21T04:00:00Z', stage: 'Grupo F', round: 'Jornada 2', home: 'Tunez', away: 'Japon', venue: 'Estadio BBVA, Monterrey' },
    { id: 'm037', kickoffUtc: '2026-06-21T16:00:00Z', stage: 'Grupo H', round: 'Jornada 2', home: 'Espana', away: 'Arabia Saudita', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 'm038', kickoffUtc: '2026-06-21T19:00:00Z', stage: 'Grupo G', round: 'Jornada 2', home: 'Belgica', away: 'Iran', venue: 'SoFi Stadium, Los Angeles' },
    { id: 'm039', kickoffUtc: '2026-06-21T22:00:00Z', stage: 'Grupo H', round: 'Jornada 2', home: 'Uruguay', away: 'Cabo Verde', venue: 'Hard Rock Stadium, Miami' },
    { id: 'm040', kickoffUtc: '2026-06-22T01:00:00Z', stage: 'Grupo G', round: 'Jornada 2', home: 'Nueva Zelanda', away: 'Egipto', venue: 'BC Place, Vancouver' },
    { id: 'm041', kickoffUtc: '2026-06-22T17:00:00Z', stage: 'Grupo J', round: 'Jornada 2', home: 'Argentina', away: 'Austria', venue: 'AT&T Stadium, Dallas' },
    { id: 'm042', kickoffUtc: '2026-06-22T21:00:00Z', stage: 'Grupo I', round: 'Jornada 2', home: 'Francia', away: 'Irak', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 'm043', kickoffUtc: '2026-06-23T00:00:00Z', stage: 'Grupo I', round: 'Jornada 2', home: 'Noruega', away: 'Senegal', venue: 'MetLife Stadium, New York/New Jersey' },
    { id: 'm044', kickoffUtc: '2026-06-23T03:00:00Z', stage: 'Grupo J', round: 'Jornada 2', home: 'Jordania', away: 'Argelia', venue: 'Levi\'s Stadium, San Francisco Bay Area' },
    { id: 'm045', kickoffUtc: '2026-06-23T17:00:00Z', stage: 'Grupo K', round: 'Jornada 2', home: 'Portugal', away: 'Uzbekistan', venue: 'NRG Stadium, Houston' },
    { id: 'm046', kickoffUtc: '2026-06-23T20:00:00Z', stage: 'Grupo L', round: 'Jornada 2', home: 'Inglaterra', away: 'Ghana', venue: 'Gillette Stadium, Boston' },
    { id: 'm047', kickoffUtc: '2026-06-23T23:00:00Z', stage: 'Grupo L', round: 'Jornada 2', home: 'Panama', away: 'Croacia', venue: 'BMO Field, Toronto' },
    { id: 'm048', kickoffUtc: '2026-06-24T02:00:00Z', stage: 'Grupo K', round: 'Jornada 2', home: 'Colombia', away: 'RD Congo', venue: 'Estadio Akron, Guadalajara' },
    { id: 'm049', kickoffUtc: '2026-06-24T19:00:00Z', stage: 'Grupo B', round: 'Jornada 3', home: 'Suiza', away: 'Canada', venue: 'BC Place, Vancouver' },
    { id: 'm050', kickoffUtc: '2026-06-24T19:00:00Z', stage: 'Grupo B', round: 'Jornada 3', home: 'Bosnia y Herzegovina', away: 'Qatar', venue: 'Lumen Field, Seattle' },
    { id: 'm051', kickoffUtc: '2026-06-24T22:00:00Z', stage: 'Grupo C', round: 'Jornada 3', home: 'Escocia', away: 'Brasil', venue: 'Hard Rock Stadium, Miami' },
    { id: 'm052', kickoffUtc: '2026-06-24T22:00:00Z', stage: 'Grupo C', round: 'Jornada 3', home: 'Marruecos', away: 'Haiti', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 'm053', kickoffUtc: '2026-06-25T01:00:00Z', stage: 'Grupo A', round: 'Jornada 3', home: 'Republica Checa', away: 'Mexico', venue: 'Estadio Azteca, Mexico City' },
    { id: 'm054', kickoffUtc: '2026-06-25T01:00:00Z', stage: 'Grupo A', round: 'Jornada 3', home: 'Sudafrica', away: 'Corea del Sur', venue: 'Estadio BBVA, Monterrey' },
    { id: 'm055', kickoffUtc: '2026-06-25T20:00:00Z', stage: 'Grupo E', round: 'Jornada 3', home: 'Curazao', away: 'Costa de Marfil', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 'm056', kickoffUtc: '2026-06-25T20:00:00Z', stage: 'Grupo E', round: 'Jornada 3', home: 'Ecuador', away: 'Alemania', venue: 'MetLife Stadium, New York/New Jersey' },
    { id: 'm057', kickoffUtc: '2026-06-25T23:00:00Z', stage: 'Grupo F', round: 'Jornada 3', home: 'Japon', away: 'Suecia', venue: 'AT&T Stadium, Dallas' },
    { id: 'm058', kickoffUtc: '2026-06-25T23:00:00Z', stage: 'Grupo F', round: 'Jornada 3', home: 'Tunez', away: 'Paises Bajos', venue: 'GEHA Field at Arrowhead Stadium, Kansas City' },
    { id: 'm059', kickoffUtc: '2026-06-26T02:00:00Z', stage: 'Grupo D', round: 'Jornada 3', home: 'Turquia', away: 'Estados Unidos', venue: 'SoFi Stadium, Los Angeles' },
    { id: 'm060', kickoffUtc: '2026-06-26T02:00:00Z', stage: 'Grupo D', round: 'Jornada 3', home: 'Paraguay', away: 'Australia', venue: 'Levi\'s Stadium, San Francisco Bay Area' },
    { id: 'm061', kickoffUtc: '2026-06-26T19:00:00Z', stage: 'Grupo I', round: 'Jornada 3', home: 'Noruega', away: 'Francia', venue: 'Gillette Stadium, Boston' },
    { id: 'm062', kickoffUtc: '2026-06-26T19:00:00Z', stage: 'Grupo I', round: 'Jornada 3', home: 'Senegal', away: 'Irak', venue: 'BMO Field, Toronto' },
    { id: 'm063', kickoffUtc: '2026-06-27T00:00:00Z', stage: 'Grupo H', round: 'Jornada 3', home: 'Cabo Verde', away: 'Arabia Saudita', venue: 'NRG Stadium, Houston' },
    { id: 'm064', kickoffUtc: '2026-06-27T00:00:00Z', stage: 'Grupo H', round: 'Jornada 3', home: 'Uruguay', away: 'Espana', venue: 'Estadio Akron, Guadalajara' },
    { id: 'm065', kickoffUtc: '2026-06-27T03:00:00Z', stage: 'Grupo G', round: 'Jornada 3', home: 'Egipto', away: 'Iran', venue: 'Lumen Field, Seattle' },
    { id: 'm066', kickoffUtc: '2026-06-27T03:00:00Z', stage: 'Grupo G', round: 'Jornada 3', home: 'Nueva Zelanda', away: 'Belgica', venue: 'BC Place, Vancouver' },
    { id: 'm067', kickoffUtc: '2026-06-27T21:00:00Z', stage: 'Grupo L', round: 'Jornada 3', home: 'Panama', away: 'Inglaterra', venue: 'MetLife Stadium, New York/New Jersey' },
    { id: 'm068', kickoffUtc: '2026-06-27T21:00:00Z', stage: 'Grupo L', round: 'Jornada 3', home: 'Croacia', away: 'Ghana', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 'm069', kickoffUtc: '2026-06-27T23:30:00Z', stage: 'Grupo K', round: 'Jornada 3', home: 'Colombia', away: 'Portugal', venue: 'Hard Rock Stadium, Miami' },
    { id: 'm070', kickoffUtc: '2026-06-27T23:30:00Z', stage: 'Grupo K', round: 'Jornada 3', home: 'RD Congo', away: 'Uzbekistan', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 'm071', kickoffUtc: '2026-06-28T02:00:00Z', stage: 'Grupo J', round: 'Jornada 3', home: 'Argelia', away: 'Austria', venue: 'GEHA Field at Arrowhead Stadium, Kansas City' },
    { id: 'm072', kickoffUtc: '2026-06-28T02:00:00Z', stage: 'Grupo J', round: 'Jornada 3', home: 'Jordania', away: 'Argentina', venue: 'AT&T Stadium, Dallas' }
  ];

  const TEAM_FLAGS = {
    Mexico: '🇲🇽',
    Sudafrica: '🇿🇦',
    'Corea del Sur': '🇰🇷',
    'Republica Checa': '🇨🇿',
    Canada: '🇨🇦',
    'Bosnia y Herzegovina': '🇧🇦',
    'Estados Unidos': '🇺🇸',
    Paraguay: '🇵🇾',
    Qatar: '🇶🇦',
    Suiza: '🇨🇭',
    Brasil: '🇧🇷',
    Marruecos: '🇲🇦',
    Haiti: '🇭🇹',
    Escocia: '🏴',
    Australia: '🇦🇺',
    Turquia: '🇹🇷',
    Alemania: '🇩🇪',
    Curazao: '🇨🇼',
    'Paises Bajos': '🇳🇱',
    Japon: '🇯🇵',
    'Costa de Marfil': '🇨🇮',
    Ecuador: '🇪🇨',
    Suecia: '🇸🇪',
    Tunez: '🇹🇳',
    Espana: '🇪🇸',
    'Cabo Verde': '🇨🇻',
    Belgica: '🇧🇪',
    Egipto: '🇪🇬',
    'Arabia Saudita': '🇸🇦',
    Uruguay: '🇺🇾',
    Iran: '🇮🇷',
    'Nueva Zelanda': '🇳🇿',
    Francia: '🇫🇷',
    Senegal: '🇸🇳',
    Irak: '🇮🇶',
    Noruega: '🇳🇴',
    Argentina: '🇦🇷',
    Argelia: '🇩🇿',
    Austria: '🇦🇹',
    Jordania: '🇯🇴',
    Portugal: '🇵🇹',
    'RD Congo': '🇨🇩',
    Inglaterra: '🏴',
    Croacia: '🇭🇷',
    Ghana: '🇬🇭',
    Panama: '🇵🇦',
    Uzbekistan: '🇺🇿',
    Colombia: '🇨🇴'
  };

  // PUNTOS DE LA QUINIELA:
  // Cambia estos valores para ajustar cuantos puntos entrega cada situacion.
  const SCORING = {
    exact: 5,
    outcome: 2,
    goalDifference: 1
  };

  let quinielaState = createBlankState();
  let quinielaStore = createLocalQuinielaStore();
  let activeTab = 'instructions';
  let authMode = 'signin';
  let noticeText = '';
  let shouldScrollToPredictionDate = false;

  function startQuinielaPage() {
    if (!document.body.classList.contains('quiniela-page')) return;
    initQuinielaPage();
    setupQuinielaScrollState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startQuinielaPage);
  } else {
    startQuinielaPage();
  }

  async function initQuinielaPage() {
    try {
      const firebaseStore = await createFirebaseQuinielaStore({
        paths: FIREBASE_PATHS,
        createBlankState,
        hydrateState,
        matches: QUINIELA_MATCHES
      });
      if (firebaseStore) quinielaStore = firebaseStore;
      quinielaState = await loadState();
      ensureDefaultParticipant();
      renderQuiniela();
    } catch (error) {
      console.warn('Firebase no se pudo inicializar. Usando modo local.', error);
      quinielaStore = createLocalQuinielaStore();
      quinielaState = await loadState();
      ensureDefaultParticipant();
      noticeText = 'Modo local activo';
      renderQuiniela();
    } finally {
      if (typeof hidePageLoader === 'function') hidePageLoader();
    }
  }

  function setupQuinielaScrollState() {
    const updateScrolledState = () => {
      document.body.classList.toggle('quiniela-scrolled', window.scrollY > 24);
    };
    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });
  }

  function createBlankState() {
    return {
      version: 1,
      seasonId: QUINIELA_SEASON_ID,
      auth: {
        provider: 'local',
        uid: LOCAL_USER_ID,
        email: '',
        isAdmin: true
      },
      activeParticipantId: '',
      participants: {},
      predictions: {},
      results: {},
      leaderboard: {
        rows: [],
        updatedAt: ''
      },
      updatedAt: ''
    };
  }

  function createLocalQuinielaStore() {
    return {
      provider: 'local',
      load() {
        try {
          const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
          if (!parsed || typeof parsed !== 'object') return createBlankState();
          return hydrateState(parsed);
        } catch (_) {
          return createBlankState();
        }
      },
      save(state) {
        const nextState = {
          ...state,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      }
    };
  }

  function hydrateState(parsed) {
    return {
      ...createBlankState(),
      ...parsed,
      seasonId: parsed.seasonId || QUINIELA_SEASON_ID,
      auth: {
        ...createBlankState().auth,
        ...(parsed.auth || {})
      },
      participants: parsed.participants || {},
      predictions: parsed.predictions || {},
      results: parsed.results || {},
      leaderboard: parsed.leaderboard || createBlankState().leaderboard
    };
  }

  async function loadState() {
    return await quinielaStore.load();
  }

  async function saveState() {
    await quinielaStore.save(quinielaState);
  }

  function createParticipantDoc(participant) {
    return {
      seasonId: QUINIELA_SEASON_ID,
      uid: participant.id,
      displayName: participant.name,
      photoURL: participant.photoURL || '',
      email: participant.email || '',
      updatedAt: new Date().toISOString()
    };
  }

  function createPredictionDoc(participantId, predictions) {
    return {
      seasonId: QUINIELA_SEASON_ID,
      uid: participantId,
      predictions,
      updatedAt: new Date().toISOString()
    };
  }

  function createResultsDoc(results) {
    return {
      seasonId: QUINIELA_SEASON_ID,
      results,
      updatedAt: new Date().toISOString()
    };
  }

  function createLeaderboardDoc(rows) {
    return {
      seasonId: QUINIELA_SEASON_ID,
      rows: rows.map((row, index) => ({
        rank: index + 1,
        uid: row.participant.id,
        displayName: row.participant.name,
        points: row.points,
        exact: row.exact,
        outcome: row.outcome,
        submitted: row.submitted
      })),
      updatedAt: new Date().toISOString()
    };
  }

  function ensureDefaultParticipant() {
    if (isFirebaseMode()) {
      if (!quinielaState.auth.uid) return;
      const uid = quinielaState.auth.uid;
      if (!quinielaState.participants[uid]) {
        quinielaState.participants[uid] = {
          id: uid,
          name: quinielaState.auth.displayName || quinielaState.auth.email || 'Jugador CAS',
          email: quinielaState.auth.email || '',
          photoURL: quinielaState.auth.photoURL || '',
          updatedAt: new Date().toISOString()
        };
      }
      quinielaState.activeParticipantId = uid;
      return;
    }

    if (quinielaState.activeParticipantId && quinielaState.participants[quinielaState.activeParticipantId]) return;
    const existingId = Object.keys(quinielaState.participants)[0];
    if (existingId) {
      quinielaState.activeParticipantId = existingId;
      saveState();
      return;
    }
    const participant = upsertParticipant(DEFAULT_PLAYER_NAME);
    quinielaState.activeParticipantId = participant.id;
    saveState();
  }

  function normalizeParticipantId(name) {
    const base = String(name || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return base || 'participante';
  }

  function upsertParticipant(name, options = {}) {
    const safeName = String(name || '').trim() || DEFAULT_PLAYER_NAME;
    let id = options.id || normalizeParticipantId(safeName);
    let suffix = 2;
    while (!options.id && quinielaState.participants[id] && quinielaState.participants[id].name.toLowerCase() !== safeName.toLowerCase()) {
      id = `${normalizeParticipantId(safeName)}-${suffix}`;
      suffix += 1;
    }

    quinielaState.participants[id] = {
      id,
      name: safeName,
      email: options.email || quinielaState.participants[id]?.email || '',
      photoURL: options.photoURL || quinielaState.participants[id]?.photoURL || '',
      createdAt: quinielaState.participants[id]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    quinielaState.predictions[id] = quinielaState.predictions[id] || {};
    return quinielaState.participants[id];
  }

  function getActiveParticipant() {
    ensureDefaultParticipant();
    return quinielaState.participants[quinielaState.activeParticipantId] || {
      id: '',
      name: isFirebaseMode() ? 'Inicia sesión' : DEFAULT_PLAYER_NAME,
      email: '',
      photoURL: ''
    };
  }

  function isFirebaseMode() {
    return quinielaState.auth?.provider === 'firebase';
  }

  function isSignedIn() {
    return !isFirebaseMode() || Boolean(quinielaState.auth?.uid);
  }

  function isEmailVerified() {
    return !isFirebaseMode() || Boolean(quinielaState.auth?.emailVerified);
  }

  function canManageResults() {
    return !isFirebaseMode() || Boolean(quinielaState.auth?.isAdmin);
  }

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function getKickoffDate(match) {
    if (match.kickoffUtc) return new Date(match.kickoffUtc);
    return new Date(`${match.date}T${match.time}:00-06:00`);
  }

  function getGuatemalaDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: GUATEMALA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function getMatchDateKey(match) {
    return getGuatemalaDateKey(getKickoffDate(match));
  }

  function formatMatchTime(match) {
    return new Intl.DateTimeFormat('es-GT', {
      timeZone: GUATEMALA_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(getKickoffDate(match));
  }

  function formatMatchDate(match) {
    const label = new Intl.DateTimeFormat('es-GT', {
      timeZone: GUATEMALA_TIME_ZONE,
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).format(getKickoffDate(match));
    return `${label} | ${formatMatchTime(match)}`;
  }

  function matchStartDate(match) {
    return getKickoffDate(match);
  }

  function isMatchLocked(match) {
    return matchStartDate(match).getTime() <= Date.now();
  }

  function scoreValue(value) {
    if (value === '' || value === null || value === undefined) return '';
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return '';
    return Math.min(99, Math.floor(number));
  }

  function isCompleteScore(score) {
    return score && score.home !== '' && score.away !== '' && Number.isFinite(Number(score.home)) && Number.isFinite(Number(score.away));
  }

  function outcomeFor(score) {
    const home = Number(score.home);
    const away = Number(score.away);
    if (home > away) return 'home';
    if (home < away) return 'away';
    return 'draw';
  }

  function goalDiffFor(score) {
    return Number(score.home) - Number(score.away);
  }

  function isCompletePrediction(match, prediction) {
    return isCompleteScore(prediction);
  }

  function hasPredictionValue(prediction) {
    return prediction
      && (prediction.home !== '' || prediction.away !== '' || prediction.advances);
  }

  function isCompleteResult(match, result) {
    return Boolean(result?.final) && isCompleteScore(result);
  }

  function calculatePredictionScore(prediction, result) {
    if (!result?.final || !isCompleteScore(result) || !isCompleteScore(prediction)) {
      return { points: 0, exact: false, outcome: false, goalDifference: false };
    }

    const exact = Number(prediction.home) === Number(result.home) && Number(prediction.away) === Number(result.away);
    if (exact) return { points: SCORING.exact, exact: true, outcome: true, goalDifference: true };

    const outcome = outcomeFor(prediction) === outcomeFor(result);
    const goalDifference = outcome && goalDiffFor(prediction) === goalDiffFor(result);
    return {
      points: (outcome ? SCORING.outcome : 0) + (goalDifference ? SCORING.goalDifference : 0),
      exact: false,
      outcome,
      goalDifference
    };
  }

  function getParticipantSummary(participantId) {
    const predictions = quinielaState.predictions[participantId] || {};
    const totals = { points: 0, exact: 0, outcome: 0, played: 0, submitted: 0 };

    QUINIELA_MATCHES.forEach(match => {
      const prediction = predictions[match.id];
      const result = quinielaState.results[match.id];
      if (isCompletePrediction(match, prediction)) totals.submitted += 1;
      if (isCompleteResult(match, result)) totals.played += 1;

      const score = calculatePredictionScore(prediction, result);
      totals.points += score.points;
      if (score.exact) totals.exact += 1;
      else if (score.outcome) totals.outcome += 1;
    });

    return totals;
  }

  function getLeaderboardRows() {
    if (!Array.isArray(quinielaState.leaderboard?.rows) || !quinielaState.leaderboard.rows.length) return [];
    return quinielaState.leaderboard.rows.map(row => ({
      participant: {
        id: row.uid || '',
        name: row.displayName || 'Jugador CAS'
      },
      points: Number(row.points) || 0,
      exact: Number(row.exact) || 0,
      outcome: Number(row.outcome) || 0,
      submitted: Number(row.submitted) || 0
    })).sort((a, b) => b.points - a.points
      || b.exact - a.exact
      || a.participant.name.localeCompare(b.participant.name));
  }

  function getCalculatedRankingRows() {
    return Object.values(quinielaState.participants)
      .map(participant => ({ participant, ...getParticipantSummary(participant.id) }))
      .sort((a, b) => b.points - a.points
        || b.exact - a.exact
        || a.participant.name.localeCompare(b.participant.name));
  }

  function getRankingRows() {
    const leaderboardRows = isFirebaseMode() ? getLeaderboardRows() : [];
    return leaderboardRows.length ? leaderboardRows : getCalculatedRankingRows();
  }

  function getMatchesByStage() {
    return [...QUINIELA_MATCHES]
      .sort((a, b) => getKickoffDate(a).getTime() - getKickoffDate(b).getTime())
      .reduce((groups, match) => {
        const stage = match.stage || 'Partidos';
        if (!groups.some(group => group.stage === stage)) groups.push({ stage, matches: [] });
        groups.find(group => group.stage === stage).matches.push(match);
        return groups;
      }, []);
  }

  function formatGroupDate(dateString) {
    const date = new Date(`${dateString}T12:00:00-06:00`);
    const label = new Intl.DateTimeFormat('es-GT', {
      timeZone: GUATEMALA_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function getMatchesByDate() {
    return [...QUINIELA_MATCHES]
      .sort((a, b) => getKickoffDate(a).getTime() - getKickoffDate(b).getTime())
      .reduce((groups, match) => {
        const dateKey = getMatchDateKey(match);
        if (!groups.some(group => group.dateKey === dateKey)) {
          groups.push({
            dateKey,
            stage: formatGroupDate(dateKey),
            matches: []
          });
        }
        groups.find(group => group.dateKey === dateKey).matches.push(match);
        return groups;
      }, []);
  }

  function getDefaultPredictionGroupIndex(groups) {
    if (!groups.length) return -1;

    const todayKey = getGuatemalaDateKey();
    const todayIndex = groups.findIndex(group => group.dateKey === todayKey);
    if (todayIndex !== -1) return todayIndex;

    const now = Date.now();
    const nextIndex = groups.findIndex(group => group.matches.some(match => getKickoffDate(match).getTime() >= now));
    if (nextIndex !== -1) return nextIndex;

    return groups.length - 1;
  }

  function predictionCountForStage(participantId, matches) {
    const predictions = quinielaState.predictions[participantId] || {};
    return matches.filter(match => isCompletePrediction(match, predictions[match.id])).length;
  }

  function resultCountForStage(matches) {
    return matches.filter(match => {
      const result = quinielaState.results[match.id];
      return isCompleteResult(match, result);
    }).length;
  }

  function renderQuiniela() {
    const app = document.getElementById('quinielaApp');
    if (!app) return;
    if (activeTab === 'results' && !canManageResults()) activeTab = 'play';

    const activeParticipant = getActiveParticipant();
    const summary = getParticipantSummary(activeParticipant.id);
    const completedResults = QUINIELA_MATCHES.filter(match => {
      const result = quinielaState.results[match.id];
      return isCompleteResult(match, result);
    }).length;

    app.innerHTML = `
      <section class="quiniela-top">
        <div class="quiniela-title-block">
          <span class="quiniela-kicker">Mundial 2026</span>
          <h1>Quiniela CAS - 2026</h1>
        </div>
        <div class="quiniela-score-strip" aria-label="Resumen">
          <div>
            <span>${summary.points}</span>
            <small>Puntos</small>
          </div>
          <div>
            <span>${summary.exact}</span>
            <small>Exactos</small>
          </div>
          <div>
            <span>${summary.submitted}/${QUINIELA_MATCHES.length}</span>
            <small>Pronósticos</small>
          </div>
          <div>
            <span>${completedResults}</span>
            <small>Finalizados</small>
          </div>
        </div>
      </section>

      <div class="quiniela-tabs${canManageResults() ? ' has-admin' : ''}" role="tablist" aria-label="Secciones de Quiniela CAS">
        ${renderTabButton('instructions', 'Info')}
        ${renderTabButton('play', 'Jugar')}
        ${renderTabButton('ranking', 'Ranking')}
        ${renderTabButton('account', 'Cuenta')}
        ${canManageResults() ? renderTabButton('results', 'Admin', 'quiniela-admin-tab') : ''}
      </div>

      <div class="quiniela-notice${noticeText ? ' active' : ''}" id="quinielaNotice">${escapeText(noticeText)}</div>
      <section class="quiniela-panel">
        ${activeTab === 'instructions' ? renderInstructions() : ''}
        ${activeTab === 'play' ? renderPlay(activeParticipant) : ''}
        ${activeTab === 'ranking' ? renderRanking() : ''}
        ${activeTab === 'account' ? renderAccount(activeParticipant) : ''}
        ${activeTab === 'results' ? renderResultsAdmin() : ''}
      </section>
    `;

    noticeText = '';
    bindQuinielaEvents();
    scrollToPredictionDateIfNeeded();
  }

  function scrollToPredictionDateIfNeeded() {
    if (!shouldScrollToPredictionDate || (activeTab !== 'play' && activeTab !== 'results')) return;
    shouldScrollToPredictionDate = false;
    const currentGroup = document.querySelector('[data-prediction-group-current="true"]');
    if (!currentGroup) return;

    window.requestAnimationFrame(() => {
      currentGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderInstructions() {
    return `
      <div class="quiniela-instructions">
        <div class="quiniela-panel-header">
          <div>
            <h2>Instrucciones</h2>
            <p>Lee esto antes de jugar. Es rápido y te ayuda a no perder puntos.</p>
          </div>
          <button type="button" class="primary-btn" data-quiniela-tab="play">Jugar</button>
        </div>

        <div class="quiniela-instruction-grid">
          <article class="quiniela-instruction-card">
            <strong>1</strong>
            <h3>Entra a Jugar</h3>
            <p>Crea tu cuenta, verifica tu email y ajusta tu nombre público en Cuenta.</p>
          </article>
          <article class="quiniela-instruction-card">
            <strong>2</strong>
            <h3>Llena tus marcadores</h3>
            <p>Escribe goles para local y visitante antes de que empiece cada partido.</p>
          </article>
          <article class="quiniela-instruction-card">
            <strong>3</strong>
            <h3>Guarda tus pronósticos</h3>
            <p>Puedes cambiar un marcador mientras el partido no haya iniciado.</p>
          </article>
          <article class="quiniela-instruction-card">
            <strong>4</strong>
            <h3>Revisa Ranking</h3>
            <p>La tabla se actualiza cuando CAS marque resultados finales.</p>
          </article>
        </div>

        <div class="quiniela-rules">
          <div>
            <h3>Puntos</h3>
            <ul>
              <li><strong>${SCORING.exact} pts</strong> por marcador exacto.</li>
              <li><strong>${SCORING.outcome} pts</strong> por acertar ganador o empate.</li>
              <li><strong>${SCORING.goalDifference} pt</strong> extra por diferencia de goles correcta.</li>
            </ul>
          </div>
          <div>
            <h3>Importante</h3>
            <ul>
              <li>Solo se toma en cuenta pronóstico confirmado.</li>
              <li>Al iniciar un partido se cierra el pronóstico.</li>
              <li>Si hay empate en puntos, ganan el que tenga más resultados exactos.</li>
            </ul>
          </div>
          <div>
            <h3>Eliminación directa</h3>
            <ul>
              <li>El marcador se pronostica solo para los 90 minutos.</li>
              <li>La puntuación es igual que en fase de grupos.</li>
              <li>Tiempos extra y penales no suman puntos.</li>
            </ul>
          </div>
          <div>
            <h3>Premios</h3>
            <ul>
              <li><strong>Primer Lugar:</strong> Camisola Sorpresa</li>
              <li><strong>Segundo Lugar:</strong> Camisola Sorpresa</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function renderPlay(activeParticipant) {
    return `
      <div class="quiniela-play-content">
        ${renderPredictions(activeParticipant.id)}
      </div>
    `;
  }

  function renderAccount(activeParticipant) {
    return `
      <div class="quiniela-account-content">
        ${renderPlayerPanel(activeParticipant)}
      </div>
    `;
  }

  function renderPlayerPanel(activeParticipant) {
    if (isFirebaseMode() && !isSignedIn()) {
      const isCreatingAccount = authMode === 'signup';
      return `
        <section class="quiniela-player-panel quiniela-login-panel quiniela-auth-panel" aria-label="Cuenta CAS">
          <div class="quiniela-auth-intro">
            <label>Cuenta CAS</label>
            <p>${isCreatingAccount ? 'Crea tu cuenta para guardar tus pronósticos.' : 'Entra con tu correo y contraseña para guardar tus pronósticos.'}</p>
          </div>
          <div class="quiniela-auth-forms">
            ${isCreatingAccount ? renderSignUpForm() : renderSignInForm()}
          </div>
        </section>
      `;
    }

    if (isFirebaseMode()) {
      if (!isEmailVerified()) {
        return `
          <section class="quiniela-player-panel quiniela-verify-panel" aria-label="Verificar correo">
            <div class="quiniela-auth-user">
              <div>
                <label>Cuenta CAS</label>
                <strong>${escapeText(quinielaState.auth.email || activeParticipant.name)}</strong>
                <span>Pendiente de verificar</span>
              </div>
            </div>
            <div class="quiniela-verify-actions">
              <p>Revisa tu correo y abre el enlace de verificación. Después vuelve aquí y confirma.</p>
              <div>
                <button type="button" class="primary-btn" data-refresh-verification>Ya verifiqué</button>
                <button type="button" class="secondary-btn quiniela-compact-secondary" data-resend-verification>Reenviar correo</button>
                <button type="button" class="secondary-btn quiniela-compact-secondary" data-auth-signout>Salir</button>
              </div>
            </div>
          </section>
        `;
      }

      return `
        <section class="quiniela-player-panel" aria-label="Participante">
          <div class="quiniela-auth-user">
            <div>
              <label>Cuenta CAS</label>
              <strong>${escapeText(quinielaState.auth.email || activeParticipant.name)}</strong>
              <span>${canManageResults() ? 'Admin CAS' : 'Verificado'}</span>
              <button type="button" class="secondary-btn quiniela-signout-btn" data-auth-signout>Salir</button>
            </div>
          </div>
          <form class="quiniela-name-form" id="quinielaNameForm">
            <div class="field-group">
              <label for="quinielaPlayerName">Nombre público</label>
              <input type="text" id="quinielaPlayerName" value="${escapeText(activeParticipant.name)}" maxlength="40" autocomplete="name">
            </div>
            <button type="submit" class="primary-btn">Guardar nombre</button>
          </form>
        </section>
      `;
    }

    return `
      <section class="quiniela-player-panel" aria-label="Participante">
        <div class="field-group">
          <label for="quinielaParticipantSelect">Participante activo</label>
          <select id="quinielaParticipantSelect">
            ${Object.values(quinielaState.participants).map(participant => `
              <option value="${escapeText(participant.id)}"${participant.id === activeParticipant.id ? ' selected' : ''}>${escapeText(participant.name)}</option>
            `).join('')}
          </select>
        </div>
        <form class="quiniela-name-form" id="quinielaNameForm">
          <div class="field-group">
            <label for="quinielaPlayerName">Nombre público</label>
            <input type="text" id="quinielaPlayerName" value="${escapeText(activeParticipant.name)}" maxlength="40" autocomplete="name">
          </div>
          <button type="submit" class="primary-btn">Usar nombre</button>
        </form>
      </section>
    `;
  }

  function renderSignInForm() {
    return `
      <form class="quiniela-auth-form" id="quinielaSignInForm">
        <h3>Entrar</h3>
        <div class="field-group">
          <label for="quinielaLoginEmail">Correo</label>
          <input type="email" id="quinielaLoginEmail" autocomplete="email" required>
        </div>
        <div class="field-group">
          <label for="quinielaLoginPassword">Contraseña</label>
          <input type="password" id="quinielaLoginPassword" autocomplete="current-password" minlength="6" required>
        </div>
        <button type="submit" class="primary-btn">Entrar</button>
        <button type="button" class="quiniela-link-btn" data-password-reset>Olvidé mi contraseña</button>
        <div class="quiniela-auth-switch">
          <span>¿No tienes cuenta?</span>
          <button type="button" class="quiniela-link-btn" data-auth-mode="signup">Crear cuenta</button>
        </div>
      </form>
    `;
  }

  function renderSignUpForm() {
    return `
      <form class="quiniela-auth-form" id="quinielaSignUpForm">
        <h3>Crear cuenta</h3>
        <div class="field-group">
          <label for="quinielaSignupName">Nombre público</label>
          <input type="text" id="quinielaSignupName" maxlength="40" autocomplete="name" required>
        </div>
        <div class="field-group">
          <label for="quinielaSignupEmail">Correo</label>
          <input type="email" id="quinielaSignupEmail" autocomplete="email" required>
        </div>
        <div class="field-group">
          <label for="quinielaSignupPassword">Contraseña</label>
          <input type="password" id="quinielaSignupPassword" autocomplete="new-password" minlength="6" required>
        </div>
        <button type="submit" class="primary-btn">Crear cuenta</button>
        <div class="quiniela-auth-switch">
          <span>¿Ya tienes cuenta?</span>
          <button type="button" class="quiniela-link-btn" data-auth-mode="signin">Entrar</button>
        </div>
      </form>
    `;
  }

  function renderTabButton(tab, label, extraClass = '') {
    return `
      <button type="button" class="quiniela-tab${activeTab === tab ? ' active' : ''}${extraClass ? ` ${escapeText(extraClass)}` : ''}" data-quiniela-tab="${escapeText(tab)}" role="tab" aria-selected="${activeTab === tab ? 'true' : 'false'}">
        ${escapeText(label)}
      </button>
    `;
  }

  function renderPredictions(participantId) {
    if (!isSignedIn()) {
      return `
        <div class="quiniela-panel-header">
          <div>
            <h2>Mis pronósticos</h2>
            <p>Entra o crea tu cuenta CAS para guardar tus marcadores.</p>
          </div>
          <button type="button" class="primary-btn" data-quiniela-tab="account">Cuenta</button>
        </div>
      `;
    }

    if (!isEmailVerified()) {
      return `
        <div class="quiniela-panel-header">
          <div>
            <h2>Mis pronósticos</h2>
            <p>Verifica tu correo para habilitar tus pronósticos y aparecer en el ranking.</p>
          </div>
          <button type="button" class="primary-btn" data-quiniela-tab="account">Cuenta</button>
        </div>
      `;
    }

    const predictions = quinielaState.predictions[participantId] || {};
    return `
      <form id="quinielaPredictionsForm">
        <div class="quiniela-panel-header">
          <div>
            <h2>Mis pronósticos</h2>
            <p>Puntaje: ${SCORING.exact} exacto | ${SCORING.outcome} ganador/empate | ${SCORING.goalDifference} diferencia</p>
          </div>
        </div>
        <div class="quiniela-play-save-sticky">
          <button type="submit" class="primary-btn">Guardar pronósticos</button>
        </div>
        ${renderPredictionGroups(participantId, predictions)}
        <div class="quiniela-save-bar">
          <button type="submit" class="primary-btn">Guardar pronósticos</button>
        </div>
      </form>
    `;
  }

  function renderPredictionGroups(participantId, predictions) {
    const groups = getMatchesByDate();
    const openIndex = getDefaultPredictionGroupIndex(groups);

    return `
      <div class="quiniela-groups">
        ${groups.map((group, index) => {
          const completed = predictionCountForStage(participantId, group.matches);
          return renderMatchGroup({
            stage: group.stage,
            count: `${completed}/${group.matches.length} completados`,
            open: index === openIndex,
            isCurrent: index === openIndex,
            cards: group.matches.map(match => renderPredictionCard(match, predictions[match.id])).join('')
          });
        }).join('')}
      </div>
    `;
  }

  function renderMatchGroup({ stage, count, open, isCurrent = false, cards }) {
    return `
      <details class="quiniela-group"${open ? ' open' : ''}${isCurrent ? ' data-prediction-group-current="true"' : ''}>
        <summary>
          <span>${escapeText(stage)}</span>
          <strong>${escapeText(count)}</strong>
        </summary>
        <div class="quiniela-match-list">
          ${cards}
        </div>
      </details>
    `;
  }

  function isPredictionLocked(match) {
    return isMatchLocked(match) || Boolean(quinielaState.results[match.id]?.final);
  }

  function predictionStatusFor(match) {
    const result = quinielaState.results[match.id];
    if (result?.final) return 'terminado';
    if (isMatchLocked(match)) return 'iniciado';
    return 'haz tu predicción';
  }

  function predictionPointsLabel(match, prediction) {
    const result = quinielaState.results[match.id];
    if (!result?.final || !isCompleteScore(result)) return '';
    const points = calculatePredictionScore(prediction, result).points;
    return `${points} ${points === 1 ? 'pt' : 'pts'}`;
  }

  function renderTeamBlock(team) {
    const hasFlag = Boolean(TEAM_FLAGS[team]);
    const flag = TEAM_FLAGS[team] || 'TBD';
    return `
      <div class="quiniela-team-block">
        <span class="quiniela-team-flag${hasFlag ? '' : ' is-placeholder'}" aria-hidden="true">${escapeText(flag)}</span>
        <strong>${escapeText(team)}</strong>
      </div>
    `;
  }

  function renderPredictionCard(match, prediction = {}) {
    const locked = isPredictionLocked(match);
    const status = predictionStatusFor(match);
    const pointsLabel = predictionPointsLabel(match, prediction);

    return `
      <article class="quiniela-match-card quiniela-prediction-card">
        <div class="quiniela-prediction-meta">
          ${escapeText(match.stage)} - ${escapeText(formatMatchTime(match))}
        </div>
        <div class="quiniela-prediction-fixture">
          ${renderTeamBlock(match.home)}
          <input class="quiniela-score-input quiniela-prediction-box" type="text" maxlength="2" inputmode="numeric" pattern="[0-9]*" data-prediction-home="${escapeText(match.id)}" value="${escapeText(prediction.home ?? '')}" ${locked ? 'disabled' : ''} aria-label="${escapeText(match.home)}">
          <b>vs</b>
          <input class="quiniela-score-input quiniela-prediction-box" type="text" maxlength="2" inputmode="numeric" pattern="[0-9]*" data-prediction-away="${escapeText(match.id)}" value="${escapeText(prediction.away ?? '')}" ${locked ? 'disabled' : ''} aria-label="${escapeText(match.away)}">
          ${renderTeamBlock(match.away)}
        </div>
        <div class="quiniela-prediction-footer">
          <div class="quiniela-prediction-status">
            ${escapeText(status)}
          </div>
          ${pointsLabel ? `<div class="quiniela-prediction-points">${escapeText(pointsLabel)}</div>` : ''}
        </div>
      </article>
    `;
  }

  function renderRanking() {
    const rows = getRankingRows();
    return `
      <div class="quiniela-panel-header">
        <div>
          <h2>Ranking</h2>
          <p>${rows.length} participante${rows.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div class="quiniela-ranking">
        ${rows.map((row, index) => renderRankingRow(row, index)).join('')}
      </div>
    `;
  }

  function renderRankingRow(row, index) {
    return `
      <article class="quiniela-ranking-row${index < 3 ? ' top-rank' : ''}">
        <div class="quiniela-rank-number">${index + 1}</div>
        <div class="quiniela-rank-person">
          <strong>${escapeText(row.participant.name)}</strong>
        </div>
        <div class="quiniela-rank-stats">
          <span>${row.points}<small>pts</small></span>
          <span>${row.exact}<small>exactos</small></span>
        </div>
      </article>
    `;
  }

  function renderResultsAdmin() {
    const groups = getMatchesByDate();
    const openIndex = getDefaultPredictionGroupIndex(groups);

    return `
      <form id="quinielaResultsForm">
        <div class="quiniela-panel-header">
          <div>
            <h2>Admin resultados</h2>
            <p>Marcadores finales para calcular el ranking</p>
          </div>
        </div>
        <div class="quiniela-play-save-sticky">
          <button type="submit" class="primary-btn">Actualizar resultados</button>
        </div>
        <div class="quiniela-admin-badge">Admin CAS</div>
        <div class="quiniela-groups">
          ${groups.map((group, index) => renderMatchGroup({
            stage: group.stage,
            count: `${resultCountForStage(group.matches)}/${group.matches.length} resultados`,
            open: index === openIndex,
            isCurrent: index === openIndex,
            cards: group.matches.map(match => renderResultCard(match, quinielaState.results[match.id])).join('')
          })).join('')}
        </div>
        <div class="quiniela-save-bar">
          <button type="submit" class="primary-btn">Actualizar resultados</button>
        </div>
      </form>
    `;
  }

  function renderResultCard(match, result = {}) {
    return `
      <article class="quiniela-match-card quiniela-prediction-card result-card">
        <div class="quiniela-prediction-meta">
          ${escapeText(match.stage)} - ${escapeText(formatMatchTime(match))}
        </div>
        <div class="quiniela-prediction-fixture">
          ${renderTeamBlock(match.home)}
          <input class="quiniela-score-input quiniela-prediction-box" type="text" maxlength="2" inputmode="numeric" pattern="[0-9]*" data-result-home="${escapeText(match.id)}" value="${escapeText(result.home ?? '')}" aria-label="${escapeText(match.home)} final">
          <b>vs</b>
          <input class="quiniela-score-input quiniela-prediction-box" type="text" maxlength="2" inputmode="numeric" pattern="[0-9]*" data-result-away="${escapeText(match.id)}" value="${escapeText(result.away ?? '')}" aria-label="${escapeText(match.away)} final">
          ${renderTeamBlock(match.away)}
        </div>
        <div class="quiniela-result-footer">
          <label class="quiniela-final-check">
            <input type="checkbox" data-result-final="${escapeText(match.id)}"${result.final ? ' checked' : ''}>
            Finalizado
          </label>
        </div>
      </article>
    `;
  }

  function bindQuinielaEvents() {
    document.getElementById('quinielaSignInForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await runQuinielaAction(async () => {
        const email = document.getElementById('quinielaLoginEmail')?.value || '';
        const password = document.getElementById('quinielaLoginPassword')?.value || '';
        await quinielaStore.signIn(email, password);
        quinielaState = await loadState();
        ensureDefaultParticipant();
        noticeText = isEmailVerified() ? 'Sesión iniciada' : 'Sesión iniciada. Verifica tu correo para jugar.';
      });
    });

    document.getElementById('quinielaSignUpForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await runQuinielaAction(async () => {
        const name = document.getElementById('quinielaSignupName')?.value || DEFAULT_PLAYER_NAME;
        const email = document.getElementById('quinielaSignupEmail')?.value || '';
        const password = document.getElementById('quinielaSignupPassword')?.value || '';
        await quinielaStore.signUp({ name, email, password });
        quinielaState = await loadState();
        ensureDefaultParticipant();
        noticeText = 'Cuenta creada. Te enviamos un correo de verificación.';
      });
    });

    document.querySelectorAll('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => {
        authMode = button.dataset.authMode === 'signup' ? 'signup' : 'signin';
        renderQuiniela();
      });
    });

    document.querySelectorAll('[data-password-reset]').forEach(button => {
      button.addEventListener('click', async () => {
        await runQuinielaAction(async () => {
          const email = document.getElementById('quinielaLoginEmail')?.value || document.getElementById('quinielaSignupEmail')?.value || '';
          if (!email.trim()) throw new Error('Escribe tu correo para enviar el reset.');
          await quinielaStore.sendPasswordReset(email);
          noticeText = 'Te enviamos un correo para cambiar tu contraseña.';
        });
      });
    });

    document.querySelectorAll('[data-resend-verification]').forEach(button => {
      button.addEventListener('click', async () => {
        await runQuinielaAction(async () => {
          await quinielaStore.sendVerification();
          noticeText = 'Correo de verificación reenviado.';
        });
      });
    });

    document.querySelectorAll('[data-refresh-verification]').forEach(button => {
      button.addEventListener('click', async () => {
        await runQuinielaAction(async () => {
          await quinielaStore.refreshUser();
          quinielaState = await loadState();
          ensureDefaultParticipant();
          noticeText = isEmailVerified() ? 'Correo verificado. Ya puedes jugar.' : 'Tu correo todavía no aparece verificado.';
        });
      });
    });

    document.querySelectorAll('[data-auth-signout]').forEach(button => {
      button.addEventListener('click', async () => {
        await runQuinielaAction(async () => {
          await quinielaStore.signOut();
          quinielaState = await loadState();
          noticeText = 'Sesión cerrada';
        });
      });
    });

    document.querySelectorAll('[data-quiniela-tab]').forEach(button => {
      button.addEventListener('click', () => {
        const nextTab = button.dataset.quinielaTab;
        shouldScrollToPredictionDate = nextTab === 'play' || nextTab === 'results';
        activeTab = nextTab;
        renderQuiniela();
      });
    });

    document.getElementById('quinielaParticipantSelect')?.addEventListener('change', async event => {
      quinielaState.activeParticipantId = event.target.value;
      await saveState();
      renderQuiniela();
    });

    document.getElementById('quinielaNameForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await runQuinielaAction(async () => {
        const name = document.getElementById('quinielaPlayerName')?.value || DEFAULT_PLAYER_NAME;
        const participant = upsertParticipant(name, isFirebaseMode() ? {
          id: quinielaState.auth.uid,
          email: quinielaState.auth.email,
          photoURL: quinielaState.auth.photoURL
        } : {});
        quinielaState.activeParticipantId = participant.id;
        if (quinielaStore.saveParticipant && isFirebaseMode()) {
          await quinielaStore.saveParticipant(participant);
        }
        await saveState();
        noticeText = 'Participante listo';
      });
    });

    document.getElementById('quinielaPredictionsForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await runQuinielaAction(async () => {
        await savePredictions();
        noticeText = 'Pronósticos guardados';
      });
    });

    document.getElementById('quinielaResultsForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await runQuinielaAction(async () => {
        await saveResults();
        noticeText = 'Resultados actualizados';
      });
    });

    document.querySelectorAll('.quiniela-score-input').forEach(input => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 2);
      });
    });
  }

  async function runQuinielaAction(action) {
    try {
      await action();
      quinielaState = await loadState();
      ensureDefaultParticipant();
    } catch (error) {
      noticeText = error.message || 'No se pudo completar la acción';
    }
    renderQuiniela();
  }

  async function savePredictions() {
    if (!isSignedIn()) throw new Error('Debes iniciar sesión para guardar.');
    if (!isEmailVerified()) throw new Error('Debes verificar tu correo antes de guardar.');

    const participant = getActiveParticipant();
    const existingPredictions = quinielaState.predictions[participant.id] || {};
    const predictions = { ...existingPredictions };
    const predictionChanges = { upserts: [], deletes: [] };

    QUINIELA_MATCHES.forEach(match => {
      if (isPredictionLocked(match)) return;
      const homeInput = document.querySelector(`[data-prediction-home="${match.id}"]`);
      const awayInput = document.querySelector(`[data-prediction-away="${match.id}"]`);
      const home = scoreValue(homeInput?.value ?? '');
      const away = scoreValue(awayInput?.value ?? '');
      if (home === '' && away === '') {
        delete predictions[match.id];
        if (hasPredictionValue(existingPredictions[match.id])) {
          predictionChanges.deletes.push(match.id);
        }
        return;
      }
      predictions[match.id] = {
        home,
        away,
        advances: '',
        updatedAt: new Date().toISOString()
      };
      predictionChanges.upserts.push({
        matchId: match.id,
        prediction: predictions[match.id]
      });
    });

    quinielaState.predictions[participant.id] = predictions;
    if (quinielaStore.savePredictions && isFirebaseMode()) {
      await quinielaStore.savePredictions(participant.id, createPredictionDoc(participant.id, predictions), predictionChanges);
    }
    await saveState();
  }

  async function saveResults() {
    if (!canManageResults()) throw new Error('Solo Admin CAS puede editar resultados.');

    const results = {};

    QUINIELA_MATCHES.forEach(match => {
      const homeInput = document.querySelector(`[data-result-home="${match.id}"]`);
      const awayInput = document.querySelector(`[data-result-away="${match.id}"]`);
      const finalInput = document.querySelector(`[data-result-final="${match.id}"]`);
      const home = scoreValue(homeInput?.value ?? '');
      const away = scoreValue(awayInput?.value ?? '');
      const final = Boolean(finalInput?.checked);
      const finalReady = final
        && home !== ''
        && away !== '';
      if (home === '' && away === '' && !final) return;
      results[match.id] = {
        home,
        away,
        advances: '',
        final: finalReady,
        updatedAt: new Date().toISOString()
      };
    });

    quinielaState.results = results;
    if (quinielaStore.loadAdminScoringData && isFirebaseMode()) {
      const scoringData = await quinielaStore.loadAdminScoringData();
      quinielaState.participants = {
        ...scoringData.participants,
        ...quinielaState.participants
      };
      quinielaState.predictions = {
        ...scoringData.predictions,
        ...quinielaState.predictions
      };
    }
    quinielaState.leaderboard = createLeaderboardDoc(getCalculatedRankingRows());
    if (quinielaStore.saveResults && isFirebaseMode()) {
      await quinielaStore.saveResults(createResultsDoc(results), quinielaState.leaderboard);
    }
    await saveState();
  }
})();
