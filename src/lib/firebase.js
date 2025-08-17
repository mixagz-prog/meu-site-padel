// src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as fbSignOut,
  getRedirectResult,
  RecaptchaVerifier,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  doc, getDoc, setDoc,
  serverTimestamp,
  collection, query, where, getDocs,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

/** ==== CONFIG DO PROJETO (copie do Console → Project settings → Web app) ==== */
const firebaseConfig = {
  apiKey: "AIzaSyAAaXJjYmRTvt0ZUnFoDCM2S-GwrifanLw",
  authDomain: "meu-site-de-padel.firebaseapp.com",
  projectId: "meu-site-de-padel",
  // ⚠️ NOME do bucket (NÃO a URL .app):
  storageBucket: "meu-site-de-padel.appspot.com",
  messagingSenderId: "919527451491",
  appId: "1:919527451491:web:91ee2183de948d07294156",
  measurementId: "G-0ZGG4XMTZC",
};

/** evita “duplicate-app” no HMR do Vite */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/** SDKs */
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

/** Providers */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const appleProvider  = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

/** Perfil básico em /users/{uid} */
export async function ensureUserDoc(user, extra = {}) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const base = {
    uid: user.uid,
    email: user.email || null,
    name: user.displayName || extra.name || null,
    displayName: user.displayName || extra.name || null,
    phone: user.phoneNumber || null,
    photoURL: user.photoURL || null,
    providers: (user.providerData || []).map(p => p.providerId),
    createdAt: snap.exists() ? (snap.data().createdAt || serverTimestamp()) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, { ...base, ...extra }, { merge: true });
}

/** Redirect results (Google/Apple) */
export async function resolveGoogleRedirectResult() {
  try { return (await getRedirectResult(auth)) || null; } catch { return null; }
}
export async function resolveAppleRedirectResult() {
  try { return (await getRedirectResult(auth)) || null; } catch { return null; }
}

/** reCAPTCHA invisível (SMS) */
export function setupInvisibleRecaptcha(containerId) {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

/** CPF exclusivo em /cpfs/{cpf} (Rules: create only se !exists) */
export async function setCpfMapping(uid, cleanCpf) {
  try {
    const ref = doc(db, "cpfs", cleanCpf);
    const snap = await getDoc(ref);
    if (snap.exists()) return { ok: false, reason: "used" };
    await setDoc(ref, { uid, createdAt: serverTimestamp() }, { merge: false });
    // opcional: guardar cópia no user p/ leitura rápida
    await setDoc(doc(db, "users", uid), { cpf: cleanCpf }, { merge: true });
    return { ok: true, cpf: cleanCpf };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Busca CPF por uid */
export async function findCpfByUid(uid) {
  const q = query(collection(db, "cpfs"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const doc0 = snap.docs[0];
  return doc0 ? doc0.id : null; // id do doc é o CPF
}

/** Verificação de e-mail (se necessário) */
export async function ensureEmailVerification(user = auth.currentUser) {
  if (user && !user.emailVerified && user.email) {
    await sendEmailVerification(user);
    return true;
  }
  return false;
}

/** signOut exposto p/ Header/MinhaConta */
export const signOut = () => fbSignOut(auth);

/** Logs de diagnóstico em dev */
if (import.meta?.env?.DEV) {
  // eslint-disable-next-line no-console
  console.log("[firebase] dev origin:", location.origin);
  // eslint-disable-next-line no-console
  console.log("[firebase] apiKey tail:", (firebaseConfig.apiKey || "").slice(-6));
}
