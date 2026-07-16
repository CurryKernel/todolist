class AppStore {
  constructor() {
    this.todos = [];
    this.categories = [];
    this.settings = {};
    this._listeners = {};
    this._saveTimer = null;
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  }

  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(cb => cb(data));
    }
  }

  _debouncedSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(async () => {
      try { await this._saveTodos(); } catch (e) { console.error('Save failed:', e); }
    }, 300);
  }

  async _saveTodos() {
    try {
      const data = {
        version: '1.0',
        lastModified: new Date().toISOString(),
        items: [...this.todos]
      };
      await window.electronAPI.writeJSON('todos.json', data);
    } catch (err) {
      console.error('Failed to save todos:', err);
    }
  }

  async _saveCategories() {
    try {
      await window.electronAPI.writeJSON('categories.json', { categories: this.categories });
    } catch (err) {
      console.error('Failed to save categories:', err);
    }
  }

  async _saveSettings() {
    try {
      await window.electronAPI.writeJSON('settings.json', this.settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  async init() {
    try {
      // Load settings
      this.settings = await window.electronAPI.readJSON('settings.json');
    } catch (err) {
      console.warn('Could not load settings, using defaults:', err);
    }
    if (!this.settings) {
      this.settings = {
        dataPath: '', theme: 'morning', wangYuanMode: true,
        autoBackup: true, firstRun: true, sidebarCollapsed: false,
        detailPanelOpen: false, currentFilter: 'all', language: 'zh-CN'
      };
    }

    try {
      // Load todos
      const todosData = await window.electronAPI.readJSON('todos.json');
      this.todos = (todosData && todosData.items) ? todosData.items : [];
    } catch (err) {
      console.warn('Could not load todos, starting fresh:', err);
      this.todos = [];
    }

    try {
      // Load categories
      const catData = await window.electronAPI.readJSON('categories.json');
      this.categories = (catData && catData.categories) ? catData.categories : [];
    } catch (err) {
      console.warn('Could not load categories, using defaults:', err);
      this.categories = [];
    }

    // Initialize defaults if empty
    if (this.categories.length === 0) {
      this.categories = [
        { id: 'work',  name: '办公', icon: 'briefcase', color: '#7BC8A4', order: 0, builtin: true },
        { id: 'life',  name: '生活', icon: 'home',      color: '#8BC34A', order: 1, builtin: true },
        { id: 'sport', name: '运动', icon: 'run',       color: '#66BB6A', order: 2, builtin: true },
        { id: 'diet',  name: '饮食', icon: 'utensils',  color: '#81C784', order: 3, builtin: true }
      ];
      await this._saveCategories();
    }
  }

  getTodos() { return this.todos; }

  _generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  async addTodo(todoData) {
    const now = new Date().toISOString();
    // Increment all existing active todos' orders by 1 to make room at top
    this.todos.forEach(t => { t.order = (t.order || 0) + 1; });
    const todo = {
      id: this._generateId(),
      title: todoData.title || '',
      description: todoData.description || '',
      category: todoData.category || 'life',
      priority: todoData.priority || 'medium',
      dueDate: todoData.dueDate || null,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      order: 0,
      progress: todoData.progress || 0,
      tags: todoData.tags || []
    };
    this.todos.unshift(todo);
    this._debouncedSave();
    this._emit('change', { action: 'add', todo });
    return todo;
  }

  async updateTodo(id, changes) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.todos[idx] = {
      ...this.todos[idx],
      ...changes,
      updatedAt: new Date().toISOString(),
      id: this.todos[idx].id
    };
    this._debouncedSave();
    this._emit('change', { action: 'update', todo: this.todos[idx] });
    return this.todos[idx];
  }

  async deleteTodo(id) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const deleted = this.todos.splice(idx, 1)[0];
    this._debouncedSave();
    this._emit('change', { action: 'delete', todo: deleted });
    return true;
  }

  async toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return null;
    const now = new Date().toISOString();
    return this.updateTodo(id, {
      completed: !todo.completed,
      completedAt: !todo.completed ? now : null
    });
  }

  async reorderTodos(orderedIds) {
    orderedIds.forEach((id, index) => {
      const todo = this.todos.find(t => t.id === id);
      if (todo) todo.order = index;
    });
    this.todos.sort((a, b) => a.order - b.order);
    this._debouncedSave();
    this._emit('change', { action: 'reorder' });
  }

  getCategories() { return this.categories; }

  async addCategory(catData) {
    const maxOrder = this.categories.reduce((max, c) => Math.max(max, c.order || 0), -1);
    const category = {
      id: 'custom-' + this._generateId(),
      name: catData.name,
      icon: catData.icon || 'folder',
      color: catData.color || '#7BC8A4',
      order: maxOrder + 1,
      builtin: false
    };
    this.categories.push(category);
    await this._saveCategories();
    this._emit('category-change', { action: 'add', category });
    return category;
  }

  async updateCategory(id, changes) {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...changes, id: this.categories[idx].id };
    await this._saveCategories();
    this._emit('category-change', { action: 'update', category: this.categories[idx] });
    return this.categories[idx];
  }

  async deleteCategory(id) {
    const cat = this.categories.find(c => c.id === id);
    if (!cat || cat.builtin) return false;
    const idx = this.categories.findIndex(c => c.id === id);
    this.categories.splice(idx, 1);
    // Move todos to default category
    this.todos.forEach(t => { if (t.category === id) t.category = 'life'; });
    await this._saveCategories();
    this._debouncedSave();
    this._emit('category-change', { action: 'delete', category: cat });
    this._emit('change', { action: 'reorder' });
    return true;
  }

  getSettings() { return this.settings; }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await this._saveSettings();
      this._emit('settings-change', this.settings);
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return false;
    }
  }
}

window.store = new AppStore();
