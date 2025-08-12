// src/utils/identifiers.js
import { onlyDigits } from "./cpf";

export function normalizeEmail(s = "") {
  return (s || "").trim().toLowerCase();
}

export function normalizePhoneBRtoE164(s = "") {
  // Espera números do Brasil como (xx) 9xxxx-xxxx ou +55xxxxxxxxxxx
  const d = onlyDigits(s);
  if (!d) return "";
  // Se já veio com +55..., mantenha; senão, prefixe +55
  if (s.trim().startsWith("+")) {
    return `+${onlyDigits(s)}`;
  }
  // Brasil: d pode ter 10 ou 11 dígitos (com 9)
  return `+55${d}`;
}

export function normalizeCPF(s = "") {
  return onlyDigits(s).slice(0, 11);
}
