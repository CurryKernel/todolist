class SearchBarModule {
  constructor() {
    this.currentFilter = 'all';    // all | active | completed
    this.currentSort = 'order';    // order | createdAt-desc | dueDate-asc | priority-desc
    this.searchQuery = '';
    this._debounceTimer = null;
  }

  init() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchBox = document.getElementById('search-box');
    const sortSelect = document.getElementById('sort-select');
    const filterBtns = document.querySelectorAll('.filter-btn');

    searchInput.addEventListener('input', () => {
      if (searchInput.value) {
        searchBox.classList.add('has-value');
      } else {
        searchBox.classList.remove('has-value');
      }
      this.searchQuery = searchInput.value.trim().toLowerCase();
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this.applyFilters();
      }, 300);
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchBox.classList.remove('has-value');
      this.searchQuery = '';
      this.applyFilters();
    });

    sortSelect.addEventListener('change', () => {
      this.currentSort = sortSelect.value;
      this.applyFilters();
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    if (window.TaskList) {
      window.TaskList.applyFilters({
        category: window.Sidebar ? window.Sidebar.getCurrentCategory() : 'all',
        status: this.currentFilter,
        sort: this.currentSort,
        query: this.searchQuery
      });
    }
  }

  getFilters() {
    return {
      category: window.Sidebar ? window.Sidebar.getCurrentCategory() : 'all',
      status: this.currentFilter,
      sort: this.currentSort,
      query: this.searchQuery
    };
  }
}

window.SearchBar = new SearchBarModule();
