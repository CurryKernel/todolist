class StatsPanelModule {
  constructor() {
    this.visible = false;
    this.charts = {};
  }

  init() {
    // Stats panel is toggled from sidebar mini-stats click
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this._renderPanel();
    // Delay chart rendering for smooth transition
    setTimeout(() => this._renderCharts(), 300);
  }

  hide() {
    this.visible = false;
    this._destroyPanel();
  }

  _renderPanel() {
    // Use detail panel area or create overlay
    const panel = document.getElementById('detail-panel');
    const body = document.getElementById('detail-panel-body');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '📊 数据统计';
    panel.classList.remove('hidden');

    const todos = window.store.getTodos();
    const categories = window.store.getCategories();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const todayCompleted = todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    const active = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const hasCompleted = todos.some(t => t.completed && t.completedAt && t.completedAt.startsWith(ds));
      if (hasCompleted) streak++;
      else if (i > 0) break;
    }

    body.innerHTML = `
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">总任务数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${rate}%</div>
          <div class="stat-label">完成率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayCompleted}</div>
          <div class="stat-label">今日完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${streak}天</div>
          <div class="stat-label">连续达成</div>
        </div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">分类占比</h4>
        <div style="height:180px;">
          <canvas id="category-chart"></canvas>
        </div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">近7天趋势</h4>
        <div style="height:160px;">
          <canvas id="trend-chart"></canvas>
        </div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">优先级分布</h4>
        <div style="height:120px;">
          <canvas id="priority-chart"></canvas>
        </div>
      </div>
    `;
  }

  _renderCharts() {
    const todos = window.store.getTodos();
    const categories = window.store.getCategories();

    // Category donut chart
    const catCtx = document.getElementById('category-chart');
    if (catCtx) {
      const catData = categories.map(cat => ({
        name: cat.name,
        count: todos.filter(t => t.category === cat.id && !t.completed).length,
        color: cat.color
      })).filter(d => d.count > 0);

      if (catData.length === 0) {
        catData.push({ name: '暂无数据', count: 1, color: '#D4E5DA' });
      }

      this.charts.category = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: catData.map(d => d.name),
          datasets: [{
            data: catData.map(d => d.count),
            backgroundColor: catData.map(d => d.color),
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Weekly trend chart
    const trendCtx = document.getElementById('trend-chart');
    if (trendCtx) {
      const days = [];
      const dayData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('zh-CN', { weekday: 'short' });
        days.push(label);
        dayData.push(todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(ds)).length);
      }

      this.charts.trend = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: '完成任务',
            data: dayData,
            borderColor: '#7BC8A4',
            backgroundColor: 'rgba(123, 200, 164, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#7BC8A4',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#E8F0EB' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      });
    }

    // Priority bar chart
    const priCtx = document.getElementById('priority-chart');
    if (priCtx) {
      const high = todos.filter(t => !t.completed && t.priority === 'high').length;
      const medium = todos.filter(t => !t.completed && t.priority === 'medium').length;
      const low = todos.filter(t => !t.completed && t.priority === 'low').length;

      this.charts.priority = new Chart(priCtx, {
        type: 'bar',
        data: {
          labels: ['高', '中', '低'],
          datasets: [{
            data: [high, medium, low],
            backgroundColor: ['#E8A87C', '#E8C87C', '#A0B5A8'],
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#E8F0EB' } },
            y: { grid: { display: false } }
          }
        }
      });
    }
  }

  _destroyPanel() {
    // Destroy charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};

    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '任务详情';
  }
}

window.StatsPanel = new StatsPanelModule();
