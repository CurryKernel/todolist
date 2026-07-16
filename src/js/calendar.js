class CalendarModule {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.selectedDateStr = this._dateToStr(new Date());
    this.container = document.getElementById('calendar-grid');
  }

  _dateToStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    this.selectedDate = new Date(y, m, day, 12, 0, 0);
    this.selectedDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.render();
    if (window.TaskList) window.TaskList.setDateStr(this.selectedDateStr);
  }

  getSelectedDateStr() {
    return this.selectedDateStr;
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const t = new Date();
    const todayStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;

    document.getElementById('cal-month-label').textContent = `${year}年${month + 1}月`;

    const todos = window.store.getTodos();
    const taskDates = new Set(todos.map(t => {
      if (t.dueDate) return t.dueDate.substring(0, 10);
      return t.createdAt ? t.createdAt.substring(0, 10) : '';
    }));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let html = '';

    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month">${prevMonthDays - i}</div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let cls = 'calendar-day';
      if (ds === todayStr) cls += ' today';
      if (ds === this.selectedDateStr) cls += ' selected';
      if (taskDates.has(ds)) cls += ' has-tasks';
      html += `<div class="${cls}" data-day="${d}">${d}</div>`;
    }

    const remaining = 42 - (firstDay + daysInMonth);
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="calendar-day other-month">${d}</div>`;
    }

    this.container.innerHTML = html;

    this.container.querySelectorAll('.calendar-day:not(.other-month)').forEach(el => {
      el.addEventListener('click', () => {
        this.selectDate(parseInt(el.dataset.day));
      });
    });
  }
}

window.Calendar = new CalendarModule();
