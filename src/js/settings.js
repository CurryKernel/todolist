class SettingsPanelModule {
  constructor() { this.visible = false; }
  init() {}

  toggle() {
    if (this.visible) { this.hide(); } else { this.show(); }
  }

  show() {
    if (window.StatsPanel && window.StatsPanel.visible) window.StatsPanel.hide();
    this.visible = true;
    const panel = document.getElementById('detail-panel');
    document.querySelector('.detail-panel-title').textContent = '⚙️ 设置';
    panel.classList.remove('hidden');

    const settings = window.store.getSettings();
    const body = document.getElementById('detail-panel-body');
    body.innerHTML = `
      <div>
        <label style="font-size:12px;color:var(--text-muted);">🎨 主题</label>
        <div style="display:flex;gap:6px;margin-top:4px;" id="theme-btns">
          ${window.ThemeManager.getThemes().map(t => `
            <button class="btn ${t.id === window.ThemeManager.getCurrent().id ? 'btn-primary' : 'btn-secondary'}"
                    data-theme="${t.id}" style="flex:1;padding:10px;font-size:13px;">${t.icon} ${t.name}</button>
          `).join('')}
        </div>
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-muted);">📁 数据路径</label>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <input class="input" id="set-path" value="${settings.dataPath||''}" readonly style="flex:1;font-size:12px;">
          <button class="btn btn-secondary" id="set-chg-path" style="font-size:12px;">更改</button>
        </div>
      </div>
      <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border-light);text-align:center;">
        <p style="font-size:13px;color:var(--text-secondary);">源计划 v1.0.0</p>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">一二布布主题 · 温暖治愈</p>
        <p style="font-size:11px;color:var(--text-muted);">Made with 💕 for you</p>
      </div>`;

    document.getElementById('theme-btns').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      document.querySelectorAll('#theme-btns button').forEach(b => {
        b.className = b === btn ? 'btn btn-primary' : 'btn btn-secondary';
      });
      window.ThemeManager.setTheme(btn.dataset.theme);
      await window.store.saveSettings({ theme: btn.dataset.theme });
    });
    document.getElementById('set-chg-path').addEventListener('click', async () => {
      const path = await window.electronAPI.selectDataPath();
      if (path) {
        await window.electronAPI.setDataPath(path);
        await window.store.saveSettings({ dataPath: path });
        document.getElementById('set-path').value = path;
      }
    });

    // Highlight current theme
    const cur = window.ThemeManager.getCurrent();
    document.querySelectorAll('#theme-btns button').forEach(b => {
      b.className = b.dataset.theme === cur.id ? 'btn btn-primary' : 'btn btn-secondary';
    });
  }

  hide() {
    this.visible = false;
    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    document.querySelector('.detail-panel-title').textContent = '任务详情';
  }
}

window.SettingsPanel = new SettingsPanelModule();
