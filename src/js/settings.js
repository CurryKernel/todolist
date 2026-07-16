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
    const cats = window.store.getCategories();
    const body = document.getElementById('detail-panel-body');
    body.style.overflowY = 'auto';

    body.innerHTML = `
      <div style="font-size:12px;color:var(--text-muted);font-weight:600;">🎨 主题换肤</div>
      <div style="display:flex;gap:6px;" id="theme-btns">
        ${window.ThemeManager.getThemes().map(t => `
          <button class="btn ${t.id === window.ThemeManager.getCurrent().id ? 'btn-primary' : 'btn-secondary'}"
                  data-theme="${t.id}" style="flex:1;padding:10px;font-size:12px;">${t.icon} ${t.name}</button>
        `).join('')}
      </div>

      <div style="font-size:12px;color:var(--text-muted);font-weight:600;margin-top:4px;">📂 分类管理</div>
      <div id="cat-list" style="display:flex;flex-direction:column;gap:4px;">
        ${cats.map(c => `
          <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-input);border-radius:8px;">
            <span style="flex:1;font-size:13px;">${c.name}</span>
            <span style="font-size:10px;color:var(--text-muted);">${c.builtin ? '内置' : '自定义'}</span>
            ${!c.builtin ? `<button class="btn btn-ghost btn-icon del-cat-btn" data-id="${c.id}" style="font-size:14px;padding:2px 6px;" title="删除">✕</button>` : ''}
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:6px;">
        <input class="input" id="new-cat-name" placeholder="新分类名称" style="flex:1;font-size:12px;padding:8px;">
        <button class="btn btn-secondary" id="add-cat-btn" style="font-size:12px;white-space:nowrap;">＋ 新增</button>
      </div>

      <div style="font-size:12px;color:var(--text-muted);font-weight:600;margin-top:4px;">💾 数据管理</div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-secondary" id="export-btn" style="flex:1;font-size:12px;">📤 导出数据</button>
        <button class="btn btn-secondary" id="import-btn" style="flex:1;font-size:12px;">📥 导入数据</button>
      </div>

      <div style="font-size:12px;color:var(--text-muted);font-weight:600;margin-top:4px;">📁 存储路径</div>
      <div style="display:flex;gap:6px;">
        <input class="input" id="set-path" value="${settings.dataPath||''}" readonly style="flex:1;font-size:11px;padding:8px;">
        <button class="btn btn-secondary" id="set-chg-path" style="font-size:12px;white-space:nowrap;">更改</button>
      </div>

      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-light);text-align:center;">
        <p style="font-size:13px;color:var(--text-secondary);">源计划 v1.0.1</p>
        <p style="font-size:11px;color:var(--text-muted);margin-top:2px;cursor:default;" id="dev-credit">Dev by Qiwen</p>
        <p style="font-size:10px;color:var(--text-muted);">Made with 💚 for 小汤圆</p>
      </div>`;

    // Theme buttons
    document.getElementById('theme-btns').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      window.ThemeManager.setTheme(btn.dataset.theme);
      await window.store.saveSettings({ theme: btn.dataset.theme });
      this.show();
    });

    // Easter egg: click "Dev by Qiwen" 5 times
    let clickCount = 0;
    const creditEl = document.getElementById('dev-credit');
    if (creditEl) {
      creditEl.addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 5) {
          clickCount = 0;
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
          overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:20px;padding:40px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.3);animation:fadeIn 300ms ease;max-width:360px;">
              <div style="font-size:48px;margin-bottom:16px;">💕</div>
              <div style="font-size:20px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">Love Hannah 小董同学</div>
              <div style="font-size:14px;color:var(--text-muted);margin-bottom:20px;">— Qiwen 💚</div>
              <button class="btn btn-primary" style="padding:10px 32px;font-size:14px;">知道了 💝</button>
            </div>`;
          document.body.appendChild(overlay);
          overlay.querySelector('button').addEventListener('click', () => overlay.remove());
          overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        }
      });
    }

    // Change path
    document.getElementById('set-chg-path').addEventListener('click', async () => {
      const path = await window.electronAPI.selectDataPath();
      if (path) {
        await window.electronAPI.setDataPath(path);
        await window.store.saveSettings({ dataPath: path });
        document.getElementById('set-path').value = path;
      }
    });

    // Add category
    document.getElementById('add-cat-btn').addEventListener('click', async () => {
      const name = document.getElementById('new-cat-name').value.trim();
      if (!name) return;
      await window.store.addCategory({ name, icon: 'folder' });
      document.getElementById('new-cat-name').value = '';
      this.show();
    });
    document.getElementById('new-cat-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('add-cat-btn').click();
    });

    // Delete category
    document.querySelectorAll('.del-cat-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await window.store.deleteCategory(btn.dataset.id);
        this.show();
      });
    });

    // Export data
    document.getElementById('export-btn').addEventListener('click', async () => {
      const todos = window.store.getTodos();
      const cats = window.store.getCategories();
      const data = JSON.stringify({ todos, categories: cats, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yuanplan-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this._toast('数据已导出');
    });

    // Import data
    document.getElementById('import-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!data.todos || !Array.isArray(data.todos)) throw new Error('Invalid format');

          // Merge: import todos, keep existing ones that don't conflict by ID
          const existingIds = new Set(window.store.getTodos().map(t => t.id));
          let imported = 0;
          for (const t of data.todos) {
            if (!existingIds.has(t.id)) {
              await window.store.addTodo(t);
              imported++;
            }
          }
          // Import categories if present
          if (data.categories) {
            const existingCatIds = new Set(window.store.getCategories().map(c => c.id));
            for (const c of data.categories) {
              if (!existingCatIds.has(c.id) && !c.builtin) {
                await window.store.addCategory(c);
              }
            }
          }
          this._toast(`导入完成：新增 ${imported} 条任务`);
          this.show();
        } catch (err) {
          this._toast('导入失败：文件格式不正确');
        }
      };
      input.click();
    });
  }

  hide() {
    this.visible = false;
    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    document.querySelector('.detail-panel-title').textContent = '任务详情';
  }

  _toast(msg) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
}

window.SettingsPanel = new SettingsPanelModule();
