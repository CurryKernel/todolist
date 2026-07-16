class FloatingModule {
  constructor() {
    this.body = document.getElementById('float-body');
    this.offset = 0; // 0 = today, -1 = yesterday, etc.
  }

  _todayStr() {
    const d = new Date();
    d.setDate(d.getDate() + this.offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  _label() {
    if (this.offset === 0) return '📋 今日待办';
    if (this.offset === -1) return '📋 昨日待办';
    if (this.offset === 1) return '📋 明日待办';
    const d = new Date(); d.setDate(d.getDate() + this.offset);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `📋 ${m}月${day}日`;
  }

  async init() {
    await window.store.init();
    if (window.ThemeManager) await window.ThemeManager.init();
    this.render();
    window.store.on('change', () => this.render());

    // Prevent accidental maximize from double-click on drag region
    window.addEventListener('dblclick', (e) => {
      if (e.target.closest('.float-header') || e.target.closest('#float-header')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Day navigation
    document.getElementById('float-prev').addEventListener('click', () => {
      this.offset--;
      this.render();
    });
    document.getElementById('float-next').addEventListener('click', () => {
      this.offset++;
      this.render();
    });

    // Restore button
    document.getElementById('float-restore').addEventListener('click', () => {
      window.electronAPI.closeFloatingWindow();
    });

    // Double-click header → restore
    document.getElementById('float-header').addEventListener('dblclick', () => {
      window.electronAPI.closeFloatingWindow();
    });

    // Right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._showContextMenu(e.clientX, e.clientY);
    });
  }

  _showContextMenu(x, y) {
    const old = document.querySelector('.float-context');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.className = 'float-context';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.innerHTML = `
      <div class="float-context-item" data-action="restore">⤢ 还原窗口</div>
      <div class="float-context-item" data-action="today">📋 回到今天</div>
      <div class="float-context-item" data-action="refresh">🔄 刷新</div>
      <div class="float-context-item" data-action="quit">✕ 退出</div>
    `;
    document.body.appendChild(menu);

    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      menu.remove();
      if (action === 'restore') window.electronAPI.closeFloatingWindow();
      else if (action === 'today') { this.offset = 0; this.render(); }
      else if (action === 'refresh') this.render();
      else if (action === 'quit') window.electronAPI.closeWindow();
    });

    document.addEventListener('click', () => menu.remove(), { once: true });
  }

  render() {
    const dateStr = this._todayStr();
    document.getElementById('float-title').textContent = this._label();

    const todos = window.store.getTodos().filter(t => {
      if (t.dueDate) return t.dueDate.startsWith(dateStr);
      return t.createdAt && t.createdAt.startsWith(dateStr);
    });

    if (todos.length === 0) {
      this.body.innerHTML = `
        <div class="float-empty">
          <div class="float-empty-icon">✨</div>
          <div>${this.offset === 0 ? '今天没有待办事项' : '这天没有待办事项'}</div>
          <div style="font-size:10px;margin-top:2px;opacity:0.7;">享受美好的一天吧 💚</div>
        </div>`;
      return;
    }

    const active = todos.filter(t => !t.completed);
    const done = todos.filter(t => t.completed);
    const sorted = [...active, ...done];

    let html = '';
    sorted.forEach(t => {
      html += `
      <div class="float-task ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="float-check ${t.completed ? 'done' : ''}"></div>
        <div class="float-task-pri pri-${t.priority}"></div>
        <div class="float-task-title" title="${this._esc(t.title)}">${this._esc(t.title)}</div>
      </div>`;
    });

    this.body.innerHTML = html;

    this.body.querySelectorAll('.float-check').forEach(cb => {
      cb.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = cb.parentElement.dataset.id;
        const todo = window.store.getTodos().find(t => t.id === id);
        await window.store.toggleTodo(id);
        if (!todo.completed) this._celebrate(cb);
      });
    });

    this.body.querySelectorAll('.float-task').forEach(card => {
      card.addEventListener('click', async () => {
        await window.store.toggleTodo(card.dataset.id);
      });
    });
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  _celebrate(el) {
    const rect = el.getBoundingClientRect();
    const emojis = ['💚','✨','🎵','🍀'];
    for (let i = 0; i < 4; i++) {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;font-size:12px;pointer-events:none;z-index:9999;transition:all 600ms ease-out;`;
      document.body.appendChild(span);
      requestAnimationFrame(() => {
        span.style.transform = `translate(${(Math.random()-0.5)*50}px, ${-20-Math.random()*30}px) rotate(${Math.random()*180}deg)`;
        span.style.opacity = '0';
      });
      setTimeout(() => span.remove(), 650);
    }
  }
}

window.Floating = new FloatingModule();
