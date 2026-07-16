class ThemeManager {
  constructor() {
    this.THEMES = ['morning', 'afternoon', 'night'];
    this.THEME_NAMES = { morning: '💚 王源绿', afternoon: '🎀 一二布布', night: '🌙 护眼模式' };
    this.THEME_ICONS = { morning: '💚', afternoon: '🎀', night: '🌙' };
    this.currentTheme = 'morning';
  }

  async init() {
    try {
      const settings = await window.electronAPI.readJSON('settings.json');
      if (settings && settings.theme && this.THEMES.includes(settings.theme)) {
        this.currentTheme = settings.theme;
      }
    } catch (e) {}
    this.apply();
  }

  setTheme(name) {
    if (!this.THEMES.includes(name)) return;
    this.currentTheme = name;
    this.apply();
  }

  apply() {
    document.documentElement.className = `theme-${this.currentTheme}`;
  }

  getCurrent() {
    return {
      id: this.currentTheme,
      name: this.THEME_NAMES[this.currentTheme],
      icon: this.THEME_ICONS[this.currentTheme]
    };
  }

  getThemes() {
    return this.THEMES.map(id => ({
      id,
      name: this.THEME_NAMES[id],
      icon: this.THEME_ICONS[id]
    }));
  }
}

window.ThemeManager = new ThemeManager();
