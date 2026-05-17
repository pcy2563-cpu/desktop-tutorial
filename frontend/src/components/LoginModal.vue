<template>
  <div v-if="visible" class="modal" @click.self="close" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center">
    <div style="background:#fff;border-radius:18px;width:90%;max-width:360px;overflow:hidden">
      <!-- Tab switcher -->
      <div style="display:flex;border-bottom:1px solid #f0f0f0">
        <button @click="mode = 'login'" :style="tabStyle(mode === 'login')">登录</button>
        <button @click="mode = 'register'" :style="tabStyle(mode === 'register')">注册</button>
      </div>

      <!-- Login form -->
      <div v-if="mode === 'login'" style="padding:20px">
        <div style="margin-bottom:14px">
          <input v-model="loginPhone" type="tel" maxlength="11" placeholder="手机号"
            style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;box-sizing:border-box">
        </div>
        <div style="margin-bottom:20px">
          <input v-model="loginPassword" type="password" placeholder="密码"
            style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;box-sizing:border-box">
        </div>
        <button @click="doLogin" :disabled="logging" style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer">
          {{ logging ? '登录中...' : '登录' }}
        </button>
      </div>

      <!-- Register form -->
      <div v-else style="padding:20px">
        <div style="margin-bottom:14px">
          <input v-model="regPhone" type="tel" maxlength="11" placeholder="手机号"
            style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;box-sizing:border-box">
        </div>
        <div style="margin-bottom:14px">
          <input v-model="regPassword" type="password" placeholder="密码（至少6位）"
            style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;box-sizing:border-box">
        </div>
        <div style="margin-bottom:20px">
          <input v-model="regNickname" placeholder="昵称（最多30字）"
            style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;box-sizing:border-box">
        </div>
        <button @click="doRegister" :disabled="registering" style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer">
          {{ registering ? '注册中...' : '注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { forumAPI } from '../api'
import { showToast } from '../utils'

const userStore = useUserStore()
const appStore = useAppStore()

const visible = ref(false)
const mode = ref('login')
const logging = ref(false)
const registering = ref(false)
const loginPhone = ref('')
const loginPassword = ref('')
const regPhone = ref('')
const regPassword = ref('')
const regNickname = ref('')

function tabStyle(active) {
  return {
    flex: 1, padding: '14px', border: 'none', background: 'none',
    fontSize: 15, fontWeight: active ? 600 : 400,
    color: active ? '#3b82f6' : '#999', cursor: 'pointer',
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent'
  }
}

function open(loginMode = 'login') {
  mode.value = loginMode
  visible.value = true
  loginPhone.value = localStorage.getItem('campus_forum_saved_phone') || ''
  loginPassword.value = ''
  regPhone.value = ''
  regPassword.value = ''
  regNickname.value = ''
}

function close() {
  visible.value = false
}

async function doLogin() {
  const phone = loginPhone.value.trim()
  const password = loginPassword.value
  if (!phone || !password) return showToast('请输入手机号和密码')
  if (!/^1\d{10}$/.test(phone)) return showToast('请输入11位手机号')
  logging.value = true
  try {
    const res = await forumAPI.login(phone, password)
    userStore.setUser(res.data)
    localStorage.setItem('campus_forum_saved_phone', phone)
    showToast('登录成功')
    close()
    window.dispatchEvent(new Event('auth-changed'))
  } catch (e) {
    showToast(e.message || '登录失败')
  } finally {
    logging.value = false
  }
}

async function doRegister() {
  const phone = regPhone.value.trim()
  const password = regPassword.value
  const nickname = regNickname.value.trim()
  if (!phone || !password || !nickname) return showToast('请输入手机号、密码和昵称')
  if (!/^1\d{10}$/.test(phone)) return showToast('请输入11位手机号')
  if (password.length < 6) return showToast('密码至少6位')
  if (nickname.length > 30) return showToast('昵称最多30字')
  registering.value = true
  try {
    const res = await forumAPI.register(phone, password, nickname)
    userStore.setUser(res.data)
    localStorage.setItem('campus_forum_saved_phone', phone)
    showToast('注册成功')
    close()
    window.dispatchEvent(new Event('auth-changed'))
  } catch (e) {
    showToast(e.message || '注册失败')
  } finally {
    registering.value = false
  }
}

defineExpose({ open, close })
</script>
