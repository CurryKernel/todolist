class CalendarModule {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.container = document.getElementById('calendar-grid');
  }

  init() {
    document.getElementById('cal-prev').addEventListener('click', () => this.prevMonth());
    document.getElementById('cal-next').addEventListener('click', () => this.nextMonth());
    this.render();
    window.store.on('change', () => this.render());
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }

  selectDate(day) {
    this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    this.render();
    if (window.TaskList) window.TaskList.setDate(this.selectedDate);
  }

  getSelectedDateStr() {
    return this.selectedDate.toISOString().split('T')[0];
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const selStr = this.selectedDate.toISOString().split('T')[0];

    document.getElementById('cal-month-label').textContent = `${year}年${month + 1}月`;

    // Build task-date set
    const todos = window.store.getTodos();
    const taskDates = new Set(todos.map(t => {
      const d = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
      return d.toISOString().split('T')[0];
    }));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let html = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      html += `<div class="calendar-day other-month">${d}</div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      let cls = 'calendar-day';
      if (ds === todayStr) cls += ' today';
      if (ds === selStr) cls += ' selected';
      if (taskDates.has(ds)) cls += ' has-tasks';
      html += `<div class="${cls}" data-day="${d}">${d}</div>`;
    }

    // Next month fill
    const remaining = 42 - (firstDay + daysInMonth);
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="calendar-day other-month">${d}</div>`;
    }

    this.container.innerHTML = html;

    // Click handlers
    this.container.querySelectorAll('.calendar-day:not(.other-month)').forEach(el => {
      el.addEventListener('click', () => {
        const day = parseInt(el.dataset.day);
        this.selectDate(day);
      });
    });
  }
}

window.Calendar = new CalendarModule();
