export const CAS_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBHFeV39TNci7l7wHsB8Ujrtc-VZHG4INE",
  authDomain: "quiniela-cas-fddd6.firebaseapp.com",
  projectId: "quiniela-cas-fddd6",
  storageBucket: "quiniela-cas-fddd6.firebasestorage.app",
  messagingSenderId: "1006973080400",
  appId: "1:1006973080400:web:abf113ceb0a36fb999d255",
  measurementId: "G-V08LP87HGZ"
};

export function isFirebaseConfigReady() {
  return Object.values(CAS_FIREBASE_CONFIG).every(value => (
    typeof value === 'string' &&
    value.trim() &&
    !value.includes('PASTE_FIREBASE')
  ));
}
