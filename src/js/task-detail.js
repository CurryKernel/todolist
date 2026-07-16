class TaskDetailModule {
  constructor() {
    this.panel = document.getElementById('detail-panel');
    this.body = document.getElementById('detail-panel-body');
    this.currentTodoId = null;
    this._saveTimer = null;
    this.deletedTodo = null;
  }

  init() {
    document.getElementById('detail-close').addEventListener('click', () => this.close());
    window.store.on('change', (evt) => {
      if (evt.action === 'delete' && evt.todo.id === this.currentTodoId) this.close();
      if (this.currentTodoId && evt.action === 'update' && evt.todo.id === this.currentTodoId) {
        if (!this.body.contains(document.activeElement)) this.open(this.currentTodoId);
      }
    });
  }

  open(todoId) {
    const todo = window.store.getTodos().find(t => t.id === todoId);
    if (!todo) return;
    this.currentTodoId = todoId;
    this.panel.classList.remove('hidden');
    this._render(todo);
  }

  close() {
    this.panel.classList.add('hidden');
    this.currentTodoId = null;
    if (this._saveTimer) clearTimeout(this._saveTimer);
  }

  _render(todo) {
    const cats = window.store.getCategories();
    const catOpts = cats.map(c => `<option value="${c.id}" ${todo.category===c.id?'selected':''}>${c.name}</option>`).join('');
    const priOpts = ['high','medium','low'].map(p => `<option value="${p}" ${todo.priority===p?'selected':''}>${p==='high'?'🔴 紧急':p==='medium'?'🟡 普通':'🟢 不急'}</option>`).join('');
    const dueVal = todo.dueDate ? todo.dueDate.substring(0,10) : '';
    const tagsStr = (todo.tags||[]).join(', ');
    const prog = todo.progress || 0;

    this.body.innerHTML = `
      <div><label style="font-size:12px;color:var(--text-muted);">标题</label>
        <input class="input" id="det-title" value="${this._esc(todo.title)}"></div>
      <div><label style="font-size:12px;color:var(--text-muted);">描述</label>
        <textarea class="textarea" id="det-desc">${this._esc(todo.description||'')}</textarea></div>
      <div style="display:flex;gap:8px;">
        <div style="flex:1;"><label style="font-size:12px;color:var(--text-muted);">分类</label>
          <select class="select" id="det-cat">${catOpts}</select></div>
        <div style="flex:1;"><label style="font-size:12px;color:var(--text-muted);">优先级</label>
          <select class="select" id="det-pri">${priOpts}</select></div>
      </div>
      <div><label style="font-size:12px;color:var(--text-muted);">截止日期</label>
        <input type="date" class="input" id="det-date" value="${dueVal}"></div>
      <div><label style="font-size:12px;color:var(--text-muted);">完成进度: ${prog}%</label>
        <input type="range" class="input" id="det-progress" value="${prog}" min="0" max="100" style="padding:0;height:6px;accent-color:var(--accent);"></div>
      <div><label style="font-size:12px;color:var(--text-muted);">标签 (逗号分隔)</label>
        <input class="input" id="det-tags" value="${tagsStr}"></div>
      <div style="font-size:11px;color:var(--text-muted);">
        创建于 ${new Date(todo.createdAt).toLocaleString('zh-CN')}
        ${todo.completedAt ? '<br>完成于 '+new Date(todo.completedAt).toLocaleString('zh-CN') : ''}</div>
      <div style="display:flex;gap:8px;margin-top:auto;padding-top:16px;">
        <button class="btn btn-danger" id="det-delete" style="flex:1;">🗑 删除</button>
        <button class="btn btn-primary" id="det-complete" style="flex:1;">${todo.completed?'↩ 取消完成':'✅ 标记完成'}</button>
      </div>`;

    // Auto-save
    ['det-title','det-desc','det-cat','det-pri','det-date','det-tags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this._scheduleSave());
        el.addEventListener('change', () => this._saveNow());
      }
    });
    const progEl = document.getElementById('det-progress');
    if (progEl) {
      progEl.addEventListener('input', () => {
        document.querySelector('#det-progress').previousElementSibling.textContent = `完成进度: ${progEl.value}%`;
        this._scheduleSave();
      });
    }

    document.getElementById('det-delete').addEventListener('click', () => this._confirmDelete(todo));
    document.getElementById('det-complete').addEventListener('click', async () => {
      await window.store.toggleTodo(todo.id);
      this.open(todo.id);
    });
  }

  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveNow(), 1500);
  }

  async _saveNow() {
    if (!this.currentTodoId) return;
    const title = document.getElementById('det-title')?.value?.trim();
    if (!title) return;
    const tagsStr = document.getElementById('det-tags')?.value || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const prog = parseInt(document.getElementById('det-progress')?.value) || 0;
    await window.store.updateTodo(this.currentTodoId, {
      title,
      description: document.getElementById('det-desc')?.value || '',
      category: document.getElementById('det-cat')?.value || 'life',
      priority: document.getElementById('det-pri')?.value || 'medium',
      dueDate: document.getElementById('det-date')?.value ? document.getElementById('det-date').value + 'T23:59:00' : null,
      tags,
      progress: Math.min(100, Math.max(0, prog))
    });
  }

  _confirmDelete(todo) {
    const btn = document.getElementById('det-delete');
    const rect = btn.getBoundingClientRect();
    const bubble = document.createElement('div');
    bubble.className = 'confirm-bubble';
    bubble.style.cssText = `position:fixed;top:${rect.top-60}px;left:${rect.left}px;`;
    bubble.innerHTML = `<span>确认删除？</span>
      <button class="btn btn-danger" id="cfm-del" style="padding:4px 12px;font-size:12px;">删除</button>
      <button class="btn btn-ghost" id="cfm-cancel" style="padding:4px 12px;font-size:12px;">取消</button>`;
    document.body.appendChild(bubble);

    document.getElementById('cfm-cancel').addEventListener('click', () => bubble.remove());
    document.getElementById('cfm-del').addEventListener('click', async () => {
      bubble.remove();
      this.deletedTodo = {...todo};
      await window.store.deleteTodo(todo.id);
      this.close();
      // Undo toast
      const tc = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `已删除 "<strong>${this._esc(todo.title)}</strong>" <button style="background:none;border:none;color:#E8A0A0;cursor:pointer;font-weight:600;margin-left:8px;" id="undo-del">撤销</button>`;
      tc.appendChild(toast);
      const undo = document.getElementById('undo-del');
      undo.addEventListener('click', async () => {
        await window.store.addTodo(this.deletedTodo);
        this.deletedTodo = null;
        toast.remove();
      });
      setTimeout(() => { this.deletedTodo = null; toast.remove(); }, 3000);
    });
    setTimeout(() => {
      document.addEventListener('click', function h(e) {
        if (!bubble.contains(e.target) && e.target !== btn) {
          bubble.remove();
          document.removeEventListener('click', h);
        }
      });
    }, 0);
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }
}

window.TaskDetail = new TaskDetailModule();
