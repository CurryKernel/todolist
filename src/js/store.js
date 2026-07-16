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
    this._saveTimer = setTimeout(() => {
      this._saveTodos();
    }, 300);
  }

  async _saveTodos() {
    const data = {
      version: '1.0',
      lastModified: new Date().toISOString(),
      items: this.todos
    };
    await window.electronAPI.writeJSON('todos.json', data);
  }

  async _saveCategories() {
    await window.electronAPI.writeJSON('categories.json', { categories: this.categories });
  }

  async _saveSettings() {
    await window.electronAPI.writeJSON('settings.json', this.settings);
  }

  async init() {
    // Load settings
    this.settings = await window.electronAPI.readJSON('settings.json');
    if (!this.settings) {
      this.settings = {
        dataPath: '', theme: 'morning', wangYuanMode: true,
        autoBackup: true, firstRun: true, sidebarCollapsed: false,
        detailPanelOpen: false, currentFilter: 'all', language: 'zh-CN'
      };
    }

    // Load todos
    const todosData = await window.electronAPI.readJSON('todos.json');
    this.todos = (todosData && todosData.items) ? todosData.items : [];

    // Load categories
    const catData = await window.electronAPI.readJSON('categories.json');
    this.categories = (catData && catData.categories) ? catData.categories : [];

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
    const maxOrder = this.todos.reduce((max, t) => Math.max(max, t.order || 0), -1);
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
      order: todoData.order !== undefined ? todoData.order : maxOrder + 1,
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
    return true;
  }

  getSettings() { return this.settings; }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this._saveSettings();
    this._emit('settings-change', this.settings);
    return true;
  }
}

window.store = new AppStore();
