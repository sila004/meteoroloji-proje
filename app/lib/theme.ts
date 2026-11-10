export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "meteoroloji-theme";

// Apply the saved choice before the page is painted, including direct page visits.
export const themeInitializationScript = `
  (() => {
    let theme = "light";
    try {
      if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "dark") {
        theme = "dark";
      }
    } catch {}
    document.documentElement.dataset.theme = theme;
  })();
`;
