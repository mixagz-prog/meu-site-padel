// src/lib/firebase.js
// Config via .env.local (Vite):
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider, // Apple
  getRedirectResult,
  RecaptchaVerifier,
  sendEmailVerification,
  signOut as fbSignOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { normalizeCpf } from "../utils/cpf";

// --- init ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

// Sessão / utilidades
export async function ensureEmailVerification() {
  const u = auth.currentUser;
  if (!u) return;
  if (!u.email) return;
  if (!u.emailVerified) {
    await sendEmailVerification(u);
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

// Cria/atualiza o perfil básico em users/{uid}
export async function upsertUserProfile(u, extra = {}) {
  if (!u) return;
  const ref = doc(db, "users", u.uid);
  await setDoc(
    ref,
    {
      uid: u.uid,
      name: u.displayName || extra.name || "",
      email: u.email || "",
      phone: u.phoneNumber || "",
      photoURL: u.photoURL || "",
      providers: (u.providerData || []).map((p) => p.providerId),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

/* ============================
   CPF — integração opcional
   ============================ */

// Retorna o CPF (string) mapeado para este uid, ou null
export async function findCpfByUid(uid) {
  const q = query(collection(db, "cpfs"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id; // id do doc é o CPF normalizado
}

/**
 * Tenta criar o mapeamento cpfs/{cpf} -> { uid }, exclusivo pelas Rules.
 * Também grava users/{uid}.cpf = cpf (conveniência).
 * Retorna { ok:true, cpf } ou { ok:false, reason:'used'|'empty' }.
 */
export async function setCpfMapping(uid, rawCpf) {
  const cpf = normalizeCpf(rawCpf || "");
  if (!cpf) return { ok: false, reason: "empty" };
  try {
    await setDoc(
      doc(db, "cpfs", cpf),
      { uid, createdAt: serverTimestamp() },
      { merge: false } // falha se já existir (exclusividade garantida)
    );
    await updateDoc(doc(db, "users", uid), { cpf, updatedAt: serverTimestamp() }).catch(() => {});
    return { ok: true, cpf };
  } catch {
    return { ok: false, reason: "used" };
  }
}

/* ============================
   Compat / aliases p/ Login.jsx
   ============================ */

// manter código legado funcionando
export async function ensureUserDoc(u, extra = {}) {
  return upsertUserProfile(u, extra);
}
export async function mapCpfToUid(uid, rawCpf) {
  return setCpfMapping(uid, rawCpf);
}
export function sanitizeCpf(v = "") {
  return normalizeCpf(v);
}

// Resolver resultado de redirect (Google/Apple). Retorna null se não houve redirect.
export async function resolveGoogleRedirectResult() {
  return await getRedirectResult(auth);
}
export async function resolveAppleRedirectResult() {
  return await getRedirectResult(auth);
}

// reCAPTCHA invisível para telefone (OTP) — reutiliza entre HMRs
export function setupInvisibleRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined") return null;
  if (window._recaptchaVerifier) return window._recaptchaVerifier;
  window._recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return window._recaptchaVerifier;
}
