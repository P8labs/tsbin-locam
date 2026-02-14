type Theme = "light" | "dark";

export class ThemeManager {
  private currentTheme: Theme = "light";
  private readonly storageKey = "locam-theme";
  private themeToggleBtn: HTMLButtonElement;

  constructor(btn: HTMLButtonElement) {
    this.themeToggleBtn = btn;
    this.loadTheme();
    this.applyTheme();
  }

  public async loadTheme(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      this.currentTheme = result[this.storageKey] || "light";
      this.applyTheme();
    } catch (error) {
      console.warn("Failed to load theme from storage, using default:", error);
      this.currentTheme = "light";
    }
  }

  public async saveTheme(): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.storageKey]: this.currentTheme });
    } catch (error) {
      console.warn("Failed to save theme to storage:", error);
    }
  }

  public applyTheme(): void {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    this.themeToggleBtn.textContent = this.currentTheme;
  }

  public async toggleTheme(): Promise<Theme> {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme();
    await this.saveTheme();
    return this.currentTheme;
  }

  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }
}

declare const browser: {
  runtime: {
    getURL: (path: string) => string;
  };
  tabs: {
    create: (options: { url: string }) => Promise<any>;
  };
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<any>;
      set: (items: any) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  };
};

declare const chrome: {
  runtime: {
    getURL: (path: string) => string;
  };
  tabs: {
    create: (options: { url: string }) => Promise<any>;
  };
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<any>;
      set: (items: any) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  };
};

const browserAPI =
  typeof browser !== "undefined" ? browser : (chrome as typeof browser);
