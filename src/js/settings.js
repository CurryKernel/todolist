class SettingsPanelModule {
  constructor() {
    this.visible = false;
  }

  init() {}

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.visible = true;
    const panel = document.getElementById('detail-panel');
    const body = document.getElementById('detail-panel-body');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '⚙️ 设置';
    panel.classList.remove('hidden');

    const settings = window.store.getSettings();
    const currentTheme = window.ThemeManager.getCurrent();
    const themes = window.ThemeManager.getThemes();

    body.innerHTML = `
      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:8px;">🎨 主题换肤</label>
        <div style="display:flex;gap:8px;" id="theme-buttons">
          ${themes.map(t => `
            <button class="btn ${t.id === currentTheme.id ? 'btn-primary' : 'btn-secondary'}"
                    data-theme="${t.id}" style="flex:1;flex-direction:column;gap:4px;padding:16px 8px;">
              <span style="font-size:24px;">${t.icon}</span>
              <span style="font-size:12px;">${t.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">📁 数据存储路径</label>
        <div style="display:flex;gap:8px;">
          <input type="text" class="input" id="settings-path" value="${settings.dataPath || ''}" readonly style="flex:1;">
          <button class="btn btn-secondary" id="change-path-btn">更改</button>
        </div>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">💚 王源主题模式</label>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:13px;">启用王源主题元素</span>
          <label style="position:relative;display:inline-block;width:44px;height:24px;">
            <input type="checkbox" id="wangyuan-toggle" ${settings.wangYuanMode ? 'checked' : ''}
                   style="opacity:0;width:0;height:0;">
            <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${settings.wangYuanMode ? 'var(--accent)' : 'var(--border)'};border-radius:24px;transition:300ms;"
                  id="toggle-bg"></span>
            <span style="position:absolute;content:'';height:18px;width:18px;left:${settings.wangYuanMode ? '23px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:300ms;"
                  id="toggle-dot"></span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">💾 自动备份</label>
        <label style="position:relative;display:inline-block;width:44px;height:24px;">
          <input type="checkbox" id="autobackup-toggle" ${settings.autoBackup ? 'checked' : ''}
                 style="opacity:0;width:0;height:0;">
          <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${settings.autoBackup ? 'var(--accent)' : 'var(--border)'};border-radius:24px;transition:300ms;"></span>
          <span style="position:absolute;height:18px;width:18px;left:${settings.autoBackup ? '23px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:300ms;"></span>
        </label>
      </div>

      <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border-light);text-align:center;">
        <p style="font-size:13px;color:var(--text-secondary);">源计划 v1.0.0</p>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">王源主题待办清单</p>
        <p style="font-size:11px;color:var(--text-muted);">Made with 💚 for 小汤圆</p>
      </div>
    `;

    // Theme buttons
    document.getElementById('theme-buttons').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      const theme = btn.dataset.theme;
      window.ThemeManager.setTheme(theme);
      await window.store.saveSettings({ theme });
      this.show(); // re-render
    });

    // Change path
    document.getElementById('change-path-btn').addEventListener('click', async () => {
      const path = await window.electronAPI.selectDataPath();
      if (path) {
        await window.electronAPI.setDataPath(path);
        await window.store.saveSettings({ dataPath: path });
        document.getElementById('settings-path').value = path;
      }
    });

    // Wang Yuan mode toggle
    document.getElementById('wangyuan-toggle').addEventListener('change', async (e) => {
      await window.store.saveSettings({ wangYuanMode: e.target.checked });
      this.show();
    });

    // Auto backup toggle
    document.getElementById('autobackup-toggle').addEventListener('change', async (e) => {
      await window.store.saveSettings({ autoBackup: e.target.checked });
    });
  }

  hide() {
    this.visible = false;
    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '任务详情';
  }
}

window.SettingsPanel = new SettingsPanelModule();
