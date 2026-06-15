export const SETTINGS_STORAGE_KEY =
  "findyourbuddy-settings";

export const themes = {
  emerald: {
    name: "Emerald",
    accent: "#18a957",
    accentDark: "#138d49",
    accentSoft: "#e8f3eb",
    heroStart: "#07110b",
    heroMiddle: "#10291a",
    heroEnd: "#0a2722",
    heroGlow: "#1e7142",
  },

  violet: {
    name: "Violet",
    accent: "#7c3aed",
    accentDark: "#6d28d9",
    accentSoft: "#f3e8ff",
    heroStart: "#140b2d",
    heroMiddle: "#29134f",
    heroEnd: "#17112f",
    heroGlow: "#8b5cf6",
  },

  ocean: {
    name: "Ocean",
    accent: "#0ea5e9",
    accentDark: "#0284c7",
    accentSoft: "#e0f2fe",
    heroStart: "#06151f",
    heroMiddle: "#0b3048",
    heroEnd: "#072b35",
    heroGlow: "#22d3ee",
  },

  sunset: {
    name: "Sunset",
    accent: "#f97316",
    accentDark: "#ea580c",
    accentSoft: "#ffedd5",
    heroStart: "#251009",
    heroMiddle: "#4b2012",
    heroEnd: "#35151c",
    heroGlow: "#fb7185",
  },
};

export const defaultSettings = {
  theme: "emerald",
  notificationsEnabled: false,
};

export function loadSettings() {
  try {
    const savedSettings = localStorage.getItem(
      SETTINGS_STORAGE_KEY,
    );

    if (savedSettings) {
      return {
        ...defaultSettings,
        ...JSON.parse(savedSettings),
      };
    }
  } catch (error) {
    console.error("Could not load settings:", error);
  }

  return defaultSettings;
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("Could not save settings:", error);
  }
}

export function applyTheme(themeName) {
  const selectedTheme =
    themes[themeName] || themes.emerald;

  const root = document.documentElement;

  root.style.setProperty(
    "--app-accent",
    selectedTheme.accent,
  );

  root.style.setProperty(
    "--app-accent-dark",
    selectedTheme.accentDark,
  );

  root.style.setProperty(
    "--app-accent-soft",
    selectedTheme.accentSoft,
  );

  root.style.setProperty(
    "--app-hero-start",
    selectedTheme.heroStart,
  );

  root.style.setProperty(
    "--app-hero-middle",
    selectedTheme.heroMiddle,
  );

  root.style.setProperty(
    "--app-hero-end",
    selectedTheme.heroEnd,
  );

  root.style.setProperty(
    "--app-hero-glow",
    selectedTheme.heroGlow,
  );
}