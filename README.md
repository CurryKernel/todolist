# 源计划 (Yuan Plan)

> 王源主题待办清单 — 简约薄荷，元气满满 💚

一个面向女生的 Windows 桌面待办事项管理工具，以王源应援绿色为视觉主题，风格简约薄荷，涵盖办公、生活、运动、饮食等多种分类场景。

## ✨ 功能特色

- ✅ **完整的待办管理** — 添加、编辑、删除、勾选完成、拖拽排序
- ✅ **四大预设分类** — 办公、生活、运动、饮食，支持自定义分类
- ✅ **三级优先级** — 高/中/低，逾期任务高亮提醒
- ✅ **截止日期** — 日期选择器，今日待办分组显示
- ✅ **实时搜索** — 关键词搜索 + 多维度筛选排序
- ✅ **数据统计** — 完成率、分类占比环形图、周趋势折线图、优先级分布条形图
- ✅ **三套主题** — 晨露 / 午后 / 夜幕，薄荷绿变体一键切换
- ✅ **王源元素** — 应援绿配色、随机语录启动页、音符完成动效
- ✅ **本地存储** — 数据100%本地保存，用户自选路径，支持自动备份
- ✅ **离线可用** — 无需网络连接，所有资源本地打包

## 🎨 设计风格

| 主题 | 说明 |
|------|------|
| 🌿 晨露 Morning | 浅薄荷绿，适合白天办公 |
| ☀️ 午后 Afternoon | 中等薄荷，全天通用 |
| 🌙 夜幕 Night | 深薄荷，夜间护眼 |

## 🛠️ 技术栈

- **框架**: Electron 28
- **前端**: 原生 HTML/CSS/JS（无框架依赖）
- **图表**: Chart.js 4.4
- **存储**: JSON 本地文件
- **打包**: electron-builder (NSIS 安装包)

## 🚀 快速开始

### 开发运行

```bash
# 克隆仓库
git clone git@github.com:CurryKernel/todolist.git
cd todolist

# 安装依赖
npm install

# 启动应用
npm start
```

### 打包安装包

```bash
npm run build:win
```

安装包生成在 `dist/` 目录下。

## 📁 项目结构

```
todolist/
├── main.js                    # Electron 主进程
├── preload.js                 # IPC 预加载脚本
├── package.json
├── electron-builder.yml       # 打包配置
├── src/
│   ├── index.html             # 主页面 (三栏布局)
│   ├── splash.html            # 启动页 (随机王源语录)
│   ├── setup.html             # 首次设置向导
│   ├── css/
│   │   ├── main.css           # 全局样式 + 布局
│   │   ├── themes.css         # 三套主题 CSS 变量
│   │   ├── splash.css         # 启动页/设置页样式
│   │   └── components.css     # 组件样式
│   ├── js/
│   │   ├── app.js             # 应用入口
│   │   ├── store.js           # 数据管理 (CRUD + 事件系统)
│   │   ├── sidebar.js         # 侧边栏导航
│   │   ├── task-list.js       # 任务列表 + 拖拽排序
│   │   ├── task-detail.js     # 详情面板 + 自动保存
│   │   ├── search.js          # 搜索 + 筛选
│   │   ├── stats.js           # 统计面板 + Chart.js 图表
│   │   ├── themes.js          # 主题管理器
│   │   ├── animations.js      # 动效系统 (音符粒子)
│   │   └── settings.js        # 设置面板
│   ├── assets/
│   │   └── icons/
│   │       └── icon.svg       # 应用图标 (源字薄荷绿)
│   └── data/
│       ├── quotes.json        # 王源语录库 (12条)
│       └── defaults.json      # 默认分类配置
└── README.md
```

## 🔒 安全

- `contextIsolation: true` + `nodeIntegration: false` 隔离渲染进程
- IPC 文件名验证防止路径穿越
- HTML 转义防止 XSS
- 所有数据 100% 本地存储

## 📄 许可

MIT License

---

Made with 💚 for 小汤圆
