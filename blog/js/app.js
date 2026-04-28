const BLOG_API_BASE = `${window.location.origin.replace(/\/$/, '')}/api`;
const USER_KEY = 'campus_forum_user';
const LEARNING_TRACK_STORAGE_KEY = 'personal_blog_learning_track_v2';

let currentUser = null;
let blogData = null;
let editorDraft = null;
let activeProjectFilter = 'all';
let noteSearchKeyword = '';
let uploadTargetFieldId = '';
let revealObserver = null;

const LEARNING_PLAYBOOK = {
  durationDays: 90,
  rhythm: [
    { label: '周一到周五', value: '2 小时学习 + 1 小时实操 + 30 分钟记录' },
    { label: '周六', value: '把本周内容整合成小项目并补 README' },
    { label: '周日', value: '复盘、修 bug、补短板并安排下周' },
  ],
  projects: [
    { title: 'AI 链上任务助手', note: '最适合做成可讲清楚价值的第一个正式项目。' },
    { title: 'AI 钱包助理', note: '适合做交互演示，产品感更强。' },
    { title: 'AI 驱动积分 DApp', note: '适合把规则、Agent 和链上奖励串起来。' },
  ],
  milestones: [
    { title: 'Solidity 基础仓库', weekIds: ['week1', 'week2'] },
    { title: '测试网部署记录', weekIds: ['week3', 'week4'] },
    { title: 'AI Agent 链上 Demo', weekIds: ['week5', 'week6', 'week7', 'week8'] },
    { title: '完整 MVP 项目', weekIds: ['week9', 'week10', 'week11'] },
    { title: '社区贡献记录', weekIds: ['week12'] },
  ],
  phases: [
    {
      id: 'phase-1',
      label: '阶段一',
      range: 'Day 1 - 30',
      title: 'Web3 基础与安全',
      goal: '写、测、部署一个简单合约，并知道常见安全坑。',
      weeks: [
        {
          id: 'week1',
          week: 1,
          label: '第1周',
          title: '环境与钱包准备',
          focus: '先把开发环境、测试网钱包和 GitHub 基础设施全部打通。',
          outputs: ['本地开发环境可运行', '测试网钱包已联通'],
          tasks: [
            '安装 Node.js、Git、VS Code、Foundry',
            '安装 MetaMask 并准备测试网钱包',
            '创建 GitHub 仓库并整理目录结构',
            '确认本地命令行可以跑通 Foundry 初始化',
          ],
        },
        {
          id: 'week2',
          week: 2,
          label: '第2周',
          title: 'Solidity 核心能力',
          focus: '只学最常用的 20%，先把合约结构和基本语法摸熟。',
          outputs: ['基础合约仓库雏形', '至少 1 个可运行合约'],
          tasks: [
            '写第一个 Solidity 合约，理解状态变量和函数',
            '练习 mapping、modifier、event、require、constructor',
            '完成一个 TodoList、记账或白名单合约',
            '给本周代码补注释并整理 README',
          ],
        },
        {
          id: 'week3',
          week: 3,
          label: '第3周',
          title: 'EVM 与安全基础',
          focus: '理解链上执行细节，开始具备最基本的安全意识。',
          outputs: ['安全检查清单', '常见风险知识卡'],
          tasks: [
            '理解 msg.sender、gas、storage / memory / calldata',
            '学习重入、权限控制、整数溢出、随机数误区',
            '阅读至少 2 个真实漏洞案例',
            '对自己的合约做一次安全自查清单',
          ],
        },
        {
          id: 'week4',
          week: 4,
          label: '第4周',
          title: 'Foundry 测试与部署',
          focus: '把测试、部署、浏览器核验整成一个完整闭环。',
          outputs: ['完整的简单 DApp 合约仓库', '测试网部署记录'],
          tasks: [
            '使用 Foundry 为合约补齐单元测试',
            '完成本地部署脚本并跑通',
            '部署到测试网并记录合约地址',
            '在区块浏览器核对交易和调用结果',
          ],
        },
      ],
    },
    {
      id: 'phase-2',
      label: '阶段二',
      range: 'Day 31 - 60',
      title: 'AI Agent 与链上集成',
      goal: '让 AI 能理解任务，并触发链上动作或读取链上状态。',
      weeks: [
        {
          id: 'week5',
          week: 5,
          label: '第5周',
          title: '最小 Agent 原型',
          focus: '先学最小闭环，不追求框架数量，优先理解输入输出。',
          outputs: ['最小 Agent 原型', '输入输出流程图'],
          tasks: [
            '理解 LLM 调用、Prompt 结构和工具调用基础',
            '画出 Agent 输入、意图识别和函数调用流程',
            '实现一个最小 Agent：一句话识别一个动作',
            '列出准备接入链上能力的工具清单',
          ],
        },
        {
          id: 'week6',
          week: 6,
          label: '第6周',
          title: '钱包与链上交互',
          focus: '打通 AI、钱包、合约调用之间的第一条链路。',
          outputs: ['AI + Wallet + Onchain 最小 Demo', '交易状态说明'],
          tasks: [
            '掌握 ethers.js 或 viem 的基础调用',
            '完成钱包连接、读取链上状态、发送交易',
            '实现自然语言到测试网交易的最小链路',
            '补充交易状态处理和错误提示',
          ],
        },
        {
          id: 'week7',
          week: 7,
          label: '第7周',
          title: 'Agent 工具层封装',
          focus: '把能力整理成明确工具，项目会更像真正产品而不是临时演示。',
          outputs: ['Agent 工具层模块', '工具调用说明'],
          tasks: [
            '封装查询余额、查询链上状态、调用合约方法',
            '增加签名前参数校验和交易解释',
            '把工具层整理成可复用模块',
            '补充调用链路文档和示例输入',
          ],
        },
        {
          id: 'week8',
          week: 8,
          label: '第8周',
          title: '演示打磨与外部能力理解',
          focus: '能探索去中心化算力就探索，没时间就优先把 Demo 打磨到可展示。',
          outputs: ['可展示的 AI Agent Onchain Demo', '稳定演示脚本'],
          tasks: [
            '理解去中心化算力或外部服务的接入场景',
            '根据时间选择探索一个服务或继续打磨 Demo',
            '优化页面交互和演示脚本',
            '保证 Demo 可以稳定跑通完整链路',
          ],
        },
      ],
    },
    {
      id: 'phase-3',
      label: '阶段三',
      range: 'Day 61 - 90',
      title: '项目实战与公开输出',
      goal: '做出可展示的正式项目，并有社区和 GitHub 输出。',
      weeks: [
        {
          id: 'week9',
          week: 9,
          label: '第9周',
          title: '正式项目定题',
          focus: '从候选方向里选一个正式项目，并把模块和边界先画清楚。',
          outputs: ['正式项目技术方案', 'MVP 范围文档'],
          tasks: [
            '在三个候选项目中确定一个正式方向',
            '画页面结构、模块边界和数据流',
            '梳理前端、Agent、合约、数据库职责',
            '控制第一版 MVP 范围，不做过重功能',
          ],
        },
        {
          id: 'week10',
          week: 10,
          label: '第10周',
          title: 'MVP 主体实现',
          focus: '闭环优先，先跑通，不追求一开始就做复杂炫技。',
          outputs: ['MVP 主功能', '完整主流程演示'],
          tasks: [
            '完成首页、钱包连接、输入框和响应区域',
            '打通 1 到 2 个链上动作',
            '实现交易记录页或操作历史区域',
            '保证主流程可运行并可演示',
          ],
        },
        {
          id: 'week11',
          week: 11,
          label: '第11周',
          title: 'GitHub 与文档整理',
          focus: '项目讲清楚和把项目做出来一样重要，尤其对答辩和作品集很关键。',
          outputs: ['作品集级文档', '可展示 GitHub 仓库'],
          tasks: [
            '补 README、技术栈说明和部署说明',
            '整理架构图、页面截图和演示素材',
            '记录 Roadmap 和版本演进',
            '检查仓库结构是否适合别人快速理解',
          ],
        },
        {
          id: 'week12',
          week: 12,
          label: '第12周',
          title: '社区贡献与对外展示',
          focus: '开始进入圈子，让别人看见你的成果，不再只是本地自学。',
          outputs: ['社区参与记录', '第一份外部贡献记录'],
          tasks: [
            '加入 2 到 3 个开发者社区并持续观察',
            '主动和至少 5 位开发者建立连接',
            '给一个开源仓库提交一次 PR 或问题反馈',
            '关注 bounty、hackathon 或可参与的 issue',
          ],
        },
      ],
    },
  ],
};

const LEARNING_WEEKS = LEARNING_PLAYBOOK.phases.flatMap((phase) => phase.weeks.map((week) => ({
  ...week,
  phaseTitle: phase.title,
  phaseLabel: phase.label,
  phaseRange: phase.range,
  phaseGoal: phase.goal,
})));

const LEARNING_TASKS = LEARNING_WEEKS.flatMap((week) => week.tasks.map((text, index) => ({
  id: `${week.id}-task-${index + 1}`,
  weekId: week.id,
  weekLabel: week.label,
  weekTitle: week.title,
  phaseLabel: week.phaseLabel,
  text,
  index: index + 1,
})));

function parseJsonResponse(text) {
  const cleanedText = String(text || '').trim().replace(/^\uFEFF/, '');
  return JSON.parse(cleanedText);
}

async function getJson(filename, query = '') {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  const res = await fetch(`${BLOG_API_BASE}/${filename}${q}`);
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '请求失败');
  }
  return data;
}

async function formPost(filename, fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.set(key, String(value));
    }
  });
  const res = await fetch(`${BLOG_API_BASE}/${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  });
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '提交失败');
  }
  return data;
}

async function uploadAssetFile(adminUserId, file) {
  const fd = new FormData();
  fd.append('adminUserId', String(adminUserId));
  fd.append('file', file);
  const res = await fetch(`${BLOG_API_BASE}/uploadAsset.php`, {
    method: 'POST',
    body: fd,
  });
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '上传失败');
  }
  return data;
}

function initCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {
    currentUser = null;
  }
}

function isAdminUser() {
  return !!currentUser && String(currentUser.role || '') === 'admin';
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data || {}));
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function showToast(message) {
  const host = document.getElementById('toastHost');
  if (!host) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  host.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 2400);
}

function ensureRevealObserver() {
  if (revealObserver || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
}

function refreshMotion(root = document) {
  ensureRevealObserver();
  const revealNodes = root.querySelectorAll('.hero-copy, .hero-panel, .project-card, .skill-group, .note-card, .reflection-card, .timeline-item, .glass-card, .learning-hero-meta-item, .admin-card');
  revealNodes.forEach((el) => {
    if (el.dataset.revealBound === '1') return;
    el.dataset.revealBound = '1';
    el.classList.add('reveal');
    if (revealObserver) {
      revealObserver.observe(el);
    } else {
      el.classList.add('is-visible');
    }
  });

  root.querySelectorAll('[data-count-to]').forEach((el) => {
    if (el.dataset.countAnimated === '1') return;
    animateCounter(el);
  });
}

function animateCounter(el) {
  const target = Number(el.dataset.countTo || 0);
  if (!Number.isFinite(target)) return;
  const suffix = el.dataset.countSuffix || '';
  const prefix = el.dataset.countPrefix || '';
  const duration = 900;
  const start = performance.now();
  el.dataset.countAnimated = '1';

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - ((1 - progress) ** 4);
    const current = Math.round(target * eased);
    el.textContent = `${prefix}${current.toLocaleString('zh-CN')}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${prefix}${target.toLocaleString('zh-CN')}${suffix}`;
    }
  };

  requestAnimationFrame(tick);
}

function formatValue(value) {
  const num = Number(value);
  return Number.isFinite(num) ? `${num.toLocaleString('zh-CN')}` : String(value || '');
}

function renderHero() {
  const hero = blogData.hero || {};
  document.getElementById('heroTitle').textContent = hero.title || '个人成长博客';
  document.getElementById('heroSummary').textContent = hero.summary || '';
  document.getElementById('heroName').textContent = hero.name || '创作者';
  document.getElementById('heroMantra').textContent = hero.mantra || '';

  const githubLink = hero.githubUrl || 'https://github.com/pcy2563-cpu/desktop-tutorial';
  const footerGithubLink = document.getElementById('footerGithubLink');
  if (footerGithubLink) footerGithubLink.href = githubLink;

  const focusList = document.getElementById('heroFocusList');
  const focusItems = Array.isArray(blogData.currentFocus) ? blogData.currentFocus : [];
  focusList.innerHTML = focusItems.map((item, index) => `
    <div class="hero-focus-item">
      <span class="hero-focus-index">${String(index + 1).padStart(2, '0')}</span>
      <p>${escapeHtml(item)}</p>
    </div>
  `).join('');

  const metrics = Array.isArray(blogData.metrics) ? blogData.metrics : [];
  const heroMetrics = document.getElementById('heroMetrics');
  heroMetrics.innerHTML = metrics.map((item) => `
    <div class="hero-metric-card">
      <span>${escapeHtml(item.label || '')}</span>
      <strong>${escapeHtml(formatValue(item.value || ''))}</strong>
      <p>${escapeHtml(item.note || '')}</p>
    </div>
  `).join('');
}

function renderProjectFilters() {
  const filtersRoot = document.getElementById('projectFilters');
  const projects = Array.isArray(blogData.projects) ? blogData.projects : [];
  const statuses = Array.from(new Set(projects.map((item) => String(item.status || '').trim()).filter(Boolean)));
  const filters = [{ label: '全部', value: 'all' }, ...statuses.map((status) => ({ label: status, value: status }))];
  filtersRoot.innerHTML = filters.map((item) => `
    <button type="button" class="filter-chip${activeProjectFilter === item.value ? ' active' : ''}" onclick="setProjectFilter('${escapeHtml(item.value)}')">${escapeHtml(item.label)}</button>
  `).join('');
}

function renderProjects() {
  renderProjectFilters();
  const grid = document.getElementById('projectsGrid');
  const items = (Array.isArray(blogData.projects) ? blogData.projects : []).filter((item) => {
    if (activeProjectFilter === 'all') return true;
    return String(item.status || '') === activeProjectFilter;
  });

  if (!items.length) {
    grid.innerHTML = '<div class="project-empty">当前筛选条件下还没有项目内容。</div>';
    return;
  }

  grid.innerHTML = items.map((project) => {
    const coverHtml = project.cover
      ? `<img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)}">`
      : `<div class="project-cover-fallback"><small>${escapeHtml(project.status || 'Project')}</small><strong>${escapeHtml(project.title)}</strong></div>`;

    const linksHtml = Array.isArray(project.links) && project.links.length
      ? `<div class="project-links">${project.links.map((link) => `<a class="project-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join('')}</div>`
      : '';

    const highlightsHtml = Array.isArray(project.highlights) && project.highlights.length
      ? `<div class="project-highlights">${project.highlights.map((item) => `<div class="project-highlight"><i></i><p>${escapeHtml(item)}</p></div>`).join('')}</div>`
      : '';

    return `
      <article class="project-card">
        <div class="project-cover">${coverHtml}</div>
        <div class="project-head">
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <span class="project-period">${escapeHtml(project.period || '')}</span>
          </div>
          <span class="project-meta">${escapeHtml(project.status || '项目')}</span>
        </div>
        <p>${escapeHtml(project.summary || '')}</p>
        <div class="chip-row">${(project.stack || []).map((tech) => `<span class="chip">${escapeHtml(tech)}</span>`).join('')}</div>
        ${highlightsHtml}
        ${linksHtml}
      </article>
    `;
  }).join('');
}

function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  const groups = Array.isArray(blogData.skillGroups) ? blogData.skillGroups : [];
  grid.innerHTML = groups.map((group) => `
    <article class="skill-group">
      <div class="section-kicker">${escapeHtml(group.title || '')}</div>
      <h3>${escapeHtml(group.title || '')}</h3>
      <p>${escapeHtml(group.desc || '')}</p>
      <div class="skill-list">
        ${(group.skills || []).map((skill) => `
          <div class="skill-item">
            <div class="skill-item-head">
              <strong>${escapeHtml(skill.name || '')}</strong>
              <span>${escapeHtml(`${Number(skill.level || 0)}%`)}</span>
            </div>
            <p>${escapeHtml(skill.note || '')}</p>
            <div class="skill-meter"><i style="--skill-scale:${Math.max(0.08, Math.min(1, Number(skill.level || 0) / 100))}"></i></div>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('');
}

function filteredNotes() {
  const notes = Array.isArray(blogData.notes) ? blogData.notes : [];
  if (!noteSearchKeyword) return notes;
  const keyword = noteSearchKeyword.toLowerCase();
  return notes.filter((note) => {
    const text = [
      note.title,
      note.category,
      note.summary,
      ...(Array.isArray(note.tags) ? note.tags : []),
    ].join(' ').toLowerCase();
    return text.includes(keyword);
  });
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  const notes = filteredNotes();

  if (!notes.length) {
    grid.innerHTML = '<div class="note-empty">没有找到匹配的笔记内容，可以换个关键词再试试。</div>';
    return;
  }

  grid.innerHTML = notes.map((note) => `
    <article class="note-card">
      <div class="note-meta">
        <span class="note-category">${escapeHtml(note.category || '笔记')}</span>
        <span class="note-date">${escapeHtml(note.updatedAt || '')}</span>
      </div>
      <h3>${escapeHtml(note.title || '')}</h3>
      <p>${escapeHtml(note.summary || '')}</p>
      <div class="note-tags">${(note.tags || []).map((tag) => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}</div>
      <div class="note-actions">
        ${note.fileUrl ? `<a class="note-download" href="${escapeHtml(note.fileUrl)}" target="_blank" rel="noopener noreferrer">打开资源</a>` : '<span class="chip">待补充文件</span>'}
      </div>
    </article>
  `).join('');
}

function renderReflections() {
  const list = document.getElementById('reflectionsList');
  const items = Array.isArray(blogData.reflections) ? blogData.reflections : [];
  list.innerHTML = items.map((item) => `
    <article class="reflection-card">
      <div class="reflection-date">${escapeHtml(item.date || '')}</div>
      <h3>${escapeHtml(item.title || '')}</h3>
      <p>${escapeHtml(item.excerpt || '')}</p>
      <div class="reflection-tags">${(item.tags || []).map((tag) => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}</div>
    </article>
  `).join('');
}

function renderTimeline() {
  const list = document.getElementById('timelineList');
  const items = Array.isArray(blogData.timeline) ? blogData.timeline : [];
  list.innerHTML = items.map((item) => `
    <article class="timeline-item">
      <span class="timeline-dot" aria-hidden="true"></span>
      <span class="timeline-year">${escapeHtml(item.year || '')}</span>
      <h3>${escapeHtml(item.label || '')}</h3>
      <p>${escapeHtml(item.desc || '')}</p>
    </article>
  `).join('');
}

function todayDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 10);
}

function createDefaultLearningState() {
  return {
    startDate: todayDateValue(),
    selectedWeekId: LEARNING_WEEKS[0].id,
    taskStates: {},
    notes: {},
  };
}

function loadLearningState() {
  try {
    const raw = localStorage.getItem(LEARNING_TRACK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : createDefaultLearningState();
    return {
      ...createDefaultLearningState(),
      ...parsed,
      taskStates: parsed && parsed.taskStates && typeof parsed.taskStates === 'object' ? parsed.taskStates : {},
      notes: parsed && parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return createDefaultLearningState();
  }
}

function saveLearningState(state) {
  localStorage.setItem(LEARNING_TRACK_STORAGE_KEY, JSON.stringify(state));
}

function getWeekById(weekId) {
  return LEARNING_WEEKS.find((week) => week.id === weekId) || LEARNING_WEEKS[0];
}

function getWeekTasks(weekId) {
  return LEARNING_TASKS.filter((task) => task.weekId === weekId);
}

function getTaskStatus(state, taskId) {
  const record = state.taskStates[taskId];
  if (!record) return 'todo';
  return record.status === 'doing' || record.status === 'done' ? record.status : 'todo';
}

function getStatusMeta(status) {
  if (status === 'doing') return { label: '进行中', className: 'is-doing' };
  if (status === 'done') return { label: '已完成', className: 'is-done' };
  return { label: '未开始', className: 'is-todo' };
}

function getWeekStats(state, week) {
  const tasks = getWeekTasks(week.id);
  const total = tasks.length;
  const done = tasks.filter((task) => getTaskStatus(state, task.id) === 'done').length;
  const doing = tasks.filter((task) => getTaskStatus(state, task.id) === 'doing').length;
  return {
    total,
    done,
    doing,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

function getOverallLearningStats(state) {
  const total = LEARNING_TASKS.length;
  const done = LEARNING_TASKS.filter((task) => getTaskStatus(state, task.id) === 'done').length;
  const doing = LEARNING_TASKS.filter((task) => getTaskStatus(state, task.id) === 'doing').length;
  return {
    total,
    done,
    doing,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

function getCompletedWeeksCount(state) {
  return LEARNING_WEEKS.filter((week) => {
    const stats = getWeekStats(state, week);
    return stats.total > 0 && stats.done === stats.total;
  }).length;
}

function getElapsedDays(startDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (Number.isNaN(start.getTime())) return 1;
  return Math.max(1, Math.floor((today - start) / 86400000) + 1);
}

function getExpectedWeekIndex(state) {
  const days = Math.min(LEARNING_PLAYBOOK.durationDays, Math.max(1, getElapsedDays(state.startDate)));
  return Math.min(LEARNING_WEEKS.length, Math.max(1, Math.ceil(days / 7)));
}

function getSuggestedWeek(state) {
  const doingWeek = LEARNING_WEEKS.find((week) => getWeekStats(state, week).doing > 0);
  if (doingWeek) return doingWeek;
  return LEARNING_WEEKS.find((week) => getWeekStats(state, week).done < getWeekStats(state, week).total) || LEARNING_WEEKS[LEARNING_WEEKS.length - 1];
}

function getNextAction(state, selectedWeek) {
  const weeks = [selectedWeek, ...LEARNING_WEEKS.filter((week) => week.id !== selectedWeek.id)];
  for (const week of weeks) {
    const tasks = getWeekTasks(week.id);
    const doingTask = tasks.find((task) => getTaskStatus(state, task.id) === 'doing');
    if (doingTask) return { week, task: doingTask };
    const todoTask = tasks.find((task) => getTaskStatus(state, task.id) !== 'done');
    if (todoTask) return { week, task: todoTask };
  }
  return { week: selectedWeek, task: null };
}

function getRecentLearningTasks(state, status, limit) {
  return LEARNING_TASKS
    .map((task) => ({ ...task, record: state.taskStates[task.id] || { status: 'todo', updatedAt: '' } }))
    .filter((task) => getTaskStatus(state, task.id) === status)
    .sort((a, b) => new Date(b.record.updatedAt || 0).getTime() - new Date(a.record.updatedAt || 0).getTime())
    .slice(0, limit);
}

function getMilestoneProgress(state, milestone) {
  const tasks = milestone.weekIds.flatMap((weekId) => getWeekTasks(weekId));
  const total = tasks.length;
  const done = tasks.filter((task) => getTaskStatus(state, task.id) === 'done').length;
  const doing = tasks.filter((task) => getTaskStatus(state, task.id) === 'doing').length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const status = done === total ? 'done' : (done > 0 || doing > 0 ? 'doing' : 'todo');
  return { total, done, doing, percent, status };
}

function renderLearning() {
  const state = loadLearningState();
  const selectedWeek = getWeekById(state.selectedWeekId);
  const suggestedWeek = getSuggestedWeek(state);
  const overall = getOverallLearningStats(state);
  const expectedWeekIndex = getExpectedWeekIndex(state);
  const nextAction = getNextAction(state, selectedWeek);

  const heroMeta = document.getElementById('learningHeroMeta');
  heroMeta.innerHTML = [
    { label: '当前应该推进', value: suggestedWeek.label, note: `${suggestedWeek.phaseTitle} · ${suggestedWeek.title}` },
    { label: '总完成率', value: `${overall.percent}%`, note: `已完成 ${overall.done} / ${overall.total} 项` },
    { label: '计划起点', value: state.startDate || todayDateValue(), note: `当前建议进入第 ${expectedWeekIndex} 周` },
    { label: '已完成周数', value: String(getCompletedWeeksCount(state)), note: `总共 ${LEARNING_WEEKS.length} 周` },
  ].map((item) => `
    <div class="learning-hero-meta-item">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <p>${escapeHtml(item.note)}</p>
    </div>
  `).join('');

  const currentCard = document.getElementById('learningCurrentCard');
  currentCard.innerHTML = `
    <div class="section-kicker">Current Week</div>
    <span class="learning-pace">当前应该推进到 ${escapeHtml(suggestedWeek.label)}</span>
    <div class="learning-current-card">
      <h3>${escapeHtml(selectedWeek.title)}</h3>
      <p>${escapeHtml(selectedWeek.focus)}</p>
    </div>
    <div class="learning-summary-grid">
      <div class="learning-summary-item">
        <span>进行天数</span>
        <strong data-count-to="${Math.min(LEARNING_PLAYBOOK.durationDays, getElapsedDays(state.startDate))}">0</strong>
        <p>从 ${escapeHtml(state.startDate || todayDateValue())} 开始计算</p>
      </div>
      <div class="learning-summary-item">
        <span>本周完成率</span>
        <strong data-count-to="${getWeekStats(state, selectedWeek).percent}" data-count-suffix="%">0%</strong>
        <p>选中周的任务完成程度</p>
      </div>
      <div class="learning-summary-item">
        <span>下一步动作</span>
        <strong>${escapeHtml(nextAction.task ? String(nextAction.task.index).padStart(2, '0') : '完成')}</strong>
        <p>${escapeHtml(nextAction.task ? nextAction.task.text : '主线已完成，可开始做复盘和答辩') }</p>
      </div>
    </div>
    <div class="admin-grid admin-grid--single">
      <div class="admin-field">
        <label for="learningStartDate">计划开始日期</label>
        <input type="date" id="learningStartDate" class="admin-input" value="${escapeHtml(state.startDate || todayDateValue())}" onchange="setLearningStartDate(this.value)">
      </div>
    </div>
  `;

  const rhythmCard = document.getElementById('learningRhythmCard');
  rhythmCard.innerHTML = `
    <div class="section-kicker">Rhythm & Phase</div>
    <h3>学习节奏与阶段进度</h3>
    <p>学习平台迁到博客后，它就成了你长期追踪技能成长的中控台。</p>
    <div class="learning-history-list">
      ${LEARNING_PLAYBOOK.rhythm.map((item) => `
        <div class="learning-history-item">
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.value)}</p>
        </div>
      `).join('')}
      ${LEARNING_PLAYBOOK.phases.map((phase) => {
        const weeks = LEARNING_WEEKS.filter((week) => week.phaseTitle === phase.title);
        const total = weeks.reduce((sum, week) => sum + getWeekStats(state, week).total, 0);
        const done = weeks.reduce((sum, week) => sum + getWeekStats(state, week).done, 0);
        const percent = total ? Math.round((done / total) * 100) : 0;
        return `
          <div class="learning-history-item">
            <strong>${escapeHtml(`${phase.label} · ${phase.title}`)}</strong>
            <p>${escapeHtml(`${phase.goal} 当前完成度 ${percent}%`)}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;

  const roadmapCard = document.getElementById('learningRoadmapCard');
  roadmapCard.innerHTML = `
    <div class="section-kicker">Roadmap</div>
    <h3>每周任务面板</h3>
    <p>点一下状态按钮就可以在未开始、进行中、已完成之间切换，学习记录会直接保存在浏览器里。</p>
    <div class="learning-week-tabs">
      ${LEARNING_WEEKS.map((week) => {
        const stats = getWeekStats(state, week);
        return `
          <button type="button" class="learning-week-tab${week.id === selectedWeek.id ? ' active' : ''}" onclick="selectLearningWeek('${week.id}')">
            <small>${escapeHtml(week.label)}</small>
            <strong>${escapeHtml(week.title)}</strong>
            <small>${stats.done}/${stats.total} 已完成</small>
          </button>
        `;
      }).join('')}
    </div>
    <div class="learning-history-item">
      <strong>${escapeHtml(`${selectedWeek.phaseTitle} · ${selectedWeek.title}`)}</strong>
      <p>${escapeHtml(selectedWeek.focus)}</p>
      <div class="chip-row">${(selectedWeek.outputs || []).map((output) => `<span class="chip">${escapeHtml(output)}</span>`).join('')}</div>
    </div>
    <div class="learning-task-list">
      ${getWeekTasks(selectedWeek.id).map((task) => {
        const status = getTaskStatus(state, task.id);
        const statusMeta = getStatusMeta(status);
        return `
          <div class="learning-task-item">
            <div class="learning-task-main">
              <span class="learning-task-index">${String(task.index).padStart(2, '0')}</span>
              <div class="learning-task-copy">
                <strong>${escapeHtml(task.text)}</strong>
                <p>${escapeHtml(`${selectedWeek.label} · ${selectedWeek.phaseLabel}`)}</p>
              </div>
            </div>
            <button type="button" class="learning-task-btn ${statusMeta.className}" onclick="cycleLearningTask('${task.id}')">${escapeHtml(statusMeta.label)}</button>
          </div>
        `;
      }).join('')}
    </div>
    <div class="admin-field" style="margin-top:16px;">
      <label for="learningWeekNote">这一周的学习记录</label>
      <textarea id="learningWeekNote" class="learning-note" placeholder="写下这一周学到哪了、卡住什么、下一步准备做什么。" oninput="updateLearningWeekNote(this.value)">${escapeHtml(state.notes[selectedWeek.id] || '')}</textarea>
    </div>
  `;

  const historyCard = document.getElementById('learningHistoryCard');
  const doneTasks = getRecentLearningTasks(state, 'done', 5);
  const doingTasks = getRecentLearningTasks(state, 'doing', 3);
  historyCard.innerHTML = `
    <div class="section-kicker">History</div>
    <h3>已学与在学</h3>
    <p>帮助你回忆已经学了什么，也看清楚当前正在推进哪一步。</p>
    <div class="learning-history-list">
      ${(doingTasks.length ? doingTasks : [{ text: '还没有“进行中”的任务，可以先把当前最要紧的一项标出来。', weekLabel: '提醒', weekTitle: '保持聚焦' }]).map((task) => `
        <div class="learning-history-item">
          <strong>${escapeHtml(`${task.weekLabel} · ${task.weekTitle}`)}</strong>
          <p>${escapeHtml(task.text)}</p>
        </div>
      `).join('')}
      ${(doneTasks.length ? doneTasks : [{ text: '还没有已完成任务，建议从第 1 周开始逐项推进。', weekLabel: '建议', weekTitle: '开始积累' }]).map((task) => `
        <div class="learning-history-item">
          <strong>${escapeHtml(`${task.weekLabel} · ${task.weekTitle}`)}</strong>
          <p>${escapeHtml(task.text)}</p>
        </div>
      `).join('')}
    </div>
  `;

  const milestoneCard = document.getElementById('learningMilestoneCard');
  milestoneCard.innerHTML = `
    <div class="section-kicker">Milestones</div>
    <h3>里程碑与后续项目</h3>
    <p>主线任务之外，也要关注阶段成果和更长期的项目方向。</p>
    <div class="learning-milestone-list">
      ${LEARNING_PLAYBOOK.milestones.map((milestone) => {
        const progress = getMilestoneProgress(state, milestone);
        const statusMeta = getStatusMeta(progress.status);
        return `
          <div class="learning-milestone-item">
            <strong>${escapeHtml(milestone.title)}</strong>
            <p>${escapeHtml(`${progress.done}/${progress.total} 项已完成 · 当前状态 ${statusMeta.label}`)}</p>
          </div>
        `;
      }).join('')}
      ${LEARNING_PLAYBOOK.projects.map((project) => `
        <div class="learning-milestone-item">
          <strong>${escapeHtml(project.title)}</strong>
          <p>${escapeHtml(project.note)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function setProjectFilter(value) {
  activeProjectFilter = value;
  renderProjects();
  refreshMotion(document.getElementById('projectsSection'));
}

function applyNoteSearch() {
  const input = document.getElementById('noteSearchInput');
  noteSearchKeyword = (input ? input.value : '').trim();
  renderNotes();
  refreshMotion(document.getElementById('notesSection'));
}

function selectLearningWeek(weekId) {
  const state = loadLearningState();
  state.selectedWeekId = getWeekById(weekId).id;
  saveLearningState(state);
  renderLearning();
  refreshMotion(document.getElementById('learningSection'));
}

function cycleLearningTask(taskId) {
  const state = loadLearningState();
  const currentStatus = getTaskStatus(state, taskId);
  const nextStatus = currentStatus === 'todo' ? 'doing' : (currentStatus === 'doing' ? 'done' : 'todo');
  state.taskStates[taskId] = {
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  saveLearningState(state);
  renderLearning();
  refreshMotion(document.getElementById('learningSection'));
}

function updateLearningWeekNote(value) {
  const state = loadLearningState();
  state.notes[state.selectedWeekId] = String(value || '').slice(0, 4000);
  saveLearningState(state);
}

function setLearningStartDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return;
  const state = loadLearningState();
  state.startDate = value;
  saveLearningState(state);
  renderLearning();
  refreshMotion(document.getElementById('learningSection'));
}

function createEmptyProject() {
  return {
    title: '',
    period: '',
    status: '新项目',
    summary: '',
    cover: '',
    stack: [],
    highlights: [],
    links: [],
  };
}

function createEmptySkillGroup() {
  return {
    title: '',
    desc: '',
    skills: [],
  };
}

function createEmptyNote() {
  return {
    title: '',
    category: '',
    summary: '',
    fileUrl: '',
    cover: '',
    updatedAt: '',
    tags: [],
  };
}

function createEmptyReflection() {
  return {
    title: '',
    date: '',
    excerpt: '',
    tags: [],
  };
}

function createEmptyTimeline() {
  return {
    year: '',
    label: '',
    desc: '',
  };
}

function linesToList(text) {
  return String(text || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function commaToList(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMetricLines(text) {
  return linesToList(text).map((line) => {
    const parts = line.split('|').map((item) => item.trim());
    return {
      label: parts[0] || '',
      value: parts[1] || '',
      note: parts[2] || '',
    };
  }).filter((item) => item.label && item.value);
}

function parseLinksLines(text) {
  return linesToList(text).map((line) => {
    const parts = line.split('|').map((item) => item.trim());
    return {
      label: parts[0] || '',
      url: parts[1] || '',
    };
  }).filter((item) => item.label && item.url);
}

function parseSkillLines(text) {
  return linesToList(text).map((line) => {
    const parts = line.split('|').map((item) => item.trim());
    return {
      name: parts[0] || '',
      level: Math.max(0, Math.min(100, Number(parts[1] || 0))),
      note: parts[2] || '',
    };
  }).filter((item) => item.name);
}

function metricsToLines(items) {
  return (items || []).map((item) => `${item.label || ''}|${item.value || ''}|${item.note || ''}`).join('\n');
}

function linksToLines(items) {
  return (items || []).map((item) => `${item.label || ''}|${item.url || ''}`).join('\n');
}

function skillsToLines(items) {
  return (items || []).map((item) => `${item.name || ''}|${item.level || 0}|${item.note || ''}`).join('\n');
}

function syncStudioDraftFromDom() {
  const root = document.getElementById('adminStudioRoot');
  if (!root) return editorDraft || cloneData(blogData);

  const payload = {
    hero: {
      name: document.getElementById('studioHeroName')?.value || '',
      title: document.getElementById('studioHeroTitle')?.value || '',
      summary: document.getElementById('studioHeroSummary')?.value || '',
      mantra: document.getElementById('studioHeroMantra')?.value || '',
      githubUrl: document.getElementById('studioHeroGithub')?.value || '',
      contactLabel: document.getElementById('studioHeroContactLabel')?.value || '',
      contactUrl: document.getElementById('studioHeroContactUrl')?.value || '',
    },
    metrics: parseMetricLines(document.getElementById('studioMetrics')?.value || ''),
    currentFocus: linesToList(document.getElementById('studioCurrentFocus')?.value || ''),
    projects: Array.from(root.querySelectorAll('[data-project-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      period: card.querySelector('[data-role="period"]')?.value || '',
      status: card.querySelector('[data-role="status"]')?.value || '',
      summary: card.querySelector('[data-role="summary"]')?.value || '',
      cover: card.querySelector('[data-role="cover"]')?.value || '',
      stack: commaToList(card.querySelector('[data-role="stack"]')?.value || ''),
      highlights: linesToList(card.querySelector('[data-role="highlights"]')?.value || ''),
      links: parseLinksLines(card.querySelector('[data-role="links"]')?.value || ''),
    })),
    skillGroups: Array.from(root.querySelectorAll('[data-skill-group-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      desc: card.querySelector('[data-role="desc"]')?.value || '',
      skills: parseSkillLines(card.querySelector('[data-role="skills"]')?.value || ''),
    })),
    notes: Array.from(root.querySelectorAll('[data-note-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      category: card.querySelector('[data-role="category"]')?.value || '',
      summary: card.querySelector('[data-role="summary"]')?.value || '',
      fileUrl: card.querySelector('[data-role="fileUrl"]')?.value || '',
      cover: card.querySelector('[data-role="cover"]')?.value || '',
      updatedAt: card.querySelector('[data-role="updatedAt"]')?.value || '',
      tags: commaToList(card.querySelector('[data-role="tags"]')?.value || ''),
    })),
    reflections: Array.from(root.querySelectorAll('[data-reflection-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      date: card.querySelector('[data-role="date"]')?.value || '',
      excerpt: card.querySelector('[data-role="excerpt"]')?.value || '',
      tags: commaToList(card.querySelector('[data-role="tags"]')?.value || ''),
    })),
    timeline: Array.from(root.querySelectorAll('[data-timeline-item]')).map((card) => ({
      year: card.querySelector('[data-role="year"]')?.value || '',
      label: card.querySelector('[data-role="label"]')?.value || '',
      desc: card.querySelector('[data-role="desc"]')?.value || '',
    })),
  };

  editorDraft = payload;
  return payload;
}

function renderAdminStudio() {
  const section = document.getElementById('adminStudioSection');
  const entryBtn = document.getElementById('adminEntryBtn');
  const root = document.getElementById('adminStudioRoot');
  if (!section || !root || !entryBtn) return;

  if (!isAdminUser()) {
    section.classList.add('hidden');
    entryBtn.classList.add('hidden');
    return;
  }

  entryBtn.classList.remove('hidden');
  if (section.dataset.open !== '1') {
    section.classList.add('hidden');
    root.innerHTML = '';
    return;
  }
  section.classList.remove('hidden');
  editorDraft = editorDraft || cloneData(blogData);

  root.innerHTML = `
    <article class="admin-card">
      <div class="section-kicker">Hero</div>
      <h3>基础介绍</h3>
      <p>这里控制博客首页的标题、简介、宣言和联系入口。</p>
      <div class="admin-grid">
        <div class="admin-field"><label>姓名</label><input id="studioHeroName" class="admin-input" value="${escapeHtml(editorDraft.hero?.name || '')}"></div>
        <div class="admin-field"><label>主标题</label><input id="studioHeroTitle" class="admin-input" value="${escapeHtml(editorDraft.hero?.title || '')}"></div>
        <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>简介</label><textarea id="studioHeroSummary" class="admin-textarea">${escapeHtml(editorDraft.hero?.summary || '')}</textarea></div>
        <div class="admin-field"><label>一句话宣言</label><input id="studioHeroMantra" class="admin-input" value="${escapeHtml(editorDraft.hero?.mantra || '')}"></div>
        <div class="admin-field"><label>GitHub 链接</label><input id="studioHeroGithub" class="admin-input" value="${escapeHtml(editorDraft.hero?.githubUrl || '')}"></div>
        <div class="admin-field"><label>联系文案</label><input id="studioHeroContactLabel" class="admin-input" value="${escapeHtml(editorDraft.hero?.contactLabel || '')}"></div>
        <div class="admin-field"><label>联系链接</label><input id="studioHeroContactUrl" class="admin-input" value="${escapeHtml(editorDraft.hero?.contactUrl || '')}"></div>
        <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>当前关注方向（每行一条）</label><textarea id="studioCurrentFocus" class="admin-textarea">${escapeHtml((editorDraft.currentFocus || []).join('\n'))}</textarea></div>
        <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>指标卡（每行：标题|值|说明）</label><textarea id="studioMetrics" class="admin-textarea">${escapeHtml(metricsToLines(editorDraft.metrics || []))}</textarea></div>
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Projects</div>
          <h3>项目作品</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('projects')">新增项目</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.projects || []).map((project, index) => `
          <div class="admin-repeater-item" data-project-item>
            <div class="admin-item-head">
              <strong>项目 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('projects', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(project.title || '')}"></div>
              <div class="admin-field"><label>时间</label><input data-role="period" class="admin-input" value="${escapeHtml(project.period || '')}"></div>
              <div class="admin-field"><label>状态</label><input data-role="status" class="admin-input" value="${escapeHtml(project.status || '')}"></div>
              <div class="admin-field"><label>封面图地址</label><input id="project-cover-${index}" data-role="cover" class="admin-input" value="${escapeHtml(project.cover || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>项目简介</label><textarea data-role="summary" class="admin-textarea">${escapeHtml(project.summary || '')}</textarea></div>
              <div class="admin-field"><label>技术栈（逗号分隔）</label><textarea data-role="stack" class="admin-textarea">${escapeHtml((project.stack || []).join(', '))}</textarea></div>
              <div class="admin-field"><label>亮点（每行一条）</label><textarea data-role="highlights" class="admin-textarea">${escapeHtml((project.highlights || []).join('\n'))}</textarea></div>
              <div class="admin-field"><label>链接（每行：名称|URL）</label><textarea data-role="links" class="admin-textarea">${escapeHtml(linksToLines(project.links || []))}</textarea></div>
            </div>
            <div class="admin-actions" style="margin-top:12px;">
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('project-cover-${index}', 'image/*')">上传封面</button>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Skills</div>
          <h3>技能图谱</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('skillGroups')">新增技能组</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.skillGroups || []).map((group, index) => `
          <div class="admin-repeater-item" data-skill-group-item>
            <div class="admin-item-head">
              <strong>技能组 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('skillGroups', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(group.title || '')}"></div>
              <div class="admin-field"><label>说明</label><input data-role="desc" class="admin-input" value="${escapeHtml(group.desc || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>技能（每行：名称|掌握度0-100|说明）</label><textarea data-role="skills" class="admin-textarea">${escapeHtml(skillsToLines(group.skills || []))}</textarea></div>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Notes</div>
          <h3>笔记资源</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('notes')">新增笔记</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.notes || []).map((note, index) => `
          <div class="admin-repeater-item" data-note-item>
            <div class="admin-item-head">
              <strong>笔记 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('notes', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(note.title || '')}"></div>
              <div class="admin-field"><label>分类</label><input data-role="category" class="admin-input" value="${escapeHtml(note.category || '')}"></div>
              <div class="admin-field"><label>更新时间</label><input data-role="updatedAt" class="admin-input" value="${escapeHtml(note.updatedAt || '')}"></div>
              <div class="admin-field"><label>标签（逗号分隔）</label><input data-role="tags" class="admin-input" value="${escapeHtml((note.tags || []).join(', '))}"></div>
              <div class="admin-field"><label>资源地址</label><input id="note-file-${index}" data-role="fileUrl" class="admin-input" value="${escapeHtml(note.fileUrl || '')}"></div>
              <div class="admin-field"><label>封面图地址</label><input id="note-cover-${index}" data-role="cover" class="admin-input" value="${escapeHtml(note.cover || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>摘要</label><textarea data-role="summary" class="admin-textarea">${escapeHtml(note.summary || '')}</textarea></div>
            </div>
            <div class="admin-actions" style="margin-top:12px;">
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('note-file-${index}', '.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip,image/*')">上传资源</button>
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('note-cover-${index}', 'image/*')">上传封面</button>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Reflections</div>
          <h3>成长感悟</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('reflections')">新增感悟</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.reflections || []).map((item, index) => `
          <div class="admin-repeater-item" data-reflection-item>
            <div class="admin-item-head">
              <strong>感悟 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('reflections', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(item.title || '')}"></div>
              <div class="admin-field"><label>时间</label><input data-role="date" class="admin-input" value="${escapeHtml(item.date || '')}"></div>
              <div class="admin-field"><label>标签（逗号分隔）</label><input data-role="tags" class="admin-input" value="${escapeHtml((item.tags || []).join(', '))}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>内容摘要</label><textarea data-role="excerpt" class="admin-textarea">${escapeHtml(item.excerpt || '')}</textarea></div>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Timeline</div>
          <h3>成长时间线</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('timeline')">新增节点</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.timeline || []).map((item, index) => `
          <div class="admin-repeater-item" data-timeline-item>
            <div class="admin-item-head">
              <strong>节点 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('timeline', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>年份 / 阶段</label><input data-role="year" class="admin-input" value="${escapeHtml(item.year || '')}"></div>
              <div class="admin-field"><label>标题</label><input data-role="label" class="admin-input" value="${escapeHtml(item.label || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>说明</label><textarea data-role="desc" class="admin-textarea">${escapeHtml(item.desc || '')}</textarea></div>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

function addStudioItem(type) {
  editorDraft = syncStudioDraftFromDom();
  if (type === 'projects') editorDraft.projects = [...(editorDraft.projects || []), createEmptyProject()];
  if (type === 'skillGroups') editorDraft.skillGroups = [...(editorDraft.skillGroups || []), createEmptySkillGroup()];
  if (type === 'notes') editorDraft.notes = [...(editorDraft.notes || []), createEmptyNote()];
  if (type === 'reflections') editorDraft.reflections = [...(editorDraft.reflections || []), createEmptyReflection()];
  if (type === 'timeline') editorDraft.timeline = [...(editorDraft.timeline || []), createEmptyTimeline()];
  renderAdminStudio();
  refreshMotion(document.getElementById('adminStudioSection'));
}

function removeStudioItem(type, index) {
  editorDraft = syncStudioDraftFromDom();
  if (!Array.isArray(editorDraft[type])) return;
  editorDraft[type] = editorDraft[type].filter((_, itemIndex) => itemIndex !== index);
  renderAdminStudio();
  refreshMotion(document.getElementById('adminStudioSection'));
}

function chooseStudioAsset(targetFieldId, accept) {
  if (!isAdminUser()) {
    showToast('请先登录管理员账号');
    return;
  }
  const input = document.getElementById('assetUploadInput');
  if (!input) return;
  uploadTargetFieldId = targetFieldId;
  input.value = '';
  input.accept = accept || '*/*';
  input.click();
}

async function handleStudioAssetUpload(event) {
  if (!isAdminUser()) return;
  const file = event?.target?.files?.[0];
  if (!file || !uploadTargetFieldId) return;
  try {
    const res = await uploadAssetFile(currentUser.id, file);
    const target = document.getElementById(uploadTargetFieldId);
    if (target) {
      target.value = res.data?.url || '';
    }
    showToast('资源已上传');
  } catch (error) {
    showToast(error.message || '上传失败');
  } finally {
    uploadTargetFieldId = '';
    event.target.value = '';
  }
}

async function saveBlogStudio() {
  if (!isAdminUser()) {
    showToast('请先登录管理员账号');
    return;
  }
  try {
    editorDraft = syncStudioDraftFromDom();
    const res = await formPost('adminSavePersonalBlog.php', {
      adminUserId: currentUser.id,
      payload: JSON.stringify(editorDraft),
    });
    blogData = cloneData(res.data || {});
    editorDraft = cloneData(blogData);
    renderPublicSections();
    renderAdminStudio();
    showToast('个人博客已保存');
  } catch (error) {
    showToast(error.message || '保存失败');
  }
}

function reloadBlogStudio() {
  editorDraft = cloneData(blogData);
  renderAdminStudio();
  showToast('已重新载入当前博客内容');
}

function openAdminStudio() {
  if (!isAdminUser()) {
    showToast('请先在论坛登录管理员账号，再进入工作台');
    return;
  }
  const section = document.getElementById('adminStudioSection');
  if (!section) return;
  section.dataset.open = '1';
  section.classList.remove('hidden');
  renderAdminStudio();
  refreshMotion(section);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPublicSections() {
  renderHero();
  renderProjects();
  renderSkills();
  renderNotes();
  renderLearning();
  renderReflections();
  renderTimeline();
  refreshMotion(document);
}

async function initPage() {
  initCurrentUser();
  const noteSearchInput = document.getElementById('noteSearchInput');
  if (noteSearchInput) {
    noteSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyNoteSearch();
      }
    });
  }

  try {
    const res = await getJson('getPersonalBlog.php');
    blogData = cloneData(res.data || {});
    editorDraft = cloneData(blogData);
    renderPublicSections();
    renderAdminStudio();
  } catch (error) {
    showToast(error.message || '博客加载失败');
  }
}

document.addEventListener('DOMContentLoaded', initPage);

window.setProjectFilter = setProjectFilter;
window.applyNoteSearch = applyNoteSearch;
window.selectLearningWeek = selectLearningWeek;
window.cycleLearningTask = cycleLearningTask;
window.updateLearningWeekNote = updateLearningWeekNote;
window.setLearningStartDate = setLearningStartDate;
window.openAdminStudio = openAdminStudio;
window.addStudioItem = addStudioItem;
window.removeStudioItem = removeStudioItem;
window.chooseStudioAsset = chooseStudioAsset;
window.handleStudioAssetUpload = handleStudioAssetUpload;
window.saveBlogStudio = saveBlogStudio;
window.reloadBlogStudio = reloadBlogStudio;

let currentRoute = 'home';
let activeArticleId = '';
let mobileMenuOpen = false;
let routeEventsBound = false;

const BLOG_ROUTE_ALIAS_MAP = {
  '': 'home',
  home: 'home',
  heroSection: 'home',
  homeOverviewSection: 'home',
  articles: 'articles',
  articlesSection: 'articles',
  projects: 'projects',
  projectsSection: 'projects',
  skills: 'skills',
  skillsSection: 'skills',
  notes: 'notes',
  notesSection: 'notes',
  learning: 'learning',
  learningSection: 'learning',
  reflections: 'reflections',
  reflectionsSection: 'reflections',
  timeline: 'timeline',
  timelineSection: 'timeline',
  studio: 'studio',
  adminStudioSection: 'studio',
};

const BLOG_ROUTE_SECTIONS = {
  home: ['heroSection', 'homeOverviewSection'],
  articles: ['articlesSection'],
  projects: ['projectsSection'],
  skills: ['skillsSection'],
  notes: ['notesSection'],
  learning: ['learningSection'],
  reflections: ['reflectionsSection'],
  timeline: ['timelineSection'],
  studio: ['adminStudioSection'],
};

function normalizeBlogRoute(hash = window.location.hash) {
  const key = String(hash || '').replace(/^#/, '').trim();
  return BLOG_ROUTE_ALIAS_MAP[key] || 'home';
}

function blogRouteHash(route) {
  return `#${route || 'home'}`;
}

function syncRouteLinks() {
  document.querySelectorAll('[data-route-link]').forEach((link) => {
    link.classList.toggle('active', link.dataset.routeLink === currentRoute);
  });
}

function setMobileMenuState(open) {
  mobileMenuOpen = !!open;
  document.body.classList.toggle('menu-open', mobileMenuOpen);

  const toggle = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileMenuDrawer');
  const backdrop = document.getElementById('mobileMenuBackdrop');

  if (toggle) {
    toggle.setAttribute('aria-expanded', mobileMenuOpen ? 'true' : 'false');
  }
  if (drawer) {
    drawer.classList.toggle('hidden', !mobileMenuOpen);
    drawer.setAttribute('aria-hidden', mobileMenuOpen ? 'false' : 'true');
  }
  if (backdrop) {
    backdrop.classList.toggle('hidden', !mobileMenuOpen);
  }
}

function toggleMobileMenu(force) {
  setMobileMenuState(typeof force === 'boolean' ? force : !mobileMenuOpen);
}

function setSectionVisibility(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden', !visible);
}

function syncBlogRoute(options = {}) {
  currentRoute = normalizeBlogRoute();
  setMobileMenuState(false);
  if (currentRoute === 'studio' && !isAdminUser()) {
    currentRoute = 'home';
    history.replaceState(null, '', blogRouteHash('home'));
  }

  Object.entries(BLOG_ROUTE_SECTIONS).forEach(([route, ids]) => {
    const visible = route === currentRoute;
    ids.forEach((id) => {
      if (route === 'studio') {
        const section = document.getElementById('adminStudioSection');
        const shouldShow = visible && !!section && section.dataset.open === '1' && isAdminUser();
        setSectionVisibility(id, shouldShow);
        return;
      }
      setSectionVisibility(id, visible);
    });
  });

  syncRouteLinks();

  const targetId = (BLOG_ROUTE_SECTIONS[currentRoute] || ['heroSection'])[0];
  const target = document.getElementById(targetId);
  if (target) {
    refreshMotion(target);
    if (options.scroll !== false) {
      target.scrollIntoView({ behavior: options.instant ? 'auto' : 'smooth', block: 'start' });
    }
  }
}

function openBlogRoute(route) {
  const nextHash = blogRouteHash(route);
  if (window.location.hash === nextHash) {
    syncBlogRoute();
  } else {
    window.location.hash = nextHash;
  }
}

function paragraphsToHtml(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function renderHero() {
  const hero = blogData.hero || {};
  document.getElementById('heroTitle').textContent = hero.title || '个人成长博客';
  document.getElementById('heroSummary').textContent = hero.summary || '';
  document.getElementById('heroName').textContent = hero.name || '创作者';
  document.getElementById('heroMantra').textContent = hero.mantra || '';

  const githubLink = hero.githubUrl || 'https://github.com/pcy2563-cpu/desktop-tutorial';
  const footerGithubLink = document.getElementById('footerGithubLink');
  if (footerGithubLink) footerGithubLink.href = githubLink;

  const focusList = document.getElementById('heroFocusList');
  const focusItems = Array.isArray(blogData.currentFocus) ? blogData.currentFocus : [];
  focusList.innerHTML = focusItems.map((item, index) => `
    <div class="hero-focus-item">
      <span class="hero-focus-index">${String(index + 1).padStart(2, '0')}</span>
      <p>${escapeHtml(item)}</p>
    </div>
  `).join('');

  const metrics = Array.isArray(blogData.metrics) ? blogData.metrics : [];
  const heroMetrics = document.getElementById('heroMetrics');
  heroMetrics.innerHTML = metrics.map((item) => `
    <div class="hero-metric-card">
      <span>${escapeHtml(item.label || '')}</span>
      <strong>${escapeHtml(formatValue(item.value || ''))}</strong>
      <p>${escapeHtml(item.note || '')}</p>
    </div>
  `).join('');
}

function renderHubCards() {
  const root = document.getElementById('hubGrid');
  if (!root) return;

  const skillCount = (Array.isArray(blogData.skillGroups) ? blogData.skillGroups : []).reduce((sum, group) => {
    return sum + (Array.isArray(group.skills) ? group.skills.length : 0);
  }, 0);

  const cards = [
    {
      route: 'articles',
      kicker: 'Article',
      title: '文章专栏',
      summary: '发布项目复盘、学习总结和成长思考，把经验沉淀成正式文章。',
      meta: [`${Array.isArray(blogData.articles) ? blogData.articles.length : 0} 篇文章`, '正式输出'],
    },
    {
      route: 'projects',
      kicker: 'Projects',
      title: '项目归档页',
      summary: '集中展示每个项目的定位、技术栈、亮点和链接，形成正式作品集。',
      meta: [`${Array.isArray(blogData.projects) ? blogData.projects.length : 0} 个项目`, '作品集展示'],
    },
    {
      route: 'skills',
      kicker: 'Skills',
      title: '技能树页',
      summary: '把掌握中的能力按方向组织起来，看清楚自己擅长什么、还缺什么。',
      meta: [`${skillCount} 项技能`, `${Array.isArray(blogData.skillGroups) ? blogData.skillGroups.length : 0} 个方向`],
    },
    {
      route: 'learning',
      kicker: 'Learning',
      title: '学习中控台',
      summary: '把学习平台和笔记沉淀收进同一条主线，持续跟踪进度、资料和下一步动作。',
      meta: [`${Array.isArray(blogData.notes) ? blogData.notes.length : 0} 份笔记`, '学习主线'],
    },
  ];

  root.innerHTML = cards.map((card) => `
    <button type="button" class="hub-card" onclick="openBlogRoute('${card.route}')">
      <div class="hub-card-head">
        <div>
          <div class="section-kicker">${escapeHtml(card.kicker)}</div>
          <strong>${escapeHtml(card.title)}</strong>
        </div>
        <span class="hub-card-arrow">→</span>
      </div>
      <p>${escapeHtml(card.summary)}</p>
      <div class="hub-card-meta">
        ${card.meta.map((item) => `<span class="hub-card-chip">${escapeHtml(item)}</span>`).join('')}
      </div>
    </button>
  `).join('');
}

function renderProjectFilters() {
  const filtersRoot = document.getElementById('projectFilters');
  if (!filtersRoot) return;
  const projects = Array.isArray(blogData.projects) ? blogData.projects : [];
  const statuses = Array.from(new Set(projects.map((item) => String(item.status || '').trim()).filter(Boolean)));
  const filters = [{ label: '全部', value: 'all' }, ...statuses.map((status) => ({ label: status, value: status }))];
  filtersRoot.innerHTML = filters.map((item) => `
    <button type="button" class="filter-chip${activeProjectFilter === item.value ? ' active' : ''}" onclick="setProjectFilter('${escapeHtml(item.value)}')">${escapeHtml(item.label)}</button>
  `).join('');
}

function renderProjects() {
  renderProjectFilters();
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const items = (Array.isArray(blogData.projects) ? blogData.projects : []).filter((item) => {
    if (activeProjectFilter === 'all') return true;
    return String(item.status || '') === activeProjectFilter;
  });

  if (!items.length) {
    grid.innerHTML = '<div class="project-empty">当前筛选条件下还没有项目内容。</div>';
    return;
  }

  grid.innerHTML = items.map((project) => {
    const coverHtml = project.cover
      ? `<img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)}">`
      : `<div class="project-cover-fallback"><small>${escapeHtml(project.status || 'Project')}</small><strong>${escapeHtml(project.title)}</strong></div>`;

    const linksHtml = Array.isArray(project.links) && project.links.length
      ? `<div class="project-links">${project.links.map((link) => `<a class="project-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join('')}</div>`
      : '';

    const highlightsHtml = Array.isArray(project.highlights) && project.highlights.length
      ? `<div class="project-highlights">${project.highlights.map((item) => `<div class="project-highlight"><i></i><p>${escapeHtml(item)}</p></div>`).join('')}</div>`
      : '';

    return `
      <article class="project-card">
        <div class="project-cover">${coverHtml}</div>
        <div class="project-head">
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <span class="project-period">${escapeHtml(project.period || '')}</span>
          </div>
          <span class="project-meta">${escapeHtml(project.status || '项目')}</span>
        </div>
        <p>${escapeHtml(project.summary || '')}</p>
        <div class="chip-row">${(project.stack || []).map((tech) => `<span class="chip">${escapeHtml(tech)}</span>`).join('')}</div>
        ${highlightsHtml}
        ${linksHtml}
      </article>
    `;
  }).join('');
}

function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;
  const groups = Array.isArray(blogData.skillGroups) ? blogData.skillGroups : [];
  grid.innerHTML = groups.map((group) => `
    <article class="skill-group">
      <div class="section-kicker">${escapeHtml(group.title || '')}</div>
      <h3>${escapeHtml(group.title || '')}</h3>
      <p>${escapeHtml(group.desc || '')}</p>
      <div class="skill-list">
        ${(group.skills || []).map((skill) => `
          <div class="skill-item">
            <div class="skill-item-head">
              <strong>${escapeHtml(skill.name || '')}</strong>
              <span>${escapeHtml(`${Number(skill.level || 0)}%`)}</span>
            </div>
            <p>${escapeHtml(skill.note || '')}</p>
            <div class="skill-meter"><i style="--skill-scale:${Math.max(0.08, Math.min(1, Number(skill.level || 0) / 100))}"></i></div>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('');
}

function filteredNotes() {
  const notes = Array.isArray(blogData.notes) ? blogData.notes : [];
  if (!noteSearchKeyword) return notes;
  const keyword = noteSearchKeyword.toLowerCase();
  return notes.filter((note) => {
    const text = [
      note.title,
      note.category,
      note.summary,
      ...(Array.isArray(note.tags) ? note.tags : []),
    ].join(' ').toLowerCase();
    return text.includes(keyword);
  });
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  if (!grid) return;
  const notes = filteredNotes();

  if (!notes.length) {
    grid.innerHTML = '<div class="note-empty">没有找到匹配的笔记内容，可以换个关键词再试试。</div>';
    return;
  }

  grid.innerHTML = notes.map((note) => `
    <article class="note-card">
      <div class="note-meta">
        <span class="note-category">${escapeHtml(note.category || '笔记')}</span>
        <span class="note-date">${escapeHtml(note.updatedAt || '')}</span>
      </div>
      <h3>${escapeHtml(note.title || '')}</h3>
      <p>${escapeHtml(note.summary || '')}</p>
      <div class="note-tags">${(note.tags || []).map((tag) => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}</div>
      <div class="note-actions">
        ${note.fileUrl ? `<a class="note-download" href="${escapeHtml(note.fileUrl)}" target="_blank" rel="noopener noreferrer">打开资源</a>` : '<span class="chip">待补充文件</span>'}
      </div>
    </article>
  `).join('');
}

function renderArticles() {
  const grid = document.getElementById('articlesGrid');
  if (!grid) return;
  const articles = Array.isArray(blogData.articles) ? blogData.articles : [];

  if (!articles.length) {
    grid.innerHTML = '<div class="project-empty">暂时还没有文章，后续会把项目复盘和成长总结陆续整理进来。</div>';
    return;
  }

  grid.innerHTML = articles.map((article, index) => {
    const articleId = article.id || `article-${index}`;
    const isOpen = activeArticleId === articleId;
    const coverHtml = article.cover
      ? `<img src="${escapeHtml(article.cover)}" alt="${escapeHtml(article.title || '文章封面')}">`
      : `<div class="article-card-cover-fallback">${escapeHtml(article.category || '文章')}</div>`;

    return `
      <article class="article-card">
        <div class="article-card-cover">${coverHtml}</div>
        <div class="article-card-head">
          <div class="article-title-block">
            <div class="section-kicker">${escapeHtml(article.category || 'Article')}</div>
            <strong>${escapeHtml(article.title || '')}</strong>
            <small>${escapeHtml(article.updatedAt || '')}</small>
          </div>
          <span class="article-read-time">${escapeHtml(article.readTime || '阅读')}</span>
        </div>
        <p>${escapeHtml(article.summary || '')}</p>
        <div class="article-card-meta">
          ${(article.tags || []).map((tag) => `<span class="page-chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <button type="button" class="ghost-btn article-toggle" onclick="toggleArticle('${escapeHtml(articleId)}')">${isOpen ? '收起全文' : '展开全文'}</button>
        ${isOpen ? `<div class="article-body">${paragraphsToHtml(article.content || article.summary || '')}</div>` : ''}
      </article>
    `;
  }).join('');
}

function toggleArticle(articleId) {
  activeArticleId = activeArticleId === articleId ? '' : articleId;
  renderArticles();
  refreshMotion(document.getElementById('articlesSection'));
}

function renderReflections() {
  const list = document.getElementById('reflectionsList');
  if (!list) return;
  const items = Array.isArray(blogData.reflections) ? blogData.reflections : [];
  list.innerHTML = items.map((item) => `
    <article class="reflection-card">
      <div class="reflection-date">${escapeHtml(item.date || '')}</div>
      <h3>${escapeHtml(item.title || '')}</h3>
      <p>${escapeHtml(item.excerpt || '')}</p>
      <div class="reflection-tags">${(item.tags || []).map((tag) => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}</div>
    </article>
  `).join('');
}

function renderTimeline() {
  const list = document.getElementById('timelineList');
  if (!list) return;
  const items = Array.isArray(blogData.timeline) ? blogData.timeline : [];
  list.innerHTML = items.map((item) => `
    <article class="timeline-item">
      <span class="timeline-dot" aria-hidden="true"></span>
      <span class="timeline-year">${escapeHtml(item.year || '')}</span>
      <h3>${escapeHtml(item.label || '')}</h3>
      <p>${escapeHtml(item.desc || '')}</p>
    </article>
  `).join('');
}

function setProjectFilter(value) {
  activeProjectFilter = value;
  renderProjects();
  openBlogRoute('projects');
}

function applyNoteSearch() {
  const input = document.getElementById('noteSearchInput');
  noteSearchKeyword = (input ? input.value : '').trim();
  renderNotes();
  openBlogRoute('notes');
}

function createEmptyArticle() {
  return {
    title: '',
    category: '',
    summary: '',
    content: '',
    cover: '',
    updatedAt: '',
    readTime: '',
    tags: [],
  };
}

function syncStudioDraftFromDom() {
  const root = document.getElementById('adminStudioRoot');
  if (!root) return editorDraft || cloneData(blogData);

  const payload = {
    hero: {
      name: document.getElementById('studioHeroName')?.value || '',
      title: document.getElementById('studioHeroTitle')?.value || '',
      summary: document.getElementById('studioHeroSummary')?.value || '',
      mantra: document.getElementById('studioHeroMantra')?.value || '',
      githubUrl: document.getElementById('studioHeroGithub')?.value || '',
      contactLabel: document.getElementById('studioHeroContactLabel')?.value || '',
      contactUrl: document.getElementById('studioHeroContactUrl')?.value || '',
    },
    metrics: parseMetricLines(document.getElementById('studioMetrics')?.value || ''),
    currentFocus: linesToList(document.getElementById('studioCurrentFocus')?.value || ''),
    articles: Array.from(root.querySelectorAll('[data-article-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      category: card.querySelector('[data-role="category"]')?.value || '',
      summary: card.querySelector('[data-role="summary"]')?.value || '',
      content: card.querySelector('[data-role="content"]')?.value || '',
      cover: card.querySelector('[data-role="cover"]')?.value || '',
      updatedAt: card.querySelector('[data-role="updatedAt"]')?.value || '',
      readTime: card.querySelector('[data-role="readTime"]')?.value || '',
      tags: commaToList(card.querySelector('[data-role="tags"]')?.value || ''),
    })),
    projects: Array.from(root.querySelectorAll('[data-project-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      period: card.querySelector('[data-role="period"]')?.value || '',
      status: card.querySelector('[data-role="status"]')?.value || '',
      summary: card.querySelector('[data-role="summary"]')?.value || '',
      cover: card.querySelector('[data-role="cover"]')?.value || '',
      stack: commaToList(card.querySelector('[data-role="stack"]')?.value || ''),
      highlights: linesToList(card.querySelector('[data-role="highlights"]')?.value || ''),
      links: parseLinksLines(card.querySelector('[data-role="links"]')?.value || ''),
    })),
    skillGroups: Array.from(root.querySelectorAll('[data-skill-group-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      desc: card.querySelector('[data-role="desc"]')?.value || '',
      skills: parseSkillLines(card.querySelector('[data-role="skills"]')?.value || ''),
    })),
    notes: Array.from(root.querySelectorAll('[data-note-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      category: card.querySelector('[data-role="category"]')?.value || '',
      summary: card.querySelector('[data-role="summary"]')?.value || '',
      fileUrl: card.querySelector('[data-role="fileUrl"]')?.value || '',
      cover: card.querySelector('[data-role="cover"]')?.value || '',
      updatedAt: card.querySelector('[data-role="updatedAt"]')?.value || '',
      tags: commaToList(card.querySelector('[data-role="tags"]')?.value || ''),
    })),
    reflections: Array.from(root.querySelectorAll('[data-reflection-item]')).map((card) => ({
      title: card.querySelector('[data-role="title"]')?.value || '',
      date: card.querySelector('[data-role="date"]')?.value || '',
      excerpt: card.querySelector('[data-role="excerpt"]')?.value || '',
      tags: commaToList(card.querySelector('[data-role="tags"]')?.value || ''),
    })),
    timeline: Array.from(root.querySelectorAll('[data-timeline-item]')).map((card) => ({
      year: card.querySelector('[data-role="year"]')?.value || '',
      label: card.querySelector('[data-role="label"]')?.value || '',
      desc: card.querySelector('[data-role="desc"]')?.value || '',
    })),
  };

  editorDraft = payload;
  return payload;
}

function renderAdminStudio() {
  const section = document.getElementById('adminStudioSection');
  const entryBtn = document.getElementById('adminEntryBtn');
  const mobileEntryBtn = document.getElementById('mobileAdminEntryBtn');
  const root = document.getElementById('adminStudioRoot');
  if (!section || !root || !entryBtn) return;

  if (!isAdminUser()) {
    section.classList.add('hidden');
    entryBtn.classList.add('hidden');
    if (mobileEntryBtn) mobileEntryBtn.classList.add('hidden');
    return;
  }

  entryBtn.classList.remove('hidden');
  if (mobileEntryBtn) mobileEntryBtn.classList.remove('hidden');
  if (section.dataset.open !== '1' && currentRoute !== 'studio') {
    section.classList.add('hidden');
    root.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  editorDraft = editorDraft || cloneData(blogData);

  root.innerHTML = `
    <article class="admin-card">
      <div class="section-kicker">Hero</div>
      <h3>基础介绍</h3>
      <p>控制博客首页的标题、简介、宣言、联系入口和当前关注方向。</p>
      <div class="admin-grid">
        <div class="admin-field"><label>姓名</label><input id="studioHeroName" class="admin-input" value="${escapeHtml(editorDraft.hero?.name || '')}"></div>
        <div class="admin-field"><label>主标题</label><input id="studioHeroTitle" class="admin-input" value="${escapeHtml(editorDraft.hero?.title || '')}"></div>
        <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>简介</label><textarea id="studioHeroSummary" class="admin-textarea">${escapeHtml(editorDraft.hero?.summary || '')}</textarea></div>
        <div class="admin-field"><label>一句话宣言</label><input id="studioHeroMantra" class="admin-input" value="${escapeHtml(editorDraft.hero?.mantra || '')}"></div>
        <div class="admin-field"><label>GitHub 链接</label><input id="studioHeroGithub" class="admin-input" value="${escapeHtml(editorDraft.hero?.githubUrl || '')}"></div>
        <div class="admin-field"><label>联系文案</label><input id="studioHeroContactLabel" class="admin-input" value="${escapeHtml(editorDraft.hero?.contactLabel || '')}"></div>
        <div class="admin-field"><label>联系链接</label><input id="studioHeroContactUrl" class="admin-input" value="${escapeHtml(editorDraft.hero?.contactUrl || '')}"></div>
        <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>当前关注方向（每行一条）</label><textarea id="studioCurrentFocus" class="admin-textarea">${escapeHtml((editorDraft.currentFocus || []).join('\n'))}</textarea></div>
        <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>指标卡（每行：标题|值|说明）</label><textarea id="studioMetrics" class="admin-textarea">${escapeHtml(metricsToLines(editorDraft.metrics || []))}</textarea></div>
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Articles</div>
          <h3>文章发布页</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('articles')">新增文章</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.articles || []).map((article, index) => `
          <div class="admin-repeater-item" data-article-item>
            <div class="admin-item-head">
              <strong>文章 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('articles', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(article.title || '')}"></div>
              <div class="admin-field"><label>分类</label><input data-role="category" class="admin-input" value="${escapeHtml(article.category || '')}"></div>
              <div class="admin-field"><label>发布日期</label><input data-role="updatedAt" class="admin-input" value="${escapeHtml(article.updatedAt || '')}"></div>
              <div class="admin-field"><label>阅读时长</label><input data-role="readTime" class="admin-input" value="${escapeHtml(article.readTime || '')}"></div>
              <div class="admin-field"><label>标签（逗号分隔）</label><input data-role="tags" class="admin-input" value="${escapeHtml((article.tags || []).join(', '))}"></div>
              <div class="admin-field"><label>封面图地址</label><input id="article-cover-${index}" data-role="cover" class="admin-input" value="${escapeHtml(article.cover || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>摘要</label><textarea data-role="summary" class="admin-textarea">${escapeHtml(article.summary || '')}</textarea></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>正文</label><textarea data-role="content" class="admin-textarea" style="min-height:180px;">${escapeHtml(article.content || '')}</textarea></div>
            </div>
            <div class="admin-actions" style="margin-top:12px;">
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('article-cover-${index}', 'image/*')">上传封面</button>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Projects</div>
          <h3>项目归档管理</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('projects')">新增项目</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.projects || []).map((project, index) => `
          <div class="admin-repeater-item" data-project-item>
            <div class="admin-item-head">
              <strong>项目 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('projects', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(project.title || '')}"></div>
              <div class="admin-field"><label>时间</label><input data-role="period" class="admin-input" value="${escapeHtml(project.period || '')}"></div>
              <div class="admin-field"><label>状态</label><input data-role="status" class="admin-input" value="${escapeHtml(project.status || '')}"></div>
              <div class="admin-field"><label>封面图地址</label><input id="project-cover-${index}" data-role="cover" class="admin-input" value="${escapeHtml(project.cover || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>项目简介</label><textarea data-role="summary" class="admin-textarea">${escapeHtml(project.summary || '')}</textarea></div>
              <div class="admin-field"><label>技术栈（逗号分隔）</label><textarea data-role="stack" class="admin-textarea">${escapeHtml((project.stack || []).join(', '))}</textarea></div>
              <div class="admin-field"><label>亮点（每行一条）</label><textarea data-role="highlights" class="admin-textarea">${escapeHtml((project.highlights || []).join('\n'))}</textarea></div>
              <div class="admin-field"><label>链接（每行：名称|URL）</label><textarea data-role="links" class="admin-textarea">${escapeHtml(linksToLines(project.links || []))}</textarea></div>
            </div>
            <div class="admin-actions" style="margin-top:12px;">
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('project-cover-${index}', 'image/*')">上传封面</button>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Skills</div>
          <h3>技能树管理</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('skillGroups')">新增技能组</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.skillGroups || []).map((group, index) => `
          <div class="admin-repeater-item" data-skill-group-item>
            <div class="admin-item-head">
              <strong>技能组 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('skillGroups', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(group.title || '')}"></div>
              <div class="admin-field"><label>说明</label><input data-role="desc" class="admin-input" value="${escapeHtml(group.desc || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>技能（每行：名称|掌握度0-100|说明）</label><textarea data-role="skills" class="admin-textarea">${escapeHtml(skillsToLines(group.skills || []))}</textarea></div>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Notes</div>
          <h3>笔记上传管理</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('notes')">新增笔记</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.notes || []).map((note, index) => `
          <div class="admin-repeater-item" data-note-item>
            <div class="admin-item-head">
              <strong>笔记 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('notes', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(note.title || '')}"></div>
              <div class="admin-field"><label>分类</label><input data-role="category" class="admin-input" value="${escapeHtml(note.category || '')}"></div>
              <div class="admin-field"><label>更新时间</label><input data-role="updatedAt" class="admin-input" value="${escapeHtml(note.updatedAt || '')}"></div>
              <div class="admin-field"><label>标签（逗号分隔）</label><input data-role="tags" class="admin-input" value="${escapeHtml((note.tags || []).join(', '))}"></div>
              <div class="admin-field"><label>资源地址</label><input id="note-file-${index}" data-role="fileUrl" class="admin-input" value="${escapeHtml(note.fileUrl || '')}"></div>
              <div class="admin-field"><label>封面图地址</label><input id="note-cover-${index}" data-role="cover" class="admin-input" value="${escapeHtml(note.cover || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>摘要</label><textarea data-role="summary" class="admin-textarea">${escapeHtml(note.summary || '')}</textarea></div>
            </div>
            <div class="admin-actions" style="margin-top:12px;">
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('note-file-${index}', '.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip,image/*')">上传资源</button>
              <button type="button" class="mini-btn" onclick="chooseStudioAsset('note-cover-${index}', 'image/*')">上传封面</button>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Reflections</div>
          <h3>成长感悟管理</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('reflections')">新增感悟</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.reflections || []).map((item, index) => `
          <div class="admin-repeater-item" data-reflection-item>
            <div class="admin-item-head">
              <strong>感悟 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('reflections', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>标题</label><input data-role="title" class="admin-input" value="${escapeHtml(item.title || '')}"></div>
              <div class="admin-field"><label>时间</label><input data-role="date" class="admin-input" value="${escapeHtml(item.date || '')}"></div>
              <div class="admin-field"><label>标签（逗号分隔）</label><input data-role="tags" class="admin-input" value="${escapeHtml((item.tags || []).join(', '))}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>内容摘要</label><textarea data-role="excerpt" class="admin-textarea">${escapeHtml(item.excerpt || '')}</textarea></div>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-item-head">
        <div>
          <div class="section-kicker">Timeline</div>
          <h3>成长时间轴管理</h3>
        </div>
        <div class="admin-actions">
          <button type="button" class="mini-btn" onclick="addStudioItem('timeline')">新增节点</button>
        </div>
      </div>
      <div class="admin-stack">
        ${(editorDraft.timeline || []).map((item, index) => `
          <div class="admin-repeater-item" data-timeline-item>
            <div class="admin-item-head">
              <strong>节点 ${index + 1}</strong>
              <button type="button" class="danger-btn" onclick="removeStudioItem('timeline', ${index})">删除</button>
            </div>
            <div class="admin-grid">
              <div class="admin-field"><label>年份 / 阶段</label><input data-role="year" class="admin-input" value="${escapeHtml(item.year || '')}"></div>
              <div class="admin-field"><label>标题</label><input data-role="label" class="admin-input" value="${escapeHtml(item.label || '')}"></div>
              <div class="admin-field admin-grid--single" style="grid-column:1 / -1;"><label>说明</label><textarea data-role="desc" class="admin-textarea">${escapeHtml(item.desc || '')}</textarea></div>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

function addStudioItem(type) {
  editorDraft = syncStudioDraftFromDom();
  if (type === 'articles') editorDraft.articles = [...(editorDraft.articles || []), createEmptyArticle()];
  if (type === 'projects') editorDraft.projects = [...(editorDraft.projects || []), createEmptyProject()];
  if (type === 'skillGroups') editorDraft.skillGroups = [...(editorDraft.skillGroups || []), createEmptySkillGroup()];
  if (type === 'notes') editorDraft.notes = [...(editorDraft.notes || []), createEmptyNote()];
  if (type === 'reflections') editorDraft.reflections = [...(editorDraft.reflections || []), createEmptyReflection()];
  if (type === 'timeline') editorDraft.timeline = [...(editorDraft.timeline || []), createEmptyTimeline()];
  renderAdminStudio();
  refreshMotion(document.getElementById('adminStudioSection'));
}

function removeStudioItem(type, index) {
  editorDraft = syncStudioDraftFromDom();
  if (!Array.isArray(editorDraft[type])) return;
  editorDraft[type] = editorDraft[type].filter((_, itemIndex) => itemIndex !== index);
  renderAdminStudio();
  refreshMotion(document.getElementById('adminStudioSection'));
}

function chooseStudioAsset(targetFieldId, accept) {
  if (!isAdminUser()) {
    showToast('请先登录管理员账号');
    return;
  }
  const input = document.getElementById('assetUploadInput');
  if (!input) return;
  uploadTargetFieldId = targetFieldId;
  input.value = '';
  input.accept = accept || '*/*';
  input.click();
}

function openAdminStudio() {
  if (!isAdminUser()) {
    showToast('请先在论坛登录管理员账号，再进入内容管理。');
    return;
  }
  toggleMobileMenu(false);
  const section = document.getElementById('adminStudioSection');
  if (!section) return;
  section.dataset.open = '1';
  renderAdminStudio();
  openBlogRoute('studio');
}

function renderPublicSections() {
  renderHero();
  renderHubCards();
  renderArticles();
  renderProjects();
  renderSkills();
  renderNotes();
  renderLearning();
  renderReflections();
  renderTimeline();
  renderAdminStudio();
  syncBlogRoute({ scroll: false, instant: true });
  refreshMotion(document);
}

async function handleStudioAssetUpload(event) {
  if (!isAdminUser()) return;
  const file = event?.target?.files?.[0];
  if (!file || !uploadTargetFieldId) return;
  try {
    const res = await uploadAssetFile(currentUser.id, file);
    const target = document.getElementById(uploadTargetFieldId);
    if (target) {
      target.value = res.data?.url || '';
    }
    showToast('资源已上传');
  } catch (error) {
    showToast(error.message || '上传失败');
  } finally {
    uploadTargetFieldId = '';
    event.target.value = '';
  }
}

async function saveBlogStudio() {
  if (!isAdminUser()) {
    showToast('请先登录管理员账号');
    return;
  }
  try {
    editorDraft = syncStudioDraftFromDom();
    const res = await formPost('adminSavePersonalBlog.php', {
      adminUserId: currentUser.id,
      payload: JSON.stringify(editorDraft),
    });
    blogData = cloneData(res.data || {});
    editorDraft = cloneData(blogData);
    renderPublicSections();
    showToast('个人博客已保存');
  } catch (error) {
    showToast(error.message || '保存失败');
  }
}

function reloadBlogStudio() {
  editorDraft = cloneData(blogData);
  renderAdminStudio();
  showToast('已重新载入当前博客内容');
}

async function initPage() {
  initCurrentUser();
  setMobileMenuState(false);

  if (!routeEventsBound) {
    window.addEventListener('hashchange', () => syncBlogRoute());
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        toggleMobileMenu(false);
      }
    });
    routeEventsBound = true;
  }

  const noteSearchInput = document.getElementById('noteSearchInput');
  if (noteSearchInput && !noteSearchInput.dataset.bound) {
    noteSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyNoteSearch();
      }
    });
    noteSearchInput.dataset.bound = '1';
  }

  const requestedRoute = normalizeBlogRoute();
  if (requestedRoute === 'studio' && isAdminUser()) {
    const section = document.getElementById('adminStudioSection');
    if (section) section.dataset.open = '1';
  }

  try {
    const res = await getJson('getPersonalBlog.php');
    blogData = cloneData(res.data || {});
    editorDraft = cloneData(blogData);
    renderPublicSections();
  } catch (error) {
    showToast(error.message || '博客加载失败');
  }
}

window.toggleArticle = toggleArticle;
window.openBlogRoute = openBlogRoute;
window.toggleMobileMenu = toggleMobileMenu;
