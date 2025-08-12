// src/utils/calendar.js
function toICSDateUTC(date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}
export function buildICS({ title, description = "", location = "", start, end, url = "" }) {
  const dtStart = toICSDateUTC(start);
  const dtEnd = toICSDateUTC(end);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@meu-site-padel`;
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Meu Site Padel//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
    `UID:${uid}`,`DTSTAMP:${toICSDateUTC(new Date())}`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,
    `SUMMARY:${(title || "").replace(/\n/g, " ")}`,
    `DESCRIPTION:${(description || "").replace(/\n/g, " ")}${url ? "\\n" + url : ""}`,
    `LOCATION:${(location || "").replace(/\n/g, " ")}`,
    "END:VEVENT","END:VCALENDAR",
  ];
  return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
}
export function downloadICS(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`; a.click();
  URL.revokeObjectURL(url);
}
export function googleCalendarUrl({ title, details = "", location = "", start, end }) {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({ action:"TEMPLATE", text:title||"", details, location, dates:`${fmt(start)}/${fmt(end)}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
