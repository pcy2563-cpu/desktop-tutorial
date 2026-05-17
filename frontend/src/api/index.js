/**
 * API 层 —— 封装所有与后端 PHP 的 HTTP 通信
 *
 * 核心机制：
 *   - formPost()：POST 请求，application/x-www-form-urlencoded 格式
 *   - getJson()：GET 请求，带 12 秒本地缓存 + 认证头注入
 *   - requestOnce()：去重，同一 key 的并发请求只发一次
 *   - clearApiCache()：手动清除缓存（发帖/评论/删除后调用）
 */
import { useUserStore } from '../stores/user'

// ---- 常量 ----
const API_BASE = `${window.location.origin.replace(/\/$/, '')}/api`  // 后端 API 根路径
const TIMEOUT = 10000       // 请求超时：10 秒
const CACHE_TTL = 12000     // GET 请求缓存有效期：12 秒

// ---- 内部状态 ----
const cache = new Map()     // GET 响应缓存，key → { time, data }
const pending = new Map()   // 正在进行的请求，key → Promise（去重用）

// 生成缓存 key：METHOD:url:extra
function cacheKey(method, url, extra = '') {
  return `${method}:${url}:${extra}`
}

// 带超时的 fetch：超过 ms 毫秒自动 abort
async function fetchWithTimeout(url, opts = {}, ms = TIMEOUT) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

// 请求去重：同一 key 只发一次，后续调用复用同一个 Promise
async function requestOnce(key, fn) {
  if (pending.has(key)) return pending.get(key)
  const p = fn().finally(() => pending.delete(key))
  pending.set(key, p)
  return p
}

// 解析 JSON 响应，处理 BOM 头
function parseJson(text) {
  let t = text.trim()
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1)  // 去掉 UTF-8 BOM
  return JSON.parse(t)
}

// 从 Pinia store 获取当前用户的 authToken 和 adminToken
function getTokens() {
  const store = useUserStore()
  return { auth: store.authToken, admin: store.adminToken }
}

// ---- POST 请求：application/x-www-form-urlencoded ----
// 用于所有写操作（登录、发帖、评论、删除、点赞、管理后台等）
async function formPost(endpoint, data) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(data)) {
    if (v != null) params.set(k, String(v))
  }
  const url = `${API_BASE}/${endpoint}`
  const body = params.toString()
  const key = cacheKey('POST', url, body)

  return requestOnce(key, async () => {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body
    })
    const json = parseJson(await res.text())
    if (json.code !== 1) throw new Error(json.msg || '操作失败')
    return json
  })
}

// ---- GET 请求：带缓存 + 认证头 ----
// 用于所有读操作（帖子列表、详情、公告、轮播图等）
async function getJson(endpoint, query = '') {
  const n = query ? (query.startsWith('?') ? query : `?${query}`) : ''
  const url = `${API_BASE}/${endpoint}${n}`
  const { auth, admin } = getTokens()

  // 注入认证头（管理后台接口需要）
  const headers = {}
  if (auth) headers['X-Auth-Token'] = auth
  if (admin) headers['X-Admin-Token'] = admin

  // 缓存 key 包含 URL + 认证状态，不同用户/角色的缓存隔离
  const key = cacheKey('GET', url, `${auth ? 'auth' : 'guest'}:${admin ? 'admin' : 'user'}`)
  const cached = cache.get(key)

  // 缓存命中且未过期，直接返回
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data

  return requestOnce(key, async () => {
    try {
      const res = await fetchWithTimeout(url, { headers })
      const json = parseJson(await res.text())
      if (json.code !== 1) throw new Error(json.msg || '请求失败')
      cache.set(key, { time: Date.now(), data: json })  // 写入缓存
      return json
    } catch (e) {
      if (cached) return cached.data  // 网络失败时返回过期缓存（降级策略）
      throw e
    }
  })
}

// ---- 图片上传：multipart/form-data，超时 30 秒 ----
async function uploadImage(file) {
  const store = useUserStore()
  const fd = new FormData()
  fd.append('userId', String(store.userId))
  fd.append('authToken', store.authToken)
  fd.append('file', file)
  const res = await fetchWithTimeout(`${API_BASE}/uploadImage.php`, { method: 'POST', body: fd }, 30000)
  const json = parseJson(await res.text())
  if (json.code !== 1) throw new Error(json.msg || '上传失败')
  return json
}

// ---- 手动清除缓存 ----
// keyFragment：只清除包含该字符串的缓存 key；不传则清空全部
export function clearApiCache(keyFragment) {
  if (keyFragment) {
    for (const key of cache.keys()) {
      if (key.includes(keyFragment)) cache.delete(key)
    }
  } else {
    cache.clear()
  }
}

// ================================================================
// forumAPI：所有业务接口的统一出口
// ================================================================
export const forumAPI = {

  // ---- 登录/注册 ----
  login: (phone, pwd) => formPost('login.php', { phone, password: pwd }),
  register: (phone, pwd, nick) => formPost('register.php', { phone, password: pwd, nickname: nick }),

  // ---- 帖子 CRUD ----
  getPosts: (opts = {}) => {
    const p = new URLSearchParams()
    if (opts.categoryId > 0) p.set('categoryId', opts.categoryId)
    if (opts.userId > 0) p.set('userId', opts.userId)
    if (opts.page > 0) p.set('page', opts.page)
    if (opts.pageSize > 0) p.set('pageSize', opts.pageSize)
    if (opts.q) p.set('q', opts.q)
    return getJson('getPosts.php', p.toString())
  },
  getPostDetail: (id, opts = {}) => {
    let q = `id=${encodeURIComponent(id)}`
    if (opts.skipView) q += '&skipView=1'
    if (opts.userId > 0) q += `&userId=${encodeURIComponent(opts.userId)}`
    return getJson('getPostDetail.php', q)
  },
  addPost: (userId, title, content, categoryId, images, isAnonymous) => {
    const store = useUserStore()
    return formPost('addPost.php', {
      userId, authToken: store.authToken, title, content,
      images: images || '[]', isAnonymous: isAnonymous ? 1 : 0,
      ...(categoryId != null ? { categoryId } : {})
    })
  },
  deletePost: (id, userId) => {
    const store = useUserStore()
    return formPost('deletePost.php', { id, userId, authToken: store.authToken })
  },

  // ---- 评论 ----
  addComment: (postId, userId, content, images, isAnonymous, parentId) => {
    const store = useUserStore()
    return formPost('addComment.php', {
      postId, userId, authToken: store.authToken, content,
      images: images || '[]', isAnonymous: isAnonymous ? 1 : 0,
      parentId: parentId || 0
    })
  },

  // ---- 点赞 ----
  togglePostLike: (postId, userId) => {
    const store = useUserStore()
    return formPost('togglePostLike.php', { postId, userId, authToken: store.authToken })
  },

  // ---- 内容中心：我的帖子/回复/点赞/精选/通知 ----
  getMyPosts: (userId) => getJson('myPosts.php', `userId=${userId}`),
  getMyReplies: (userId) => getJson('myReplies.php', `userId=${userId}`),
  getLikedPosts: (userId) => getJson('likedPosts.php', `userId=${userId}`),
  getFeaturedPosts: (userId = 0) => {
    const p = new URLSearchParams()
    if (userId > 0) p.set('userId', userId)
    return getJson('featuredPosts.php', p.toString())
  },
  getMyNotifications: (userId) => getJson('myNotifications.php', `userId=${userId}`),
  getMyCenterSummary: (userId) => getJson('myCenterSummary.php', `userId=${userId}`),

  // ---- 行为画像 & 推荐 ----
  getUserBehaviorSummary: (userId) => getJson('userBehaviorSummary.php', `userId=${userId}`),
  getRecommendedPosts: (userId, limit = 6) => {
    const p = new URLSearchParams()
    if (userId > 0) p.set('userId', userId)
    if (limit > 0) p.set('limit', limit)
    return getJson('recommendPosts.php', p.toString())
  },

  // ---- 数据看板（公开统计） ----
  getPublicDashboardStats: (userId = 0) => {
    const p = new URLSearchParams()
    if (userId > 0) p.set('userId', userId)
    return getJson('publicDashboardStats.php', p.toString())
  },

  // ---- 站点配置（公开读取） ----
  getBanners: () => getJson('getBanners.php'),           // 轮播图
  getSiteBranding: () => getJson('getSiteBranding.php'), // 品牌设置（Logo 文字/图片）
  getSiteAnnouncement: () => getJson('getSiteAnnouncement.php'), // 站内公告

  // ---- 用户头像 ----
  updateUserAvatar: (userId, avatar) => {
    const store = useUserStore()
    return formPost('updateUserAvatar.php', { userId, avatar, authToken: store.authToken })
  },
  uploadImage,

  // ---- 管理后台（需要 adminToken） ----
  adminBannersList: (adminToken) => formPost('adminBannersList.php', { adminToken }),
  adminBannerSave: (adminToken, data) => formPost('adminBannerSave.php', { ...data, adminToken }),
  adminBannerDelete: (adminToken, id) => formPost('adminBannerDelete.php', { adminToken, id }),
  adminSearchUsers: (adminToken, keyword) => formPost('adminUserSearch.php', { adminToken, keyword }),
  adminPostAuthorInfo: (adminToken, postId) => formPost('adminPostAuthorInfo.php', { adminToken, postId }), // 查看帖子真实作者（匿名帖也能看到）
  adminMuteUser: (adminToken, data) => formPost('adminMuteUser.php', { ...data, adminToken }),              // 禁言/解除禁言
  adminDashboardStats: (adminToken) => formPost('adminDashboardStats.php', { adminToken }),
  adminSaveSiteBranding: (adminToken, data) => formPost('adminSaveSiteBranding.php', { ...data, adminToken }),
  adminSaveSiteAnnouncement: (adminToken, data) => formPost('adminSaveSiteAnnouncement.php', { ...data, adminToken }), // 保存站内公告

  // ---- 举报审核（管理员） ----
  adminReportsList: (adminToken, status = 'pending', page = 1, pageSize = 20) => {
    return getJson('adminReportsList.php', `adminToken=${encodeURIComponent(adminToken)}&status=${status}&page=${page}&pageSize=${pageSize}`)
  },
  adminReportHandle: (adminToken, reportId, action, note = '') => {
    return formPost('adminReportHandle.php', { adminToken, reportId, action, note })
  }
}
