class QuotesModule {
  constructor() {
    this.quotes = [
      { text: '生而自由，爱而无畏', source: '王源' },
      { text: '保持热爱，奔赴山海', source: '王源' },
      { text: '做自己的光，不需要太亮', source: '王源' },
      { text: '一步一步，踏实走好', source: '王源' },
      { text: '少年的梦，不应止于心动', source: '王源' },
      { text: '愿你出走半生，归来仍是少年', source: '王源' },
      { text: '好好生活，慢慢相遇', source: '王源' },
      { text: '心之所向，素履以往', source: '王源' },
      { text: '不要着急，最好的总在不经意间出现', source: '王源' },
      { text: '只要心中还有梦想，前路就永远充满了希望', source: '王源' },
      { text: '梦想不会逃走，逃走的只有自己', source: '王源' },
      { text: '做任何事情都要全力以赴', source: '王源' },
      { text: '源气满满，今天也要加油', source: '源计划' },
      { text: '世界上只有一种真正的英雄主义', source: '罗曼·罗兰' },
      { text: '生活原本沉闷，但跑起来就有风', source: '佚名' }
    ];
    this.timer = null;
  }

  init() {
    this.showRandom();
    // Auto-refresh every 1 hour
    this.timer = setInterval(() => this.showRandom(), 60 * 60 * 1000);
    // Double-click to refresh
    const widget = document.getElementById('quotes-widget');
    if (widget) {
      widget.addEventListener('dblclick', () => this.showRandom());
    }
  }

  showRandom() {
    const q = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    const textEl = document.getElementById('quotes-text');
    const sourceEl = document.getElementById('quotes-source');
    if (textEl) textEl.textContent = `"${q.text}"`;
    if (sourceEl) sourceEl.textContent = `— ${q.source}`;
  }
}

window.Quotes = new QuotesModule();
