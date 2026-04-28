const LEARNING_TRACK_STORAGE_PREFIX = 'campus_forum_learning_track_v1';

const LEARNING_STATUS_META = {
  todo: { label: '未开始', className: 'is-todo' },
  doing: { label: '进行中', className: 'is-doing' },
  done: { label: '已完成', className: 'is-done' },
};

const LEARNING_PLAYBOOK = {
  durationDays: 90,
  orientation: '开发者路线为主，产品实验为辅',
  weeklyRhythm: [
    { label: '周一到周五', value: '2 小时学习 + 1 小时实操 + 30 分钟记录' },
    { label: '周六', value: '把本周内容整合成一个小项目，补 README 并推到 GitHub' },
    { label: '周日', value: '复盘、修 bug、补短板，并写清楚下周计划' },
  ],
  principles: [
    '每天都要有可见输出，不要连续多天只看教程不写代码。',
    '先把 Solidity、钱包交互、交易生命周期打扎实，再把 Agent 接上去。',
    '每完成一个阶段，就沉淀成 GitHub 仓库、README、截图和演示记录。',
  ],
  projects: [
    {
      title: 'AI 链上任务助手',
      tag: '优先推荐',
      desc: '用户输入自然语言后，由 Agent 帮忙创建、查询和更新链上任务，价值清楚、演示链路完整。',
    },
    {
      title: 'AI 钱包助理',
      tag: '偏产品',
      desc: '帮助用户解释交易、查询资产和执行简单链上操作，适合做交互型演示。',
    },
    {
      title: 'AI 驱动的积分 DApp',
      tag: '偏运营',
      desc: '用户完成任务后发放积分，适合把 Agent、规则和链上奖励组合在一起。',
    },
  ],
  phases: [
    {
      id: 'phase-1',
      label: '阶段一',
      range: 'Day 1 - 30',
      title: 'Web3 基础与安全',
      goal: '目标是能写、测、部署一个简单合约，并知道常见安全坑。',
      meter: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
      weeks: [
        {
          id: 'week1',
          week: 1,
          label: '第1周',
          title: '环境与钱包准备',
          focus: '先把开发环境、测试网钱包和 GitHub 基础设施全部打通。',
          tasks: [
            '安装 Node.js、Git、VS Code、Foundry',
            '安装 MetaMask 并准备测试网钱包',
            '创建 GitHub 仓库并整理目录结构',
            '确认本地命令行可以跑通 Foundry 初始化',
          ],
          outputs: ['本地开发环境可运行', '测试网钱包已联通'],
        },
        {
          id: 'week2',
          week: 2,
          label: '第2周',
          title: 'Solidity 核心能力',
          focus: '只学最常用的 20%，先把合约结构和基本语法摸熟。',
          tasks: [
            '写第一个 Solidity 合约，理解状态变量和函数',
            '练习 mapping、modifier、event、require、constructor',
            '完成一个 TodoList、记账或白名单合约',
            '给本周代码补注释并整理 README',
          ],
          outputs: ['基础合约仓库雏形', '至少 1 个可运行合约'],
        },
        {
          id: 'week3',
          week: 3,
          label: '第3周',
          title: 'EVM 与安全基础',
          focus: '理解链上执行细节，开始具备最基本的安全意识。',
          tasks: [
            '理解 msg.sender、gas、storage / memory / calldata',
            '学习重入、权限控制、整数溢出、随机数误区',
            '阅读至少 2 个真实漏洞案例',
            '对自己的合约做一次安全自查清单',
          ],
          outputs: ['安全检查清单', '常见风险知识卡'],
        },
        {
          id: 'week4',
          week: 4,
          label: '第4周',
          title: 'Foundry 测试与部署',
          focus: '把测试、部署、浏览器核验整成一个完整闭环。',
          tasks: [
            '使用 Foundry 为合约补齐单元测试',
            '完成本地部署脚本并跑通',
            '部署到测试网并记录合约地址',
            '在区块浏览器核对交易和调用结果',
          ],
          outputs: ['完整的简单 DApp 合约仓库', '测试网部署记录'],
        },
      ],
    },
    {
      id: 'phase-2',
      label: '阶段二',
      range: 'Day 31 - 60',
      title: 'AI Agent 与链上集成',
      goal: '目标是让 AI 能理解任务，并触发链上动作或读取链上状态。',
      meter: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
      weeks: [
        {
          id: 'week5',
          week: 5,
          label: '第5周',
          title: '最小 Agent 原型',
          focus: '先学最小闭环，不追求框架数量，优先理解输入输出。',
          tasks: [
            '理解 LLM 调用、Prompt 结构和工具调用基础',
            '画出 Agent 输入、意图识别和函数调用流程',
            '实现一个最小 Agent：一句话识别一个动作',
            '列出准备接入链上能力的工具清单',
          ],
          outputs: ['最小 Agent 原型', '输入输出流程图'],
        },
        {
          id: 'week6',
          week: 6,
          label: '第6周',
          title: '钱包与链上交互',
          focus: '打通 AI、钱包、合约调用之间的第一条链路。',
          tasks: [
            '掌握 ethers.js 或 viem 的基础调用',
            '完成钱包连接、读取链上状态、发送交易',
            '实现自然语言到测试网交易的最小链路',
            '补充交易状态处理和错误提示',
          ],
          outputs: ['AI + Wallet + Onchain 最小 Demo', '交易状态说明'],
        },
        {
          id: 'week7',
          week: 7,
          label: '第7周',
          title: 'Agent 工具层封装',
          focus: '把能力整理成明确工具，项目会更像真正产品而不是临时演示。',
          tasks: [
            '封装查询余额、查询链上状态、调用合约方法',
            '增加签名前参数校验和交易解释',
            '把工具层整理成可复用模块',
            '补充调用链路文档和示例输入',
          ],
          outputs: ['Agent 工具层模块', '工具调用说明'],
        },
        {
          id: 'week8',
          week: 8,
          label: '第8周',
          title: '演示打磨与外部能力理解',
          focus: '能探索去中心化算力就探索，没时间就优先把 Demo 打磨到可展示。',
          tasks: [
            '理解去中心化算力或外部服务的接入场景',
            '根据时间选择探索一个服务或继续打磨 Demo',
            '优化页面交互和演示脚本',
            '保证 Demo 可以稳定跑通完整链路',
          ],
          outputs: ['可展示的 AI Agent Onchain Demo', '稳定演示脚本'],
        },
      ],
    },
    {
      id: 'phase-3',
      label: '阶段三',
      range: 'Day 61 - 90',
      title: '项目实战与公开输出',
      goal: '目标是做出可展示的正式项目，并有社区和 GitHub 输出。',
      meter: 'linear-gradient(90deg, #fb923c, #f97316)',
      weeks: [
        {
          id: 'week9',
          week: 9,
          label: '第9周',
          title: '正式项目定题',
          focus: '从候选方向里选一个正式项目，并把模块和边界先画清楚。',
          tasks: [
            '在三个候选项目中确定一个正式方向',
            '画页面结构、模块边界和数据流',
            '梳理前端、Agent、合约、数据库职责',
            '控制第一版 MVP 范围，不做过重功能',
          ],
          outputs: ['正式项目技术方案', 'MVP 范围文档'],
        },
        {
          id: 'week10',
          week: 10,
          label: '第10周',
          title: 'MVP 主体实现',
          focus: '闭环优先，先跑通，不追求一开始就做复杂炫技。',
          tasks: [
            '完成首页、钱包连接、输入框和响应区域',
            '打通 1 到 2 个链上动作',
            '实现交易记录页或操作历史区域',
            '保证主流程可运行并可演示',
          ],
          outputs: ['MVP 主功能', '完整主流程演示'],
        },
        {
          id: 'week11',
          week: 11,
          label: '第11周',
          title: 'GitHub 与文档整理',
          focus: '项目讲清楚和把项目做出来一样重要，尤其对答辩和作品集很关键。',
          tasks: [
            '补 README、技术栈说明和部署说明',
            '整理架构图、页面截图和演示素材',
            '记录 Roadmap 和版本演进',
            '检查仓库结构是否适合别人快速理解',
          ],
          outputs: ['作品集级文档', '可展示 GitHub 仓库'],
        },
        {
          id: 'week12',
          week: 12,
          label: '第12周',
          title: '社区贡献与对外展示',
          focus: '开始进入圈子，让别人看见你的成果，不再只是本地自学。',
          tasks: [
            '加入 2 到 3 个开发者社区并持续观察',
            '主动和至少 5 位开发者建立连接',
            '给一个开源仓库提交一次 PR 或问题反馈',
            '关注 bounty、hackathon 或可参与的 issue',
          ],
          outputs: ['社区参与记录', '第一份外部贡献记录'],
        },
      ],
    },
  ],
};

const LEARNING_WEEKS = LEARNING_PLAYBOOK.phases.flatMap((phase) => phase.weeks.map((week) => ({
  ...week,
  phaseId: phase.id,
  phaseLabel: phase.label,
  phaseTitle: phase.title,
  phaseRange: phase.range,
  phaseGoal: phase.goal,
  phaseMeter: phase.meter,
})));

const LEARNING_TASKS = LEARNING_WEEKS.flatMap((week) => week.tasks.map((text, index) => ({
  id: `${week.id}-task-${index + 1}`,
  text,
  index: index + 1,
  weekId: week.id,
  weekLabel: week.label,
  weekTitle: week.title,
  phaseId: week.phaseId,
  phaseLabel: week.phaseLabel,
})));

const LEARNING_TASK_MAP = LEARNING_TASKS.reduce((acc, task) => {
  acc[task.id] = task;
  return acc;
}, {});

const LEARNING_MILESTONES = [
  {
    id: 'milestone-1',
    title: 'Solidity 基础仓库',
    desc: '至少包含基础合约、README 和清晰的目录结构。',
    weekIds: ['week1', 'week2'],
  },
  {
    id: 'milestone-2',
    title: '测试网部署记录',
    desc: '完成测试、部署脚本、测试网地址与浏览器核验截图。',
    weekIds: ['week3', 'week4'],
  },
  {
    id: 'milestone-3',
    title: 'AI Agent 链上 Demo',
    desc: '完成自然语言到链上动作的最小演示闭环。',
    weekIds: ['week5', 'week6', 'week7', 'week8'],
  },
  {
    id: 'milestone-4',
    title: '完整 MVP 项目',
    desc: '完成正式项目的 MVP、主要页面、链上动作与演示说明。',
    weekIds: ['week9', 'week10', 'week11'],
  },
  {
    id: 'milestone-5',
    title: '社区贡献与曝光记录',
    desc: '完成至少一次对外贡献或社区参与记录，让项目被别人看见。',
    weekIds: ['week12'],
  },
];

let learningCoachState = null;
let learningCoachStateKey = '';

function learningStorageKey() {
  return `${LEARNING_TRACK_STORAGE_PREFIX}:${currentUser && currentUser.id ? currentUser.id : 'guest'}`;
}

function todayDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 10);
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createDefaultLearningState() {
  return {
    startDate: todayDateValue(),
    selectedWeekId: LEARNING_WEEKS[0].id,
    notes: {},
    taskStates: {},
    lastUpdated: '',
  };
}

function normalizeTaskRecord(record) {
  if (record && typeof record === 'object') {
    const status = record.status === 'doing' || record.status === 'done' ? record.status : 'todo';
    return {
      status,
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    };
  }
  if (record === 'doing' || record === 'done') {
    return { status: record, updatedAt: '' };
  }
  return { status: 'todo', updatedAt: '' };
}

function normalizeLearningState(raw = {}) {
  const defaults = createDefaultLearningState();
  const state = {
    ...defaults,
    notes: {},
    taskStates: {},
  };

  if (typeof raw.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate)) {
    state.startDate = raw.startDate;
  }

  if (typeof raw.selectedWeekId === 'string' && LEARNING_WEEKS.some((week) => week.id === raw.selectedWeekId)) {
    state.selectedWeekId = raw.selectedWeekId;
  }

  if (raw.notes && typeof raw.notes === 'object') {
    Object.keys(raw.notes).forEach((weekId) => {
      if (LEARNING_WEEKS.some((week) => week.id === weekId)) {
        state.notes[weekId] = String(raw.notes[weekId] || '').slice(0, 4000);
      }
    });
  }

  if (raw.taskStates && typeof raw.taskStates === 'object') {
    LEARNING_TASKS.forEach((task) => {
      const record = raw.taskStates[task.id];
      if (record !== undefined) {
        state.taskStates[task.id] = normalizeTaskRecord(record);
      }
    });
  }

  if (typeof raw.lastUpdated === 'string') {
    state.lastUpdated = raw.lastUpdated;
  }

  return state;
}

function loadLearningCoachState(force = false) {
  const key = learningStorageKey();
  if (!force && learningCoachState && learningCoachStateKey === key) {
    return learningCoachState;
  }

  let parsed = createDefaultLearningState();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      parsed = normalizeLearningState(JSON.parse(raw));
    }
  } catch {
    parsed = createDefaultLearningState();
  }

  learningCoachState = parsed;
  learningCoachStateKey = key;
  return learningCoachState;
}

function saveLearningCoachState() {
  if (!learningCoachState) return;
  learningCoachState.lastUpdated = new Date().toISOString();
  learningCoachStateKey = learningStorageKey();
  localStorage.setItem(learningCoachStateKey, JSON.stringify(learningCoachState));
}

function getLearningStatusMeta(status) {
  return LEARNING_STATUS_META[status] || LEARNING_STATUS_META.todo;
}

function getTaskStatus(taskId, state = loadLearningCoachState()) {
  return normalizeTaskRecord(state.taskStates[taskId]).status;
}

function getTaskRecord(taskId, state = loadLearningCoachState()) {
  return normalizeTaskRecord(state.taskStates[taskId]);
}

function getWeekById(weekId) {
  return LEARNING_WEEKS.find((week) => week.id === weekId) || LEARNING_WEEKS[0];
}

function getSelectedLearningWeek(state = loadLearningCoachState()) {
  if (state.selectedWeekId) {
    return getWeekById(state.selectedWeekId);
  }
  return getSuggestedLearningWeek(state);
}

function getWeekTasks(week) {
  return LEARNING_TASKS.filter((task) => task.weekId === week.id);
}

function getWeekStats(week, state = loadLearningCoachState()) {
  const tasks = getWeekTasks(week);
  const total = tasks.length;
  const done = tasks.filter((task) => getTaskStatus(task.id, state) === 'done').length;
  const doing = tasks.filter((task) => getTaskStatus(task.id, state) === 'doing').length;
  const todo = total - done - doing;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, doing, todo, percent };
}

function getPhaseStats(phase, state = loadLearningCoachState()) {
  const weeks = LEARNING_WEEKS.filter((week) => week.phaseId === phase.id);
  const stats = weeks.map((week) => getWeekStats(week, state));
  const total = stats.reduce((sum, item) => sum + item.total, 0);
  const done = stats.reduce((sum, item) => sum + item.done, 0);
  const doing = stats.reduce((sum, item) => sum + item.doing, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return {
    total,
    done,
    doing,
    percent,
    status: done === total ? 'done' : (done > 0 || doing > 0 ? 'doing' : 'todo'),
  };
}

function getOverallTaskStats(state = loadLearningCoachState()) {
  const total = LEARNING_TASKS.length;
  const done = LEARNING_TASKS.filter((task) => getTaskStatus(task.id, state) === 'done').length;
  const doing = LEARNING_TASKS.filter((task) => getTaskStatus(task.id, state) === 'doing').length;
  const todo = total - done - doing;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, doing, todo, percent };
}

function getCompletedWeeksCount(state = loadLearningCoachState()) {
  return LEARNING_WEEKS.filter((week) => {
    const stats = getWeekStats(week, state);
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

function getExpectedWeekIndex(state = loadLearningCoachState()) {
  const days = clampNumber(getElapsedDays(state.startDate), 1, LEARNING_PLAYBOOK.durationDays);
  return clampNumber(Math.ceil(days / 7), 1, LEARNING_WEEKS.length);
}

function getSuggestedLearningWeek(state = loadLearningCoachState()) {
  const doingWeek = LEARNING_WEEKS.find((week) => getWeekStats(week, state).doing > 0);
  if (doingWeek) return doingWeek;
  return LEARNING_WEEKS.find((week) => {
    const stats = getWeekStats(week, state);
    return stats.done < stats.total;
  }) || LEARNING_WEEKS[LEARNING_WEEKS.length - 1];
}

function getNextAction(state = loadLearningCoachState(), preferredWeek = null) {
  const primaryWeek = preferredWeek || getSelectedLearningWeek(state) || getSuggestedLearningWeek(state);
  const weeksToSearch = [primaryWeek, ...LEARNING_WEEKS.filter((week) => week.id !== primaryWeek.id)];

  for (const week of weeksToSearch) {
    const tasks = getWeekTasks(week);
    const doingTask = tasks.find((task) => getTaskStatus(task.id, state) === 'doing');
    if (doingTask) return { week, task: doingTask };
    const nextTodo = tasks.find((task) => getTaskStatus(task.id, state) !== 'done');
    if (nextTodo) return { week, task: nextTodo };
  }

  return { week: primaryWeek, task: null };
}

function getRecentTasksByStatus(status, limit = 6, state = loadLearningCoachState()) {
  return LEARNING_TASKS
    .map((task) => ({
      ...task,
      record: getTaskRecord(task.id, state),
    }))
    .filter((task) => task.record.status === status)
    .sort((a, b) => {
      const at = new Date(a.record.updatedAt || 0).getTime();
      const bt = new Date(b.record.updatedAt || 0).getTime();
      return bt - at;
    })
    .slice(0, limit);
}

function getMilestoneProgress(milestone, state = loadLearningCoachState()) {
  const weeks = milestone.weekIds.map((weekId) => getWeekById(weekId));
  const tasks = weeks.flatMap((week) => getWeekTasks(week));
  const total = tasks.length;
  const done = tasks.filter((task) => getTaskStatus(task.id, state) === 'done').length;
  const doing = tasks.filter((task) => getTaskStatus(task.id, state) === 'doing').length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return {
    total,
    done,
    doing,
    percent,
    status: done === total ? 'done' : (done > 0 || doing > 0 ? 'doing' : 'todo'),
  };
}

function getNextMilestone(state = loadLearningCoachState()) {
  return LEARNING_MILESTONES.find((milestone) => getMilestoneProgress(milestone, state).status !== 'done') || null;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return '未设置';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function getPaceMessage(state = loadLearningCoachState()) {
  const expectedWeekIndex = getExpectedWeekIndex(state);
  const expectedWeek = LEARNING_WEEKS[expectedWeekIndex - 1];
  const completedWeeks = getCompletedWeeksCount(state);

  if (completedWeeks >= LEARNING_WEEKS.length) {
    return '主线 12 周已经全部完成，接下来重点放在复盘、答辩和项目打磨。';
  }
  if (completedWeeks + 1 < expectedWeekIndex) {
    return `当前节奏稍慢，建议优先补齐 ${LEARNING_WEEKS[completedWeeks].label}。`;
  }
  if (completedWeeks >= expectedWeekIndex) {
    return '当前节奏不错，可以继续推进下一周内容。';
  }
  return `当前应推进到 ${expectedWeek.label}，完成这一周后节奏会更稳。`;
}

function selectLearningWeek(weekId) {
  const state = loadLearningCoachState();
  state.selectedWeekId = getWeekById(weekId).id;
  saveLearningCoachState();
  renderLearningCoachPage();
}

function setLearningTaskStatus(taskId, status) {
  const state = loadLearningCoachState();
  state.taskStates[taskId] = {
    status,
    updatedAt: new Date().toISOString(),
  };
  saveLearningCoachState();
  renderLearningCoachPage();
}

function cycleLearningTask(taskId) {
  const current = getTaskStatus(taskId, loadLearningCoachState());
  const next = current === 'todo' ? 'doing' : (current === 'doing' ? 'done' : 'todo');
  setLearningTaskStatus(taskId, next);
}

function setLearningStartDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return;
  const state = loadLearningCoachState();
  state.startDate = value;
  saveLearningCoachState();
  renderLearningCoachPage();
}

function resetLearningStartDate() {
  setLearningStartDate(todayDateValue());
  showToast('已把计划起点调整到今天');
}

function updateLearningWeekNote(value) {
  const state = loadLearningCoachState();
  const selectedWeek = getSelectedLearningWeek(state);
  state.notes[selectedWeek.id] = String(value || '').slice(0, 4000);
  saveLearningCoachState();
}

function focusLearningSuggestedWeek() {
  const state = loadLearningCoachState();
  const suggestedWeek = getSuggestedLearningWeek(state);
  state.selectedWeekId = suggestedWeek.id;
  saveLearningCoachState();
  renderLearningCoachPage();
  showToast(`已定位到 ${suggestedWeek.label}`);
}

function buildLearningSummaryCards(state, suggestedWeek) {
  const overall = getOverallTaskStats(state);
  const completedWeeks = getCompletedWeeksCount(state);
  const expectedWeekIndex = getExpectedWeekIndex(state);
  const cards = [
    { label: '已完成任务', value: overall.done, hint: '累计勾选完成的学习动作' },
    { label: '进行中', value: overall.doing, hint: `当前重点聚焦在 ${suggestedWeek.label}` },
    { label: '完成率', value: overall.percent, suffix: '%', hint: `总共 ${overall.total} 项主线任务` },
    { label: '已完成周数', value: completedWeeks, hint: `当前建议推进到第 ${expectedWeekIndex} 周` },
  ];

  return cards.map((item, index) => `
    <article class="dashboard-summary-card learning-summary-card learning-summary-card--${index + 1}" data-reveal="up" style="--reveal-delay:${index * 70}ms">
      <span>${escapeHtml(item.label)}</span>
      <strong data-count-to="${Number(item.value || 0)}" data-count-suffix="${escapeHtml(item.suffix || '')}">0${escapeHtml(item.suffix || '')}</strong>
      <p>${escapeHtml(item.hint)}</p>
    </article>
  `).join('');
}

function renderLearningControlCard(state) {
  const controlCard = document.getElementById('learningControlCard');
  if (!controlCard) return;

  const phaseHtml = LEARNING_PLAYBOOK.phases.map((phase, index) => {
    const stats = getPhaseStats(phase, state);
    const statusMeta = getLearningStatusMeta(stats.status);
    return `
      <div class="learning-phase-item" data-reveal="up" style="--reveal-delay:${index * 70}ms">
        <div class="learning-phase-head">
          <div>
            <span>${escapeHtml(`${phase.label} · ${phase.range}`)}</span>
            <strong>${escapeHtml(phase.title)}</strong>
          </div>
          <span class="learning-status-tag ${statusMeta.className}">${stats.percent}%</span>
        </div>
        <p>${escapeHtml(phase.goal)}</p>
        <div class="learning-phase-track">
          <i style="--bar-scale:${Math.max(0.06, stats.percent / 100)}; --meter-color:${phase.meter}"></i>
        </div>
      </div>
    `;
  }).join('');

  const rhythmHtml = LEARNING_PLAYBOOK.weeklyRhythm.map((item, index) => `
    <div class="learning-rhythm-item" data-reveal="up" style="--reveal-delay:${index * 70 + 40}ms">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join('');

  controlCard.innerHTML = `
    <div class="dashboard-card-head">
      <div>
        <p class="section-eyebrow">学习设置</p>
        <h3>我的节奏与阶段</h3>
      </div>
      <p>开始日期会帮你推算当前应该学到第几周，阶段进度和学习笔记会自动保存。</p>
    </div>
    <div class="learning-control-grid">
      <div>
        <label class="field-label" for="learningStartDate">计划开始日期</label>
        <div class="learning-start-row">
          <input type="date" id="learningStartDate" class="learning-date-input" value="${escapeHtml(state.startDate)}" onchange="setLearningStartDate(this.value)">
          <button type="button" class="profile-secondary-btn" onclick="resetLearningStartDate()">从今天开始</button>
        </div>
        <p class="learning-inline-tip">${escapeHtml(getPaceMessage(state))}</p>
      </div>
      <div class="learning-phase-stack">
        ${phaseHtml}
      </div>
      <div class="learning-rhythm-list">
        ${rhythmHtml}
      </div>
    </div>
  `;
}

function renderLearningNextCard(state, selectedWeek, suggestedWeek) {
  const nextCard = document.getElementById('learningNextCard');
  if (!nextCard) return;

  const nextAction = getNextAction(state, selectedWeek);
  const nextMilestone = getNextMilestone(state);
  const elapsedDays = clampNumber(getElapsedDays(state.startDate), 1, LEARNING_PLAYBOOK.durationDays);

  const principleHtml = LEARNING_PLAYBOOK.principles.map((item, index) => `
    <div class="learning-rhythm-item" data-reveal="up" style="--reveal-delay:${index * 70 + 60}ms">
      <span>学习原则</span>
      <strong>${escapeHtml(item)}</strong>
    </div>
  `).join('');

  const nextActionHtml = nextAction.task
    ? `
      <div class="learning-next-focus" data-reveal="up">
        <span class="learning-focus-pill">下一步建议</span>
        <h3>${escapeHtml(nextAction.task.text)}</h3>
        <p>优先完成 ${escapeHtml(`${nextAction.week.label}《${nextAction.week.title}》`)} 里的这一步，完成后整个学习主线会更顺。</p>
        <div class="learning-next-meta">
          <span class="learning-next-chip">${escapeHtml(nextAction.week.phaseTitle)}</span>
          <span class="learning-next-chip">当前第 ${elapsedDays} 天</span>
          <span class="learning-next-chip">${escapeHtml(nextMilestone ? `下个里程碑：${nextMilestone.title}` : '里程碑已全部完成')}</span>
        </div>
        <div class="profile-account-actions">
          <button type="button" class="profile-primary-btn" onclick="selectLearningWeek('${nextAction.week.id}')">打开这一周</button>
          <button type="button" class="profile-secondary-btn" onclick="cycleLearningTask('${nextAction.task.id}')">标记进度</button>
        </div>
      </div>
    `
    : `
      <div class="learning-next-focus" data-reveal="up">
        <span class="learning-focus-pill">主线已完成</span>
        <h3>开始整理答辩和作品输出</h3>
        <p>12 周主线任务已经全部完成，接下来建议重点做复盘、讲解稿、演示视频和 GitHub 项目打磨。</p>
        <div class="learning-next-meta">
          <span class="learning-next-chip">建议开始项目复盘</span>
          <span class="learning-next-chip">整理答辩材料</span>
          <span class="learning-next-chip">优化仓库展示</span>
        </div>
      </div>
    `;

  nextCard.innerHTML = `
    <div class="dashboard-card-head">
      <div>
        <p class="section-eyebrow">当前定位</p>
        <h3>学到哪了</h3>
      </div>
      <p>系统会优先根据“进行中”和“尚未完成”的任务，自动判断你此刻最该继续推进哪一步。</p>
    </div>
    <div class="learning-side-stack">
      ${nextActionHtml}
      <div class="learning-rhythm-list">
        ${principleHtml}
      </div>
    </div>
  `;
}

function buildWeekTabHtml(week, state, isActive, index) {
  const stats = getWeekStats(week, state);
  return `
    <button type="button" class="learning-week-tab${isActive ? ' active' : ''}" onclick="selectLearningWeek('${week.id}')" data-reveal="up" style="--reveal-delay:${Math.min(index * 50, 360)}ms">
      <small>${escapeHtml(week.label)}</small>
      <strong>${escapeHtml(week.title)}</strong>
      <small>${stats.done}/${stats.total} 已完成</small>
    </button>
  `;
}

function renderLearningRoadmapCard(state, selectedWeek, suggestedWeek) {
  const roadmapCard = document.getElementById('learningRoadmapCard');
  if (!roadmapCard) return;

  const selectedStats = getWeekStats(selectedWeek, state);
  const noteValue = state.notes[selectedWeek.id] || '';
  const taskHtml = getWeekTasks(selectedWeek).map((task, index) => {
    const status = getTaskStatus(task.id, state);
    const statusMeta = getLearningStatusMeta(status);
    return `
      <div class="learning-task-item" data-reveal="up" style="--reveal-delay:${index * 70}ms">
        <div class="learning-task-main">
          <span class="learning-task-index">${String(index + 1).padStart(2, '0')}</span>
          <div class="learning-task-copy">
            <strong>${escapeHtml(task.text)}</strong>
            <p>${escapeHtml(`${selectedWeek.label} · ${selectedWeek.phaseTitle}`)}</p>
          </div>
        </div>
        <button type="button" class="learning-task-btn ${statusMeta.className}" onclick="cycleLearningTask('${task.id}')">${statusMeta.label}</button>
      </div>
    `;
  }).join('');

  const weekTabs = LEARNING_WEEKS.map((week, index) => buildWeekTabHtml(week, state, week.id === selectedWeek.id, index)).join('');
  const selectedNote = selectedWeek.id === suggestedWeek.id ? '当前推荐周' : '手动查看周';

  roadmapCard.innerHTML = `
    <div class="dashboard-card-head">
      <div>
        <p class="section-eyebrow">学习路线</p>
        <h3>路线图与每周任务</h3>
      </div>
      <p>每周任务点击即可在“未开始 / 进行中 / 已完成”之间切换，下面的学习记录会自动保存。</p>
    </div>
    <div class="learning-week-tabs">
      ${weekTabs}
    </div>
    <div class="learning-roadmap-meta">
      <div class="learning-roadmap-stat" data-reveal="up">
        <span>本周总任务</span>
        <strong data-count-to="${selectedStats.total}">0</strong>
        <p>${escapeHtml(selectedWeek.focus)}</p>
      </div>
      <div class="learning-roadmap-stat" data-reveal="up" style="--reveal-delay:70ms">
        <span>本周已完成</span>
        <strong data-count-to="${selectedStats.done}">0</strong>
        <p>建议先把本周任务做完整，再继续往后推。</p>
      </div>
      <div class="learning-roadmap-stat" data-reveal="up" style="--reveal-delay:140ms">
        <span>本周完成率</span>
        <strong data-count-to="${selectedStats.percent}" data-count-suffix="%">0%</strong>
        <p>${escapeHtml(selectedNote)}</p>
      </div>
    </div>
    <div class="learning-week-shell">
      <div class="learning-week-header">
        <div>
          <h3>${escapeHtml(`${selectedWeek.label} · ${selectedWeek.title}`)}</h3>
          <p>${escapeHtml(selectedWeek.focus)}</p>
        </div>
        <div class="learning-week-pills">
          <span class="learning-week-pill">${escapeHtml(selectedWeek.phaseLabel)}</span>
          <span class="learning-week-pill">${escapeHtml(selectedWeek.phaseRange)}</span>
          <span class="learning-week-pill">${escapeHtml(selectedWeek.phaseTitle)}</span>
        </div>
      </div>
      <div class="learning-task-list">
        ${taskHtml}
      </div>
      <div class="learning-output-block" data-reveal="up">
        <label class="field-label">本周应该拿到的输出</label>
        <div class="learning-output-list">
          ${selectedWeek.outputs.map((item) => `<span class="learning-output-chip">${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>
      <div data-reveal="up">
        <label class="field-label" for="learningWeekNote">这一周的学习记录</label>
        <textarea id="learningWeekNote" class="learning-note-textarea" placeholder="这里可以记录：今天学到哪了、卡住的地方、下一步准备做什么。" oninput="updateLearningWeekNote(this.value)">${escapeHtml(noteValue)}</textarea>
        <p class="learning-note-foot">支持随时记录“我已经学过了什么”和“我接下来要补哪一块”。</p>
      </div>
    </div>
  `;
}

function renderLearningHistoryCard(state) {
  const historyCard = document.getElementById('learningHistoryCard');
  if (!historyCard) return;

  const doneTasks = getRecentTasksByStatus('done', 6, state);
  const doingTasks = getRecentTasksByStatus('doing', 4, state);

  const doneHtml = doneTasks.length
    ? doneTasks.map((task, index) => `
      <div class="learning-history-item" data-reveal="up" style="--reveal-delay:${index * 70}ms">
        <div class="learning-history-head">
          <div>
            <span>${escapeHtml(`${task.weekLabel} · ${task.weekTitle}`)}</span>
            <strong>${escapeHtml(task.text)}</strong>
          </div>
          <span class="learning-status-tag is-done">已完成</span>
        </div>
        <p>${escapeHtml(task.phaseLabel)}</p>
      </div>
    `).join('')
    : '<p class="learning-empty-copy">你还没有标记完成的任务，建议先从第 1 周开始逐项推进。</p>';

  const doingHtml = doingTasks.length
    ? doingTasks.map((task, index) => `
      <div class="learning-history-item" data-reveal="up" style="--reveal-delay:${index * 70 + 40}ms">
        <div class="learning-history-head">
          <div>
            <span>${escapeHtml(`${task.weekLabel} · ${task.weekTitle}`)}</span>
            <strong>${escapeHtml(task.text)}</strong>
          </div>
          <span class="learning-status-tag is-doing">进行中</span>
        </div>
        <p>${escapeHtml(`当前挂靠在 ${task.phaseLabel}，建议先做完这一项再切别的内容。`)}</p>
      </div>
    `).join('')
    : '<p class="learning-empty-copy">还没有“进行中”的任务。可以把当前最该做的一步先标成进行中，学习会更聚焦。</p>';

  historyCard.innerHTML = `
    <div class="dashboard-card-head">
      <div>
        <p class="section-eyebrow">学习记录</p>
        <h3>已经学过与正在推进</h3>
      </div>
      <p>这里会把你最近完成和正在推进的内容拆开，方便你快速回忆自己已经学到哪了。</p>
    </div>
    <div class="learning-history-stack">
      <div>
        <p class="section-eyebrow">已经学过</p>
        <div class="learning-history-list">
          ${doneHtml}
        </div>
      </div>
      <div>
        <p class="section-eyebrow">正在推进</p>
        <div class="learning-history-list">
          ${doingHtml}
        </div>
      </div>
    </div>
  `;
}

function renderLearningMilestoneCard(state) {
  const milestoneCard = document.getElementById('learningMilestoneCard');
  if (!milestoneCard) return;

  const milestoneHtml = LEARNING_MILESTONES.map((milestone, index) => {
    const progress = getMilestoneProgress(milestone, state);
    const statusMeta = getLearningStatusMeta(progress.status);
    return `
      <div class="learning-milestone-item ${statusMeta.className}" data-reveal="up" style="--reveal-delay:${index * 70}ms">
        <div class="learning-history-head">
          <div>
            <span>${progress.done}/${progress.total} 项</span>
            <strong>${escapeHtml(milestone.title)}</strong>
          </div>
          <span class="learning-status-tag ${statusMeta.className}">${statusMeta.label}</span>
        </div>
        <p>${escapeHtml(milestone.desc)}</p>
        <div class="learning-mini-meter">
          <i style="--bar-scale:${Math.max(0.06, progress.percent / 100)}; --meter-color:${progress.status === 'done' ? 'linear-gradient(90deg, #0f766e, #14b8a6)' : (progress.status === 'doing' ? 'linear-gradient(90deg, #fb923c, #f97316)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)')}"></i>
        </div>
      </div>
    `;
  }).join('');

  const projectHtml = LEARNING_PLAYBOOK.projects.map((project, index) => `
    <div class="learning-project-item" data-reveal="up" style="--reveal-delay:${index * 70 + 60}ms">
      <span>${escapeHtml(project.tag)}</span>
      <strong>${escapeHtml(project.title)}</strong>
      <p>${escapeHtml(project.desc)}</p>
    </div>
  `).join('');

  milestoneCard.innerHTML = `
    <div class="dashboard-card-head">
      <div>
        <p class="section-eyebrow">阶段目标</p>
        <h3>里程碑与项目建议</h3>
      </div>
      <p>每过一个里程碑，都尽量沉淀出仓库、说明文档、截图和演示素材，后面答辩会轻松很多。</p>
    </div>
    <div class="learning-milestone-stack">
      <div class="learning-milestone-list">
        ${milestoneHtml}
      </div>
      <div>
        <p class="section-eyebrow">可做项目</p>
        <div class="learning-project-list">
          ${projectHtml}
        </div>
      </div>
    </div>
  `;
}

function renderLearningHeroVisual(state, suggestedWeek, overall) {
  const heroVisual = document.getElementById('learningHeroVisual');
  if (!heroVisual) return;

  const elapsedDays = clampNumber(getElapsedDays(state.startDate), 1, LEARNING_PLAYBOOK.durationDays);
  const expectedWeekIndex = getExpectedWeekIndex(state);
  const completedWeeks = getCompletedWeeksCount(state);
  const selectedWeek = getSelectedLearningWeek(state);

  heroVisual.innerHTML = `
    <div class="learning-orbit" data-reveal="up">
      <div class="learning-orbit-ring learning-orbit-ring--outer"></div>
      <div class="learning-orbit-ring learning-orbit-ring--middle"></div>
      <div class="learning-orbit-ring learning-orbit-ring--inner"></div>
      <div class="learning-orbit-core">
        <strong data-count-to="${elapsedDays}">0</strong>
        <span>学习进行中</span>
      </div>
      <div class="learning-orbit-satellite learning-orbit-satellite--a">W${selectedWeek.week}</div>
      <div class="learning-orbit-satellite learning-orbit-satellite--b">${overall.percent}%</div>
      <div class="learning-orbit-satellite learning-orbit-satellite--c">目标 ${expectedWeekIndex} 周</div>
    </div>
    <div class="learning-hero-stat-grid">
      <div class="learning-hero-stat">
        <span>当前主线</span>
        <strong>${escapeHtml(suggestedWeek.label)}</strong>
        <small>${escapeHtml(suggestedWeek.title)}</small>
      </div>
      <div class="learning-hero-stat">
        <span>已完成周数</span>
        <strong data-count-to="${completedWeeks}">0</strong>
        <small>共 ${LEARNING_WEEKS.length} 周</small>
      </div>
    </div>
  `;
}

function renderLearningCoachPage(force = false) {
  const page = document.getElementById('learningPage');
  const summaryGrid = document.getElementById('learningSummaryGrid');
  if (!page || !summaryGrid) return;

  const state = loadLearningCoachState(force);
  const suggestedWeek = getSuggestedLearningWeek(state);
  const selectedWeek = getSelectedLearningWeek(state);
  const nextMilestone = getNextMilestone(state);
  const overall = getOverallTaskStats(state);
  const elapsedDays = clampNumber(getElapsedDays(state.startDate), 1, LEARNING_PLAYBOOK.durationDays);

  renderHeroMeta('learningHeroMeta', [
    { label: '当前定位', value: suggestedWeek.label, note: `${suggestedWeek.phaseTitle} · ${suggestedWeek.title}` },
    { label: '计划起点', value: formatDateLabel(state.startDate), note: `当前是第 ${elapsedDays} 天 / 共 ${LEARNING_PLAYBOOK.durationDays} 天` },
    { label: '下一里程碑', value: nextMilestone ? nextMilestone.title : '主线已完成', note: nextMilestone ? nextMilestone.desc : '建议开始打磨答辩和作品展示' },
    { label: '整体完成率', value: `${overall.percent}%`, note: `总任务 ${overall.total} 项，已完成 ${overall.done} 项` },
  ]);

  summaryGrid.innerHTML = buildLearningSummaryCards(state, suggestedWeek);
  renderLearningControlCard(state);
  renderLearningNextCard(state, selectedWeek, suggestedWeek);
  renderLearningRoadmapCard(state, selectedWeek, suggestedWeek);
  renderLearningHistoryCard(state);
  renderLearningMilestoneCard(state);
  renderLearningHeroVisual(state, suggestedWeek, overall);

  refreshMotionScene(page);
}
