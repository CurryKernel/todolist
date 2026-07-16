class SidebarModule {
  constructor() {
    this.currentCategory = 'all';
    this.container = document.getElementById('category-nav');
  }

  init() {
    this.render();
    window.store.on('change', () => this.render());
    window.store.on('category-change', () => this.render());
    window.store.on('settings-change', () => this.updateGreeting());

    document.getElementById('mini-stats').addEventListener('click', () => {
      if (window.StatsPanel) window.StatsPanel.toggle();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      if (window.SettingsPanel) window.SettingsPanel.toggle();
    });

    this.updateGreeting();
  }

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '今天也要加油 💚';
    if (hour < 6) greeting = '夜深了，早点休息 🌙';
    else if (hour < 9) greeting = '早上好，源气满满 🌅';
    else if (hour < 12) greeting = '上午好，全力以赴 💪';
    else if (hour < 14) greeting = '中午好，记得吃饭 🍽️';
    else if (hour < 18) greeting = '下午好，保持专注 ✨';
    else if (hour < 22) greeting = '晚上好，回顾今天 📝';
    document.getElementById('sidebar-greeting').innerHTML = `源气满满<br><strong>${greeting}</strong>`;
  }

  render() {
    const categories = window.store.getCategories();
    const todos = window.store.getTodos();

    let html = '';

    // "All" item
    const allCount = todos.filter(t => !t.completed).length;
    html += `
      <div class="nav-item ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">
        <span class="nav-icon">📋</span>
        <span>全部待办</span>
        <span class="nav-badge">${allCount}</span>
      </div>
    `;

    // Category items
    categories.forEach(cat => {
      const count = todos.filter(t => t.category === cat.id && !t.completed).length;
      const iconMap = { briefcase: '💼', home: '🏠', run: '🏃', utensils: '🍽️', folder: '📂' };
      const icon = iconMap[cat.icon] || '📂';
      html += `
        <div class="nav-item ${this.currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
          <span class="nav-icon">${icon}</span>
          <span>${cat.name}</span>
          <span class="nav-badge">${count}</span>
        </div>
      `;
    });

    // "Add Category" button
    html += `
      <div class="nav-item" id="add-category-btn" style="color: var(--text-muted); font-style: italic;">
        <span class="nav-icon">＋</span>
        <span>新建分类</span>
      </div>
    `;

    this.container.innerHTML = html;

    // Click handlers
    this.container.querySelectorAll('.nav-item[data-category]').forEach(item => {
      item.addEventListener('click', () => {
        this.currentCategory = item.dataset.category;
        this.render();
        if (window.TaskList) window.TaskList.filterByCategory(this.currentCategory);
      });
    });

    // Add category handler
    const addBtn = document.getElementById('add-category-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = prompt('请输入新分类名称：');
        if (name && name.trim()) {
          const colors = ['#7BC8A4', '#8BC34A', '#66BB6A', '#81C784', '#4CAF50', '#009688'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          window.store.addCategory({ name: name.trim(), icon: 'folder', color });
        }
      });
    }

    // Update mini stats
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    const todayTotal = todos.filter(t => !t.completed || (t.completedAt && t.completedAt.startsWith(today))).length;
    document.getElementById('mini-stats-number').textContent = `${todayCompleted}/${todos.filter(t => !t.completed).length + todayCompleted}`;
  }

  getCurrentCategory() {
    return this.currentCategory;
  }
}

window.Sidebar = new SidebarModule();
