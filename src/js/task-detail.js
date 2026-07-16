class TaskDetailModule {
  constructor() {
    this.panel = document.getElementById('detail-panel');
    this.body = document.getElementById('detail-panel-body');
    this.currentTodoId = null;
    this._saveTimer = null;
    this.deletedTodo = null;
    this.undoTimer = null;
  }

  init() {
    document.getElementById('detail-close-btn').addEventListener('click', () => this.close());

    // Listen for store changes to refresh if currently open
    window.store.on('change', (evt) => {
      if (evt.action === 'delete' && evt.todo.id === this.currentTodoId) {
        this.close();
      }
      if (this.currentTodoId && evt.action === 'update' && evt.todo.id === this.currentTodoId) {
        // Don't re-render during user edits — check if this was external
        const activeEl = document.activeElement;
        if (!this.body.contains(activeEl)) {
          this.open(this.currentTodoId);
        }
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
    const categories = window.store.getCategories();
    const catOptions = categories.map(c =>
      `<option value="${c.id}" ${todo.category === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const priorityOptions = ['high', 'medium', 'low'].map(p =>
      `<option value="${p}" ${todo.priority === p ? 'selected' : ''}>${p === 'high' ? '🔴 高' : p === 'medium' ? '🟡 中' : '🟢 低'}</option>`
    ).join('');

    const dueDateValue = todo.dueDate ? todo.dueDate.substring(0, 16) : '';

    const tagsStr = (todo.tags || []).join(', ');

    this.body.innerHTML = `
      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">标题</label>
        <input type="text" class="input" id="detail-title" value="${this._escapeHtml(todo.title)}" placeholder="任务标题">
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">描述</label>
        <textarea class="textarea" id="detail-desc" placeholder="添加详细描述...">${this._escapeHtml(todo.description || '')}</textarea>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">分类</label>
        <select class="select" id="detail-category">${catOptions}</select>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">优先级</label>
        <select class="select" id="detail-priority">${priorityOptions}</select>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">截止日期</label>
        <input type="datetime-local" class="input" id="detail-due-date" value="${dueDateValue}">
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">标签 (逗号分隔)</label>
        <input type="text" class="input" id="detail-tags" value="${tagsStr}" placeholder="重要, 紧急">
      </div>

      <div style="font-size:12px; color:var(--text-muted); margin-top: 8px;">
        创建于 ${new Date(todo.createdAt).toLocaleString('zh-CN')}
        ${todo.completedAt ? `<br>完成于 ${new Date(todo.completedAt).toLocaleString('zh-CN')}` : ''}
      </div>

      <div style="display:flex; gap:8px; margin-top: auto; padding-top: 16px;">
        <button class="btn btn-danger" id="detail-delete-btn" style="flex:1;">
          🗑 删除任务
        </button>
        <button class="btn btn-secondary" id="detail-complete-btn" style="flex:1;">
          ${todo.completed ? '↩ 取消完成' : '✅ 标记完成'}
        </button>
      </div>
    `;

    // Attach auto-save to all inputs
    const inputs = this.body.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => this._scheduleSave());
      input.addEventListener('change', () => this._saveNow());
    });

    // Delete button
    document.getElementById('detail-delete-btn').addEventListener('click', () => {
      this._confirmDelete(todo);
    });

    // Complete toggle button
    document.getElementById('detail-complete-btn').addEventListener('click', async () => {
      const updated = await window.store.toggleTodo(todo.id);
      if (updated) {
        if (!todo.completed && window.Animations) {
          // Animation triggered from task-list checkbox, skip here
        }
        this.open(todo.id); // re-render
      }
    });
  }

  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveNow(), 1500);
  }

  async _saveNow() {
    if (!this.currentTodoId) return;
    const title = document.getElementById('detail-title')?.value?.trim();
    if (!title) return; // don't save empty title

    const tagsStr = document.getElementById('detail-tags')?.value || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const changes = { title };
    const descEl = document.getElementById('detail-desc');
    if (descEl) changes.description = descEl.value;
    const catEl = document.getElementById('detail-category');
    if (catEl) changes.category = catEl.value;
    const priEl = document.getElementById('detail-priority');
    if (priEl) changes.priority = priEl.value;
    const dueEl = document.getElementById('detail-due-date');
    if (dueEl) changes.dueDate = dueEl.value || null;
    changes.tags = tags;

    await window.store.updateTodo(this.currentTodoId, changes);
  }

  _confirmDelete(todo) {
    // Create confirm bubble
    const deleteBtn = document.getElementById('detail-delete-btn');
    const rect = deleteBtn.getBoundingClientRect();

    const bubble = document.createElement('div');
    bubble.className = 'confirm-bubble';
    bubble.style.position = 'fixed';
    bubble.style.top = (rect.top - 60) + 'px';
    bubble.style.left = (rect.left) + 'px';
    bubble.innerHTML = `
      <span>确认删除？</span>
      <button class="btn btn-danger" id="confirm-delete-btn" style="padding:4px 12px;font-size:12px;">删除</button>
      <button class="btn btn-ghost" id="cancel-delete-btn" style="padding:4px 12px;font-size:12px;">取消</button>
    `;
    document.body.appendChild(bubble);

    const removeBubble = () => { if (bubble.parentNode) bubble.remove(); };

    bubble.querySelector('#cancel-delete-btn').addEventListener('click', removeBubble);
    bubble.querySelector('#confirm-delete-btn').addEventListener('click', async () => {
      removeBubble();
      this.deletedTodo = { ...todo };
      await window.store.deleteTodo(todo.id);
      this.close();

      // Show undo toast
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `已删除 "<strong>${todo.title}</strong>" <button style="background:none;border:none;color:#7BC8A4;cursor:pointer;font-weight:600;margin-left:8px;" id="undo-delete-btn">撤销</button>`;
      container.appendChild(toast);

      document.getElementById('undo-delete-btn').addEventListener('click', async () => {
        await window.store.addTodo(this.deletedTodo);
        this.deletedTodo = null;
        toast.remove();
      });

      this.undoTimer = setTimeout(() => {
        this.deletedTodo = null;
        toast.remove();
      }, 3000);
    });

    // Click outside to dismiss
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!bubble.contains(e.target) && e.target !== deleteBtn) {
          removeBubble();
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.TaskDetail = new TaskDetailModule();
