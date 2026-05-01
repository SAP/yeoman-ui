import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "../assets/css/globalStyles.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "@mdi/font/css/materialdesignicons.css";

// Read VS Code theme CSS variables injected into the webview.
// VS Code injects these on document.body (not document.documentElement).
// The value may be hex (#rrggbb), rgb(...), rgba(...), or a var(...) reference
// depending on the theme. Accept any non-empty string; only fall back to the
// dark-theme default when the property is missing or blank.
function getVSCodeColor(variable, fallback) {
  try {
    const val = getComputedStyle(document.body).getPropertyValue(variable).trim();
    return val.length > 0 ? val : fallback;
  } catch {
    return fallback;
  }
}

// Reads all three surface colours from VS Code's current theme variables.
function getVSCodeSurfaceColors() {
  return {
    // --vscode-input-background: used for v-autocomplete__mask (the input overlay on click)
    // --vscode-dropdown-background: used for the dropdown list overlay
    // --vscode-editor-background: used for the overall surface/background
    "surface-light": getVSCodeColor("--vscode-input-background", "#3C3C3C"),
    surface: getVSCodeColor("--vscode-dropdown-background", "#252526"),
    background: getVSCodeColor("--vscode-editor-background", "#1E1E1E"),
  };
}

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
  },
  theme: {
    themes: {
      light: {
        colors: getVSCodeSurfaceColors(),
      },
    },
  },
});

// VS Code signals theme changes by updating class on document.body
// (e.g. "vscode-dark" → "vscode-light"). When that happens, re-read the
// VS Code CSS variables and update Vuetify's theme so the dropdown colours
// stay correct without needing to close and reopen the panel.
// The observer reference is exported so callers (e.g. tests) can disconnect it.
export const themeObserver = new MutationObserver(() => {
  Object.assign(vuetify.theme.themes.value.light.colors, getVSCodeSurfaceColors());
});
themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

export default vuetify;
