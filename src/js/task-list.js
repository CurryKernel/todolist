class TaskListModule {
  constructor() {
    this.container = document.getElementById('task-list');
    this.emptyState = document.getElementById('empty-state');
    this.filterState = { category: 'all', status: 'all', sort: 'order', query: '' };
    this.deletedTodo = null;
    this.undoTimer = null;
  }

  init() {
    this.render();
    window.store.on('change', () => this.render());

    // Quick add bar
    document.getElementById('quick-add-btn').addEventListener('click', () => this.showQuickAdd());
    document.getElementById('quick-add-cancel').addEventListener('click', () => this.hideQuickAdd());
    document.getElementById('quick-add-confirm').addEventListener('click', () => this.handleQuickAdd());

    const quickInput = document.getElementById('quick-add-input');
    quickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleQuickAdd();
      if (e.key === 'Escape') this.hideQuickAdd();
    });

    // Populate quick-add category select
    this.populateQuickAddCategories();
    window.store.on('category-change', () => this.populateQuickAddCategories());
  }

  populateQuickAddCategories() {
    const select = document.getElementById('quick-add-category');
    const categories = window.store.getCategories();
    select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  showQuickAdd() {
    const bar = document.getElementById('quick-add-bar');
    bar.style.display = 'flex';
    document.getElementById('quick-add-input').focus();
  }

  hideQuickAdd() {
    document.getElementById('quick-add-bar').style.display = 'none';
    document.getElementById('quick-add-input').value = '';
  }

  async handleQuickAdd() {
    const title = document.getElementById('quick-add-input').value.trim();
    if (!title) return;

    const category = document.getElementById('quick-add-category').value;
    const priority = document.getElementById('quick-add-priority').value;

    await window.store.addTodo({ title, category, priority });
    document.getElementById('quick-add-input').value = '';
    document.getElementById('quick-add-input').focus();
  }

  focusQuickAdd() {
    this.showQuickAdd();
  }

  filterByCategory(categoryId) {
    this.filterState.category = categoryId;
    this.applyFilters(this.filterState);
  }

  applyFilters(filters) {
    this.filterState = { ...this.filterState, ...filters };
    this.render();
  }

  getFilteredTodos() {
    let todos = [...window.store.getTodos()];
    const { category, status, sort, query } = this.filterState;

    // Category filter
    if (category && category !== 'all') {
      todos = todos.filter(t => t.category === category);
    }

    // Status filter
    if (status === 'active') todos = todos.filter(t => !t.completed);
    else if (status === 'completed') todos = todos.filter(t => t.completed);

    // Search query
    if (query) {
      const q = query.toLowerCase();
      todos = todos.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Sort
    switch (sort) {
      case 'createdAt-desc':
        todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'dueDate-asc':
        todos.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
      case 'priority-desc':
        const priOrder = { high: 0, medium: 1, low: 2 };
        todos.sort((a, b) => (priOrder[a.priority] || 1) - (priOrder[b.priority] || 1));
        break;
      case 'order':
      default:
        todos.sort((a, b) => a.order - b.order);
        break;
    }

    // Completed items go to bottom
    const active = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    return [...active, ...completed];
  }

  render() {
    const todos = this.getFilteredTodos();
    const hasQuery = this.filterState.query && this.filterState.query.length > 0;

    if (todos.length === 0) {
      this.container.innerHTML = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      if (hasQuery) {
        emptyDiv.innerHTML = `
          <svg viewBox="0 0 120 120" width="100" height="100">
            <circle cx="60" cy="60" r="40" fill="none" stroke="#E8F0EB" stroke-width="1.5"/>
            <text x="60" y="65" text-anchor="middle" font-size="32">🔍</text>
          </svg>
          <div class="empty-title">源气不足，试试换个关键词~</div>
          <div class="empty-desc">没有找到匹配"${this.filterState.query}"的任务</div>
        `;
      } else {
        emptyDiv.innerHTML = `
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="45" r="8" fill="#D4EDE0"/>
            <circle cx="45" cy="70" r="6" fill="#D4EDE0"/>
            <circle cx="75" cy="70" r="6" fill="#D4EDE0"/>
            <path d="M35 90 Q60 105 85 90" fill="none" stroke="#D4EDE0" stroke-width="2" stroke-linecap="round"/>
            <circle cx="60" cy="55" r="42" fill="none" stroke="#E8F0EB" stroke-width="1"/>
          </svg>
          <div class="empty-title">从这里开始你的计划</div>
          <div class="empty-desc">按 Ctrl+N 或点击 "+ 新建" 添加第一个待办</div>
        `;
      }
      this.container.appendChild(emptyDiv);
      return;
    }

    // Build HTML
    let html = '';
    const categories = window.store.getCategories();
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c; });

    // Group: today due items at top
    const today = new Date().toISOString().split('T')[0];
    const todayDue = todos.filter(t => t.dueDate && t.dueDate.startsWith(today) && !t.completed);
    const nonToday = todos.filter(t => !(t.dueDate && t.dueDate.startsWith(today) && !t.completed));

    if (todayDue.length > 0) {
      html += `<div style="font-size:12px; color:var(--text-muted); padding:8px 0; font-weight:600;">📅 今日待办</div>`;
      html += todayDue.map(t => this._renderCard(t, catMap)).join('');
      html += `<div style="font-size:12px; color:var(--text-muted); padding:8px 0; font-weight:600;">📋 其他任务</div>`;
    }

    html += nonToday.map(t => this._renderCard(t, catMap)).join('');
    this.container.innerHTML = html;

    // Attach event listeners
    this.container.querySelectorAll('.task-card').forEach(card => {
      const id = card.dataset.id;

      // Click → open detail
      card.addEventListener('click', (e) => {
        if (e.target.closest('.checkbox-circle') || e.target.closest('.drag-handle')) return;
        if (window.TaskDetail) window.TaskDetail.open(id);
      });

      // Checkbox toggle
      const checkbox = card.querySelector('.checkbox-circle');
      if (checkbox) {
        checkbox.addEventListener('click', async (e) => {
          e.stopPropagation();
          const todo = window.store.getTodos().find(t => t.id === id);
          await window.store.toggleTodo(id);
          if (!todo.completed && window.Animations) {
            const rect = checkbox.getBoundingClientRect();
            window.Animations.spawnNotes(rect.left + 11, rect.top);
          }
        });
      }

      // Drag & drop
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.container.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
        this._saveOrder();
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedEl = this.container.querySelector(`.task-card[data-id="${draggedId}"]`);
        if (draggedEl && draggedEl !== card) {
          card.parentNode.insertBefore(draggedEl, card);
        }
      });
    });
  }

  _renderCard(todo, catMap) {
    const cat = catMap[todo.category] || {};
    const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
    const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }) : '';

    const priorityLabels = { high: '🔴', medium: '🟡', low: '🟢' };
    const iconMap = { briefcase: '💼', home: '🏠', run: '🏃', utensils: '🍽️', folder: '📂' };
    const catIcon = iconMap[cat.icon] || '📂';

    return `
      <div class="task-card ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" draggable="true">
        <span class="drag-handle" style="cursor:grab; color:var(--text-muted); font-size:14px;">⋮⋮</span>
        <div class="checkbox-circle ${todo.completed ? 'checked' : ''}"></div>
        <div class="priority-strip priority-${todo.priority}"></div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:var(--text-sm); color:${isOverdue ? 'var(--danger)' : 'var(--text-primary)'}; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${this._highlightMatch(todo.title)}
            ${isOverdue ? ' ⚠️' : ''}
          </div>
          <div style="display:flex; gap:8px; margin-top:4px; align-items:center;">
            <span style="font-size:var(--text-xs); color:var(--text-muted);">${catIcon} ${cat.name || '未分类'}</span>
            ${dueDate ? `<span style="font-size:var(--text-xs); color:${isOverdue ? 'var(--danger)' : 'var(--text-muted)'};">📅 ${dueDate}</span>` : ''}
            ${todo.tags && todo.tags.length ? todo.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  _highlightMatch(text) {
    if (!this.filterState.query) return text;
    const escaped = this.filterState.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:var(--accent-light);padding:0 2px;border-radius:2px;">$1</mark>');
  }

  _saveOrder() {
    const cards = this.container.querySelectorAll('.task-card');
    const orderedIds = Array.from(cards).map(c => c.dataset.id);
    window.store.reorderTodos(orderedIds);
  }

  handleUndo() {
    if (this.deletedTodo && this.undoTimer) {
      clearTimeout(this.undoTimer);
      window.store.addTodo(this.deletedTodo);
      this.showToast('已撤销删除');
      this.deletedTodo = null;
      this.undoTimer = null;
    }
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

window.TaskList = new TaskListModule();
