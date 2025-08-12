// src/utils/userNames.js
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore";

// cache simples em memória para evitar leituras repetidas
const nameCache = new Map();

/**
 * Resolve uma lista de UIDs para nomes legíveis.
 * Busca em users/{uid} e usa, na ordem: name || displayName || fullName || email || uid
 * Faz batch de 10 por limitação do where(documentId(), 'in', ...)
 * @param {string[]} uids
 * @returns {Promise<Record<string,string>>} ex: { uid1: "João", uid2: "Maria" }
 */
export async function resolveUserNames(uids = []) {
  const result = {};
  const missing = [];

  for (const uid of uids) {
    if (!uid) continue;
    if (nameCache.has(uid)) {
      result[uid] = nameCache.get(uid);
    } else {
      missing.push(uid);
    }
  }

  // busca em lotes de até 10
  while (missing.length) {
    const batch = missing.splice(0, 10);
    const q = query(collection(db, "users"), where(documentId(), "in", batch));
    let snap;
    try {
      snap = await getDocs(q);
    } catch {
      // Se der erro (ex.: índice), marca fallback e segue
      for (const uid of batch) {
        result[uid] = uid;
        nameCache.set(uid, uid);
      }
      continue;
    }

    const found = new Set();
    snap.forEach((docu) => {
      const data = docu.data() || {};
      const name =
        data.name ||
        data.displayName ||
        data.fullName ||
        data.email ||
        docu.id;
      result[docu.id] = name;
      nameCache.set(docu.id, name);
      found.add(docu.id);
    });

    // quem não foi encontrado recebe fallback (uid)
    for (const uid of batch) {
      if (!found.has(uid)) {
        result[uid] = uid;
        nameCache.set(uid, uid);
      }
    }
  }

  return result;
}

// opcional: para salvar no cache quando você já souber o nome
export function cacheUserName(uid, name) {
  if (!uid) return;
  nameCache.set(uid, name || uid);
}
