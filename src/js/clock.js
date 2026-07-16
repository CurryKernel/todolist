class ClockModule {
  constructor() {}

  init() {
    this.tick();
    setInterval(() => this.tick(), 1000);
  }

  tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock-time').textContent = `${h}:${m}`;

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const y = now.getFullYear();
    const mo = now.getMonth() + 1;
    const d = now.getDate();
    const w = weekdays[now.getDay()];
    document.getElementById('clock-date').textContent = `${y}年${mo}月${d}日 星期${w}`;
  }
}

window.Clock = new ClockModule();
