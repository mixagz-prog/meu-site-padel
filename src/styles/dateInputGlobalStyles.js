// src/styles/dateInputGlobalStyles.js
export default function injectDateInputStyles() {
  if (typeof document === "undefined") return;
  if (window.__DATE_INPUT_STYLES__) return; // injeta só uma vez
  window.__DATE_INPUT_STYLES__ = true;

  const css = `
    /* Base dos inputs de data em todo o app */
    input[type="date"] {
      background-color: #0f0f0f !important;
      border: 1px solid #f97316 !important;
      color: #ffffff !important;
      border-radius: 12px !important;
      padding: 10px 12px !important;
      font-size: 15px !important;
      outline: none !important;
      accent-color: #f97316 !important;
    }
    /* Ícone do calendário (Chrome/Edge/Safari) em laranja */
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(63%) sepia(74%) saturate(748%) hue-rotate(352deg) brightness(97%) contrast(96%);
      cursor: pointer;
    }
    /* Evita fundo branco em wrappers do Safari */
    input[type="date"]::-webkit-datetime-edit-fields-wrapper {
      background-color: transparent;
    }
    /* Ícone no Firefox */
    input[type="date"]::-moz-calendar-picker-indicator {
      filter: invert(63%) sepia(74%) saturate(748%) hue-rotate(352deg) brightness(97%) contrast(96%);
      cursor: pointer;
    }
  `;

  const style = document.createElement("style");
  style.setAttribute("data-id", "date-input-global-styles");
  style.textContent = css;
  document.head.appendChild(style);
}
