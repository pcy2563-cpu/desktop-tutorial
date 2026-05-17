/* ========================================
 * 共享工具函数
 * ======================================== */

// ============ 头像预设系统 ============
const AVATAR_PRESETS = {
  jade: { start: '#0f766e', end: '#14b8a6', label: '青' },
  sky: { start: '#0369a1', end: '#38bdf8', label: '蓝' },
  sun: { start: '#ea580c', end: '#fb923c', label: '橙' },
  rose: { start: '#be123c', end: '#fb7185', label: '粉' }
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function avatarPresetKey(seed) {
  const keys = Object.keys(AVATAR_PRESETS)
  if (!keys.length) return 'jade'
  const s = String(seed || 'u')
  return keys[Array.from(s).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % keys.length]
}

function presetAvatarUrl(presetKey, displayName) {
  const key = String(presetKey || '').replace(/^preset:/, '') || avatarPresetKey(displayName)
  const preset = AVATAR_PRESETS[key] || AVATAR_PRESETS.jade
  const initial = displayName && String(displayName).trim() ? String(displayName).trim().charAt(0) : '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${preset.start}"/><stop offset="100%" style="stop-color:${preset.end}"/></linearGradient></defs><rect width="80" height="80" rx="24" fill="url(#g)"/><circle cx="64" cy="18" r="10" fill="rgba(255,255,255,0.18)"/><text x="40" y="48" text-anchor="middle" fill="white" font-size="28" font-family="system-ui,sans-serif">${escapeHtml(initial)}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function defaultAvatar(name) {
  return presetAvatarUrl(avatarPresetKey(name), name)
}

export function avatarUrl(avatar, displayName) {
  if (avatar && String(avatar).trim()) {
    const s = String(avatar).trim()
    if (/^preset:/.test(s)) return presetAvatarUrl(s, displayName)
    return s
  }
  return defaultAvatar(displayName || 'u')
}

export function isAnonymousPost(post) {
  return !!post && (Number(post.is_anonymous) === 1 || post.is_anonymous === true)
}

export function getPostDisplayName(post) {
  return isAnonymousPost(post) ? '匿名用户' : (post?.user_nickname || '匿名')
}

export function getPostAvatar(post) {
  return isAnonymousPost(post) ? defaultAvatar('匿') : avatarUrl(post?.user_avatar, post?.user_nickname)
}

export function isAnonymousComment(c) {
  return !!c && (Number(c.is_anonymous) === 1 || c.is_anonymous === true)
}

export function getCommentDisplayName(c) {
  return isAnonymousComment(c) ? '匿名用户' : (c?.user_nickname || '用户')
}

export function getCommentAvatar(c) {
  return isAnonymousComment(c) ? defaultAvatar('匿') : avatarUrl(c?.user_avatar, c?.user_nickname)
}

// ============ 时间格式化 ============
export function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// ============ 图片解析 ============
export function parsePostImages(images) {
  if (!images) return []
  try {
    const arr = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(arr) ? arr.filter(i => typeof i === 'string' && /^\/uploads\/forum\//.test(i.trim())).slice(0, 9) : []
  } catch { return [] }
}

export function encodeGalleryUrls(urls) {
  return encodeURIComponent(JSON.stringify(Array.isArray(urls) ? urls : []))
}

// ============ Toast 通知 ============
let toastTimer = null
export function showToast(message, duration = 2500) {
  let container = document.getElementById('vue-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'vue-toast-container'
    container.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;pointer-events:none'
    document.body.appendChild(container)
  }
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = 'background:rgba(0,0,0,0.78);color:#fff;padding:10px 22px;border-radius:99px;font-size:14px;margin-bottom:8px;opacity:0;transition:opacity 0.3s;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis'
  container.appendChild(toast)
  requestAnimationFrame(() => { toast.style.opacity = '1' })
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// ============ 手机号脱敏 ============
export function maskPhone(phone) {
  const s = phone ? String(phone).trim() : ''
  return /^1\d{10}$/.test(s) ? s.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : s
}

// ============ 行为类型标签 ============
export function behaviorTypeLabel(type) {
  const map = {
    view_post: '浏览帖子', search: '搜索内容', comment_post: '发表评论',
    like_post: '点赞互动', unlike_post: '取消点赞', create_post: '发布帖子',
    browse_category: '浏览内容流'
  }
  return map[String(type || '').toLowerCase()] || type || '其他行为'
}
