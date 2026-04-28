/**
 * 与根目录 /api/*.php 对接（表单 POST + JSON 响应）
 */
const API_BASE = `${window.location.origin.replace(/\/$/, '')}/api`;
const API_TIMEOUT_MS = 10000;
const API_CACHE_TTL = 12000;
const API_USER_KEY = 'campus_forum_user';
const apiCache = new Map();
const pendingRequests = new Map();

function getStoredAuthToken() {
  try {
    const raw = localStorage.getItem(API_USER_KEY);
    if (!raw) return '';
    const user = JSON.parse(raw);
    return user && user.authToken ? String(user.authToken) : '';
  } catch {
    return '';
  }
}

function getStoredAdminToken() {
  try {
    const raw = localStorage.getItem(API_USER_KEY);
    if (!raw) return '';
    const user = JSON.parse(raw);
    return user && user.adminToken ? String(user.adminToken) : '';
  } catch {
    return '';
  }
}

function cacheKey(method, url, body = '') {
  return `${method}:${url}:${body}`;
}

async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function requestOnce(key, runner) {
  if (pendingRequests.has(key)) return pendingRequests.get(key);
  const task = runner().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, task);
  return task;
}

function parseJsonResponse(text) {
  try {
    // 清理文本：移除BOM头、空白字符等
    let cleanedText = text.trim();
    
    // 移除UTF-8 BOM头 (EF BB BF)
    if (cleanedText.charCodeAt(0) === 0xFEFF) {
      cleanedText = cleanedText.slice(1);
    }
    
    // 尝试解析JSON
    const result = JSON.parse(cleanedText);
    
    // 检查是否有预期的结构
    if (result && typeof result === 'object') {
      return result;
    } else {
      throw new Error('服务器返回的数据结构异常');
    }
  } catch (error) {
    console.error('JSON解析错误:', error);
    console.error('原始响应:', text);
    
    // 尝试从错误响应中提取信息
    if (text.includes('{') && text.includes('}')) {
      try {
        // 尝试提取可能的JSON部分
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(start, end);
        const parsed = JSON.parse(jsonStr);
        return parsed;
      } catch (e) {
        // 如果还是失败，返回友好的错误信息
        throw new Error(`服务器响应格式异常: ${error.message}`);
      }
    }
    
    throw new Error('服务器返回的数据不是有效的JSON格式');
  }
}

async function formPost(filename, fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null) body.set(k, String(v));
  });
  const url = `${API_BASE}/${filename}`;
  const bodyText = body.toString();
  const key = cacheKey('POST', url, bodyText);
  return requestOnce(key, async () => {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: bodyText,
    });
    const data = parseJsonResponse(await res.text());
    if (data.code !== 1) {
      throw new Error(data.msg || '操作失败');
    }
    return data;
  });
}

async function getJson(filename, query = '') {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  const url = `${API_BASE}/${filename}${q}`;
  const headers = {};
  const authToken = getStoredAuthToken();
  const adminToken = getStoredAdminToken();
  if (authToken) headers['X-Auth-Token'] = authToken;
  if (adminToken) headers['X-Admin-Token'] = adminToken;
  const key = cacheKey('GET', url, `${authToken ? 'auth' : 'guest'}:${adminToken ? 'admin' : 'user'}`);
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.time < API_CACHE_TTL) {
    return cached.data;
  }
  return requestOnce(key, async () => {
    try {
      const res = await fetchWithTimeout(url, { headers });
      const data = parseJsonResponse(await res.text());
      if (data.code !== 1) {
        throw new Error(data.msg || '请求失败');
      }
      apiCache.set(key, { time: Date.now(), data });
      return data;
    } catch (error) {
      if (cached) return cached.data;
      throw error;
    }
  });
}

async function uploadForumImage(userId, file) {
  const fd = new FormData();
  fd.append('userId', String(userId));
  fd.append('authToken', getStoredAuthToken());
  fd.append('file', file);
  const res = await fetchWithTimeout(`${API_BASE}/uploadImage.php`, {
    method: 'POST',
    body: fd,
  }, 30000);
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '上传失败');
  }
  return data;
}

const forumAPI = {
  getBanners() {
    return getJson('getBanners.php');
  },

  getSiteBranding() {
    return getJson('getSiteBranding.php');
  },

  getSiteAnnouncement() {
    return getJson('getSiteAnnouncement.php');
  },

  adminBannersList(adminToken) {
    return formPost('adminBannersList.php', { adminToken });
  },

  adminBannerSave(adminToken, fields) {
    return formPost('adminBannerSave.php', { ...fields, adminToken });
  },

  adminBannerDelete(adminToken, id) {
    return formPost('adminBannerDelete.php', { adminToken, id });
  },

  adminSearchUsers(adminToken, keyword) {
    return formPost('adminUserSearch.php', { adminToken, keyword });
  },

  adminPostAuthorInfo(adminToken, postId) {
    return formPost('adminPostAuthorInfo.php', { adminToken, postId });
  },

  adminMuteUser(adminToken, fields) {
    return formPost('adminMuteUser.php', { ...fields, adminToken });
  },

  adminDashboardStats(adminToken) {
    return formPost('adminDashboardStats.php', { adminToken });
  },

  adminSaveSiteBranding(adminToken, fields) {
    return formPost('adminSaveSiteBranding.php', { ...fields, adminToken });
  },

  adminSaveSiteAnnouncement(adminToken, fields) {
    return formPost('adminSaveSiteAnnouncement.php', { ...fields, adminToken });
  },

  getPublicDashboardStats(userId = 0) {
    const params = new URLSearchParams();
    if (userId > 0) params.set('userId', String(userId));
    return getJson('publicDashboardStats.php', params.toString());
  },

  getUserBehaviorSummary(userId) {
    const params = new URLSearchParams({ userId: String(userId) });
    return getJson('userBehaviorSummary.php', params.toString());
  },

  getMyCenterSummary(userId) {
    const params = new URLSearchParams({ userId: String(userId) });
    return getJson('myCenterSummary.php', params.toString());
  },

  getMyPosts(userId) {
    const params = new URLSearchParams({ userId: String(userId) });
    return getJson('myPosts.php', params.toString());
  },

  getMyReplies(userId) {
    const params = new URLSearchParams({ userId: String(userId) });
    return getJson('myReplies.php', params.toString());
  },

  getLikedPosts(userId) {
    const params = new URLSearchParams({ userId: String(userId) });
    return getJson('likedPosts.php', params.toString());
  },

  getFeaturedPosts(userId = 0) {
    const params = new URLSearchParams();
    if (userId > 0) params.set('userId', String(userId));
    return getJson('featuredPosts.php', params.toString());
  },

  getMyNotifications(userId) {
    const params = new URLSearchParams({ userId: String(userId) });
    return getJson('myNotifications.php', params.toString());
  },

  getRecommendedPosts(userId, limit = 6) {
    const params = new URLSearchParams();
    if (userId > 0) params.set('userId', String(userId));
    if (limit > 0) params.set('limit', String(limit));
    return getJson('recommendPosts.php', params.toString());
  },

  getPosts(options = {}) {
    const params = new URLSearchParams();
    if (options.categoryId > 0) params.set('categoryId', String(options.categoryId));
    if (options.userId > 0) params.set('userId', String(options.userId));
    if (options.page > 0) params.set('page', String(options.page));
    if (options.pageSize > 0) params.set('pageSize', String(options.pageSize));
    if (options.q) params.set('q', String(options.q));
    return getJson('getPosts.php', params.toString());
  },

  getPostDetail(id, options = {}) {
    let q = `id=${encodeURIComponent(id)}`;
    if (options.skipView) q += '&skipView=1';
    if (options.userId > 0) q += `&userId=${encodeURIComponent(options.userId)}`;
    return getJson('getPostDetail.php', q);
  },

  login(phone, password) {
    return formPost('login.php', { phone, password });
  },

  register(phone, password, nickname) {
    return formPost('register.php', { phone, password, nickname });
  },

  addPost(userId, title, content, categoryId, imagesJson, isAnonymous) {
    const payload = {
      userId,
      authToken: getStoredAuthToken(),
      title,
      content,
      images: imagesJson || '[]',
      isAnonymous: isAnonymous ? 1 : 0,
    };
    if (categoryId !== undefined && categoryId !== null) {
      payload.categoryId = categoryId;
    }
    return formPost('addPost.php', payload);
  },

  addComment(postId, userId, content, imagesJson, isAnonymous) {
    return formPost('addComment.php', {
      postId,
      userId,
      authToken: getStoredAuthToken(),
      content,
      images: imagesJson || '[]',
      isAnonymous: isAnonymous ? 1 : 0,
    });
  },

  deletePost(id, userId) {
    return formPost('deletePost.php', { id, userId, authToken: getStoredAuthToken() });
  },

  togglePostLike(postId, userId) {
    return formPost('togglePostLike.php', { postId, userId, authToken: getStoredAuthToken() });
  },

  uploadImage(userId, file) {
    return uploadForumImage(userId, file);
  },

  updateUserAvatar(userId, avatar) {
    return formPost('updateUserAvatar.php', { userId, avatar, authToken: getStoredAuthToken() });
  },
};

