class App {
  constructor() { this.initialized = false; }

  async init() {
    if (this.initialized) return;

    await window.store.init();

    if (window.ThemeManager) await window.ThemeManager.init();
    if (window.Clock) window.Clock.init();
    if (window.Calendar) window.Calendar.init();
    if (window.GifRotator) window.GifRotator.init();
    if (window.Quotes) window.Quotes.init();
    if (window.TaskList) window.TaskList.init();
    if (window.TaskDetail) window.TaskDetail.init();
    if (window.SearchBar) window.SearchBar.init();
    if (window.StatsPanel) window.StatsPanel.init();
    if (window.SettingsPanel) window.SettingsPanel.init();
    if (window.Animations) window.Animations.init();

    this.initialized = true;

    // Settings/Stats panel buttons
    document.getElementById('btn-settings').addEventListener('click', () => {
      if (window.SettingsPanel) window.SettingsPanel.toggle();
    });
    document.getElementById('btn-stats').addEventListener('click', () => {
      if (window.StatsPanel) window.StatsPanel.toggle();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('add-task-title').focus();
      }
    });

    // Set add-task date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('add-date');
    if (dateInput) dateInput.value = today;

    console.log('源计划 · 一二布布主题 · initialized');
  }
}

window.App = new App();
