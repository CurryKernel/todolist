class AnimationsModule {
  constructor() { this.enabled = true; }
  init() {
    const settings = window.store.getSettings();
    this.enabled = settings.wangYuanMode !== false;
    window.store.on('settings-change', (s) => { this.enabled = s.wangYuanMode !== false; });
  }
  spawnNotes() {} // Celebration handled in task-list.js now
}

window.Animations = new AnimationsModule();
