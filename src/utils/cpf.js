// src/utils/cpf.js
export function normalizeCpf(v = "") {
  return String(v).replace(/\D/g, "").slice(0, 11);
}

export function maskCpf(v = "") {
  const n = normalizeCpf(v);
  return n
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
}

export function isValidCpf(v = "") {
  const s = normalizeCpf(v);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(s[i]) * (10 - i);
  let d1 = 11 - (soma % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(s[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(s[i]) * (11 - i);
  let d2 = 11 - (soma % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(s[10]);
}
