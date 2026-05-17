/**
 * 用户 Store（Pinia）
 * 管理登录状态、用户信息、认证 token
 * 数据持久化到 localStorage，刷新页面后自动恢复
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { avatarUrl, defaultAvatar, maskPhone } from '../utils'

const USER_KEY = 'campus_forum_user'  // localStorage 存储 key

export const useUserStore = defineStore('user', () => {
  // ---- 核心状态 ----
  const user = ref(null)  // 用户对象，null 表示未登录

  // ---- 计算属性：从 user 对象派生 ----
  const isLoggedIn = computed(() => !!user.value && !!user.value.id)
  const userId = computed(() => user.value?.id || 0)
  const isAdmin = computed(() => user.value && String(user.value.role || '') === 'admin')

  // adminToken：管理员登录后获得，调用管理后台 API 时需要
  const adminToken = computed(() => {
    if (isAdmin.value && user.value?.adminToken) return user.value.adminToken
    return ''
  })

  // authToken：普通用户登录后获得，调用需要身份验证的 API 时需要
  const authToken = computed(() => user.value?.authToken || '')

  // 显示名称：优先昵称，其次脱敏手机号，再次用户名
  const displayName = computed(() => {
    if (!user.value) return '未登录'
    return user.value.nickname || maskPhone(user.value.phone) || user.value.username || '用户'
  })

  // 显示头像：优先用户上传的头像，否则用预设渐变头像
  const displayAvatar = computed(() => {
    if (!user.value) return defaultAvatar('游客')
    return avatarUrl(user.value.avatar_url || user.value.avatar, user.value.nickname || user.value.username)
  })

  // 是否被禁言
  const isMuted = computed(() => {
    if (!user.value) return false
    return Number(user.value.is_muted) === 1 || user.value.is_muted === true
  })

  // ---- 操作函数 ----

  // 从 localStorage 恢复登录状态（页面刷新时调用）
  function initFromStorage() {
    try {
      const stored = localStorage.getItem(USER_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.id) {
          user.value = parsed
        }
      }
    } catch {
      localStorage.removeItem(USER_KEY)
      user.value = null
    }
  }

  // 登录/注册成功后调用，保存用户数据到内存 + localStorage
  function setUser(data) {
    user.value = data
    localStorage.setItem(USER_KEY, JSON.stringify(data))
  }

  // 更新头像 URL（不重新登录，只更新头像字段）
  function updateAvatar(url) {
    if (user.value) {
      user.value = { ...user.value, avatar_url: url, avatar: url }
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    }
  }

  // 退出登录：清除内存状态 + localStorage
  function logout() {
    user.value = null
    localStorage.removeItem(USER_KEY)
  }

  return {
    user, isLoggedIn, userId, isAdmin, adminToken, authToken,
    displayName, displayAvatar, isMuted,
    initFromStorage, setUser, updateAvatar, logout
  }
})
