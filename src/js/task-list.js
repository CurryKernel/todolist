class TaskListModule {
  constructor() {
    this.container = document.getElementById('task-list');
    this.currentDateStr = this._todayStr();
    this.filterCategory = 'all';
    this.filterStatus = 'all';
    this.searchQuery = '';
    this.deletedTodo = null;
  }

  _todayStr() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  _dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  init() {
    this.render();
    window.store.on('change', () => this.render());

    document.getElementById('day-prev').addEventListener('click', () => this.shiftDay(-1));
    document.getElementById('day-next').addEventListener('click', () => this.shiftDay(1));
    document.getElementById('day-today').addEventListener('click', () => {
      this.currentDateStr = this._todayStr();
      this.render();
      if (window.Calendar) {
        window.Calendar.selectedDateStr = this.currentDateStr;
        window.Calendar.render();
      }
    });

    document.getElementById('btn-add').addEventListener('click', () => this.addTodo());
    const titleInput = document.getElementById('add-task-title');
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTodo();
      if (e.key === 'Escape') titleInput.value = '';
    });
    titleInput.addEventListener('focus', () => {
      document.getElementById('add-task-extra').style.display = 'flex';
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.render(), 250);
    });
    document.getElementById('filter-status').addEventListener('change', (e) => {
      this.filterStatus = e.target.value; this.render();
    });
    document.getElementById('filter-category').addEventListener('change', (e) => {
      this.filterCategory = e.target.value; this.render();
    });

    window.store.on('category-change', () => this._populateCategoryFilter());
    this._populateCategoryFilter();
  }

  _populateCategoryFilter() {
    const cats = window.store.getCategories();
    const sel = document.getElementById('filter-category');
    sel.innerHTML = '<option value="all">所有分类</option>' +
      cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const addCat = document.getElementById('add-category');
    if (addCat) addCat.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  setDateStr(dateStr) {
    this.currentDateStr = dateStr;
    this.render();

    // Update day label
    const [y, m, d] = dateStr.split('-').map(Number);
    const todayStr = this._todayStr();
    if (dateStr === todayStr) {
      document.getElementById('day-label').textContent = '📅 今天';
    } else {
      const cur = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0,0,0,0);
      cur.setHours(0,0,0,0);
      const diff = Math.round((cur - today) / 86400000);
      if (diff === -1) document.getElementById('day-label').textContent = '📅 昨天';
      else if (diff === 1) document.getElementById('day-label').textContent = '📅 明天';
      else {
        const w = ['日','一','二','三','四','五','六'][cur.getDay()];
        document.getElementById('day-label').textContent = `📅 ${m}月${d}日 周${w}`;
      }
    }
  }

  shiftDay(delta) {
    const [y, m, d] = this.currentDateStr.split('-').map(Number);
    const cur = new Date(y, m - 1, d, 12, 0, 0);
    cur.setDate(cur.getDate() + delta);
    this.currentDateStr = this._dateStr(cur);
    this.render();

    // Update day label
    const todayStr = this._todayStr();
    if (this.currentDateStr === todayStr) {
      document.getElementById('day-label').textContent = '📅 今天';
    } else {
      const w = ['日','一','二','三','四','五','六'][cur.getDay()];
      document.getElementById('day-label').textContent = `📅 ${cur.getMonth()+1}月${cur.getDate()}日 周${w}`;
    }

    // Sync calendar
    if (window.Calendar) {
      window.Calendar.selectedDateStr = this.currentDateStr;
      window.Calendar.render();
    }
  }

  async addTodo() {
    const title = document.getElementById('add-task-title').value.trim();
    if (!title) return;
    const cat = document.getElementById('add-category').value || 'life';
    const pri = document.getElementById('add-priority').value || 'medium';
    const dateVal = document.getElementById('add-date').value;
    const prog = parseInt(document.getElementById('add-progress').value) || 0;

    await window.store.addTodo({
      title, category: cat, priority: pri,
      dueDate: dateVal ? dateVal + 'T23:59:00' : this.currentDateStr + 'T23:59:00',
      progress: Math.min(100, Math.max(0, prog))
    });
    document.getElementById('add-task-title').value = '';
    document.getElementById('add-progress').value = '';
    this.render();
  }

  getFilteredTodos() {
    let todos = [...window.store.getTodos()];
    todos = todos.filter(t => {
      if (t.dueDate) return t.dueDate.startsWith(this.currentDateStr);
      return t.createdAt && t.createdAt.startsWith(this.currentDateStr);
    });
    if (this.filterCategory !== 'all') todos = todos.filter(t => t.category === this.filterCategory);
    if (this.filterStatus === 'active') todos = todos.filter(t => !t.completed);
    else if (this.filterStatus === 'completed') todos = todos.filter(t => t.completed);
    if (this.searchQuery) {
      const q = this.searchQuery;
      todos = todos.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q))) ||
        (t.category && window.store.getCategories().find(c => c.id === t.category)?.name?.toLowerCase().includes(q))
      );
    }
    const priOrder = { high: 0, medium: 1, low: 2 };
    todos.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priOrder[a.priority] || 1) - (priOrder[b.priority] || 1);
    });
    return todos;
  }

  render() {
    const todos = this.getFilteredTodos();
    const cats = window.store.getCategories();
    const catMap = {}; cats.forEach(c => { catMap[c.id] = c; });
    const total = todos.length;
    const done = todos.filter(t => t.completed).length;

    if (todos.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <circle cx="30" cy="40" r="12" fill="#D4EDE0"/>
            <circle cx="70" cy="40" r="14" fill="#E8F3EC"/>
            <ellipse cx="50" cy="60" rx="30" ry="18" fill="#EDF7F1"/>
            <circle cx="38" cy="35" r="2" fill="#2C3E35"/>
            <circle cx="66" cy="35" r="2" fill="#2C3E35"/>
            <path d="M40 50 Q50 58 60 50" fill="none" stroke="#2C3E35" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <div class="empty-title">${this.searchQuery ? '没有找到匹配的任务~' : '今天还没有计划哦~'}</div>
          <div class="empty-desc">${this.searchQuery ? '试试换个关键词吧' : '点击上方添加新任务吧'}</div>
        </div>`;
      return;
    }

    let html = `<div class="stat-row">
      <div class="stat-mini"><div class="stat-val">${total}</div><div class="stat-lbl">任务总数</div></div>
      <div class="stat-mini"><div class="stat-val">${done}</div><div class="stat-lbl">已完成</div></div>
      <div class="stat-mini"><div class="stat-val">${total > 0 ? Math.round(done/total*100) : 0}%</div><div class="stat-lbl">完成率</div></div>
    </div>`;
    html += todos.map(t => this._renderCard(t, catMap)).join('');
    this.container.innerHTML = html;

    this.container.querySelectorAll('.task-card').forEach(card => {
      const id = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.task-checkbox')) return;
        if (window.TaskDetail) window.TaskDetail.open(id);
      });
      const cb = card.querySelector('.task-checkbox');
      if (cb) {
        cb.addEventListener('click', async (e) => {
          e.stopPropagation();
          const todo = window.store.getTodos().find(t => t.id === id);
          await window.store.toggleTodo(id);
          if (!todo.completed) this._celebrate(cb);
        });
      }
    });
  }

  _renderCard(t, catMap) {
    const cat = catMap[t.category] || {};
    const progress = t.progress || 0;
    const isOverdue = t.dueDate && !t.completed && t.dueDate < new Date().toISOString();
    const dueLabel = t.dueDate ? new Date(t.dueDate.substring(0,10)+'T12:00:00').toLocaleDateString('zh-CN', { month:'short', day:'numeric' }) : '';
    const icons = { work:'💼', life:'🏠', sport:'🏃', diet:'🍽️', briefcase:'💼', home:'🏠', run:'🏃', utensils:'🍽️', folder:'📂' };

    return `
    <div class="task-card ${t.completed ? 'completed' : ''}" data-id="${t.id}">
      <div class="task-checkbox ${t.completed ? 'checked' : ''}"></div>
      <div class="task-body">
        <div class="task-title">${this._esc(t.title)}${isOverdue ? ' ⚠️' : ''}</div>
        <div class="task-meta">
          <span class="cat-badge">${icons[cat.icon] || '📂'} ${cat.name || '未分类'}</span>
          <span class="priority-badge priority-${t.priority}">${t.priority === 'high' ? '🔴 紧急' : t.priority === 'medium' ? '🟡 普通' : '🟢 不急'}</span>
          ${dueLabel ? `<span class="task-meta-item">📅 ${dueLabel}</span>` : ''}
        </div>
        ${progress > 0 ? `
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          <span class="progress-text">${progress}%</span>
        </div>` : ''}
        ${t.tags && t.tags.length ? `<div style="margin-top:4px;">${t.tags.map(tag => `<span class="tag">${this._esc(tag)}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  _celebrate(el) {
    const rect = el.getBoundingClientRect();
    const emojis = ['💚','✨','🎵','🍀','🌟','🎶','💫','♬'];
    for (let i = 0; i < 6; i++) {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;font-size:${14+Math.random()*14}px;pointer-events:none;z-index:9999;transition:all 700ms cubic-bezier(0.25,0.46,0.45,0.94);`;
      document.body.appendChild(span);
      requestAnimationFrame(() => {
        span.style.transform = `translate(${(Math.random()-0.5)*80}px, ${-40-Math.random()*50}px) rotate(${Math.random()*360}deg)`;
        span.style.opacity = '0';
      });
      setTimeout(() => span.remove(), 750);
    }
  }

  showToast(msg) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
}

window.TaskList = new TaskListModule();
