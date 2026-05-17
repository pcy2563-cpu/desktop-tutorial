const USER_KEY = 'campus_forum_user';
const REMEMBER_PHONE_KEY = 'campus_forum_saved_phone';
const REMEMBER_PASS_KEY = 'campus_forum_saved_password';
const LEGACY_REMEMBER_USER_KEY = 'campus_forum_saved_username';

const ANONYMOUS_NAME = '匿名用户';

let currentUser = null;
let currentCategory = 0;
let posts = [];
let currentDetailPostId = null;
let currentDetailPost = null;
let postSearchKeyword = '';
let currentPage = 1;
let pageSize = 6;
let hasMorePosts = false;
let isLoadingPosts = false;
let currentTab = 'home';
let publicDashboardStatsCache = null;
let commentDraftImageUrls = [];
let postDetailReturnTab = 'home';
let imageViewerUrls = [];
let imageViewerIndex = 0;
let imageViewerScale = 1;
let imageViewerOffsetX = 0;
let imageViewerOffsetY = 0;
let imageViewerDrag = null;
let imageViewerPinch = null;
let imageViewerSwipe = null;
let siteBranding = { mode: 'text', text: '通', image: '' };
let revealObserver = null;
let countObserver = null;
let homeOverviewState = null;
let announcementPopupChecked = false;
let activeAnnouncementLink = '';
let siteAnnouncement = {
  enabled: false,
  title: '',
  body: '',
  image: '',
  link: '',
};
let adminPostInfoState = {
  postId: 0,
  userId: 0,
  role: '',
};
const ANNOUNCEMENT_SEEN_KEY = 'forum_announcement_seen_v2';

const CONTENT_CENTER_TAB_META = {
  myPosts: {
    label: '我的帖子',
    hint: '按发布时间倒序查看自己发布的内容。',
    empty: '你还没有发布过帖子。',
  },
  myReplies: {
    label: '收到回复',
    hint: '集中查看别人对你帖子的新回复。',
    empty: '暂时还没有人回复你的帖子。',
  },
  likedPosts: {
    label: '点赞过',
    hint: '回看你点赞过的内容，便于快速重访。',
    empty: '你还没有点赞过帖子。',
  },
  featuredPosts: {
    label: '精选',
    hint: '综合热度、互动和时效性筛出的优质内容。',
    empty: '当前还没有可展示的精选内容。',
  },
  notifications: {
    label: '站内通知',
    hint: '聚合回复和点赞提醒，集中查看互动动态。',
    empty: '暂时没有新的站内通知。',
  },
};

const contentCenterState = {
  activeTab: 'myPosts',
  summary: null,
  cache: {},
  requestId: 0,
  lastUserId: 0,
};

const dashboardViewState = {
  trend: 'content',
  distribution: 'content',
  composition: 'engagement',
  focus: 'keywords',
  ranking: 'posts',
};

const HOME_TAB_META = {
  0: {
    label: '新发',
    eyebrow: '新发栏目',
    title: '最新发布内容',
    desc: '首页默认按发布时间倒序展示最新内容。',
    badge: '按时间排序',
  },
  5: {
    label: '推荐',
    eyebrow: '推荐栏目',
    title: '个性化推荐概览',
    desc: '推荐会根据行为画像、搜索关键词和互动记录动态刷新。',
    badge: '推荐已开启',
  },
  6: {
    label: '精选',
    eyebrow: '精选栏目',
    title: '站内精选内容',
    desc: '综合热度、互动和时效性后筛选出的优质内容。',
    badge: '热度精选',
  },
  7: {
    label: '我的帖子',
    eyebrow: '我的内容',
    title: '我的帖子',
    desc: '集中查看自己发布的内容，方便回顾和演示。',
    badge: '个人内容',
  },
  8: {
    label: '收到回复',
    eyebrow: '互动回流',
    title: '收到的回复',
    desc: '别人回复你的帖子后，会在这里集中展示。',
    badge: '互动提醒',
  },
  9: {
    label: '点赞过',
    eyebrow: '我的记录',
    title: '点赞过的帖子',
    desc: '快速回看曾经点赞过的内容。',
    badge: '点赞记录',
  },
  10: {
    label: '站内通知',
    eyebrow: '站内通知',
    title: '互动通知',
    desc: '聚合回复和点赞提醒，统一查看站内动态。',
    badge: '动态更新',
  },
};

const AVATAR_PRESETS = {
  jade: { start: '#0f766e', end: '#14b8a6', label: '青' },
  sky: { start: '#0369a1', end: '#38bdf8', label: '蓝' },
  sun: { start: '#ea580c', end: '#fb923c', label: '橙' },
  rose: { start: '#be123c', end: '#fb7185', label: '粉' },
};

function avatarPresetKey(seed) {
  const keys = Object.keys(AVATAR_PRESETS);
  if (!keys.length) return 'jade';
  const text = String(seed || 'u');
  const sum = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return keys[sum % keys.length];
}

function defaultAvatar(seed) {
  return presetAvatarUrl(`preset:${avatarPresetKey(seed)}`, seed);
}

function presetAvatarUrl(value, seed) {
  const presetKey = String(value || '').replace(/^preset:/, '') || avatarPresetKey(seed);
  const preset = AVATAR_PRESETS[presetKey] || AVATAR_PRESETS.jade;
  const ch = (seed && String(seed).trim()) ? String(seed).trim().charAt(0) : '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${preset.start}"/><stop offset="100%" style="stop-color:${preset.end}"/></linearGradient></defs><rect width="80" height="80" rx="24" fill="url(#g)"/><circle cx="64" cy="18" r="10" fill="rgba(255,255,255,0.18)"/><text x="40" y="48" text-anchor="middle" fill="white" font-size="28" font-family="system-ui,sans-serif">${escapeHtml(ch)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function avatarUrl(url, seed) {
  if (url && String(url).trim()) {
    const value = String(url).trim();
    if (/^preset:/.test(value)) {
      return presetAvatarUrl(value, seed);
    }
    return value;
  }
  return defaultAvatar(seed || 'u');
}

function normalizeSiteBranding(data = {}) {
  const image = typeof data.image === 'string' && /^\/uploads\/forum\//.test(data.image.trim())
    ? data.image.trim()
    : '';
  const rawText = typeof data.text === 'string' ? data.text.trim() : '';
  const text = rawText ? rawText.slice(0, 2) : '通';
  const mode = data.mode === 'image' && image ? 'image' : 'text';
  return { mode, text, image };
}

function applyBrandingToNodes(logoEl, textEl, imageEl, branding) {
  if (!logoEl || !textEl || !imageEl) return;
  const safeBranding = normalizeSiteBranding(branding);
  const useImage = safeBranding.mode === 'image' && safeBranding.image;
  logoEl.classList.toggle('is-image', !!useImage);
  textEl.textContent = safeBranding.text || '通';
  textEl.classList.toggle('hidden', !!useImage);
  imageEl.classList.toggle('hidden', !useImage);
  if (useImage) {
    imageEl.src = safeBranding.image;
  } else {
    imageEl.removeAttribute('src');
  }
}

function applySiteBranding(data = {}) {
  siteBranding = normalizeSiteBranding(data);
  applyBrandingToNodes(
    document.getElementById('headerLogo'),
    document.getElementById('headerLogoText'),
    document.getElementById('headerLogoImage'),
    siteBranding,
  );
  syncAdminBrandingForm();
}

function syncAdminBrandingForm() {
  applyBrandingToNodes(
    document.getElementById('adminBrandingPreviewLogo'),
    document.getElementById('adminBrandingPreviewText'),
    document.getElementById('adminBrandingPreviewImage'),
    siteBranding,
  );

  const logoTextInput = document.getElementById('brandingLogoText');
  if (logoTextInput && document.activeElement !== logoTextInput) {
    logoTextInput.value = siteBranding.mode === 'text' ? (siteBranding.text || '通') : '';
  }
}

async function loadSiteBranding() {
  try {
    const res = await forumAPI.getSiteBranding();
    applySiteBranding(res.data || {});
  } catch {
    applySiteBranding(siteBranding);
  }
}

function limitText(value, maxChars) {
  const safe = String(value || '').trim();
  if (!safe || !maxChars) return safe;
  return Array.from(safe).slice(0, maxChars).join('');
}

function normalizeAnnouncementLink(value) {
  const safe = String(value || '').trim();
  if (!safe) return '';
  return /^(https?:\/\/|\/)/i.test(safe) ? safe : '';
}

function normalizeAnnouncementImage(value) {
  const safe = String(value || '').trim();
  if (!safe) return '';
  return /^(https?:\/\/|\/uploads\/forum\/)/i.test(safe) ? safe : '';
}

function normalizeSiteAnnouncement(data = {}) {
  return {
    enabled: data.enabled === true || Number(data.enabled) === 1 || String(data.enabled || '').toLowerCase() === 'true',
    title: limitText(data.title, 50),
    body: limitText(data.body, 500),
    image: normalizeAnnouncementImage(data.image),
    link: normalizeAnnouncementLink(data.link || data.link_url),
  };
}

function updateAdminAnnouncementHeroMeta(announcement = siteAnnouncement) {
  renderHeroMeta('adminAnnouncementHeroMeta', [
    { label: '当前状态', value: announcement.enabled ? '已启用' : '未启用', note: '控制首页是否自动弹窗' },
    { label: '图片素材', value: announcement.image ? '已配置' : '未配置', note: '支持公告配图展示' },
    { label: '跳转链接', value: announcement.link ? '已配置' : '未配置', note: '可选，点击公告按钮时打开' },
  ]);
}

function syncAdminAnnouncementForm() {
  const enabledEl = document.getElementById('adminAnnouncementEnabled');
  const titleInput = document.getElementById('adminAnnouncementTitle');
  const bodyInput = document.getElementById('adminAnnouncementBody');
  const linkInput = document.getElementById('adminAnnouncementLink');
  const imageInput = document.getElementById('adminAnnouncementImageUrl');
  const statusEl = document.getElementById('adminAnnouncementStatus');
  const linkBadgeEl = document.getElementById('adminAnnouncementLinkBadge');
  const previewTitleEl = document.getElementById('adminAnnouncementPreviewTitle');
  const previewBodyEl = document.getElementById('adminAnnouncementPreviewBody');
  const previewLinkEl = document.getElementById('adminAnnouncementPreviewLink');
  const previewMediaEl = document.getElementById('adminAnnouncementPreviewMedia');
  const previewImageEl = document.getElementById('adminAnnouncementPreviewImage');

  if (enabledEl) enabledEl.checked = !!siteAnnouncement.enabled;
  if (titleInput) titleInput.value = siteAnnouncement.title;
  if (bodyInput) bodyInput.value = siteAnnouncement.body;
  if (linkInput) linkInput.value = siteAnnouncement.link;
  if (imageInput) imageInput.value = siteAnnouncement.image;

  if (statusEl) {
    statusEl.textContent = siteAnnouncement.enabled ? '已启用' : '未启用';
    statusEl.classList.toggle('is-active', !!siteAnnouncement.enabled);
  }
  if (linkBadgeEl) {
    linkBadgeEl.classList.toggle('hidden', !siteAnnouncement.link);
  }
  if (previewTitleEl) {
    previewTitleEl.textContent = siteAnnouncement.title || '当前暂无公告';
  }
  if (previewBodyEl) {
    previewBodyEl.textContent = siteAnnouncement.body || '保存并启用后，首页会自动弹出公告内容。';
  }
  if (previewLinkEl) {
    if (siteAnnouncement.link) {
      previewLinkEl.href = siteAnnouncement.link;
      previewLinkEl.classList.remove('hidden');
    } else {
      previewLinkEl.classList.add('hidden');
      previewLinkEl.removeAttribute('href');
    }
  }
  if (previewMediaEl && previewImageEl) {
    if (siteAnnouncement.image) {
      previewImageEl.src = siteAnnouncement.image;
      previewImageEl.alt = siteAnnouncement.title || '公告配图';
      previewMediaEl.classList.remove('hidden');
    } else {
      previewMediaEl.classList.add('hidden');
      previewImageEl.removeAttribute('src');
      previewImageEl.alt = '';
    }
  }

  updateAdminAnnouncementHeroMeta(siteAnnouncement);
}

function applySiteAnnouncement(data = {}) {
  siteAnnouncement = normalizeSiteAnnouncement(data);
  syncAdminAnnouncementForm();
}

async function loadSiteAnnouncement(options = {}) {
  const { autoShow = true } = options;
  try {
    const res = await forumAPI.getSiteAnnouncement();
    applySiteAnnouncement(res.data || {});
  } catch {
    applySiteAnnouncement(siteAnnouncement);
  }

  if (autoShow) {
    maybeAutoShowAnnouncement(siteAnnouncement);
  }
}

function encodeUtf8Base64(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function ensureMotionObservers() {
  if (!revealObserver && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  if (!countObserver && 'IntersectionObserver' in window) {
    countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -24px 0px' });
  }
}

function easeOutQuart(t) {
  return 1 - ((1 - t) ** 4);
}

function animateCounter(el) {
  if (!el || el.dataset.countAnimated === '1') return;
  const target = Number(el.dataset.countTo || 0);
  const suffix = el.dataset.countSuffix || '';
  const prefix = el.dataset.countPrefix || '';
  const duration = Math.min(1600, Math.max(700, Number(el.dataset.countDuration || 1100)));
  const start = performance.now();
  el.dataset.countAnimated = '1';

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = easeOutQuart(progress);
    const currentValue = Math.round(target * eased);
    el.textContent = `${prefix}${currentValue.toLocaleString('zh-CN')}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${prefix}${target.toLocaleString('zh-CN')}${suffix}`;
    }
  };

  requestAnimationFrame(tick);
}

function applyRevealTargets(root = document) {
  if (!root || !root.querySelectorAll) return;
  const selectors = [
    '.profile-account-card',
    '.profile-entry-card',
    '.dashboard-hero',
    '.dashboard-summary-card',
    '.dashboard-admin-card',
    '.dashboard-card',
    '.recommend-card',
    '.post-item',
    '.detail-hero-card',
    '.detail-comments-card',
    '.admin-manage-card',
    '.insight-subcard',
    '.insight-metric',
    '.comment-row',
  ];

  const seen = new Set();
  let order = 0;
  root.querySelectorAll(selectors.join(',')).forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    if (!el.dataset.reveal) {
      el.dataset.reveal = 'up';
    }
    if (!el.style.getPropertyValue('--reveal-delay')) {
      el.style.setProperty('--reveal-delay', `${Math.min(order * 70, 520)}ms`);
    }
    order += 1;
  });
}

function refreshMotionScene(root = document) {
  if (!root) return;
  applyRevealTargets(root);
  ensureMotionObservers();

  const revealNodes = root.querySelectorAll ? root.querySelectorAll('[data-reveal]') : [];
  revealNodes.forEach((el) => {
    if (el.dataset.revealBound === '1') return;
    el.dataset.revealBound = '1';
    el.classList.add('reveal-on-scroll');
    if (revealObserver) {
      revealObserver.observe(el);
    } else {
      el.classList.add('is-visible');
    }
  });

  const countNodes = root.querySelectorAll ? root.querySelectorAll('[data-count-to]') : [];
  countNodes.forEach((el) => {
    if (el.dataset.countBound === '1') return;
    el.dataset.countBound = '1';
    if (countObserver) {
      countObserver.observe(el);
    } else {
      animateCounter(el);
    }
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const readyNodes = root.querySelectorAll ? root.querySelectorAll('.dashboard-card, .dashboard-summary-card, .dashboard-admin-card') : [];
      readyNodes.forEach((el) => el.classList.add('is-ready'));
    });
  });
}

function maskPhone(phone) {
  const value = phone ? String(phone).trim() : '';
  if (!/^1\d{10}$/.test(value)) return '';
  return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function isAnonymousPost(post) {
  return !!post && (Number(post.is_anonymous) === 1 || post.is_anonymous === true);
}

function getPostDisplayName(post) {
  return isAnonymousPost(post) ? ANONYMOUS_NAME : ((post && post.user_nickname) || '匿名');
}

function getPostAvatar(post) {
  if (isAnonymousPost(post)) {
    return defaultAvatar('匿');
  }
  return avatarUrl(post && post.user_avatar, post && post.user_nickname);
}

function parsePostImages(raw) {
  if (!raw) return [];
  try {
    const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(a)) return [];
    return a.filter((u) => typeof u === 'string' && /^\/uploads\/forum\//.test(u.trim())).slice(0, 9);
  } catch {
    return [];
  }
}

function parseCommentImages(raw) {
  return parsePostImages(raw).slice(0, 6);
}

function encodeGalleryUrls(urls) {
  return encodeURIComponent(JSON.stringify(Array.isArray(urls) ? urls : []));
}

function isAnonymousComment(comment) {
  return !!comment && (Number(comment.is_anonymous) === 1 || comment.is_anonymous === true);
}

function getCommentDisplayName(comment) {
  return isAnonymousComment(comment) ? ANONYMOUS_NAME : ((comment && comment.user_nickname) || '用户');
}

function getCommentAvatar(comment) {
  if (isAnonymousComment(comment)) {
    return defaultAvatar('匿');
  }
  return avatarUrl(comment && comment.user_avatar, comment && comment.user_nickname);
}

function imageGridHtml(urls, className = 'post-image-grid') {
  if (!urls.length) return '';
  const gallery = encodeGalleryUrls(urls);
  return `
    <div class="${className}">
      ${urls.map((u, index) => `
        <button type="button" class="image-grid-item" onclick="openImageViewerFromEncoded(event, '${gallery}', ${index})">
          <img src="${escapeHtml(u)}" alt="" loading="lazy" decoding="async">
        </button>
      `).join('')}
    </div>
  `;
}

function postImagesStripHtml(urls) {
  if (!urls.length) return '';
  const preview = urls.slice(0, 3);
  const countClass = `count-${Math.min(preview.length, 3)}`;
  const gallery = encodeGalleryUrls(urls);
  const items = preview.map((u, index) => {
    const remain = urls.length - 3;
    const overlay = index === 2 && remain > 0
      ? `<span class="post-preview-more">+${remain}</span>`
      : '';
    return `
      <button type="button" class="post-preview-item" onclick="openImageViewerFromEncoded(event, '${gallery}', ${index})">
        <img src="${escapeHtml(u)}" alt="" loading="lazy" decoding="async">
        ${overlay}
      </button>
    `;
  }).join('');
  return `<div class="post-preview-grid ${countClass}">${items}</div>`;
}

function commentImagesHtml(urls) {
  return imageGridHtml(urls, 'comment-image-grid');
}

function summarizeText(text, maxLength = 72) {
  const value = text ? String(text).replace(/\s+/g, ' ').trim() : '';
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function renderHeroMeta(targetId, items = []) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const safeItems = Array.isArray(items) ? items.filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '') : [];
  if (!safeItems.length) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }

  el.classList.remove('hidden');
  el.innerHTML = safeItems.map((item, index) => `
    <div class="hero-meta-chip" data-reveal="up" style="--reveal-delay:${index * 60}ms">
      <span>${escapeHtml(item.label || '')}</span>
      <strong>${escapeHtml(String(item.value))}</strong>
      <small>${escapeHtml(item.note || '')}</small>
    </div>
  `).join('');
  refreshMotionScene(el);
}

function renderProfileOverviewPanel() {
  return;
}

function renderHomeFeedOverview() {
  return;
}

function updateAdminBannerHeroMeta(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  renderHeroMeta('adminBannerHeroMeta', [
    { label: '轮播总数', value: safeRows.length, note: '当前后台可管理的全部轮播图' },
    { label: '启用轮播', value: safeRows.filter((row) => row.status === 'active').length, note: '正在首页展示的轮播数量' },
    { label: '图标模式', value: siteBranding.mode === 'image' ? '图片图标' : '文字图标', note: '头部左上角论坛图标当前状态' },
  ]);
}

function updateAdminUserHeroMeta(rows = [], keyword = '') {
  const safeRows = Array.isArray(rows) ? rows : [];
  renderHeroMeta('adminUserHeroMeta', [
    { label: '检索结果', value: safeRows.length || '待查询', note: keyword ? `关键词：${keyword}` : '支持昵称、手机号和用户 ID' },
    { label: '手机号已绑定', value: safeRows.length ? safeRows.filter((row) => !!row.phone).length : '待查询', note: '可直接用于禁言与定位账号' },
    { label: '禁言账号', value: safeRows.length ? safeRows.filter((row) => Number(row.is_muted) === 1).length : '待查询', note: '便于展示后台治理能力' },
  ]);
}

function renderTextWithBreaks(text) {
  return escapeHtml(text || '').replace(/\n/g, '<br>');
}

let postDraftImageUrls = [];
let carouselTimer = null;
let carouselIndex = 0;
const COMMENT_IMAGE_LIMIT = 6;

function userIsMuted() {
  return currentUser && (Number(currentUser.is_muted) === 1 || currentUser.is_muted === true);
}

document.addEventListener('DOMContentLoaded', async () => {
  const imgInput = document.getElementById('postImagesInput');
  if (imgInput) {
    imgInput.addEventListener('change', onPostImagesSelected);
  }

  const commentImgInput = document.getElementById('commentImagesInput');
  if (commentImgInput) {
    commentImgInput.addEventListener('change', onCommentImagesSelected);
  }

  bindCommentComposerEvents();
  bindImageViewerEvents();

  const adminSearchInput = document.getElementById('adminUserKeyword');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        adminSearchUsers();
      }
    });
  }

  const postSearchInput = document.getElementById('postSearchInput');
  if (postSearchInput) {
    postSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applySearch();
      }
    });
  }

  initUser();
  if (!currentUser) {
    await trySavedLogin();
  }

  await loadSiteBranding();
  await loadSiteAnnouncement();
  switchTab('home', { preserveScroll: true });
  await loadPosts({ reset: true });
  loadHomeBanners();
  refreshMotionScene(document);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
});

function saveCredentials(phone) {
  localStorage.setItem(REMEMBER_PHONE_KEY, phone);
  localStorage.removeItem(REMEMBER_PASS_KEY);
}

function clearSavedCredentials() {
  localStorage.removeItem(REMEMBER_PHONE_KEY);
  localStorage.removeItem(REMEMBER_PASS_KEY);
  localStorage.removeItem(LEGACY_REMEMBER_USER_KEY);
}

async function trySavedLogin() {
  let phone = localStorage.getItem(REMEMBER_PHONE_KEY);
  if (!phone) {
    const legacy = localStorage.getItem(LEGACY_REMEMBER_USER_KEY);
    if (legacy && /^1\d{10}$/.test(legacy.trim())) {
      phone = legacy.trim();
      localStorage.setItem(REMEMBER_PHONE_KEY, phone);
      localStorage.removeItem(LEGACY_REMEMBER_USER_KEY);
    }
  }
  localStorage.removeItem(REMEMBER_PASS_KEY);
  if (!phone) return;

  const phoneInput = document.getElementById('loginPhone');
  if (phoneInput && !phoneInput.value) {
    phoneInput.value = phone;
  }
}

function initUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return;
  try {
    currentUser = JSON.parse(raw);
    if (!currentUser || !currentUser.id) currentUser = null;
    if (currentUser && !currentUser.authToken) {
      localStorage.removeItem(USER_KEY);
      currentUser = null;
    }
    if (currentUser && String(currentUser.role || '') === 'admin' && !currentUser.adminToken) {
      localStorage.removeItem(USER_KEY);
      currentUser = null;
    }
    updateUserUI();
  } catch {
    localStorage.removeItem(USER_KEY);
    currentUser = null;
  }
}

function persistUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isAdminUser() {
  return currentUser && String(currentUser.role || '') === 'admin';
}

function getAdminToken() {
  if (!isAdminUser() || !currentUser || !currentUser.adminToken) {
    showToast('管理员登录已过期，请重新登录');
    return '';
  }
  return currentUser.adminToken;
}

function updateUserUI() {
  const card = document.getElementById('profileAccountCard');
  if (card) {
    if (currentUser) {
      const ph = currentUser.phone ? String(currentUser.phone) : '';
      const masked = maskPhone(ph);
      const name = escapeHtml(currentUser.nickname || masked || currentUser.username || '用户');
      const adminTag = isAdminUser() ? '<span class="role-badge">管理员</span>' : '';
      const muteTag = userIsMuted() ? '<span class="role-badge mute-badge">禁言</span>' : '';
      const pic = currentUser.avatar_url || currentUser.avatar;
      const selectedAvatar = String(pic || '');
      card.innerHTML = `
        <div class="profile-account-top">
          <div class="profile-account-avatar-wrap">
            <img class="profile-account-avatar" src="${avatarUrl(pic, currentUser.nickname || currentUser.username)}" alt="">
            <label class="profile-avatar-upload-btn">
              更换
              <input type="file" id="profileAvatarInput" accept="image/*" hidden onchange="onProfileAvatarSelected(event)">
            </label>
          </div>
          <div class="profile-account-meta">
            <h3>${name}${adminTag}${muteTag}</h3>
            <p>${escapeHtml(masked || '未绑定手机号')}</p>
            <span class="profile-account-tip">${isAdminUser() ? '可进入管理员入口、个人博客和分析页。' : '可进入个人博客、画像和分析。'}</span>
          </div>
        </div>
        <div class="profile-account-stats">
          <div class="profile-account-stat"><span>角色</span><strong>${isAdminUser() ? '管理员' : '普通用户'}</strong></div>
          <div class="profile-account-stat"><span>状态</span><strong>${userIsMuted() ? '已禁言' : '正常'}</strong></div>
        </div>
        <div class="profile-avatar-panel">
          <div class="profile-avatar-panel-head">
            <span>默认头像</span>
            <small>可切换或上传</small>
          </div>
          <div class="profile-avatar-preset-row">
            ${Object.entries(AVATAR_PRESETS).map(([key, preset]) => `
              <button type="button" class="profile-avatar-preset${selectedAvatar === `preset:${key}` ? ' active' : ''}" onclick="setPresetAvatar('${key}')">
                <span class="profile-avatar-preset-dot" style="background:linear-gradient(135deg, ${preset.start}, ${preset.end})"></span>
                <span>${preset.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="profile-account-actions">
          <button type="button" class="profile-primary-btn" onclick="checkAuthAndPost()">去发布</button>
          <button type="button" class="profile-secondary-btn" onclick="logout()">退出登录</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="profile-guest-card">
          <div>
            <h3 class="insight-title">登录后解锁“我的”页面</h3>
            <p class="insight-copy">登录后可查看账号信息。</p>
          </div>
          <div class="profile-account-actions">
            <button type="button" class="profile-primary-btn" onclick="showLogin()">登录</button>
            <button type="button" class="profile-secondary-btn" onclick="showRegister()">注册</button>
          </div>
        </div>
      `;
      }
    }

    renderProfileOverviewPanel();
    if (!currentUser) {
      setProfileContentEntryHint('登录后查看帖子、回复和通知');
    } else if (!contentCenterState.summary) {
      setProfileContentEntryHint('集中查看帖子、回复和通知');
    }
  
    const headerPageLabel = document.getElementById('headerPageLabel');
    if (headerPageLabel) {
      const pageLabelMap = {
        home: '首页',
        profile: '我的',
        detail: '帖子详情',
        dashboard: '数据分析',
        behavior: '行为画像',
        contentCenter: '内容中心',
        adminBanner: '轮播管理',
        adminAnnouncement: '公告设置',
        adminUser: '用户管理',
      };
      headerPageLabel.textContent = pageLabelMap[currentTab] || '首页';
    }

  syncProfileAdminTools();
}

async function saveUserAvatar(avatarValue) {
  if (!currentUser) return;
  const res = await forumAPI.updateUserAvatar(currentUser.id, avatarValue);
  currentUser = {
    ...currentUser,
    ...(res.data || {}),
    avatar: res.data?.avatar_url || avatarValue,
    avatar_url: res.data?.avatar_url || avatarValue,
  };
  persistUser(currentUser);
  updateUserUI();
  showToast('头像已更新');
}

async function onProfileAvatarSelected(event) {
  if (!currentUser) return;
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    const upload = await forumAPI.uploadImage(currentUser.id, file);
    const avatarUrlValue = upload?.data?.url;
    if (!avatarUrlValue) {
      throw new Error('头像上传失败');
    }
    await saveUserAvatar(avatarUrlValue);
  } catch (error) {
    showToast(error.message || '头像上传失败');
  } finally {
    event.target.value = '';
  }
}

async function setPresetAvatar(presetKey) {
  if (!currentUser) return;
  try {
    await saveUserAvatar(`preset:${presetKey}`);
  } catch (error) {
    showToast(error.message || '头像切换失败');
  }
}

function syncProfileAdminTools(forceLoad = false) {
  const box = document.getElementById('profileAdminSection');
  if (!box) return;

  if (isAdminUser()) {
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
    if (currentTab === 'adminBanner' || currentTab === 'adminAnnouncement' || currentTab === 'adminUser') {
      switchTab('profile', { preserveScroll: true });
      return;
    }
  }
}

function switchTab(tab, options = {}) {
  if (tab === 'dashboard') currentTab = 'dashboard';
  else if (tab === 'detail') currentTab = 'detail';
  else if (tab === 'adminBanner') currentTab = 'adminBanner';
  else if (tab === 'adminAnnouncement') currentTab = 'adminAnnouncement';
  else if (tab === 'adminUser') currentTab = 'adminUser';
  else if (tab === 'contentCenter') currentTab = 'contentCenter';
  else if (tab === 'behavior') currentTab = 'behavior';
  else if (tab === 'profile') currentTab = 'profile';
  else currentTab = 'home';

  const homePage = document.getElementById('homePage');
  const postDetailPage = document.getElementById('postDetailPage');
  const profilePage = document.getElementById('profilePage');
  const dashboardPage = document.getElementById('dashboardPage');
  const behaviorPage = document.getElementById('behaviorPage');
  const contentCenterPage = document.getElementById('contentCenterPage');
  const adminBannerPage = document.getElementById('adminBannerPage');
  const adminAnnouncementPage = document.getElementById('adminAnnouncementPage');
  const adminUserPage = document.getElementById('adminUserPage');
  if (homePage) {
    homePage.classList.toggle('hidden', currentTab !== 'home');
  }
  if (postDetailPage) {
    postDetailPage.classList.toggle('hidden', currentTab !== 'detail');
  }
  if (profilePage) {
    profilePage.classList.toggle('hidden', currentTab !== 'profile');
  }
  if (dashboardPage) {
    dashboardPage.classList.toggle('hidden', currentTab !== 'dashboard');
  }
  if (behaviorPage) {
    behaviorPage.classList.toggle('hidden', currentTab !== 'behavior');
  }
  if (contentCenterPage) {
    contentCenterPage.classList.toggle('hidden', currentTab !== 'contentCenter');
  }
  if (adminBannerPage) {
    adminBannerPage.classList.toggle('hidden', currentTab !== 'adminBanner');
  }
  if (adminAnnouncementPage) {
    adminAnnouncementPage.classList.toggle('hidden', currentTab !== 'adminAnnouncement');
  }
  if (adminUserPage) {
    adminUserPage.classList.toggle('hidden', currentTab !== 'adminUser');
  }

  document.querySelectorAll('.bottom-nav-item[data-tab]').forEach((btn) => {
    const activeTab = currentTab === 'detail'
      ? postDetailReturnTab
      : (currentTab === 'home' ? 'home' : 'profile');
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });

  updateUserUI();
  syncHomeModeUI();

  if (currentTab === 'profile') {
    syncProfileAdminTools(true);
  }
  if (currentTab === 'dashboard') {
    loadPublicDashboardStats();
  }
  if (currentTab === 'behavior') {
    loadUserBehaviorSummary();
  }
  if (currentTab === 'contentCenter') {
    loadContentCenter();
  }
  if (currentTab === 'adminBanner') {
    loadAdminBannerPanel();
  }
  if (currentTab === 'adminAnnouncement') {
    loadAdminAnnouncementPanel();
  }
  if (currentTab === 'adminUser') {
    updateAdminUserHeroMeta([], '');
  }

  refreshMotionScene(document);

  if (!options.preserveScroll) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function getPostQueryOptions(page) {
  return {
    categoryId: 0,
    page,
    pageSize,
    q: postSearchKeyword,
    userId: currentUser ? Number(currentUser.id) : 0,
  };
}

function syncHomeModeUI() {
  const recommendMode = currentTab === 'home' && isHomeRecommendTab();
  const showSearch = currentTab === 'home' && shouldShowHomeSearch();
  const showLoadMore = currentTab === 'home' && shouldShowHomeLoadMore();
  const searchWrap = document.querySelector('.search-bar-wrap');
  const postList = document.getElementById('postList');
  const loadMoreWrap = document.getElementById('loadMoreWrap');
  const recommendSection = document.getElementById('recommendSection');
  const homeRecommendProfileSection = document.getElementById('homeRecommendProfileSection');

  if (searchWrap) {
    searchWrap.classList.toggle('hidden', !showSearch);
  }
  if (postList) {
    postList.classList.toggle('hidden', recommendMode);
  }
  if (loadMoreWrap) {
    loadMoreWrap.classList.toggle('hidden', recommendMode || !showLoadMore);
  }
  if (recommendSection) {
    recommendSection.classList.toggle('hidden', !recommendMode);
  }
  if (homeRecommendProfileSection) {
    homeRecommendProfileSection.classList.toggle('hidden', !recommendMode);
  }

  renderHomeFeedOverview();
}

function openDashboardPage() {
  switchTab('dashboard');
}

function openBehaviorPage() {
  switchTab('behavior');
}

function openAdminBannerPage() {
  if (!isAdminUser() || !currentUser) {
    showToast('仅管理员可访问');
    return;
  }
  switchTab('adminBanner');
}

function openAdminAnnouncementPage() {
  if (!isAdminUser() || !currentUser) {
    showToast('仅管理员可访问');
    return;
  }
  switchTab('adminAnnouncement');
}

function openAdminUserPage() {
  if (!isAdminUser() || !currentUser) {
    showToast('仅管理员可访问');
    return;
  }
  switchTab('adminUser');
}

function updateLoadMoreButton() {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;
  btn.classList.toggle('hidden', !hasMorePosts);
  btn.disabled = isLoadingPosts;
  btn.textContent = isLoadingPosts && hasMorePosts ? '加载中…' : '加载更多';
}

function behaviorCount(summary, key) {
  const counts = summary && summary.behavior_counts ? summary.behavior_counts : {};
  return Number(counts[key] || 0);
}

function getProfileStageLabel(summary = {}) {
  if (summary.profile_stage_label) {
    return String(summary.profile_stage_label);
  }

  const activeScore = Number(summary.active_score || 0);
  const recentDays = Number(summary.recent_active_days || 0);
  const keywordCount = Array.isArray(summary.top_keywords) ? summary.top_keywords.length : 0;

  if (activeScore >= 60 || recentDays >= 10) return '深度活跃';
  if (activeScore >= 25 || recentDays >= 5 || keywordCount >= 3) return '稳定成型';
  if (activeScore > 0 || keywordCount > 0) return '持续成型';
  return '画像待建立';
}

function getBehaviorPreferenceRows(summary = {}) {
  const preset = Array.isArray(summary.behavior_preferences) ? summary.behavior_preferences : [];
  if (preset.length) {
    return preset
      .map((item) => ({
        behavior_type: item.behavior_type || '',
        label: item.label || behaviorTypeLabel(item.behavior_type),
        score: Number(item.score || 0),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  const weights = {
    create_post: 6,
    comment_post: 5,
    like_post: 4,
    view_post: 3,
    search: 2,
    browse_category: 2,
  };

  return Object.keys(weights)
    .map((type) => ({
      behavior_type: type,
      label: behaviorTypeLabel(type),
      score: behaviorCount(summary, type) * weights[type],
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

function getBehaviorTags(summary = {}) {
  const tags = [];
  const activeScore = Number(summary.active_score || 0);
  const recentDays = Number(summary.recent_active_days || 0);
  const keywordCount = Array.isArray(summary.top_keywords) ? summary.top_keywords.length : 0;

  if (activeScore >= 60) {
    tags.push('深度活跃');
  } else if (activeScore >= 25) {
    tags.push('稳定成型');
  } else if (activeScore > 0) {
    tags.push('持续成型');
  } else {
    tags.push('画像建立中');
  }

  if (behaviorCount(summary, 'create_post') >= 2) tags.push('内容创作者');
  if (behaviorCount(summary, 'comment_post') >= 3) tags.push('互动积极');
  if (behaviorCount(summary, 'search') >= 2) tags.push('搜索意图清晰');
  if (behaviorCount(summary, 'like_post') >= 3) tags.push('反馈信号稳定');
  if (keywordCount >= 3) tags.push('关键词样本充足');
  if (recentDays >= 7) tags.push('近7日持续活跃');

  return tags.slice(0, 4);
}

function getBehaviorEventNote(type) {
  const key = String(type || '').toLowerCase();
  if (key === 'search') return '已纳入关键词画像';
  if (key === 'view_post') return '已记录浏览兴趣';
  if (key === 'like_post') return '已记录正向反馈';
  if (key === 'comment_post') return '已提升互动权重';
  if (key === 'create_post') return '已增强内容生产画像';
  if (key === 'browse_category') return '已写入浏览路径';
  return '已同步到行为画像';
}

function setProfileBehaviorEntryHint(text) {
  const el = document.getElementById('profileBehaviorEntryHint');
  if (el) {
    el.textContent = text;
  }
}

function setProfileDashboardEntryHint(text) {
  const el = document.getElementById('profileDashboardEntryHint');
  if (el) {
    el.textContent = text;
  }
}

function setProfileContentEntryHint(text) {
  const el = document.getElementById('profileContentEntryHint');
  if (el) {
    el.textContent = text;
  }
}

function getHomeTabMeta(tabId) {
  return HOME_TAB_META[tabId] || HOME_TAB_META[0];
}

function isHomeRecommendTab(tabId = currentCategory) {
  return Number(tabId) === 5;
}

function isHomeSpecialTab(tabId = currentCategory) {
  return [6, 7, 8, 9, 10].includes(Number(tabId));
}

function isHomePersonalTab(tabId = currentCategory) {
  return [7, 8, 9, 10].includes(Number(tabId));
}

function shouldShowHomeSearch(tabId = currentCategory) {
  return Number(tabId) === 0;
}

function shouldShowHomeLoadMore(tabId = currentCategory) {
  return Number(tabId) === 0;
}

function getContentCenterMeta(tab) {
  return CONTENT_CENTER_TAB_META[tab] || CONTENT_CENTER_TAB_META.myPosts;
}

function invalidateContentCenterCache() {
  contentCenterState.summary = null;
  contentCenterState.cache = {};
  contentCenterState.requestId += 1;
}

function ensureContentCenterUserState() {
  const userId = currentUser ? Number(currentUser.id) : 0;
  if (contentCenterState.lastUserId !== userId) {
    invalidateContentCenterCache();
    contentCenterState.lastUserId = userId;
  }
}

function renderContentCenterGuest() {
  const guestSection = document.getElementById('contentCenterGuestSection');
  const mainSection = document.getElementById('contentCenterMain');
  if (guestSection) {
    guestSection.classList.remove('hidden');
  }
  if (mainSection) {
    mainSection.classList.add('hidden');
  }

  renderHeroMeta('contentCenterHeroMeta', [
    { label: '登录后解锁', value: '内容中心', note: '统一查看我的帖子、回复、点赞和通知' },
    { label: '答辩亮点', value: '闭环链路', note: '覆盖发布、互动、推荐和通知等完整流程' },
    { label: '展示方式', value: '栏目聚合', note: '适合演示用户中心与内容管理能力' },
  ]);
  setProfileContentEntryHint('登录后查看帖子、回复和通知');
}

function renderContentCenterSummary(summary = {}) {
  const grid = document.getElementById('contentCenterSummaryGrid');
  if (!grid) return;

  const cards = [
    {
      label: '我的帖子',
      value: Number(summary.post_count || 0),
      hint: '按发布时间管理自己发布的内容',
    },
    {
      label: '收到回复',
      value: Number(summary.reply_count || 0),
      hint: '别人回复你的帖子会汇总在这里',
    },
    {
      label: '点赞记录',
      value: Number(summary.liked_count || 0),
      hint: '快速找回曾经点赞过的帖子',
    },
    {
      label: '站内通知',
      value: Number(summary.notification_count || 0),
      hint: '聚合回复和点赞等互动提醒',
    },
  ];

  grid.innerHTML = cards.map((item, index) => `
    <article class="dashboard-summary-card dashboard-summary-card--${(index % 4) + 1}" data-reveal="up" style="--reveal-delay:${index * 55}ms">
      <span>${escapeHtml(item.label)}</span>
      <strong data-count-to="${item.value}">0</strong>
      <p>${escapeHtml(item.hint)}</p>
    </article>
  `).join('');

  renderHeroMeta('contentCenterHeroMeta', [
    { label: '精选内容', value: Number(summary.featured_count || 0), note: '综合热度和时效性筛出的站内优质内容' },
    { label: '累计获赞', value: Number(summary.total_likes || 0), note: '你发布的帖子累计收到的点赞次数' },
    { label: '累计浏览', value: Number(summary.total_views || 0), note: '你发布的内容被浏览的总次数' },
  ]);

  setProfileContentEntryHint(
    Number(summary.post_count || 0) > 0
      ? `${Number(summary.post_count || 0)} 帖 · ${Number(summary.reply_count || 0)} 条回复`
      : '集中查看帖子、回复和通知',
  );
  refreshMotionScene(grid);
}

function updateContentCenterTabsUI() {
  document.querySelectorAll('#contentCenterTabs .content-center-tab').forEach((btn) => {
    const active = btn.dataset.tab === contentCenterState.activeTab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function updateContentCenterCurrentHint(tab, items = []) {
  const el = document.getElementById('contentCenterCurrentHint');
  if (!el) return;

  const meta = getContentCenterMeta(tab);
  let text = meta.hint;

  if (tab === 'myPosts' && items.length) {
    text = `共 ${items.length} 条帖子，按发布时间倒序展示。`;
  } else if (tab === 'myReplies' && items.length) {
    text = `共 ${items.length} 条回复，点击即可进入对应帖子详情。`;
  } else if (tab === 'likedPosts' && items.length) {
    text = `共 ${items.length} 条点赞记录，适合回看感兴趣内容。`;
  } else if (tab === 'featuredPosts' && items.length) {
    text = `当前筛出 ${items.length} 条精选内容，综合热度与时效性动态更新。`;
  } else if (tab === 'notifications' && items.length) {
    text = `已汇总 ${items.length} 条互动提醒，包括回复和点赞。`;
  }

  el.textContent = text;
}

function contentCenterEmptyHtml(tab) {
  const meta = getContentCenterMeta(tab);
  return `
    <div class="empty content-center-empty">
      <div class="empty-icon" aria-hidden="true">📮</div>
      <p>${escapeHtml(meta.empty)}</p>
      <small>${escapeHtml(meta.hint)}</small>
    </div>
  `;
}

function contentCenterPostExcerpt(post) {
  const text = summarizeText(post.content || '', 88);
  if (text) {
    return text;
  }
  const imageCount = parsePostImages(post.images).length;
  if (imageCount > 0) {
    return `这是一条包含 ${imageCount} 张图片的图文内容。`;
  }
  return '点击查看完整内容';
}

function buildContentPostCard(post, options = {}) {
  const badges = [];
  if (options.pill) {
    badges.push(`<span class="content-feed-pill">${escapeHtml(options.pill)}</span>`);
  }
  if (Number(post.is_top) === 1) {
    badges.push('<span class="content-feed-pill content-feed-pill--hot">置顶</span>');
  }
  if (Number(post.is_anonymous) === 1) {
    badges.push('<span class="content-feed-pill content-feed-pill--anon">匿名</span>');
  }

  const noteText = options.note ? `<p class="content-feed-note">${escapeHtml(options.note)}</p>` : '';
  const imageStrip = postImagesStripHtml(parsePostImages(post.images));
  const imageCount = parsePostImages(post.images).length;
  const likes = Number(post.likes ?? post.like_count ?? 0);
  const comments = Number(post.comment_count ?? 0);
  const views = Number(post.view_count ?? 0);

  return `
    <article class="dashboard-card content-feed-card" data-reveal="up" onclick="showPostDetail(${Number(post.id)})">
      <div class="content-feed-top">
        <div class="content-feed-pills">${badges.join('')}</div>
        <time class="content-feed-time">${escapeHtml(formatTime(options.timeValue || post.created_at))}</time>
      </div>
      <h3 class="content-feed-title">${escapeHtml(post.title || '未命名帖子')}</h3>
      <p class="content-feed-excerpt">${escapeHtml(contentCenterPostExcerpt(post))}</p>
      ${imageStrip ? `<div class="content-feed-media">${imageStrip}</div>` : ''}
      ${noteText}
      <div class="content-feed-meta">
        <span>${imageCount ? `${imageCount} 张图` : '文字内容'}</span>
        <span>${views} 浏览</span>
        <span>${likes} 赞</span>
        <span>${comments} 评论</span>
      </div>
    </article>
  `;
}

function buildContentReplyCard(item) {
  const actorName = getCommentDisplayName(item);
  const actorAvatar = getCommentAvatar(item);
  const detailNote = Number(item.image_count || 0) > 0 ? `${Number(item.image_count || 0)} 张评论图` : '文字评论';
  const postPreview = item.post_preview || '点击进入帖子详情查看完整上下文。';

  return `
    <article class="dashboard-card content-feed-card content-feed-card--reply" data-reveal="up" onclick="showPostDetail(${Number(item.post_id)})">
      <div class="content-actor-row">
        <img class="content-actor-avatar" src="${actorAvatar}" alt="" width="42" height="42" loading="lazy">
        <div class="content-actor-copy">
          <div class="content-feed-top">
            <div class="content-feed-pills">
              <span class="content-feed-pill">收到回复</span>
              ${Number(item.is_anonymous) === 1 ? '<span class="content-feed-pill content-feed-pill--anon">匿名</span>' : ''}
            </div>
            <time class="content-feed-time">${escapeHtml(formatTime(item.created_at))}</time>
          </div>
          <h3 class="content-feed-title">${escapeHtml(actorName)} 回复了你</h3>
        </div>
      </div>
      <p class="content-feed-excerpt">${escapeHtml(item.reply_preview || '有人回复了你的帖子')}</p>
      <div class="content-reply-quote">
        <strong>${escapeHtml(item.post_title || '未命名帖子')}</strong>
        <p>${escapeHtml(postPreview)}</p>
      </div>
      <div class="content-feed-meta">
        <span>${escapeHtml(detailNote)}</span>
        <span>回复互动</span>
        <span>点击查看详情</span>
      </div>
    </article>
  `;
}

function buildContentNotificationCard(item) {
  const actorName = getCommentDisplayName(item);
  const actorAvatar = getCommentAvatar(item);
  const isLike = item.notify_type === 'like';
  const pill = isLike ? '收到点赞' : '回复提醒';

  return `
    <article class="dashboard-card content-feed-card content-feed-card--notify" data-reveal="up" onclick="showPostDetail(${Number(item.post_id)})">
      <div class="content-actor-row">
        <img class="content-actor-avatar" src="${actorAvatar}" alt="" width="42" height="42" loading="lazy">
        <div class="content-actor-copy">
          <div class="content-feed-top">
            <div class="content-feed-pills">
              <span class="content-feed-pill${isLike ? ' content-feed-pill--hot' : ''}">${pill}</span>
            </div>
            <time class="content-feed-time">${escapeHtml(formatTime(item.created_at))}</time>
          </div>
          <h3 class="content-feed-title">${escapeHtml(actorName)}${escapeHtml(item.message ? ` ${item.message}` : ' 触发了一条新通知')}</h3>
        </div>
      </div>
      <div class="content-reply-quote">
        <strong>${escapeHtml(item.post_title || '未命名帖子')}</strong>
        <p>点击进入帖子详情查看完整内容</p>
      </div>
      <div class="content-feed-meta">
        <span>${isLike ? '点赞互动' : '评论互动'}</span>
        <span>站内通知</span>
        <span>点击查看详情</span>
      </div>
    </article>
  `;
}

function renderContentCenterList(tab, items = []) {
  const listEl = document.getElementById('contentCenterList');
  if (!listEl) return;

  updateContentCenterTabsUI();
  updateContentCenterCurrentHint(tab, items);

  if (!items.length) {
    listEl.innerHTML = contentCenterEmptyHtml(tab);
    refreshMotionScene(listEl);
    return;
  }

  if (tab === 'myReplies') {
    listEl.innerHTML = items.map((item) => buildContentReplyCard(item)).join('');
  } else if (tab === 'notifications') {
    listEl.innerHTML = items.map((item) => buildContentNotificationCard(item)).join('');
  } else if (tab === 'likedPosts') {
    listEl.innerHTML = items.map((post) => buildContentPostCard(post, {
      pill: '点赞过',
      timeValue: post.liked_at || post.created_at,
      note: post.liked_at ? `点赞时间：${formatTime(post.liked_at)}` : '已加入你的点赞记录',
    })).join('');
  } else if (tab === 'featuredPosts') {
    listEl.innerHTML = items.map((post) => buildContentPostCard(post, {
      pill: '精选内容',
      note: post.featured_reason || '综合热度和时效性筛选进入精选',
    })).join('');
  } else {
    listEl.innerHTML = items.map((post) => buildContentPostCard(post, {
      pill: '我的帖子',
    })).join('');
  }

  refreshMotionScene(listEl);
}

async function fetchContentCenterTabData(tab, force = false) {
  if (!currentUser) {
    return [];
  }

  if (!force && Array.isArray(contentCenterState.cache[tab])) {
    return contentCenterState.cache[tab];
  }

  let res;
  if (tab === 'myReplies') {
    res = await forumAPI.getMyReplies(currentUser.id);
  } else if (tab === 'likedPosts') {
    res = await forumAPI.getLikedPosts(currentUser.id);
  } else if (tab === 'featuredPosts') {
    res = await forumAPI.getFeaturedPosts(currentUser.id);
  } else if (tab === 'notifications') {
    res = await forumAPI.getMyNotifications(currentUser.id);
  } else {
    res = await forumAPI.getMyPosts(currentUser.id);
  }

  const items = Array.isArray(res.data) ? res.data : [];
  contentCenterState.cache[tab] = items;
  return items;
}

async function loadContentCenterSummary(force = false) {
  const grid = document.getElementById('contentCenterSummaryGrid');
  if (!grid || !currentUser) return;

  if (!force && contentCenterState.summary) {
    renderContentCenterSummary(contentCenterState.summary);
    return;
  }

  grid.innerHTML = '<div class="insight-loading">正在汇总内容中心…</div>';
  const res = await forumAPI.getMyCenterSummary(currentUser.id);
  contentCenterState.summary = res.data || {};
  renderContentCenterSummary(contentCenterState.summary);
}

async function loadActiveContentCenterTab(force = false) {
  const listEl = document.getElementById('contentCenterList');
  if (!listEl) return;

  const tab = contentCenterState.activeTab;
  const meta = getContentCenterMeta(tab);
  updateContentCenterTabsUI();

  if (!currentUser) {
    listEl.innerHTML = '';
    return;
  }

  if (!force && Array.isArray(contentCenterState.cache[tab])) {
    renderContentCenterList(tab, contentCenterState.cache[tab]);
    return;
  }

  const token = ++contentCenterState.requestId;
  listEl.innerHTML = `<div class="insight-loading">正在加载${escapeHtml(meta.label)}…</div>`;

  try {
    const items = await fetchContentCenterTabData(tab, force);
    if (token !== contentCenterState.requestId || contentCenterState.activeTab !== tab) {
      return;
    }
    renderContentCenterList(tab, items);
  } catch (error) {
    if (token !== contentCenterState.requestId || contentCenterState.activeTab !== tab) {
      return;
    }
    listEl.innerHTML = `
      <div class="empty content-center-empty">
        <div class="empty-icon" aria-hidden="true">📭</div>
        <p>${escapeHtml(error.message || `${meta.label}加载失败`)}</p>
        <small>可点击右上角刷新内容重试。</small>
      </div>
    `;
  }
}

async function loadContentCenter(force = false) {
  ensureContentCenterUserState();

  const guestSection = document.getElementById('contentCenterGuestSection');
  const mainSection = document.getElementById('contentCenterMain');
  if (!guestSection || !mainSection) return;

  if (!currentUser) {
    renderContentCenterGuest();
    return;
  }

  guestSection.classList.add('hidden');
  mainSection.classList.remove('hidden');
  if (!contentCenterState.summary) {
    setProfileContentEntryHint('集中查看帖子、回复和通知');
  }

  const [summaryResult] = await Promise.allSettled([
    loadContentCenterSummary(force),
    loadActiveContentCenterTab(force),
  ]);

  if (summaryResult.status === 'rejected' && !contentCenterState.summary) {
    const grid = document.getElementById('contentCenterSummaryGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty content-center-empty">
          <div class="empty-icon" aria-hidden="true">📊</div>
          <p>${escapeHtml(summaryResult.reason?.message || '内容概况加载失败')}</p>
          <small>可点击右上角刷新内容重试。</small>
        </div>
      `;
    }
  }
  refreshMotionScene(document.getElementById('contentCenterPage'));
}

async function setContentCenterTab(tab) {
  if (!CONTENT_CENTER_TAB_META[tab]) return;
  contentCenterState.activeTab = tab;
  updateContentCenterTabsUI();
  updateContentCenterCurrentHint(tab, contentCenterState.cache[tab] || []);

  if (currentTab === 'contentCenter') {
    await loadActiveContentCenterTab(false);
  }
}

function refreshContentCenter() {
  invalidateContentCenterCache();
  loadContentCenter(true);
}

function openContentCenterPage() {
  switchTab('contentCenter');
}

function renderGuestBehaviorCard() {
  const section = document.getElementById('behaviorInsightsSection');
  const card = document.getElementById('userBehaviorCard');
  if (!section || !card) return;

  setProfileBehaviorEntryHint('查看兴趣和活跃情况');
  renderHeroMeta('behaviorHeroMeta', [
    { label: '画像状态', value: '待生成', note: '登录后开始记录搜索、浏览和互动行为' },
    { label: '推荐联动', value: '未开启', note: '推荐栏目会在登录后同步使用画像结果' },
    { label: '答辩重点', value: '行为分析', note: '这是论坛系统与大数据方向结合的核心模块' },
  ]);

  section.classList.remove('hidden');
  card.innerHTML = `
    <div class="insight-hero">
      <div>
        <p class="section-eyebrow">行为画像</p>
        <h3 class="insight-title">登录后生成你的专属画像</h3>
        <p class="insight-copy">系统会根据搜索、浏览、点赞、评论和发帖行为构建兴趣画像，这是这个毕业项目里“用户行为分析”的核心展示区域。</p>
      </div>
      <div class="insight-tags">
        <span class="insight-tag">游客模式</span>
        <span class="insight-tag">画像待生成</span>
      </div>
    </div>
    <div class="insight-metrics">
      <div class="insight-metric"><span>活跃分</span><strong>0</strong></div>
      <div class="insight-metric"><span>画像阶段</span><strong>待登录</strong></div>
      <div class="insight-metric"><span>近30天活跃日</span><strong>0</strong></div>
      <div class="insight-metric"><span>互动深度</span><strong>0</strong></div>
    </div>
    <div class="insight-subcard">
      <h4>如何触发个性化分析</h4>
      <div class="behavior-list">
        <div class="behavior-row"><div><strong>搜索内容</strong><span>记录关键词偏好</span></div><time>实时</time></div>
        <div class="behavior-row"><div><strong>浏览帖子</strong><span>识别浏览深度和停留偏好</span></div><time>实时</time></div>
        <div class="behavior-row"><div><strong>点赞评论发帖</strong><span>提高用户画像精度</span></div><time>实时</time></div>
      </div>
    </div>
  `;
  refreshMotionScene(section);
}

function renderGuestRecommendProfileCard() {
  const card = document.getElementById('homeRecommendProfileCard');
  if (!card) return;
  card.innerHTML = `
    <div class="recommend-profile-hero">
      <div>
        <p class="section-eyebrow">推荐画像</p>
        <h3 class="insight-title">登录后查看你的推荐依据</h3>
        <p class="insight-copy">推荐栏目会展示系统如何根据你的行为、关键词和互动信号为你挑选内容。</p>
      </div>
      <div class="insight-tags">
        <span class="insight-tag">游客模式</span>
        <span class="insight-tag">推荐待生成</span>
      </div>
    </div>
    <div class="recommend-profile-grid">
      <div class="recommend-profile-metric"><span>画像阶段</span><strong>待登录</strong></div>
      <div class="recommend-profile-metric"><span>活跃分</span><strong>0</strong></div>
      <div class="recommend-profile-metric"><span>近30天活跃日</span><strong>0</strong></div>
    </div>
  `;
}

function resetPersonalizedUI() {
  const recommendTitle = document.getElementById('recommendSectionTitle');
  const recommendHint = document.getElementById('recommendSectionHint');

  renderGuestBehaviorCard();
  renderGuestRecommendProfileCard();
  homeOverviewState = { profile: {}, items: [] };

  if (recommendTitle) recommendTitle.textContent = '站内推荐';
  if (recommendHint) recommendHint.textContent = '登录后升级为个性化推荐。';
  syncHomeModeUI();
}

function renderHomeRecommendProfile(summary = {}) {
  const card = document.getElementById('homeRecommendProfileCard');
  if (!card) return;

  const profileStage = getProfileStageLabel(summary);
  const tags = getBehaviorTags(summary);
  const keywords = Array.isArray(summary.top_keywords) ? summary.top_keywords.slice(0, 4) : [];
  const tagHtml = (tags.length ? tags : ['推荐模型已启动']).map((tag) => (
    `<span class="insight-tag">${escapeHtml(tag)}</span>`
  )).join('');
  const keywordHtml = keywords.length
    ? keywords.map((word) => `<span class="keyword-chip">${escapeHtml(word)}</span>`).join('')
    : '<span class="keyword-chip">继续使用后生成</span>';

  card.innerHTML = `
    <div class="recommend-profile-hero">
      <div>
        <p class="section-eyebrow">推荐画像</p>
        <h3 class="insight-title">${escapeHtml(Number(summary.active_score || 0) > 0 ? '你的推荐画像已形成' : '你的推荐画像正在建立')}</h3>
        <p class="insight-copy">系统会根据近期关键词、浏览轨迹和互动反馈生成推荐。</p>
      </div>
      <div class="insight-tags">${tagHtml}</div>
    </div>
    <div class="recommend-profile-grid">
      <div class="recommend-profile-metric"><span>画像阶段</span><strong>${escapeHtml(profileStage)}</strong></div>
      <div class="recommend-profile-metric"><span>活跃分</span><strong>${Number(summary.active_score || 0)}</strong></div>
      <div class="recommend-profile-metric"><span>近30天活跃日</span><strong>${Number(summary.recent_active_days || 0)}</strong></div>
    </div>
    <div class="recommend-profile-keywords">
      <h4>关键词依据</h4>
      <div class="keyword-list">${keywordHtml}</div>
    </div>
  `;
}

function renderUserBehaviorSummary(summary = {}) {
  const section = document.getElementById('behaviorInsightsSection');
  const card = document.getElementById('userBehaviorCard');
  if (!section || !card) return;

  section.classList.remove('hidden');

  const tags = getBehaviorTags(summary);
  const preferences = getBehaviorPreferenceRows(summary);
  const keywords = Array.isArray(summary.top_keywords) ? summary.top_keywords : [];
  const recentBehaviors = Array.isArray(summary.recent_behaviors) ? summary.recent_behaviors : [];
  const profileStage = getProfileStageLabel(summary);
  const preferenceMax = preferences.reduce((max, item) => Math.max(max, Number(item.score || 0)), 1);
  const interactionDepth = behaviorCount(summary, 'create_post') + behaviorCount(summary, 'comment_post') + behaviorCount(summary, 'like_post');
  renderHeroMeta('behaviorHeroMeta', [
    { label: '活跃分', value: Number(summary.active_score || 0), note: '根据近期开启的行为事件动态计算' },
    { label: '画像阶段', value: profileStage, note: '会随着浏览、搜索和互动持续迭代' },
    { label: '互动深度', value: interactionDepth, note: '由发帖、评论和点赞共同构成' },
  ]);

  const tagHtml = (tags.length ? tags : ['画像建立中']).map((tag) => (
    `<span class="insight-tag">${escapeHtml(tag)}</span>`
  )).join('');

  const preferenceHtml = preferences.length
    ? preferences.map((item) => {
      const score = Number(item.score || 0);
      const width = Math.max(18, Math.round((score / preferenceMax) * 100));
      return `
        <div class="pref-row">
          <div class="pref-head">
            <span>${escapeHtml(item.label || '其他')}</span>
            <strong>${score}</strong>
          </div>
          <div class="pref-bar"><span style="width:${width}%"></span></div>
        </div>
      `;
    }).join('')
    : '<p class="insight-empty">再多浏览一些内容，系统会逐渐识别你的兴趣偏好。</p>';

  const keywordHtml = keywords.length
    ? `<div class="keyword-list">${keywords.map((word) => `<span class="keyword-chip">${escapeHtml(word)}</span>`).join('')}</div>`
    : '<p class="insight-empty">当前关键词样本还不多，继续搜索或浏览后会更准确。</p>';

  const recentHtml = recentBehaviors.length
    ? recentBehaviors.map((item) => `
      <div class="behavior-row">
        <div>
          <strong>${escapeHtml(item.label || '浏览内容')}</strong>
          <span>${escapeHtml(getBehaviorEventNote(item.behavior_type))}</span>
        </div>
        <time>${escapeHtml(formatTime(item.created_at))}</time>
      </div>
    `).join('')
    : '<p class="insight-empty">继续使用后显示最近行为。</p>';

  card.innerHTML = `
    <div class="insight-hero">
      <div>
        <p class="section-eyebrow">实时画像</p>
        <h3 class="insight-title">${Number(summary.active_score || 0) > 0 ? '你的兴趣画像已生成' : '你的兴趣画像正在建立'}</h3>
        <p class="insight-copy">这部分会实时分析你的论坛行为，用于毕业设计中的用户画像与推荐逻辑展示。</p>
      </div>
      <div class="insight-tags">${tagHtml}</div>
    </div>
    <div class="insight-metrics">
      <div class="insight-metric"><span>活跃分</span><strong>${Number(summary.active_score || 0)}</strong></div>
      <div class="insight-metric"><span>画像阶段</span><strong>${escapeHtml(profileStage)}</strong></div>
      <div class="insight-metric"><span>近30天活跃日</span><strong>${Number(summary.recent_active_days || 0)}</strong></div>
      <div class="insight-metric"><span>互动深度</span><strong>${interactionDepth}</strong></div>
    </div>
    <div class="insight-columns">
      <div class="insight-subcard">
        <h4>行为偏好</h4>
        ${preferenceHtml}
      </div>
      <div class="insight-subcard">
        <h4>高频关键词</h4>
        ${keywordHtml}
      </div>
    </div>
    <div class="insight-subcard">
      <h4>最近行为</h4>
      <div class="behavior-list">${recentHtml}</div>
    </div>
  `;

  setProfileBehaviorEntryHint(`${profileStage} · 活跃分 ${Number(summary.active_score || 0)}`);
  renderHomeRecommendProfile(summary);
  refreshMotionScene(document.getElementById('behaviorPage'));
}

async function loadUserBehaviorSummary() {
  const section = document.getElementById('behaviorInsightsSection');
  const card = document.getElementById('userBehaviorCard');
  const homeCard = document.getElementById('homeRecommendProfileCard');
  if (!section || !card) return;

  if (!currentUser) {
    renderGuestBehaviorCard();
    renderGuestRecommendProfileCard();
    return;
  }

  section.classList.remove('hidden');
  card.innerHTML = '<div class="insight-loading">正在分析…</div>';
  if (homeCard) {
    homeCard.innerHTML = '<div class="insight-loading">正在分析…</div>';
  }

  try {
    const res = await forumAPI.getUserBehaviorSummary(currentUser.id);
    renderUserBehaviorSummary(res.data?.summary || {});
  } catch (error) {
    card.innerHTML = `<p class="insight-empty">${escapeHtml(error.message || '画像加载失败')}</p>`;
    if (homeCard) {
      homeCard.innerHTML = `<p class="insight-empty">${escapeHtml(error.message || '推荐画像加载失败')}</p>`;
    }
  }
}

function renderRecommendedPosts(items, profile = {}) {
  const section = document.getElementById('recommendSection');
  const titleEl = document.getElementById('recommendSectionTitle');
  const hintEl = document.getElementById('recommendSectionHint');
  const listEl = document.getElementById('recommendList');
  if (!section || !titleEl || !hintEl || !listEl) return;

  homeOverviewState = { profile, items };

  if (!currentUser) {
    titleEl.textContent = '站内推荐';
    hintEl.textContent = '登录后升级为个性化推荐。';
  } else {
    const profileStage = getProfileStageLabel(profile);
    titleEl.textContent = '为你推荐';
    hintEl.textContent = Array.isArray(profile.top_keywords) && profile.top_keywords.length
      ? `综合关键词 ${profile.top_keywords.slice(0, 3).map((item) => `“${item}”`).join('、')} 与${profileStage}画像生成`
      : `根据${profileStage}画像与近期互动生成`;
  }

  if (!items.length) {
    listEl.innerHTML = '<p class="insight-empty">暂时还没有可推荐内容，继续活跃后推荐会更准确。</p>';
    return;
  }

  listEl.innerHTML = items.map((post) => {
    const likes = Number(post.likes ?? post.like_count ?? 0);
    const comments = Number(post.comment_count ?? 0);
    const excerpt = summarizeText(post.content || (parsePostImages(post.images).length ? '这是一条图文内容，适合继续浏览。' : ''));
    return `
      <article class="recommend-card" data-reveal="up" onclick="showPostDetail(${post.id})">
        <div class="recommend-header">
          <span class="recommend-pill">推荐内容</span>
          <span class="recommend-reason">${escapeHtml(post.recommended_reason || '你可能感兴趣')}</span>
        </div>
        <h3 class="recommend-title">${escapeHtml(post.title || '未命名帖子')}</h3>
        <p class="recommend-excerpt">${escapeHtml(excerpt || '点进查看详情')}</p>
        <div class="recommend-footer">
          <span>${escapeHtml(formatTime(post.created_at))}</span>
          <span>${likes} 赞</span>
          <span>${comments} 评论</span>
        </div>
      </article>
    `;
  }).join('');
  refreshMotionScene(listEl);
}

async function loadRecommendedPosts() {
  const section = document.getElementById('recommendSection');
  const listEl = document.getElementById('recommendList');
  if (!section || !listEl) return;

  listEl.innerHTML = '<div class="insight-loading">推荐生成中…</div>';

  try {
    const res = await forumAPI.getRecommendedPosts(currentUser ? currentUser.id : 0, 6);
    renderRecommendedPosts(Array.isArray(res.data) ? res.data : [], res.profile || {});
  } catch (error) {
    listEl.innerHTML = `<p class="insight-empty">${escapeHtml(error.message || '推荐加载失败')}</p>`;
  }
}

function renderHomeAuthPrompt(tabId) {
  const listEl = document.getElementById('postList');
  if (!listEl) return;
  const meta = getHomeTabMeta(tabId);
  homeOverviewState = { channelId: tabId, items: [], requiresLogin: true };
  listEl.innerHTML = `
    <article class="dashboard-card content-feed-card" data-reveal="up">
      <div class="content-feed-pills">
        <span class="content-feed-pill">${escapeHtml(meta.label)}</span>
      </div>
      <h3 class="content-feed-title">登录后查看${escapeHtml(meta.label)}</h3>
      <p class="content-feed-excerpt">${escapeHtml(meta.desc)}</p>
      <div class="profile-account-actions">
        <button type="button" class="profile-primary-btn" onclick="showLogin()">登录</button>
        <button type="button" class="profile-secondary-btn" onclick="showRegister()">注册</button>
      </div>
    </article>
  `;
  renderHomeFeedOverview();
  refreshMotionScene(listEl);
}

function renderHomeSpecialFeed(tabId, items = []) {
  const listEl = document.getElementById('postList');
  if (!listEl) return;

  homeOverviewState = { channelId: tabId, items };
  if (!items.length) {
    listEl.innerHTML = contentCenterEmptyHtml(
      tabId === 6 ? 'featuredPosts'
        : (tabId === 7 ? 'myPosts'
          : (tabId === 8 ? 'myReplies'
            : (tabId === 9 ? 'likedPosts' : 'notifications'))),
    );
    renderHomeFeedOverview();
    refreshMotionScene(listEl);
    return;
  }

  if (tabId === 8) {
    listEl.innerHTML = items.map((item) => buildContentReplyCard(item)).join('');
  } else if (tabId === 10) {
    listEl.innerHTML = items.map((item) => buildContentNotificationCard(item)).join('');
  } else if (tabId === 9) {
    listEl.innerHTML = items.map((post) => buildContentPostCard(post, {
      pill: '点赞过',
      timeValue: post.liked_at || post.created_at,
      note: post.liked_at ? `点赞时间：${formatTime(post.liked_at)}` : '已加入你的点赞记录',
    })).join('');
  } else if (tabId === 7) {
    listEl.innerHTML = items.map((post) => buildContentPostCard(post, {
      pill: '我的帖子',
      note: '你发布的内容会按发布时间倒序展示。',
    })).join('');
  } else {
    listEl.innerHTML = items.map((post) => buildContentPostCard(post, {
      pill: '精选内容',
      note: post.featured_reason || '综合热度和时效性筛选进入精选',
    })).join('');
  }

  renderHomeFeedOverview();
  refreshMotionScene(listEl);
}

async function loadHomeSpecialFeed(tabId) {
  const listEl = document.getElementById('postList');
  if (!listEl) return;

  if (isHomePersonalTab(tabId) && !currentUser) {
    renderHomeAuthPrompt(tabId);
    return;
  }

  listEl.innerHTML = '<div class="insight-loading">内容加载中…</div>';

  let res;
  if (tabId === 6) {
    res = await forumAPI.getFeaturedPosts(currentUser ? currentUser.id : 0);
  } else if (tabId === 7) {
    res = await forumAPI.getMyPosts(currentUser.id);
  } else if (tabId === 8) {
    res = await forumAPI.getMyReplies(currentUser.id);
  } else if (tabId === 9) {
    res = await forumAPI.getLikedPosts(currentUser.id);
  } else {
    res = await forumAPI.getMyNotifications(currentUser.id);
  }

  renderHomeSpecialFeed(tabId, Array.isArray(res.data) ? res.data : []);
}

async function loadPersonalizedData() {
  if (!currentUser) {
    resetPersonalizedUI();
    await loadRecommendedPosts();
    syncHomeModeUI();
    return;
  }

  await Promise.allSettled([
    loadUserBehaviorSummary(),
    loadRecommendedPosts(),
  ]);
  syncHomeModeUI();
}

async function loadPosts(options = {}) {
  const { reset = false } = options;
  const listEl = document.getElementById('postList');
  if (!listEl || isLoadingPosts) return;

  if (!isHomeSpecialTab() && !isHomeRecommendTab()) {
    homeOverviewState = null;
  }

  syncHomeModeUI();

  if (isHomeRecommendTab()) {
    posts = [];
    hasMorePosts = false;
    isLoadingPosts = false;
    updateLoadMoreButton();
    await loadPersonalizedData();
    return;
  }

  if (isHomeSpecialTab()) {
    posts = [];
    hasMorePosts = false;
    isLoadingPosts = false;
    updateLoadMoreButton();
    try {
      await loadHomeSpecialFeed(currentCategory);
    } catch (error) {
      listEl.innerHTML = `<div class="empty"><div class="empty-icon" aria-hidden="true">📭</div><p>${escapeHtml(error.message || '加载失败')}</p><button type="button" class="retry-btn" onclick="loadPosts({ reset: true })">重试</button></div>`;
      homeOverviewState = { channelId: currentCategory, items: [] };
      renderHomeFeedOverview();
    }
    return;
  }

  if (reset) {
    currentPage = 1;
    hasMorePosts = false;
    posts = [];
    listEl.innerHTML = '<div class="loading"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></div>';
  }

  isLoadingPosts = true;
  updateLoadMoreButton();

  try {
    const result = await forumAPI.getPosts(getPostQueryOptions(currentPage));
    const rows = Array.isArray(result.data) ? result.data : [];
    if (reset) {
      posts = rows;
    } else {
      posts = posts.concat(rows);
    }

    const pagination = result.pagination || {};
    hasMorePosts = Number(pagination.has_more) === 1 || pagination.has_more === true;
    renderPosts(posts);
  } catch (error) {
    listEl.innerHTML = `<div class="empty"><div class="empty-icon" aria-hidden="true">📭</div><p>${escapeHtml(error.message || '加载失败')}</p><button type="button" class="retry-btn" onclick="loadPosts({ reset: true })">重试</button></div>`;
  } finally {
    isLoadingPosts = false;
    updateLoadMoreButton();
  }
}

function renderPosts(postsData) {
  const listEl = document.getElementById('postList');

  if (postsData.length === 0) {
    listEl.innerHTML = '<div class="empty"><div class="empty-icon" aria-hidden="true">✨</div><p>没有找到符合条件的帖子</p></div>';
    renderHomeFeedOverview();
    return;
  }

  listEl.innerHTML = postsData.map((post) => {
    const likes = Number(post.likes ?? post.like_count ?? 0);
    const comments = Number(post.comment_count ?? 0);
    const av = getPostAvatar(post);
    const nick = escapeHtml(getPostDisplayName(post));
    const pin = Number(post.is_top) ? '<span class="post-pin">置顶</span>' : '';
    const anonymousBadge = isAnonymousPost(post) ? '<span class="post-anon-badge">匿名</span>' : '';
    const imgs = parsePostImages(post.images);
    const strip = postImagesStripHtml(imgs);
    const text = post.content ? `<p class="post-content">${escapeHtml(post.content)}</p>` : '';
    const mediaBadge = imgs.length
      ? `<span class="post-media-badge">${imgs.length} 张图</span>`
      : '<span class="post-media-badge post-media-badge--text">文字帖</span>';
    const mediaTip = imgs.length
      ? '点图片可预览，点卡片看详情'
      : '点卡片查看完整内容';
    const adminInfoBtn = renderPostAdminInfoButton(post.id);
    return `
    <article class="post-item" data-reveal="up" onclick="showPostDetail(${post.id})">
      <div class="post-header">
        <img class="post-avatar" src="${av}" alt="" width="40" height="40" loading="lazy">
        <div class="post-info">
          <div class="post-nickname">${nick}${anonymousBadge}</div>
          <div class="post-meta">${formatTime(post.created_at)}</div>
        </div>
        <div class="post-header-right">
          ${pin}
          ${adminInfoBtn}
        </div>
      </div>
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      <div class="post-signal-row">
        ${mediaBadge}
        <span class="post-media-tip">${escapeHtml(mediaTip)}</span>
      </div>
      ${strip}
      ${text}
      <div class="post-stats">
        <span class="stat-item" title="浏览"><span class="stat-ico" aria-hidden="true">👁</span>${post.view_count ?? 0}</span>
        <span class="stat-item likeable${Number(post.liked_by_me) === 1 ? ' active' : ''}" title="点赞" onclick="togglePostLike(${post.id}, event)"><span class="stat-ico" aria-hidden="true">❤️</span>${likes}</span>
        <span class="stat-item" title="评论"><span class="stat-ico" aria-hidden="true">💬</span>${comments}</span>
      </div>
    </article>`;
  }).join('');
  renderHomeFeedOverview();
  refreshMotionScene(listEl);
}

async function filterCategory(catId) {
  currentCategory = catId;
  document.querySelectorAll('.categories .cat-btn').forEach((btn) => {
    if (btn.classList.contains('post-btn')) return;
    btn.classList.toggle('active', parseInt(btn.dataset.id, 10) === catId);
  });
  syncHomeModeUI();
  await loadPosts({ reset: true });
}

async function applySearch() {
  const input = document.getElementById('postSearchInput');
  postSearchKeyword = input ? input.value.trim() : '';
  await loadPosts({ reset: true });
}

async function loadMorePosts() {
  if (!hasMorePosts || isLoadingPosts) return;
  currentPage += 1;
  await loadPosts();
}

function resetPostDraft() {
  postDraftImageUrls = [];
  const prev = document.getElementById('postImagesPreview');
  if (prev) prev.innerHTML = '';
  const inp = document.getElementById('postImagesInput');
  if (inp) inp.value = '';
  const anonymousEl = document.getElementById('postAnonymous');
  if (anonymousEl) anonymousEl.checked = false;
}

function checkAuthAndPost() {
  if (!currentUser) {
    showToast('请先登录');
    showLogin();
    return;
  }
  if (userIsMuted()) {
    showToast('您已被禁言，无法发帖');
    return;
  }
  resetPostDraft();
  openModal('postModal');
}

async function onPostImagesSelected(ev) {
  const input = ev.target;
  const files = input.files ? Array.from(input.files) : [];
  if (!files.length || !currentUser) return;

  const remain = 9 - postDraftImageUrls.length;
  if (remain <= 0) {
    showToast('最多 9 张图片');
    input.value = '';
    return;
  }

  const batch = files.slice(0, remain);
  for (const file of batch) {
    try {
      const res = await forumAPI.uploadImage(currentUser.id, file);
      if (res.data && res.data.url) {
        postDraftImageUrls.push(res.data.url);
      }
    } catch (e) {
      showToast(e.message || '上传失败');
    }
  }
  input.value = '';
  renderPostDraftPreview();
}

function renderPostDraftPreview() {
  const el = document.getElementById('postImagesPreview');
  if (!el) return;
  el.innerHTML = postDraftImageUrls.map((u, i) => `
    <div class="draft-thumb-wrap">
      <img class="draft-thumb" src="${escapeHtml(u)}" alt="">
      <button type="button" class="draft-remove" aria-label="删除" onclick="removeDraftImage(${i})">×</button>
    </div>
  `).join('');
}

function removeDraftImage(index) {
  postDraftImageUrls.splice(index, 1);
  renderPostDraftPreview();
}

function resetCommentDraft() {
  commentDraftImageUrls = [];
  const prev = document.getElementById('commentImagesPreview');
  if (prev) prev.innerHTML = '';
  const inp = document.getElementById('commentImagesInput');
  if (inp) inp.value = '';
  const anonymousEl = document.getElementById('commentAnonymous');
  if (anonymousEl) anonymousEl.checked = false;
}

async function onCommentImagesSelected(ev) {
  const input = ev.target;
  const files = Array.from(input.files || []);
  if (!files.length || !currentUser) return;

  const remain = COMMENT_IMAGE_LIMIT - commentDraftImageUrls.length;
  if (remain <= 0) {
    showToast(`最多 ${COMMENT_IMAGE_LIMIT} 张图片`);
    input.value = '';
    return;
  }

  for (const file of files.slice(0, remain)) {
    try {
      const res = await forumAPI.uploadImage(currentUser.id, file);
      if (res && res.data && res.data.url) {
        commentDraftImageUrls.push(res.data.url);
      }
    } catch (e) {
      showToast(e.message || '上传失败');
    }
  }

  input.value = '';
  renderCommentDraftPreview();
  setCommentComposerExpanded(true);
}

function renderCommentDraftPreview() {
  const el = document.getElementById('commentImagesPreview');
  if (!el) return;
  el.innerHTML = commentDraftImageUrls.map((u, i) => `
    <div class="draft-thumb-wrap">
      <img class="draft-thumb" src="${escapeHtml(u)}" alt="">
      <button type="button" class="draft-remove" aria-label="删除" onclick="removeCommentDraftImage(${i})">×</button>
    </div>
  `).join('');
}

function removeCommentDraftImage(index) {
  commentDraftImageUrls.splice(index, 1);
  renderCommentDraftPreview();
  collapseCommentComposerIfIdle();
}

function bindCommentComposerEvents() {
  const input = document.getElementById('commentText');
  if (!input || input.dataset.bound === '1') return;
  input.dataset.bound = '1';

  input.addEventListener('focus', () => {
    setCommentComposerExpanded(true);
  });
  input.addEventListener('input', () => {
    autoResizeCommentInput();
    setCommentComposerExpanded(true);
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      collapseCommentComposerIfIdle();
    }, 120);
  });

  autoResizeCommentInput(true);
}

function getCommentComposerBox() {
  return document.getElementById('commentComposerBox');
}

function getCommentComposerExtras() {
  return document.getElementById('commentComposerExtras');
}

function autoResizeCommentInput(forceCompact = false) {
  const input = document.getElementById('commentText');
  if (!input) return;

  input.style.height = 'auto';
  const minHeight = forceCompact ? 46 : 84;
  input.style.height = `${Math.max(minHeight, input.scrollHeight)}px`;
}

function setCommentComposerExpanded(expanded) {
  const box = getCommentComposerBox();
  const extras = getCommentComposerExtras();
  if (!box || !extras) return;

  box.classList.toggle('expanded', expanded);
  extras.classList.toggle('hidden', !expanded);
  autoResizeCommentInput(!expanded);
}

function collapseCommentComposerIfIdle() {
  const input = document.getElementById('commentText');
  if (!input) return;
  if (document.activeElement === input) return;
  if (input.value.trim() || commentDraftImageUrls.length > 0) {
    setCommentComposerExpanded(true);
    return;
  }
  setCommentComposerExpanded(false);
}

function getImageViewerStage() {
  return document.getElementById('imageViewerStage');
}

function getImageViewerImage() {
  return document.getElementById('imageViewerImage');
}

function getImageViewerCaption() {
  return document.getElementById('imageViewerCaption');
}

function bindImageViewerEvents() {
  const stage = getImageViewerStage();
  const image = getImageViewerImage();
  if (!stage || !image || stage.dataset.bound === '1') return;

  stage.dataset.bound = '1';

  stage.addEventListener('wheel', handleImageViewerWheel, { passive: false });
  stage.addEventListener('mousedown', handleImageViewerMouseDown);
  stage.addEventListener('mousemove', handleImageViewerMouseMove);
  stage.addEventListener('mouseup', stopImageViewerDrag);
  stage.addEventListener('mouseleave', stopImageViewerDrag);
  stage.addEventListener('dblclick', () => {
    if (imageViewerScale > 1.05) resetImageViewerTransform();
    else setImageViewerScale(2);
  });
  stage.addEventListener('touchstart', handleImageViewerTouchStart, { passive: false });
  stage.addEventListener('touchmove', handleImageViewerTouchMove, { passive: false });
  stage.addEventListener('touchend', handleImageViewerTouchEnd, { passive: false });
  stage.addEventListener('touchcancel', handleImageViewerTouchEnd, { passive: false });
  document.addEventListener('keydown', handleImageViewerKeydown);

  image.addEventListener('load', () => {
    resetImageViewerTransform();
  });
}

function updateImageViewerCaption() {
  const captionEl = getImageViewerCaption();
  if (!captionEl || !imageViewerUrls.length) return;
  captionEl.textContent = `第 ${imageViewerIndex + 1} 张 / 共 ${imageViewerUrls.length} 张${imageViewerScale > 1.05 ? ' · 已放大' : ''}`;
}

function clampImageViewerOffset() {
  const stage = getImageViewerStage();
  const image = getImageViewerImage();
  if (!stage || !image || !image.naturalWidth || !image.naturalHeight) return;

  const stageRect = stage.getBoundingClientRect();
  const stageWidth = Math.max(1, stageRect.width);
  const stageHeight = Math.max(1, stageRect.height);
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const stageRatio = stageWidth / stageHeight;

  let baseWidth = stageWidth;
  let baseHeight = stageWidth / imageRatio;
  if (imageRatio < stageRatio) {
    baseHeight = stageHeight;
    baseWidth = stageHeight * imageRatio;
  }

  const scaledWidth = baseWidth * imageViewerScale;
  const scaledHeight = baseHeight * imageViewerScale;
  const maxOffsetX = Math.max(0, (scaledWidth - stageWidth) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - stageHeight) / 2);

  imageViewerOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, imageViewerOffsetX));
  imageViewerOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, imageViewerOffsetY));
}

function applyImageViewerTransform() {
  const stage = getImageViewerStage();
  const image = getImageViewerImage();
  if (!image) return;

  clampImageViewerOffset();
  if (stage) {
    stage.classList.toggle('is-zoomed', imageViewerScale > 1.05);
  }
  image.style.transform = `translate3d(${imageViewerOffsetX}px, ${imageViewerOffsetY}px, 0) scale(${imageViewerScale})`;
  updateImageViewerCaption();
}

function resetImageViewerTransform() {
  imageViewerScale = 1;
  imageViewerOffsetX = 0;
  imageViewerOffsetY = 0;
  applyImageViewerTransform();
}

function setImageViewerScale(nextScale, centerX = 0, centerY = 0) {
  const clampedScale = Math.max(1, Math.min(5, nextScale));
  const ratio = clampedScale / imageViewerScale;
  imageViewerOffsetX = imageViewerOffsetX * ratio + centerX * (1 - ratio);
  imageViewerOffsetY = imageViewerOffsetY * ratio + centerY * (1 - ratio);
  imageViewerScale = clampedScale;
  applyImageViewerTransform();
}

function zoomImageViewerBy(delta) {
  setImageViewerScale(imageViewerScale + delta);
}

function renderImageViewerImage() {
  const imageEl = getImageViewerImage();
  if (!imageEl || !imageViewerUrls.length) return;
  imageEl.src = imageViewerUrls[imageViewerIndex];
  resetImageViewerTransform();
  updateImageViewerCaption();
}

function viewPrevImage() {
  if (!imageViewerUrls.length) return;
  imageViewerIndex = (imageViewerIndex - 1 + imageViewerUrls.length) % imageViewerUrls.length;
  renderImageViewerImage();
}

function viewNextImage() {
  if (!imageViewerUrls.length) return;
  imageViewerIndex = (imageViewerIndex + 1) % imageViewerUrls.length;
  renderImageViewerImage();
}

function handleImageViewerKeydown(event) {
  const modal = document.getElementById('imageViewerModal');
  if (!modal || modal.classList.contains('hidden')) return;

  if (event.key === 'Escape') {
    closeModal('imageViewerModal');
  } else if (event.key === 'ArrowLeft' && imageViewerUrls.length > 1) {
    viewPrevImage();
  } else if (event.key === 'ArrowRight' && imageViewerUrls.length > 1) {
    viewNextImage();
  } else if (event.key === '+' || event.key === '=') {
    zoomImageViewerBy(0.18);
  } else if (event.key === '-') {
    zoomImageViewerBy(-0.18);
  }
}

function handleImageViewerWheel(event) {
  if (document.getElementById('imageViewerModal')?.classList.contains('hidden')) return;
  const stage = getImageViewerStage();
  if (!stage) return;

  event.preventDefault();
  const rect = stage.getBoundingClientRect();
  const centerX = event.clientX - rect.left - rect.width / 2;
  const centerY = event.clientY - rect.top - rect.height / 2;
  const delta = event.deltaY < 0 ? 0.16 : -0.16;
  setImageViewerScale(imageViewerScale + delta, centerX, centerY);
}

function handleImageViewerMouseDown(event) {
  if (imageViewerScale <= 1) return;
  event.preventDefault();
  imageViewerDrag = {
    startX: event.clientX,
    startY: event.clientY,
    originX: imageViewerOffsetX,
    originY: imageViewerOffsetY,
  };
}

function handleImageViewerMouseMove(event) {
  if (!imageViewerDrag) return;
  event.preventDefault();
  imageViewerOffsetX = imageViewerDrag.originX + (event.clientX - imageViewerDrag.startX);
  imageViewerOffsetY = imageViewerDrag.originY + (event.clientY - imageViewerDrag.startY);
  applyImageViewerTransform();
}

function stopImageViewerDrag() {
  imageViewerDrag = null;
}

function getTouchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(touches) {
  if (!touches || touches.length < 2) return { x: 0, y: 0 };
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function handleImageViewerTouchStart(event) {
  if (document.getElementById('imageViewerModal')?.classList.contains('hidden')) return;

  if (event.touches.length === 2) {
    const midpoint = getTouchMidpoint(event.touches);
    imageViewerPinch = {
      distance: getTouchDistance(event.touches),
      scale: imageViewerScale,
      midpointX: midpoint.x,
      midpointY: midpoint.y,
    };
    imageViewerDrag = null;
    imageViewerSwipe = null;
    return;
  }

  if (event.touches.length === 1) {
    const touch = event.touches[0];
    imageViewerSwipe = {
      startX: touch.clientX,
      startY: touch.clientY,
      time: Date.now(),
    };
  }

  if (event.touches.length === 1 && imageViewerScale > 1) {
    const touch = event.touches[0];
    imageViewerDrag = {
      startX: touch.clientX,
      startY: touch.clientY,
      originX: imageViewerOffsetX,
      originY: imageViewerOffsetY,
    };
  }
}

function handleImageViewerTouchMove(event) {
  const stage = getImageViewerStage();
  if (!stage) return;

  if (event.touches.length === 2 && imageViewerPinch) {
    event.preventDefault();
    const distance = getTouchDistance(event.touches);
    const midpoint = getTouchMidpoint(event.touches);
    const rect = stage.getBoundingClientRect();
    const centerX = midpoint.x - rect.left - rect.width / 2;
    const centerY = midpoint.y - rect.top - rect.height / 2;
    const ratio = distance / Math.max(1, imageViewerPinch.distance);
    setImageViewerScale(imageViewerPinch.scale * ratio, centerX, centerY);
    return;
  }

  if (event.touches.length === 1 && imageViewerDrag) {
    event.preventDefault();
    const touch = event.touches[0];
    imageViewerOffsetX = imageViewerDrag.originX + (touch.clientX - imageViewerDrag.startX);
    imageViewerOffsetY = imageViewerDrag.originY + (touch.clientY - imageViewerDrag.startY);
    applyImageViewerTransform();
  }
}

function handleImageViewerTouchEnd(event) {
  if (event.touches.length < 2) {
    imageViewerPinch = null;
  }
  if (event.touches.length === 0) {
    imageViewerDrag = null;
    if (imageViewerSwipe && imageViewerScale <= 1.05 && imageViewerUrls.length > 1) {
      const changed = event.changedTouches && event.changedTouches[0];
      if (changed) {
        const deltaX = changed.clientX - imageViewerSwipe.startX;
        const deltaY = changed.clientY - imageViewerSwipe.startY;
        const elapsed = Date.now() - imageViewerSwipe.time;
        if (elapsed < 520 && Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          if (deltaX < 0) viewNextImage();
          else viewPrevImage();
        }
      }
    }
    imageViewerSwipe = null;
  }
}

function openImageViewer(urls, index = 0) {
  const safeUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (!safeUrls.length) return;

  imageViewerUrls = safeUrls;
  imageViewerIndex = Math.max(0, Math.min(index, safeUrls.length - 1));
  renderImageViewerImage();
  openModal('imageViewerModal');
}

function openImageViewerFromEncoded(event, encodedGallery, index = 0) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  try {
    const urls = JSON.parse(decodeURIComponent(encodedGallery || '[]'));
    openImageViewer(urls, index);
  } catch {
    showToast('图片预览失败');
  }
}

function modalBackdropClick(event, modalId) {
  if (event.target === event.currentTarget) closeModal(modalId);
}

function hasAnnouncementContent(announcement = {}) {
  return !!(announcement.title || announcement.body || announcement.image);
}

function getAnnouncementSignature(announcement = {}) {
  const safeAnnouncement = normalizeSiteAnnouncement(announcement);
  if (!safeAnnouncement.enabled || !hasAnnouncementContent(safeAnnouncement)) {
    return '';
  }
  const parts = [
    safeAnnouncement.enabled ? '1' : '0',
    safeAnnouncement.title || '',
    safeAnnouncement.body || '',
    safeAnnouncement.image || '',
    safeAnnouncement.link || '',
  ];
  return parts.join('|');
}

function resetAnnouncementModalState() {
  activeAnnouncementLink = '';
  const imageEl = document.getElementById('announcementModalImage');
  const mediaEl = document.getElementById('announcementModalMedia');
  const primaryBtn = document.getElementById('announcementModalPrimaryBtn');
  if (imageEl) {
    imageEl.removeAttribute('src');
    imageEl.alt = '';
  }
  if (mediaEl) {
    mediaEl.classList.add('hidden');
  }
  if (primaryBtn) {
    primaryBtn.classList.add('hidden');
  }
}

function showAnnouncementModal(announcement = {}) {
  const titleEl = document.getElementById('announcementModalTitle');
  const descEl = document.getElementById('announcementModalDesc');
  const mediaEl = document.getElementById('announcementModalMedia');
  const imageEl = document.getElementById('announcementModalImage');
  const primaryBtn = document.getElementById('announcementModalPrimaryBtn');
  if (!titleEl || !descEl || !mediaEl || !imageEl || !primaryBtn) return;

  const safeAnnouncement = normalizeSiteAnnouncement(announcement);
  const title = safeAnnouncement.title || '校园公告';
  const body = safeAnnouncement.body || '请留意最新公告内容。';
  const image = safeAnnouncement.image;
  const linkUrl = safeAnnouncement.link;

  activeAnnouncementLink = linkUrl;
  titleEl.textContent = title;
  descEl.textContent = body;

  if (image) {
    imageEl.src = image;
    imageEl.alt = title;
    mediaEl.classList.remove('hidden');
  } else {
    imageEl.removeAttribute('src');
    imageEl.alt = '';
    mediaEl.classList.add('hidden');
  }

  primaryBtn.textContent = '查看详情';
  primaryBtn.classList.toggle('hidden', !linkUrl);
  openModal('announcementModal');
}

function maybeAutoShowAnnouncement(announcement = {}) {
  if (announcementPopupChecked) return;
  announcementPopupChecked = true;

  const signature = getAnnouncementSignature(announcement);
  if (!signature) return;

  try {
    const seenKey = sessionStorage.getItem(ANNOUNCEMENT_SEEN_KEY);
    if (seenKey === signature) {
      return;
    }
    sessionStorage.setItem(ANNOUNCEMENT_SEEN_KEY, signature);
  } catch {
  }

  showAnnouncementModal(announcement);
}

function handleAnnouncementPrimaryAction() {
  if (!activeAnnouncementLink) return;
  window.open(activeAnnouncementLink, '_blank', 'noopener,noreferrer');
  closeModal('announcementModal');
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  el.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
  if (modalId === 'announcementModal') {
    resetAnnouncementModalState();
  }
  if (modalId === 'adminPostInfoModal') {
    resetAdminPostInfoModalState();
  }
  if (modalId === 'imageViewerModal') {
    imageViewerDrag = null;
    imageViewerPinch = null;
    imageViewerSwipe = null;
    imageViewerUrls = [];
    imageViewerIndex = 0;
    const imageEl = getImageViewerImage();
    const captionEl = getImageViewerCaption();
    if (imageEl) imageEl.src = '';
    if (captionEl) captionEl.textContent = '';
    resetImageViewerTransform();
  }
  if (!document.querySelector('.modal:not(.hidden)')) {
    document.body.classList.remove('modal-open');
  }
}

function closeAllModals() {
  ['postModal', 'loginModal', 'registerModal', 'imageViewerModal', 'announcementModal', 'adminPostInfoModal'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  resetAnnouncementModalState();
  resetAdminPostInfoModalState();
  document.body.classList.remove('modal-open');
}

function closePostDetailPage() {
  const nextTab = postDetailReturnTab || 'home';
  switchTab(nextTab);
  if (nextTab === 'home') {
    loadPosts({ reset: true });
  } else if (nextTab === 'contentCenter') {
    loadContentCenter(true);
  }
}

function refreshCurrentPostDetail() {
  if (!currentDetailPostId) return;
  showPostDetail(currentDetailPostId, { skipView: true, preserveSource: true });
}

function showLogin() {
  openModal('loginModal');
  closeModal('registerModal');
}

function showRegister() {
  openModal('registerModal');
  closeModal('loginModal');
}

async function login() {
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!phone || !password) {
    showToast('请输入手机号和密码');
    return;
  }

  if (!/^1\d{10}$/.test(phone)) {
    showToast('请输入11位手机号');
    return;
  }

  try {
    const data = await forumAPI.login(phone, password);
    currentUser = data.data;
    persistUser(currentUser);
    saveCredentials(phone);
    ensureContentCenterUserState();
    updateUserUI();
    publicDashboardStatsCache = null;
    closeModal('loginModal');
    showToast('登录成功');
    document.getElementById('loginPhone').value = '';
    document.getElementById('loginPassword').value = '';
    await loadPosts({ reset: true });
    if (currentTab === 'contentCenter') {
      await loadContentCenter(true);
    }
  } catch (error) {
    showToast(error.message || '登录失败');
  }
}

async function register() {
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const nickname = document.getElementById('regNickname').value.trim();

  if (!phone || !password || !nickname) {
    showToast('请输入手机号、密码和昵称');
    return;
  }

  if (!/^1\d{10}$/.test(phone)) {
    showToast('请输入11位手机号');
    return;
  }

  if (password.length < 6) {
    showToast('密码至少 6 位');
    return;
  }

  if (nickname.length > 30) {
    showToast('昵称最多 30 个字');
    return;
  }

  try {
    const data = await forumAPI.register(phone, password, nickname);
    currentUser = data.data;
    persistUser(currentUser);
    saveCredentials(phone);
    ensureContentCenterUserState();
    updateUserUI();
    publicDashboardStatsCache = null;
    closeModal('registerModal');
    showToast('注册成功');
    document.getElementById('regPhone').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regNickname').value = '';
    await loadPosts({ reset: true });
    if (currentTab === 'contentCenter') {
      await loadContentCenter(true);
    }
  } catch (error) {
    showToast(error.message || '注册失败');
  }
}

function logout() {
  currentUser = null;
  persistUser(null);
  clearSavedCredentials();
  ensureContentCenterUserState();
  updateUserUI();
  publicDashboardStatsCache = null;
  showToast('已退出登录');
  loadPosts({ reset: true });
  if (currentTab === 'contentCenter') {
    loadContentCenter(true);
  }
}

async function submitPost() {
  if (!currentUser) {
    showToast('请先登录');
    return;
  }
  if (userIsMuted()) {
    showToast('您已被禁言，无法发帖');
    return;
  }

  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const anonymousEl = document.getElementById('postAnonymous');
  const isAnonymous = !!(anonymousEl && anonymousEl.checked);

  if (!content && postDraftImageUrls.length === 0) {
    showToast('请填写正文或上传图片');
    return;
  }

  try {
    const imagesJson = JSON.stringify(postDraftImageUrls);
    await forumAPI.addPost(currentUser.id, title, content, 0, imagesJson, isAnonymous);
    closeModal('postModal');
    showToast('发布成功');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    resetPostDraft();
    publicDashboardStatsCache = null;
    invalidateContentCenterCache();
    await loadPosts({ reset: true });
  } catch (error) {
    showToast(error.message || '发布失败');
  }
}

function renderCommentHtml(comment) {
  const name = escapeHtml(getCommentDisplayName(comment));
  const cav = getCommentAvatar(comment);
  const images = parseCommentImages(comment.images);
  const anonymousBadge = isAnonymousComment(comment) ? '<span class="comment-anon-badge">匿名</span>' : '';
  const text = comment.content
    ? `<div class="comment-text">${renderTextWithBreaks(comment.content)}</div>`
    : '';
  const imageGrid = commentImagesHtml(images);

  return `
    <div class="comment-row" data-reveal="up">
      <img class="comment-avatar" src="${cav}" alt="" width="36" height="36" loading="lazy">
      <div class="comment-body">
        <div class="comment-head">
          <span class="comment-name">${name}${anonymousBadge}</span>
          <span class="comment-time">${formatTime(comment.created_at)}</span>
        </div>
        ${text}
        ${imageGrid}
      </div>
    </div>
  `;
}

async function showPostDetail(postId, options = {}) {
  const alreadyOnDetail = currentTab === 'detail';
  if (!options.preserveSource) {
    postDetailReturnTab = currentTab === 'contentCenter'
      ? 'contentCenter'
      : (currentTab === 'profile' ? 'profile' : 'home');
  }
  currentDetailPostId = postId;
  currentDetailPost = null;
  const contentEl = document.getElementById('detailContent');
  const commentsEl = document.getElementById('commentsList');
  const commentInput = document.getElementById('commentText');
  if (contentEl) contentEl.innerHTML = '<div class="detail-loading">加载中…</div>';
  if (commentsEl) commentsEl.innerHTML = '<div class="detail-loading">评论加载中…</div>';
  if (commentInput) commentInput.value = '';
  resetCommentDraft();
  setCommentComposerExpanded(false);
  switchTab('detail', { preserveScroll: alreadyOnDetail || !!options.preserveScroll });

  const delBtn = document.getElementById('deletePostBtn');
  const likeBtn = document.getElementById('detailLikeBtn');
  const adminInfoBtn = document.getElementById('detailAdminInfoBtn');
  const topBadge = document.getElementById('detailTopBadge');
  delBtn.classList.add('hidden');
  if (adminInfoBtn) adminInfoBtn.classList.add('hidden');
  if (likeBtn) {
    likeBtn.classList.remove('active');
    likeBtn.textContent = '点赞';
  }

  try {
    const data = await forumAPI.getPostDetail(postId, {
      ...options,
      userId: currentUser ? Number(currentUser.id) : 0,
    });
    const { post, comments } = data.data;
    currentDetailPost = post;
    const likes = Number(post.likes ?? post.like_count ?? 0);

    if (Number(post.is_top)) {
      topBadge.classList.remove('hidden');
    } else {
      topBadge.classList.add('hidden');
    }

    document.getElementById('detailTitle').textContent = post.title;
    const urls = parsePostImages(post.images);
    let bodyHtml = '';
    if (post.content) {
      bodyHtml += `<div class="detail-text">${renderTextWithBreaks(post.content)}</div>`;
    }
    bodyHtml += imageGridHtml(urls);
    contentEl.innerHTML = bodyHtml || '<p class="comments-empty">这条帖子暂无正文内容。</p>';

    document.getElementById('detailCategory').textContent = urls.length ? '图文内容' : '文字内容';
    document.getElementById('detailTime').textContent = formatTime(post.created_at);
    document.getElementById('detailViews').textContent = `浏览 ${post.view_count ?? 0}`;
    document.getElementById('detailLikes').textContent = `点赞 ${likes}`;
    if (likeBtn) {
      likeBtn.classList.toggle('active', Number(post.liked_by_me) === 1);
      likeBtn.textContent = Number(post.liked_by_me) === 1 ? `已点赞 (${likes})` : `点赞 (${likes})`;
    }

    const av = document.getElementById('detailAvatar');
    av.src = getPostAvatar(post);
    av.alt = '';
    document.getElementById('detailNickname').textContent = getPostDisplayName(post);

    const isOwner = currentUser && Number(post.user_id) === Number(currentUser.id);
    if (isOwner || isAdminUser()) {
      delBtn.classList.remove('hidden');
    }
    if (isAdminUser() && adminInfoBtn) {
      adminInfoBtn.classList.remove('hidden');
    }

    const list = Array.isArray(comments) ? comments : [];
    if (list.length === 0) {
      commentsEl.innerHTML = '<p class="comments-empty">暂无评论，抢沙发～</p>';
    } else {
      commentsEl.innerHTML = list.map((c) => renderCommentHtml(c)).join('');
    }

    updateCommentFormVisibility();
    refreshMotionScene(document.getElementById('postDetailPage'));
    if (currentUser && !options.skipView) {
      loadPersonalizedData();
    }
  } catch (error) {
    if (contentEl) {
      contentEl.innerHTML = `<p class="comments-empty">${escapeHtml(error.message || '加载失败')}</p>`;
    }
    if (commentsEl) {
      commentsEl.innerHTML = `<p class="comments-empty">${escapeHtml(error.message || '加载失败')}</p>`;
    }
    showToast(error.message || '加载失败');
  }
}

function updateCommentFormVisibility() {
  const hint = document.getElementById('commentLoginHint');
  const inputRow = document.getElementById('commentInputRow');
  if (!hint || !inputRow) return;
  if (currentUser && userIsMuted()) {
    hint.textContent = '您已被禁言，暂不可评论';
    hint.classList.remove('hidden');
    inputRow.classList.add('hidden');
    return;
  }
  if (currentUser) {
    hint.textContent = '登录后可发表评论';
    hint.classList.add('hidden');
    inputRow.classList.remove('hidden');
    collapseCommentComposerIfIdle();
  } else {
    hint.textContent = '登录后可发表评论';
    hint.classList.remove('hidden');
    inputRow.classList.add('hidden');
  }
}

async function submitComment() {
  if (!currentUser) {
    showToast('请先登录');
    showLogin();
    return;
  }
  if (userIsMuted()) {
    showToast('您已被禁言，无法评论');
    return;
  }
  if (!currentDetailPostId) return;

  const content = document.getElementById('commentText').value.trim();
  const anonymousEl = document.getElementById('commentAnonymous');
  const isAnonymous = !!(anonymousEl && anonymousEl.checked);
  if (!content && commentDraftImageUrls.length === 0) {
    showToast('请输入评论内容或上传图片');
    return;
  }

  try {
    const imagesJson = JSON.stringify(commentDraftImageUrls);
    await forumAPI.addComment(currentDetailPostId, currentUser.id, content, imagesJson, isAnonymous);
    document.getElementById('commentText').value = '';
    resetCommentDraft();
    setCommentComposerExpanded(false);
    showToast('评论成功');
    publicDashboardStatsCache = null;
    invalidateContentCenterCache();
    await showPostDetail(currentDetailPostId, { skipView: true, preserveSource: true });
    await loadPosts({ reset: true });
  } catch (error) {
    showToast(error.message || '评论失败');
  }
}

async function deleteCurrentPost() {
  if (!currentUser || !currentDetailPostId) return;
  if (!confirm('确定删除这条帖子？删除后无法恢复。')) return;

  try {
    await forumAPI.deletePost(currentDetailPostId, currentUser.id);
    closePostDetailPage();
    showToast('已删除');
    publicDashboardStatsCache = null;
    invalidateContentCenterCache();
    await loadPosts({ reset: true });
  } catch (error) {
    showToast(error.message || '删除失败');
  }
}

function syncHeroDots(root, idx) {
  root.querySelectorAll('.hero-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

function gotoSlide(i, n) {
  const sc = document.getElementById('heroScroller');
  const root = document.getElementById('heroCarouselRoot');
  if (!sc || !n) return;
  carouselIndex = ((i % n) + n) % n;
  sc.scrollTo({ left: sc.clientWidth * carouselIndex, behavior: 'smooth' });
  if (root) syncHeroDots(root, carouselIndex);
}

async function loadHomeBanners() {
  const root = document.getElementById('heroCarouselRoot');
  if (!root) return;
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
  try {
    const res = await forumAPI.getBanners();
    const list = Array.isArray(res.data)
      ? res.data.filter((item) => item && String(item.image || '').trim())
      : [];
    if (list.length === 0) {
      root.innerHTML = '';
      root.classList.add('hidden');
      return;
    }
    root.classList.remove('hidden');
    const slides = list.map((b) => {
      const img = escapeHtml(b.image);
      const tit = escapeHtml(b.title || '轮播');
      const url = b.link_url && String(b.link_url).trim();
      const inner = `<img src="${img}" alt="${tit}" loading="lazy" decoding="async" draggable="false">`;
      if (url) {
        const safe = escapeHtml(String(url).trim());
        return `<a class="hero-card" href="${safe}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
      }
      return `<div class="hero-card">${inner}</div>`;
    }).join('');

    const n = list.length;
    const dots = n > 1
      ? `<div class="hero-dots">${list.map((_, i) => `<button type="button" class="hero-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="第${i + 1}张"></button>`).join('')}</div>`
      : '';
    root.innerHTML = `<div class="hero-scroller" id="heroScroller">${slides}</div>${dots}`;

    const sc = document.getElementById('heroScroller');
    carouselIndex = 0;

    root.querySelectorAll('.hero-dot').forEach((d) => {
      d.addEventListener('click', () => {
        gotoSlide(parseInt(d.dataset.i, 10), n);
      });
    });

    let touchStartX = 0;
    sc.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    sc.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 45) return;
      if (dx > 0) gotoSlide(carouselIndex - 1, n);
      else gotoSlide(carouselIndex + 1, n);
    }, { passive: true });

    sc.addEventListener('scroll', () => {
      const w = Math.max(1, sc.clientWidth);
      const idx = Math.round(sc.scrollLeft / w);
      if (idx >= 0 && idx < n && idx !== carouselIndex) {
        carouselIndex = idx;
        syncHeroDots(root, carouselIndex);
      }
    });

    if (n > 1) {
      carouselTimer = setInterval(() => {
        gotoSlide(carouselIndex + 1, n);
      }, 4800);
    }
  } catch {
    root.innerHTML = '';
    root.classList.add('hidden');
  }
}

async function adminSaveBranding() {
  if (!currentUser || !isAdminUser()) return;

  const textInput = document.getElementById('brandingLogoText');
  const fileInput = document.getElementById('brandingLogoFile');
  const nextText = textInput ? textInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  let mode = 'text';
  let logoImage = '';
  let logoText = nextText;

  if (file) {
    try {
      const upload = await forumAPI.uploadImage(currentUser.id, file);
      logoImage = upload?.data?.url || '';
      if (!logoImage) {
        throw new Error('图标上传失败');
      }
      mode = 'image';
    } catch (error) {
      showToast(error.message || '图标上传失败');
      return;
    } finally {
      fileInput.value = '';
    }
  } else if (!nextText) {
    showToast('请输入文字图标或上传图片');
    return;
  }

  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminSaveSiteBranding(adminToken, {
      mode,
      logoText,
      logoTextBase64: encodeUtf8Base64(logoText),
      logoImage,
    });
    applySiteBranding(res.data || { mode, text: logoText, image: logoImage });
    showToast('论坛图标已更新');
  } catch (error) {
    showToast(error.message || '图标保存失败');
  }
}

async function adminResetBranding() {
  if (!currentUser || !isAdminUser()) return;
  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminSaveSiteBranding(adminToken, {
      mode: 'text',
      logoText: '通',
      logoTextBase64: encodeUtf8Base64('通'),
      logoImage: '',
    });
    applySiteBranding(res.data || { mode: 'text', text: '通', image: '' });
    const textInput = document.getElementById('brandingLogoText');
    const fileInput = document.getElementById('brandingLogoFile');
    if (textInput) textInput.value = '通';
    if (fileInput) fileInput.value = '';
    showToast('已恢复默认图标');
  } catch (error) {
    showToast(error.message || '恢复失败');
  }
}

async function loadAdminAnnouncementPanel() {
  if (!currentUser || !isAdminUser()) return;

  const pageEl = document.getElementById('adminAnnouncementPage');
  const fileEl = document.getElementById('adminAnnouncementImageFile');
  updateAdminAnnouncementHeroMeta(siteAnnouncement);
  syncAdminAnnouncementForm();

  try {
    const res = await forumAPI.getSiteAnnouncement();
    applySiteAnnouncement(res.data || {});
    if (fileEl) fileEl.value = '';
  } catch (error) {
    showToast(error.message || '公告加载失败');
  }

  refreshMotionScene(pageEl);
}

async function adminSaveAnnouncement() {
  if (!currentUser || !isAdminUser()) return;

  const enabledEl = document.getElementById('adminAnnouncementEnabled');
  const titleEl = document.getElementById('adminAnnouncementTitle');
  const bodyEl = document.getElementById('adminAnnouncementBody');
  const linkEl = document.getElementById('adminAnnouncementLink');
  const imageUrlEl = document.getElementById('adminAnnouncementImageUrl');
  const fileEl = document.getElementById('adminAnnouncementImageFile');

  const enabled = !!(enabledEl && enabledEl.checked);
  const title = titleEl ? titleEl.value.trim() : '';
  const body = bodyEl ? bodyEl.value.trim() : '';
  const link = linkEl ? linkEl.value.trim() : '';
  let image = imageUrlEl ? imageUrlEl.value.trim() : '';

  if (fileEl && fileEl.files && fileEl.files[0]) {
    try {
      const upload = await forumAPI.uploadImage(currentUser.id, fileEl.files[0]);
      image = upload?.data?.url || '';
      if (!image) {
        throw new Error('公告图片上传失败');
      }
    } catch (error) {
      showToast(error.message || '公告图片上传失败');
      return;
    } finally {
      fileEl.value = '';
    }
  }

  if (enabled && !title && !body && !image) {
    showToast('请至少填写标题、正文或上传图片');
    return;
  }

  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminSaveSiteAnnouncement(adminToken, {
      enabled: enabled ? 1 : 0,
      title,
      body,
      link,
      image,
    });
    applySiteAnnouncement(res.data || { enabled, title, body, link, image });
    showToast(enabled ? '公告已更新' : '公告已保存');
  } catch (error) {
    showToast(error.message || '公告保存失败');
  }
}

async function loadAdminBannerPanel() {
  if (!currentUser || !isAdminUser()) return;
  const el = document.getElementById('adminBannerList');
  if (!el) return;
  el.innerHTML = '<div class="admin-loading">加载中…</div>';
  updateAdminBannerHeroMeta([]);
  syncAdminBrandingForm();
  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminBannersList(adminToken);
    const rows = res.data || [];
    updateAdminBannerHeroMeta(rows);
    if (rows.length === 0) {
      el.innerHTML = '<p class="admin-muted">暂无轮播</p>';
      refreshMotionScene(document.getElementById('adminBannerPage'));
      return;
    }
    el.innerHTML = rows.map((r) => {
      const st = r.status === 'active' ? '启用中' : '已下线';
      const createdAt = r.created_at ? formatTime(r.created_at) : '时间未知';
      const btn = `<button type="button" class="btn-banner-del" onclick="adminDeleteBanner(${r.id})">删除</button>`;
      return `<div class="admin-banner-row" data-reveal="up">
        <img src="${escapeHtml(r.image)}" alt="" class="admin-banner-thumb" loading="lazy">
        <div class="admin-banner-meta">
          <div>${escapeHtml(r.title)} · ${escapeHtml(st)}</div>
          <small>排序 ${escapeHtml(String(r.sort_order))} · id ${r.id} · ${escapeHtml(createdAt)}</small>
        </div>
        <div class="admin-banner-actions">${btn}</div>
      </div>`;
    }).join('');
    refreshMotionScene(document.getElementById('adminBannerPage'));
  } catch (e) {
    el.innerHTML = `<p class="admin-muted">${escapeHtml(e.message)}</p>`;
    refreshMotionScene(document.getElementById('adminBannerPage'));
  }
}

async function loadAdminDashboardStats() {
  if (!currentUser || !isAdminUser()) return;
  const el = document.getElementById('adminStatsPanel');
  if (!el) return;
  el.innerHTML = '<div class="admin-loading">统计中…</div>';
  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminDashboardStats(adminToken);
    const summary = res.data?.summary || {};
    const hotPosts = Array.isArray(res.data?.hot_posts) ? res.data.hot_posts : [];
    const contentSegments = Array.isArray(res.data?.content_segments) ? res.data.content_segments : [];
    const topKeywords = Array.isArray(res.data?.top_keywords) ? res.data.top_keywords : [];
    const behaviorFocus = Array.isArray(res.data?.behavior_focus) ? res.data.behavior_focus : [];
    const behaviorTrend = Array.isArray(res.data?.behavior_trend) ? res.data.behavior_trend : [];
    const activeUsers = Array.isArray(res.data?.active_users) ? res.data.active_users : [];
    el.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat-card"><div class="admin-stat-label">总用户</div><div class="admin-stat-value">${summary.users || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">帖子数</div><div class="admin-stat-value">${summary.posts || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">评论数</div><div class="admin-stat-value">${summary.comments || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">点赞数</div><div class="admin-stat-value">${summary.likes || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">今日发帖</div><div class="admin-stat-value">${summary.today_posts || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">禁言用户</div><div class="admin-stat-value">${summary.muted_users || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">行为总量</div><div class="admin-stat-value">${summary.behavior_events || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">近7日活跃用户</div><div class="admin-stat-value">${summary.active_users_7d || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">近7日搜索</div><div class="admin-stat-value">${summary.searches_7d || 0}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-label">近7日浏览</div><div class="admin-stat-value">${summary.views_7d || 0}</div></div>
      </div>
      <div class="admin-stat-sublist">
        <div class="admin-subtitle">热门帖子</div>
        ${(hotPosts.length ? hotPosts : [{ title: '暂无数据', like_count: 0 }]).map((item) => `<div class="admin-stat-subrow"><span>${escapeHtml(item.title || '未命名')}</span><strong>${Number(item.like_count || 0)} 赞</strong></div>`).join('')}
      </div>
      <div class="admin-stat-sublist">
        <div class="admin-subtitle">内容分段</div>
        ${(contentSegments.length ? contentSegments : [{ label: '暂无数据', total: 0 }]).map((item) => `<div class="admin-stat-subrow"><span>${escapeHtml(item.label || '暂无数据')}</span><strong>${Number(item.total || 0)}</strong></div>`).join('')}
      </div>
      <div class="admin-stat-sublist">
        <div class="admin-subtitle">高频搜索词</div>
        ${(topKeywords.length ? topKeywords : [{ keyword: '暂无数据', total: 0 }]).map((item) => `<div class="admin-stat-subrow"><span>${escapeHtml(item.keyword || '暂无数据')}</span><strong>${Number(item.total || 0)}</strong></div>`).join('')}
      </div>
      <div class="admin-stat-sublist">
        <div class="admin-subtitle">行为焦点</div>
        ${(behaviorFocus.length ? behaviorFocus : [{ label: '暂无数据', total: 0 }]).map((item) => `<div class="admin-stat-subrow"><span>${escapeHtml(item.label || '暂无数据')}</span><strong>${Number(item.total || 0)}</strong></div>`).join('')}
      </div>
      <div class="admin-stat-sublist">
        <div class="admin-subtitle">近7日行为趋势</div>
        ${(behaviorTrend.length ? behaviorTrend : [{ log_date: '暂无数据', total: 0, active_users: 0 }]).map((item) => `<div class="admin-stat-subrow"><span>${escapeHtml(String(item.log_date || '暂无数据'))}</span><strong>${Number(item.total || 0)} 次 / ${Number(item.active_users || 0)} 人</strong></div>`).join('')}
      </div>
      <div class="admin-stat-sublist">
        <div class="admin-subtitle">活跃用户榜</div>
        ${(activeUsers.length ? activeUsers : [{ nickname: '暂无数据', active_score: 0 }]).map((item) => `<div class="admin-stat-subrow"><span>${escapeHtml(item.nickname || '未命名')}</span><strong>${Number(item.active_score || 0)} 分</strong></div>`).join('')}
      </div>
    `;
  } catch (e) {
    el.innerHTML = `<p class="admin-muted">${escapeHtml(e.message || '统计加载失败')}</p>`;
  }
}

function formatDashboardShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(5);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function behaviorTypeLabel(type) {
  const key = String(type || '').toLowerCase();
  if (key === 'view_post') return '浏览帖子';
  if (key === 'search') return '搜索内容';
  if (key === 'comment_post') return '发表评论';
  if (key === 'like_post') return '点赞互动';
  if (key === 'unlike_post') return '取消点赞';
  if (key === 'create_post') return '发布帖子';
  if (key === 'browse_category') return '浏览内容流';
  return type || '其他行为';
}

function setDashboardView(group, view) {
  if (!dashboardViewState[group] || dashboardViewState[group] === view) {
    return;
  }
  dashboardViewState[group] = view;
  if (!publicDashboardStatsCache) return;
  const scrollTop = window.scrollY;
  renderPublicDashboard(publicDashboardStatsCache);
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollTop, behavior: 'auto' });
  });
}

function buildDashboardToggleGroup(group, items) {
  return `
    <div class="dashboard-toggle-group">
      ${items.map((item) => `
        <button
          type="button"
          class="dashboard-toggle${dashboardViewState[group] === item.value ? ' active' : ''}"
          onclick="setDashboardView('${group}', '${item.value}')"
        >${escapeHtml(item.label)}</button>
      `).join('')}
    </div>
  `;
}

function buildDashboardCard(options = {}) {
  const wideClass = options.wide ? ' dashboard-card-wide' : '';
  const extraClass = options.className ? ` ${options.className}` : '';
  const delay = Number(options.delay || 0);
  return `
    <article class="dashboard-card${wideClass}${extraClass}" data-reveal="up" style="--reveal-delay:${delay}ms">
      <div class="dashboard-card-head">
        <div>
          <p class="section-eyebrow">${escapeHtml(options.eyebrow || '数据分析')}</p>
          <h3>${escapeHtml(options.title || '图表')}</h3>
        </div>
        <div class="dashboard-card-tools">
          ${options.toggles || ''}
          <p>${escapeHtml(options.desc || '')}</p>
        </div>
      </div>
      ${options.body || ''}
    </article>
  `;
}

function buildDashboardLineChart(rows, series, options = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeSeries = Array.isArray(series) ? series.filter((item) => Array.isArray(item.values)) : [];
  if (!safeRows.length || !safeSeries.length) {
    return '<p class="insight-empty">暂无足够数据生成趋势图。</p>';
  }

  const chartId = String(options.id || 'dashboard-trend').replace(/[^a-z0-9_-]/gi, '');
  const width = 720;
  const height = 300;
  const padLeft = 48;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 38;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const maxValue = Math.max(1, ...safeSeries.flatMap((item) => item.values.map((v) => Number(v || 0))));
  const stepX = safeRows.length > 1 ? plotWidth / (safeRows.length - 1) : 0;

  const defs = safeSeries.map((item, index) => `
    <linearGradient id="${chartId}-fill-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${item.color}" stop-opacity="0.34"></stop>
      <stop offset="100%" stop-color="${item.color}" stop-opacity="0"></stop>
    </linearGradient>
  `).join('');

  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = padTop + plotHeight * ratio;
    const label = Math.round(maxValue * (1 - ratio));
    return `
      <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="dashboard-grid-line"></line>
      <text x="${padLeft - 10}" y="${y + 4}" class="dashboard-axis-text">${label}</text>
    `;
  }).join('');

  const xLabels = safeRows.map((row, index) => {
    const x = padLeft + stepX * index;
    return `<text x="${x}" y="${height - 10}" text-anchor="middle" class="dashboard-axis-text">${escapeHtml(formatDashboardShortDate(row.log_date))}</text>`;
  }).join('');

  const metrics = safeSeries.map((item) => {
    const values = item.values.map((value) => Number(value || 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    const peak = Math.max(...values);
    return `
      <div class="dashboard-trend-stat">
        <span>${escapeHtml(item.label)}</span>
        <strong data-count-to="${total}">0</strong>
        <small>峰值 ${peak}</small>
      </div>
    `;
  }).join('');

  const seriesHtml = safeSeries.map((item, index) => {
    const points = item.values.map((rawValue, pointIndex) => {
      const value = Number(rawValue || 0);
      const x = padLeft + stepX * pointIndex;
      const y = padTop + plotHeight - (value / maxValue) * plotHeight;
      return { x, y, value };
    });

    const linePath = points.map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`;
    const dots = points.map((point, pointIndex) => `
      <circle
        cx="${point.x}"
        cy="${point.y}"
        r="4.4"
        fill="${item.color}"
        class="dashboard-line-point"
        style="animation-delay:${(pointIndex * 70) + (index * 80)}ms"
      ></circle>
    `).join('');

    return `
      <path d="${areaPath}" fill="url(#${chartId}-fill-${index})" class="dashboard-line-area"></path>
      <path d="${linePath}" fill="none" stroke="${item.color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="dashboard-line-path"></path>
      ${dots}
    `;
  }).join('');

  const legend = safeSeries.map((item) => `
    <span class="dashboard-chart-legend-item">
      <i style="background:${item.color}"></i>
      ${escapeHtml(item.label)}
    </span>
  `).join('');

  return `
    <div class="dashboard-chart-legend">${legend}</div>
    <div class="dashboard-trend-metrics">${metrics}</div>
    <div class="dashboard-line-chart">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="趋势图">
        <defs>${defs}</defs>
        ${gridLines}
        ${seriesHtml}
        ${xLabels}
      </svg>
    </div>
  `;
}

function buildDashboardBarRows(items, formatter, emptyText) {
  const safeItems = Array.isArray(items) ? items.filter((item) => Number(item.total || item.value || 0) > 0) : [];
  if (!safeItems.length) {
    return `<p class="insight-empty">${escapeHtml(emptyText || '暂无数据')}</p>`;
  }

  const formattedItems = safeItems.map((item, index) => formatter(item, index));
  const maxValue = Math.max(1, ...formattedItems.map((item) => Number(item.value || 0)));

  return `
    <div class="dashboard-bars">
      ${formattedItems.map((payload, index) => {
        const value = Number(payload.value || 0);
        const ratio = Math.max(0.08, value / maxValue);
        return `
          <div class="dashboard-bar-row">
            <div class="dashboard-bar-head">
              <div>
                <span>${escapeHtml(payload.label)}</span>
                ${payload.note ? `<small>${escapeHtml(payload.note)}</small>` : ''}
              </div>
              <strong data-count-to="${value}" data-count-suffix="${escapeHtml(payload.suffix || '')}">0${escapeHtml(payload.suffix || '')}</strong>
            </div>
            <div class="dashboard-bar-track">
              <span style="--bar-scale:${ratio}; --bar-color:${payload.color || '#4f46e5'}; --bar-delay:${index * 80}ms"></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildDashboardDonut(items, centerLabel = '结构') {
  const palette = ['#8b5cf6', '#06b6d4', '#fb923c', '#14b8a6', '#e11d48', '#f59e0b', '#38bdf8'];
  const safeItems = (Array.isArray(items) ? items : []).map((item, index) => ({
    label: item.label,
    value: Number(item.value || 0),
    color: item.color || palette[index % palette.length],
  })).filter((item) => item.value > 0);

  if (!safeItems.length) {
    return '<p class="insight-empty">暂无足够数据生成占比图。</p>';
  }

  const total = safeItems.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const stops = safeItems.map((item) => {
    const start = (offset / total) * 100;
    offset += item.value;
    const end = (offset / total) * 100;
    return `${item.color} ${start}% ${end}%`;
  }).join(', ');

  const legend = safeItems.map((item) => `
    <div class="dashboard-donut-legend-row">
      <span><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>
      <strong data-count-to="${item.value}">0</strong>
    </div>
  `).join('');

  return `
    <div class="dashboard-donut-wrap">
      <div class="dashboard-donut-panel">
        <div class="dashboard-donut" style="background:conic-gradient(${stops})">
          <div class="dashboard-donut-hole">
            <strong data-count-to="${total}">0</strong>
            <span>${escapeHtml(centerLabel)}</span>
          </div>
        </div>
      </div>
      <div class="dashboard-donut-legend">${legend}</div>
    </div>
  `;
}

function buildDashboardHourBars(items) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return '<p class="insight-empty">暂无高峰时段数据。</p>';
  }

  const maxValue = Math.max(1, ...safeItems.map((item) => Number(item.total || 0)));
  const peak = safeItems.reduce((best, item) => (
    Number(item.total || 0) > Number(best.total || 0) ? item : best
  ), safeItems[0]);

  return `
    <div class="dashboard-hour-chart">
      <div class="dashboard-hour-meta">
        <div class="dashboard-hour-stat">
          <span>高峰时段</span>
          <strong>${escapeHtml(String(peak.label || '--'))}</strong>
        </div>
        <div class="dashboard-hour-stat">
          <span>最高事件量</span>
          <strong data-count-to="${Number(peak.total || 0)}">0</strong>
        </div>
      </div>
      <div class="dashboard-hour-columns">
        ${safeItems.map((item, index) => {
          const ratio = Math.max(0.06, Number(item.total || 0) / maxValue);
          const hue = 190 + Math.round((index / Math.max(1, safeItems.length - 1)) * 70);
          const shortLabel = index % 3 === 0 ? String(item.label || '').replace(':00', '') : '';
          return `
            <div class="dashboard-hour-column" title="${escapeHtml(String(item.label || '--'))} · ${Number(item.total || 0)} 次">
              <span
                class="dashboard-hour-bar"
                style="--column-scale:${ratio}; --column-delay:${index * 28}ms; --column-color:linear-gradient(180deg, hsl(${hue} 92% 74%), hsl(${Math.max(12, hue - 34)} 88% 54%))"
              ></span>
              <small>${escapeHtml(shortLabel)}</small>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function buildDashboardHeatmap(items) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return '<p class="insight-empty">暂无热力趋势数据。</p>';
  }

  const maxValue = Math.max(1, ...safeItems.map((item) => Number(item.value || 0)));
  const total = safeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const peak = safeItems.reduce((best, item) => (
    Number(item.value || 0) > Number(best.value || 0) ? item : best
  ), safeItems[0]);

  return `
    <div class="dashboard-heatmap-panel">
      <div class="dashboard-heatmap-summary">
        <div class="dashboard-heatmap-stat">
          <span>14日热力总量</span>
          <strong data-count-to="${total}">0</strong>
        </div>
        <div class="dashboard-heatmap-stat">
          <span>最热日期</span>
          <strong>${escapeHtml(String(peak.label || '--'))}</strong>
        </div>
      </div>
      <div class="dashboard-heatmap-grid">
        ${safeItems.map((item, index) => {
          const ratio = Math.max(0.08, Number(item.value || 0) / maxValue);
          return `
            <div
              class="dashboard-heatmap-cell"
              title="${escapeHtml(String(item.label || '--'))} · 热力 ${Number(item.value || 0)}"
              style="--heat-ratio:${ratio}; --heat-delay:${index * 42}ms"
            >
              <span>${escapeHtml(String(item.label || '--'))}</span>
              <strong>${Number(item.value || 0)}</strong>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function buildDashboardKeywordCloud(items) {
  const safeItems = Array.isArray(items)
    ? items.map((item) => ({
      label: item.keyword || item.label,
      value: Number(item.total || item.value || 0),
    })).filter((item) => item.label && item.value > 0)
    : [];
  if (!safeItems.length) {
    return '<p class="insight-empty">暂无高频关键词数据。</p>';
  }

  const maxValue = Math.max(1, ...safeItems.map((item) => item.value));
  return `
    <div class="dashboard-keyword-cloud">
      ${safeItems.map((item, index) => {
        const size = 13 + Math.round((item.value / maxValue) * 13);
        const angle = 120 + (index * 19);
        return `
          <span class="dashboard-keyword-chip" style="--keyword-size:${size}px; --keyword-angle:${angle}deg; --keyword-delay:${index * 60}ms">
            ${escapeHtml(item.label)}
            <small>${item.value}</small>
          </span>
        `;
      }).join('')}
    </div>
  `;
}

function buildDashboardPulseMetrics(items) {
  const safeItems = Array.isArray(items) ? items.filter((item) => Number(item.value || 0) >= 0) : [];
  if (!safeItems.length) {
    return '<p class="insight-empty">暂无实时指标。</p>';
  }

  const maxValue = Math.max(1, ...safeItems.map((item) => Number(item.value || 0)));
  return `
    <div class="dashboard-pulse-grid">
      ${safeItems.map((item, index) => {
        const value = Number(item.value || 0);
        const ratio = Math.max(0.08, value / maxValue);
        return `
          <div class="dashboard-pulse-card">
            <span>${escapeHtml(item.label || '指标')}</span>
            <strong data-count-to="${value}" data-count-suffix="${escapeHtml(item.suffix || '')}">0${escapeHtml(item.suffix || '')}</strong>
            <p>${escapeHtml(item.note || '')}</p>
            <div class="dashboard-pulse-track">
              <i style="--pulse-scale:${ratio}; --pulse-color:${item.color || '#0f766e'}; --pulse-delay:${index * 80}ms"></i>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildDashboardRankList(items, formatter, emptyText) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return `<p class="insight-empty">${escapeHtml(emptyText || '暂无排名数据')}</p>`;
  }

  const payloads = safeItems.map((item, index) => formatter(item, index));
  const maxMetric = Math.max(1, ...payloads.map((item) => Number(item.metric || 0)));

  return `
    <div class="dashboard-rank-list">
      ${payloads.map((payload, index) => {
        const ratio = Math.max(0.1, Number(payload.metric || 0) / maxMetric);
        return `
          <div class="dashboard-rank-row">
            <div class="dashboard-rank-main">
              <span class="dashboard-rank-index">${index + 1}</span>
              <div>
                <strong>${escapeHtml(payload.title || '未命名')}</strong>
                <p>${escapeHtml(payload.desc || '')}</p>
              </div>
            </div>
            <div class="dashboard-rank-side">
              <div class="dashboard-rank-value">${escapeHtml(payload.value || '')}</div>
              <div class="dashboard-rank-meter">
                <span style="--rank-scale:${ratio}; --rank-color:${payload.color || '#0ea5e9'}"></span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPublicDashboard(data = {}) {
  const summaryGrid = document.getElementById('dashboardSummaryGrid');
  const adminSummary = document.getElementById('dashboardAdminSummary');
  const chartsGrid = document.getElementById('dashboardChartsGrid');
  const accessBadge = document.getElementById('dashboardAccessBadge');
  if (!summaryGrid || !adminSummary || !chartsGrid || !accessBadge) return;

  const summary = data.summary || {};
  const contentSegments = Array.isArray(data.content_segments) ? data.content_segments : [];
  const hotPosts = Array.isArray(data.hot_posts) ? data.hot_posts : [];
  const topKeywords = Array.isArray(data.top_keywords) ? data.top_keywords : [];
  const behaviorFocus = Array.isArray(data.behavior_focus) ? data.behavior_focus : [];
  const behaviorMix = Array.isArray(data.behavior_mix) ? data.behavior_mix : [];
  const behaviorTrend = Array.isArray(data.behavior_trend) ? data.behavior_trend : [];
  const contentTrend = Array.isArray(data.content_trend) ? data.content_trend : [];
  const hourlyActivity = Array.isArray(data.hourly_activity) ? data.hourly_activity : [];
  const activityHeatmap = Array.isArray(data.activity_heatmap) ? data.activity_heatmap : [];
  const activeUsers = Array.isArray(data.active_users) ? data.active_users : [];
  const adminExtra = data.admin_extra && typeof data.admin_extra === 'object' ? data.admin_extra : null;

  accessBadge.textContent = adminExtra ? '管理员视角已解锁' : '全体用户可见';
  setProfileDashboardEntryHint(`用户 ${Number(summary.users || 0)} · 帖子 ${Number(summary.posts || 0)} · 活跃 ${Number(summary.active_users_7d || 0)}`);
  renderHeroMeta('dashboardHeroMeta', [
    { label: '7日活跃', value: Number(summary.active_users_7d || 0), note: '近七天有真实行为记录的用户数' },
    { label: '今日内容', value: `${Number(summary.today_posts || 0)} 帖 / ${Number(summary.today_comments || 0)} 评`, note: '打开页面后数字会从零动态增长' },
    { label: '看板特性', value: '动态切换', note: '图表会随着切换按钮和数据刷新实时变化' },
  ]);

  const summaryCards = [
    { label: '平台用户', value: summary.users || 0, hint: '当前注册总人数' },
    { label: '帖子总数', value: summary.posts || 0, hint: '正常展示中的帖子' },
    { label: '评论总数', value: summary.comments || 0, hint: '全站互动内容' },
    { label: '点赞总数', value: summary.likes || 0, hint: '累计帖子点赞' },
    { label: '今日发帖', value: summary.today_posts || 0, hint: '内容发布节奏' },
    { label: '今日评论', value: summary.today_comments || 0, hint: '今日互动情况' },
    { label: '7日活跃用户', value: summary.active_users_7d || 0, hint: '近7天有行为记录' },
    { label: '7日搜索量', value: summary.searches_7d || 0, hint: '近7天搜索行为' },
  ];

  summaryGrid.innerHTML = summaryCards.map((item, index) => `
    <article class="dashboard-summary-card dashboard-summary-card--${(index % 4) + 1}" data-reveal="up" style="--reveal-delay:${index * 60}ms">
      <span>${escapeHtml(item.label)}</span>
      <strong data-count-to="${Number(item.value || 0)}">0</strong>
      <p>${escapeHtml(item.hint)}</p>
    </article>
  `).join('');

  if (adminExtra) {
    adminSummary.classList.remove('hidden');
    adminSummary.innerHTML = `
      <article class="dashboard-admin-card" data-reveal="up" style="--reveal-delay:40ms">
        <span>禁言用户</span>
        <strong data-count-to="${Number(adminExtra.muted_users || 0)}">0</strong>
        <p>仅管理员可见的治理指标</p>
      </article>
      <article class="dashboard-admin-card" data-reveal="up" style="--reveal-delay:110ms">
        <span>在线轮播</span>
        <strong data-count-to="${Number(adminExtra.active_banners || 0)}">0</strong>
        <p>当前前台可展示的轮播数量</p>
      </article>
      <article class="dashboard-admin-card" data-reveal="up" style="--reveal-delay:180ms">
        <span>行为事件</span>
        <strong data-count-to="${Number(summary.behavior_events || 0)}">0</strong>
        <p>推荐系统可用的历史行为数据规模</p>
      </article>
    `;
  } else {
    adminSummary.classList.add('hidden');
    adminSummary.innerHTML = '';
  }

  let trendTitle = '内容增长曲线';
  let trendDesc = '帖子与评论会随着刷新和互动实时变化。';
  let trendBody = buildDashboardLineChart(contentTrend, [
    { label: '发帖量', color: '#8b5cf6', values: contentTrend.map((item) => Number(item.posts || 0)) },
    { label: '评论量', color: '#fb923c', values: contentTrend.map((item) => Number(item.comments || 0)) },
  ], { id: 'content-trend' });

  if (dashboardViewState.trend === 'behavior') {
    trendTitle = '行为活跃曲线';
    trendDesc = '浏览、搜索和互动会共同推高活跃度。';
    trendBody = buildDashboardLineChart(behaviorTrend, [
      { label: '行为事件', color: '#06b6d4', values: behaviorTrend.map((item) => Number(item.total || 0)) },
      { label: '活跃用户', color: '#14b8a6', values: behaviorTrend.map((item) => Number(item.active_users || 0)) },
    ], { id: 'behavior-trend' });
  } else if (dashboardViewState.trend === 'fusion') {
    trendTitle = '融合热度曲线';
    trendDesc = '把内容产出和行为事件放在同一张主图里观察。';
    trendBody = buildDashboardLineChart(contentTrend, [
      { label: '发帖量', color: '#8b5cf6', values: contentTrend.map((item) => Number(item.posts || 0)) },
      { label: '评论量', color: '#fb923c', values: contentTrend.map((item) => Number(item.comments || 0)) },
      { label: '行为事件', color: '#06b6d4', values: behaviorTrend.map((item) => Number(item.total || 0)) },
    ], { id: 'fusion-trend' });
  }

  let distributionTitle = '内容分段概览';
  let distributionDesc = '查看图文、纯文字、置顶和高互动内容的结构。';
  let distributionBody = buildDashboardBarRows(
    contentSegments,
    (item) => ({
      label: item.label || '其他内容',
      value: Number(item.total || 0),
      note: '内容量',
      color: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
    }),
    '暂无内容分段数据',
  );

  if (dashboardViewState.distribution === 'behavior') {
    distributionTitle = '行为焦点分布';
    distributionDesc = '实时观察站内用户更常触发哪些关键行为。';
    distributionBody = buildDashboardBarRows(
      behaviorFocus,
      (item) => ({
        label: item.label || '其他行为',
        value: Number(item.total || 0),
        note: '触发次数',
        color: 'linear-gradient(90deg, #06b6d4, #38bdf8)',
      }),
      '暂无行为焦点数据',
    );
  } else if (dashboardViewState.distribution === 'hourly') {
    distributionTitle = '高峰时段分布';
    distributionDesc = '查看近30天哪一段时间最活跃。';
    distributionBody = buildDashboardHourBars(hourlyActivity);
  }

  let compositionTitle = '平台互动结构';
  let compositionDesc = '查看帖子、评论、点赞与流量的构成。';
  let compositionBody = buildDashboardDonut([
    { label: '帖子', value: Number(summary.posts || 0), color: '#8b5cf6' },
    { label: '评论', value: Number(summary.comments || 0), color: '#fb923c' },
    { label: '点赞', value: Number(summary.likes || 0), color: '#e11d48' },
    { label: '浏览(7日)', value: Number(summary.views_7d || 0), color: '#06b6d4' },
    { label: '搜索(7日)', value: Number(summary.searches_7d || 0), color: '#14b8a6' },
  ], '互动');

  if (dashboardViewState.composition === 'behavior') {
    compositionTitle = '行为构成';
    compositionDesc = '按行为类型拆解近30天用户动作。';
    compositionBody = buildDashboardDonut(
      behaviorMix.map((item) => ({
        label: behaviorTypeLabel(item.behavior_type),
        value: Number(item.total || 0),
      })),
      '行为',
    );
  }

  let focusTitle = '搜索关键词云';
  let focusDesc = '词越大说明近30天出现得越频繁。';
  let focusBody = buildDashboardKeywordCloud(topKeywords);
  if (dashboardViewState.focus === 'heatmap') {
    focusTitle = '近14日热力格';
    focusDesc = '综合行为、发帖和评论生成热力强度。';
    focusBody = buildDashboardHeatmap(activityHeatmap);
  }

  const pulseBody = buildDashboardPulseMetrics([
    { label: '今日发帖', value: Number(summary.today_posts || 0), note: '内容更新速度', color: '#8b5cf6' },
    { label: '今日评论', value: Number(summary.today_comments || 0), note: '即时互动热度', color: '#fb923c' },
    { label: '7日浏览', value: Number(summary.views_7d || 0), note: '内容曝光情况', color: '#06b6d4' },
    { label: '7日活跃', value: Number(summary.active_users_7d || 0), note: '用户参与深度', color: '#14b8a6' },
  ]);

  const rankingTitle = dashboardViewState.ranking === 'posts' ? '热门帖子排行' : '活跃用户榜';
  const rankingDesc = dashboardViewState.ranking === 'posts'
    ? '按热度排序，随点赞和评论变化。'
    : '按近30天活跃度排序。';
  const rankingBody = dashboardViewState.ranking === 'posts'
    ? buildDashboardRankList(
      hotPosts,
      (item) => ({
        title: item.title || '未命名帖子',
        desc: `${Number(item.view_count || 0)} 次浏览 · ${formatTime(item.created_at)}`,
        value: `${Number(item.like_count || 0)}赞 / ${Number(item.comment_count || 0)}评`,
        metric: (Number(item.like_count || 0) * 2) + Number(item.comment_count || 0) + (Number(item.view_count || 0) / 10),
        color: '#fb923c',
      }),
      '暂无热门帖子数据',
    )
    : buildDashboardRankList(
      activeUsers,
      (item) => ({
        title: item.nickname || '未命名用户',
        desc: `${Number(item.total_events || 0)} 次行为记录`,
        value: `${Number(item.active_score || 0)} 分`,
        metric: Number(item.active_score || 0),
        color: '#06b6d4',
      }),
      '暂无活跃用户数据',
    );

  const cards = [
    {
      wide: true,
      eyebrow: '动态图谱',
      title: trendTitle,
      desc: trendDesc,
      toggles: buildDashboardToggleGroup('trend', [
        { label: '内容', value: 'content' },
        { label: '行为', value: 'behavior' },
        { label: '融合', value: 'fusion' },
      ]),
      body: trendBody,
    },
    {
      eyebrow: '分布分析',
      title: distributionTitle,
      desc: distributionDesc,
      toggles: buildDashboardToggleGroup('distribution', [
        { label: '内容', value: 'content' },
        { label: '行为', value: 'behavior' },
        { label: '时段', value: 'hourly' },
      ]),
      body: distributionBody,
    },
    {
      eyebrow: '构成分析',
      title: compositionTitle,
      desc: compositionDesc,
      toggles: buildDashboardToggleGroup('composition', [
        { label: '互动', value: 'engagement' },
        { label: '行为', value: 'behavior' },
      ]),
      body: compositionBody,
    },
    {
      eyebrow: '热点信号',
      title: focusTitle,
      desc: focusDesc,
      toggles: buildDashboardToggleGroup('focus', [
        { label: '关键词', value: 'keywords' },
        { label: '热力格', value: 'heatmap' },
      ]),
      body: focusBody,
    },
    {
      eyebrow: '实时节奏',
      title: '关键指标脉冲',
      desc: '打开页面会从零开始滚动，刷新后继续同步最新数值。',
      body: pulseBody,
    },
    {
      wide: true,
      eyebrow: '榜单分析',
      title: rankingTitle,
      desc: rankingDesc,
      toggles: buildDashboardToggleGroup('ranking', [
        { label: '帖子榜', value: 'posts' },
        { label: '用户榜', value: 'users' },
      ]),
      body: rankingBody,
    },
  ];

  chartsGrid.innerHTML = cards.map((card, index) => buildDashboardCard({
    ...card,
    delay: 120 + (index * 70),
  })).join('');

  refreshMotionScene(document.getElementById('dashboardPage'));
}

async function loadPublicDashboardStats(force = false) {
  const summaryGrid = document.getElementById('dashboardSummaryGrid');
  const chartsGrid = document.getElementById('dashboardChartsGrid');
  if (!summaryGrid || !chartsGrid) return;

  if (!force && publicDashboardStatsCache) {
    renderPublicDashboard(publicDashboardStatsCache);
    return;
  }

  summaryGrid.innerHTML = '<div class="insight-loading">正在汇总平台数据…</div>';
  chartsGrid.innerHTML = '<div class="insight-loading">图表生成中…</div>';

  try {
    const res = await forumAPI.getPublicDashboardStats(currentUser ? Number(currentUser.id) : 0);
    publicDashboardStatsCache = res.data || {};
    renderPublicDashboard(publicDashboardStatsCache);
  } catch (error) {
    const msg = escapeHtml(error.message || '数据看板加载失败');
    summaryGrid.innerHTML = `<p class="insight-empty">${msg}</p>`;
    chartsGrid.innerHTML = `<p class="insight-empty">${msg}</p>`;
  }
}

async function adminAddBanner() {
  if (!isAdminUser() || !currentUser) return;
  const title = document.getElementById('newBannerTitle').value.trim();
  const urlInput = document.getElementById('newBannerImageUrl').value.trim();
  const linkUrl = document.getElementById('newBannerLink').value.trim();
  const sortOrder = parseInt(document.getElementById('newBannerSort').value, 10) || 0;
  const fileEl = document.getElementById('newBannerImageFile');

  if (!title) {
    showToast('请填写轮播标题');
    return;
  }

  let image = urlInput;
  if (fileEl && fileEl.files && fileEl.files[0]) {
    try {
      const up = await forumAPI.uploadImage(currentUser.id, fileEl.files[0]);
      image = up.data.url;
    } catch (e) {
      showToast(e.message || '图片上传失败');
      return;
    }
    fileEl.value = '';
  }

  if (!image) {
    showToast('请填写图片地址或上传图片');
    return;
  }

  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    await forumAPI.adminBannerSave(adminToken, {
      id: 0,
      title,
      image,
      linkUrl,
      sortOrder,
    });
    showToast('轮播已添加');
    document.getElementById('newBannerTitle').value = '';
    document.getElementById('newBannerImageUrl').value = '';
    document.getElementById('newBannerLink').value = '';
    document.getElementById('newBannerSort').value = '0';
    await loadAdminBannerPanel();
    await loadHomeBanners();
  } catch (e) {
    showToast(e.message || '保存失败');
  }
}

async function adminDeleteBanner(id) {
  if (!isAdminUser() || !currentUser) return;
  if (!confirm('确定删除该轮播吗？如果这张图没有被其他内容使用，也会一起清理。')) return;
  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    await forumAPI.adminBannerDelete(adminToken, id);
    showToast('轮播已删除');
    await loadAdminBannerPanel();
    await loadHomeBanners();
  } catch (e) {
    showToast(e.message || '操作失败');
  }
}

function renderAdminSearchResults(rows) {
  const el = document.getElementById('adminUserSearchResults');
  if (!el) return;
  const keywordEl = document.getElementById('adminUserKeyword');
  updateAdminUserHeroMeta(rows, keywordEl ? keywordEl.value.trim() : '');
  if (!rows.length) {
    el.innerHTML = '<p class="admin-muted">没有找到匹配的用户</p>';
    return;
  }

  el.innerHTML = rows.map((user) => {
    const phone = user.phone ? escapeHtml(String(user.phone)) : '<span class="admin-user-phone-empty">未绑定手机号</span>';
    const mutedTag = Number(user.is_muted) === 1 ? '<span class="admin-user-tag danger">已禁言</span>' : '<span class="admin-user-tag ok">正常</span>';
    const adminTag = String(user.role || '') === 'admin' ? '<span class="admin-user-tag">管理员</span>' : '<span class="admin-user-tag">普通用户</span>';
    const displayName = escapeHtml(user.nickname || user.username || `用户${user.id}`);
    const masked = user.phone ? `（${escapeHtml(maskPhone(user.phone) || String(user.phone))}）` : '';
    return `<div class="admin-user-row">
      <div class="admin-user-main">
        <div class="admin-user-name">${displayName}<span class="admin-user-id">#${user.id}</span></div>
        <div class="admin-user-phone">${phone}</div>
        <div class="admin-user-meta">${escapeHtml(user.username || '')}${masked}</div>
        <div class="admin-user-tags">${adminTag}${mutedTag}</div>
      </div>
      <div class="admin-user-actions">
        <button type="button" class="btn-mute" onclick="adminSetMute(1, ${Number(user.id)})">禁言</button>
        <button type="button" class="btn-unmute" onclick="adminSetMute(0, ${Number(user.id)})">解禁</button>
      </div>
    </div>`;
  }).join('');
}

async function adminSearchUsers(silent = false) {
  if (!isAdminUser() || !currentUser) return;
  const keywordEl = document.getElementById('adminUserKeyword');
  const resultEl = document.getElementById('adminUserSearchResults');
  const keyword = keywordEl ? keywordEl.value.trim() : '';
  if (!keyword) {
    updateAdminUserHeroMeta([], '');
    if (resultEl) {
      resultEl.innerHTML = '<p class="admin-muted">请输入昵称、手机号或用户 ID 查询</p>';
    }
    if (!silent) showToast('请输入查询关键词');
    return;
  }
  if (resultEl) {
    resultEl.innerHTML = '<div class="admin-loading">查询中…</div>';
  }
  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminSearchUsers(adminToken, keyword);
    renderAdminSearchResults(Array.isArray(res.data) ? res.data : []);
  } catch (e) {
    if (resultEl) {
      resultEl.innerHTML = `<p class="admin-muted">${escapeHtml(e.message || '查询失败')}</p>`;
    }
    if (!silent) showToast(e.message || '查询失败');
  }
}

async function adminSetMute(muted, userId = 0) {
  if (!isAdminUser() || !currentUser) return;
  const phoneEl = document.getElementById('mutePhoneInput');
  const phone = phoneEl ? phoneEl.value.trim() : '';
  if (Number(userId) <= 0 && !/^1\d{10}$/.test(phone)) {
    showToast('请先查询用户，或输入11位手机号');
    return;
  }
  try {
    const payload = { muted };
    if (Number(userId) > 0) payload.userId = Number(userId);
    else payload.phone = phone;
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const result = await forumAPI.adminMuteUser(adminToken, payload);
    showToast(muted ? '已禁言' : '已解除禁言');
    const targetPhone = result?.data?.phone || phone;
    if (currentUser.phone === targetPhone) {
      currentUser.is_muted = muted;
      persistUser(currentUser);
      updateUserUI();
      updateCommentFormVisibility();
    }
    await adminSearchUsers(true);
  } catch (e) {
    showToast(e.message || '操作失败');
  }
}

async function togglePostLike(postId, event) {
  if (event) {
    event.stopPropagation();
  }
  if (!currentUser) {
    showToast('请先登录');
    showLogin();
    return;
  }
  try {
    const res = await forumAPI.togglePostLike(postId, currentUser.id);
    const payload = res.data || {};
    publicDashboardStatsCache = null;
    invalidateContentCenterCache();
    posts = posts.map((post) => {
      if (Number(post.id) !== Number(postId)) return post;
      return {
        ...post,
        likes: Number(payload.like_count || 0),
        like_count: Number(payload.like_count || 0),
        liked_by_me: Number(payload.liked || 0),
      };
    });
    if (currentDetailPost && Number(currentDetailPost.id) === Number(postId)) {
      currentDetailPost.likes = Number(payload.like_count || 0);
      currentDetailPost.like_count = Number(payload.like_count || 0);
      currentDetailPost.liked_by_me = Number(payload.liked || 0);
      document.getElementById('detailLikes').textContent = `点赞 ${Number(payload.like_count || 0)}`;
      const likeBtn = document.getElementById('detailLikeBtn');
      if (likeBtn) {
        likeBtn.classList.toggle('active', Number(payload.liked) === 1);
        likeBtn.textContent = Number(payload.liked) === 1 ? `已点赞 (${Number(payload.like_count || 0)})` : `点赞 (${Number(payload.like_count || 0)})`;
      }
    }
    renderPosts(posts);
    loadPersonalizedData();
  } catch (e) {
    showToast(e.message || '点赞失败');
  }
}

async function toggleCurrentPostLike() {
  if (!currentDetailPostId) return;
  await togglePostLike(currentDetailPostId);
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;

  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAbsoluteTime(isoString) {
  if (!isoString) return '暂无';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function renderPostAdminInfoButton(postId) {
  if (!isAdminUser() || !currentUser) return '';
  return `<button type="button" class="post-admin-info-btn" onclick="showAdminPostAuthorInfo(${Number(postId)}, event)">查看信息</button>`;
}

function resetAdminPostInfoModalState() {
  adminPostInfoState = {
    postId: 0,
    userId: 0,
    role: '',
  };
  const titleEl = document.getElementById('adminPostInfoTitle');
  const bodyEl = document.getElementById('adminPostInfoBody');
  if (titleEl) {
    titleEl.textContent = '帖子作者信息';
  }
  if (bodyEl) {
    bodyEl.innerHTML = '<p class="admin-post-info-loading">正在读取信息…</p>';
  }
}

function renderAdminPostInfoField(label, value) {
  const safeValue = value ? escapeHtml(String(value)) : '<span class="admin-post-info-empty">暂无</span>';
  return `
    <div class="admin-post-info-item">
      <span>${escapeHtml(label)}</span>
      <strong>${safeValue}</strong>
    </div>
  `;
}

function renderAdminPostInfo(data = {}) {
  const titleEl = document.getElementById('adminPostInfoTitle');
  const bodyEl = document.getElementById('adminPostInfoBody');
  if (!titleEl || !bodyEl) return;

  const postTitle = String(data.post_title || '未命名帖子');
  const userId = Number(data.user_id || 0);
  const role = String(data.role || '');
  const isMuted = Number(data.is_muted) === 1;
  const isAnonymous = Number(data.is_anonymous) === 1;
  const isSelf = currentUser && userId > 0 && Number(currentUser.id) === userId;
  const canMute = userId > 0 && role !== 'admin' && !isSelf;

  adminPostInfoState = {
    postId: Number(data.post_id || 0),
    userId,
    role,
  };

  titleEl.textContent = '帖子作者信息';

  const chipHtml = `
    <div class="admin-post-info-chip-row">
      <span class="admin-user-tag">${isAnonymous ? '匿名发布' : '实名发布'}</span>
      <span class="admin-user-tag${isMuted ? ' danger' : ' ok'}">${isMuted ? '已禁言' : '正常'}</span>
      <span class="admin-user-tag">${role === 'admin' ? '管理员账号' : '普通用户'}</span>
    </div>
  `;

  let actionHtml = '';
  if (!userId) {
    actionHtml = '<p class="admin-post-info-note">该帖子关联账号信息不存在，当前无法直接处理。</p>';
  } else if (role === 'admin') {
    actionHtml = '<p class="admin-post-info-note">该账号是管理员账号，不能在这里执行禁言。</p>';
  } else if (isSelf) {
    actionHtml = '<p class="admin-post-info-note">当前登录的管理员账号不能对自己执行禁言。</p>';
  } else if (canMute) {
    actionHtml = `
      <div class="admin-post-info-actions">
        <button type="button" class="btn-mute" onclick="adminSetMuteFromPostInfo(1)">禁言此用户</button>
        <button type="button" class="btn-unmute" onclick="adminSetMuteFromPostInfo(0)">解除禁言</button>
      </div>
    `;
  }

  bodyEl.innerHTML = `
    <div class="admin-post-info-summary">
      <strong>${escapeHtml(postTitle)}</strong>
      <p class="admin-post-info-subtitle">这里显示的是帖子真实作者信息，仅管理员可见，匿名帖也能在这里看到用户名和手机号。</p>
      ${chipHtml}
    </div>
    <div class="admin-post-info-grid">
      ${renderAdminPostInfoField('帖子 ID', data.post_id || '暂无')}
      ${renderAdminPostInfoField('发帖时间', formatAbsoluteTime(data.post_created_at))}
      ${renderAdminPostInfoField('用户 ID', userId || '暂无')}
      ${renderAdminPostInfoField('昵称', data.nickname || '未设置')}
      ${renderAdminPostInfoField('用户名', data.username || '未设置')}
      ${renderAdminPostInfoField('手机号', data.phone || '未绑定')}
      ${renderAdminPostInfoField('账号角色', role === 'admin' ? '管理员' : '普通用户')}
      ${renderAdminPostInfoField('账号状态', isMuted ? '已禁言' : '正常')}
      ${renderAdminPostInfoField('注册时间', formatAbsoluteTime(data.user_created_at))}
    </div>
    ${actionHtml}
  `;
}

async function showAdminPostAuthorInfo(postId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (!isAdminUser() || !currentUser) return;

  const titleEl = document.getElementById('adminPostInfoTitle');
  const bodyEl = document.getElementById('adminPostInfoBody');
  if (titleEl) {
    titleEl.textContent = '帖子作者信息';
  }
  if (bodyEl) {
    bodyEl.innerHTML = '<p class="admin-post-info-loading">正在读取信息…</p>';
  }

  openModal('adminPostInfoModal');

  try {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    const res = await forumAPI.adminPostAuthorInfo(adminToken, postId);
    renderAdminPostInfo(res.data || {});
  } catch (error) {
    if (bodyEl) {
      bodyEl.innerHTML = `<p class="admin-post-info-error">${escapeHtml(error.message || '读取失败')}</p>`;
    }
    showToast(error.message || '读取失败');
  }
}

function showAdminPostAuthorInfoFromDetail(event) {
  if (!currentDetailPost) return;
  showAdminPostAuthorInfo(currentDetailPost.id, event);
}

async function adminSetMuteFromPostInfo(muted) {
  if (!adminPostInfoState.userId || !adminPostInfoState.postId) return;
  await adminSetMute(muted, adminPostInfoState.userId);
  await showAdminPostAuthorInfo(adminPostInfoState.postId);
}

function showToast(message) {
  let el = document.querySelector('.toast');
  if (el) el.remove();
  el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 2200);
}

