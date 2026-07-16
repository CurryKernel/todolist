class StatsPanelModule {
  constructor() { this.visible = false; this.charts = {}; }
  init() {}

  toggle() {
    if (this.visible) { this.hide(); } else { this.show(); }
  }

  show() {
    if (window.SettingsPanel && window.SettingsPanel.visible) window.SettingsPanel.hide();
    this.visible = true;
    const panel = document.getElementById('detail-panel');
    document.querySelector('.detail-panel-title').textContent = '📊 统计';
    panel.classList.remove('hidden');

    const todos = window.store.getTodos();
    const cats = window.store.getCategories();
    const today = new Date().toISOString().split('T')[0];
    const total = todos.length;
    const done = todos.filter(t => t.completed).length;
    const todayDone = todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    const rate = total > 0 ? Math.round(done/total*100) : 0;

    // Streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate()-i);
      if (todos.some(t => t.completed && t.completedAt && t.completedAt.startsWith(d.toISOString().split('T')[0]))) streak++;
      else if (i > 0) break;
    }

    const body = document.getElementById('detail-panel-body');
    body.innerHTML = `
      <div class="stat-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="stat-mini"><div class="stat-val">${total}</div><div class="stat-lbl">总任务</div></div>
        <div class="stat-mini"><div class="stat-val">${rate}%</div><div class="stat-lbl">完成率</div></div>
        <div class="stat-mini"><div class="stat-val">${todayDone}</div><div class="stat-lbl">今日完成</div></div>
        <div class="stat-mini"><div class="stat-val">${streak}天</div><div class="stat-lbl">连续天数</div></div>
      </div>
      <div><h4 style="font-size:13px;color:var(--text-secondary);margin:8px 0;">分类分布</h4>
        <div style="height:160px;"><canvas id="stat-donut"></canvas></div></div>
      <div><h4 style="font-size:13px;color:var(--text-secondary);margin:8px 0;">近7天趋势</h4>
        <div style="height:140px;"><canvas id="stat-trend"></canvas></div></div>`;

    setTimeout(() => {
      const donutCtx = document.getElementById('stat-donut');
      if (donutCtx) {
        const catData = cats.map(c => ({
          name: c.name, count: todos.filter(t => t.category===c.id).length, color: c.color
        })).filter(d => d.count > 0);
        if (catData.length === 0) catData.push({name:'无数据',count:1,color:'#F0E0D6'});
        this.charts.donut = new Chart(donutCtx, {
          type: 'doughnut',
          data: {
            labels: catData.map(d=>d.name),
            datasets: [{data:catData.map(d=>d.count),backgroundColor:['#E8A0A0','#C4956A','#F0B060','#7BC8A4','#D48888','#B0C4DE'],borderWidth:2,borderColor:'#fff'}]
          },
          options: {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{padding:8,usePointStyle:true,font:{size:10}}}},cutout:'60%'}
        });
      }
      const trendCtx = document.getElementById('stat-trend');
      if (trendCtx) {
        const days=[], data=[];
        for (let i=6;i>=0;i--) {
          const d=new Date();d.setDate(d.getDate()-i);
          days.push(d.toLocaleDateString('zh-CN',{weekday:'short'}));
          data.push(todos.filter(t=>t.completed&&t.completedAt&&t.completedAt.startsWith(d.toISOString().split('T')[0])).length);
        }
        this.charts.trend = new Chart(trendCtx, {
          type:'line',data:{labels:days,datasets:[{label:'完成',data,borderColor:'#E8A0A0',backgroundColor:'rgba(232,160,160,0.1)',fill:true,tension:0.4,pointRadius:4}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
        });
      }
    }, 200);
  }

  hide() {
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};
    this.visible = false;
    document.getElementById('detail-panel').classList.add('hidden');
    document.querySelector('.detail-panel-title').textContent = '任务详情';
  }
}

window.StatsPanel = new StatsPanelModule();
