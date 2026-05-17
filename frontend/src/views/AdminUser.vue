<template>
  <div class="page-container">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">用户管理</span>
    </div>
    <div style="padding:0 12px 12px">
      <input v-model="keyword" @input="debouncedSearch" placeholder="搜索用户..."
        style="width:100%;padding:10px 14px;border:1px solid #e5e7eb;border-radius:99px;font-size:14px">
    </div>
    <div v-if="loading" class="loading">搜索中…</div>
    <div v-for="u in users" :key="u.id" style="background:#fff;margin:0 12px 8px;border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px">
      <img :src="u.avatar_url || '/default-avatar.png'" alt="" style="width:42px;height:42px;border-radius:50%;object-fit:cover">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600">{{ u.nickname || u.username }}</div>
        <div style="font-size:12px;color:#999">{{ u.phone || '-' }} · {{ u.role }}</div>
      </div>
      <button @click="toggleMute(u)" :style="{
        padding: '6px 12px', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
        background: Number(u.is_muted) ? '#10b981' : '#ef4444',
        color: '#fff'
      }">{{ Number(u.is_muted) ? '解禁' : '禁言' }}</button>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'
const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')
const users = ref([])
const loading = ref(false)
let timer = null
function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(search, 400)
}
async function search() {
  if (!keyword.value.trim()) return
  loading.value = true
  try {
    const res = await forumAPI.adminSearchUsers(userStore.adminToken, keyword.value)
    users.value = res.data || []
  } catch (e) { alert(e.message) }
  finally { loading.value = false }
}
async function toggleMute(u) {
  const mute = !Number(u.is_muted)
  const reason = mute ? prompt('禁言原因（可选）') : ''
  try {
    await forumAPI.adminMuteUser(userStore.adminToken, { userId: u.id, muted: mute ? 1 : 0, reason: reason || '' })
    u.is_muted = mute ? 1 : 0
  } catch (e) { alert(e.message) }
}
</script>
