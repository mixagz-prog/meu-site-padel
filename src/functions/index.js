import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

/* ============================
   Helpers / Referências
============================ */
const globalStatsRef = db.doc("admin/stats/global");
const userStatsRef = (uid) => db.doc(`admin/stats/reservationsByUser/${uid}`);

async function ensureGlobal() {
  const snap = await globalStatsRef.get();
  if (!snap.exists) {
    await globalStatsRef.set({
      totalUsers: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

function requireAuth(ctx) {
  if (!ctx.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login necessário.");
  }
}

function requireAdmin(ctx) {
  requireAuth(ctx);
  if (!ctx.auth.token?.admin) {
    throw new functions.https.HttpsError("permission-denied", "Acesso restrito ao admin.");
  }
}

/* ============================
   Contadores (gatilhos)
============================ */
export const onUserCreate = functions.auth.user().onCreate(async () => {
  await ensureGlobal();
  await globalStatsRef.update({
    totalUsers: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

export const onReservationCreate = functions.firestore
  .document("reservations/{dateKey}/slots/{slotKey}")
  .onCreate(async (snap) => {
    const uid = snap.data()?.uid;
    if (!uid) return;
    await userStatsRef(uid).set(
      {
        count: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

export const onReservationDelete = functions.firestore
  .document("reservations/{dateKey}/slots/{slotKey}")
  .onDelete(async (snap) => {
    const uid = snap.data()?.uid;
    if (!uid) return;
    await userStatsRef(uid).set(
      {
        count: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

/* ============================
   Eventos (filas) — Callables
============================ */
export const joinEvent = functions.https.onCall(async (data, ctx) => {
  requireAuth(ctx);
  const uid = ctx.auth.uid;
  const { dateKey, slotKey } = data || {};
  if (!dateKey || !slotKey) {
    throw new functions.https.HttpsError("invalid-argument", "Parâmetros inválidos.");
  }
  const evtRef = db.doc(`events/${dateKey}/slots/${slotKey}`);

  await db.runTransaction(async (tx) => {
    const evtSnap = await tx.get(evtRef);
    if (!evtSnap.exists) throw new functions.https.HttpsError("not-found", "Evento não encontrado.");
    const evt = evtSnap.data();
    const players = Array.isArray(evt.players) ? evt.players : [];

    if (evt.locked) throw new functions.https.HttpsError("failed-precondition", "Lista trancada.");
    if (players.includes(uid)) throw new functions.https.HttpsError("already-exists", "Você já está na lista.");

    const capacity = Number(evt.capacity) || 0;
    if (players.length >= capacity) throw new functions.https.HttpsError("resource-exhausted", "Lista cheia.");

    const newPlayers = [...players, uid];
    const willLock = newPlayers.length >= capacity;

    tx.update(evtRef, {
      players: newPlayers,
      locked: willLock ? true : evt.locked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

export const setEventLocked = functions.https.onCall(async (data, ctx) => {
  requireAdmin(ctx);
  const { dateKey, slotKey, locked } = data || {};
  if (!dateKey || !slotKey || typeof locked !== "boolean") {
    throw new functions.https.HttpsError("invalid-argument", "Parâmetros inválidos.");
  }
  await db.doc(`events/${dateKey}/slots/${slotKey}`).update({
    locked,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

export const releaseReservation = functions.https.onCall(async (data, ctx) => {
  requireAdmin(ctx);
  const { dateKey, slotKey } = data || {};
  if (!dateKey || !slotKey) {
    throw new functions.https.HttpsError("invalid-argument", "Parâmetros inválidos.");
  }
  await db.doc(`reservations/${dateKey}/slots/${slotKey}`).delete();
  return { ok: true };
});

/* ============================
   Bootstrap Admin
============================ */
export const bootMakeAdmin = functions.https.onCall(async (data, ctx) => {
  const { email, token } = data || {};
  const expected = functions.config().admin?.boot_token;
  if (!expected || token !== expected) {
    throw new functions.https.HttpsError("permission-denied", "Token inválido.");
  }
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Informe o e-mail.");
  }

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch {
    throw new functions.https.HttpsError("not-found", "Usuário não encontrado por e-mail.");
  }

  const current = userRecord.customClaims || {};
  await admin.auth().setCustomUserClaims(userRecord.uid, { ...current, admin: true });
  return { ok: true, uid: userRecord.uid };
});

export const revokeAdmin = functions.https.onCall(async (data, ctx) => {
  requireAdmin(ctx);
  const { email } = data || {};
  if (!email) throw new functions.https.HttpsError("invalid-argument", "Informe o e-mail.");

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch {
    throw new functions.https.HttpsError("not-found", "Usuário não encontrado por e-mail.");
  }

  const claims = userRecord.customClaims || {};
  delete claims.admin;
  await admin.auth().setCustomUserClaims(userRecord.uid, claims);
  return { ok: true, uid: userRecord.uid };
});
