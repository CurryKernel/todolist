class App {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await window.store.init();
    await window.ThemeManager.init();
    this.initialized = true;

    // Initialize UI modules
    if (window.Sidebar) window.Sidebar.init();
    if (window.TaskList) window.TaskList.init();
    if (window.TaskDetail) window.TaskDetail.init();
    if (window.SearchBar) window.SearchBar.init();
    if (window.StatsPanel) window.StatsPanel.init();
    if (window.SettingsPanel) window.SettingsPanel.init();
    if (window.Animations) window.Animations.init();

    // Listen for menu actions from main process
    if (window.electronAPI.onMenuAction) {
      window.electronAPI.onMenuAction((action) => {
        if (action === 'undo' && window.TaskList) {
          window.TaskList.handleUndo();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (window.TaskList) window.TaskList.focusQuickAdd();
      }
    });

    console.log('源计划 initialized');
  }
}

window.App = new App();
