<template>
  <div class="page-container">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">内容中心</span>
    </div>

    <!-- Summary -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 12px;margin-bottom:12px">
      <div style="background:#fff;border-radius:18px;padding:16px">
        <span style="font-size:12px;color:#999">我的帖子</span>
        <div style="font-size:24px;font-weight:700;color:#3b82f6">{{ summary.post_count || 0 }}</div>
      </div>
      <div style="background:#fff;border-radius:18px;padding:16px">
        <span style="font-size:12px;color:#999">收到回复</span>
        <div style="font-size:24px;font-weight:700;color:#059669">{{ summary.reply_count || 0 }}</div>
      </div>
      <div style="background:#fff;border-radius:18px;padding:16px">
        <span style="font-size:12px;color:#999">点赞记录</span>
        <div style="font-size:24px;font-weight:700;color:#f59e0b">{{ summary.liked_count || 0 }}</div>
      </div>
      <div style="background:#fff;border-radius:18px;padding:16px">
        <span style="font-size:12px;color:#999">站内通知</span>
        <div style="font-size:24px;font-weight:700;color:#ef4444">{{ summary.notification_count || 0 }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;overflow-x:auto;gap:8px;padding:0 12px 8px;scrollbar-width:none">
      <button v-for="tab in tabs" :key="tab.key"
        @click="switchTab(tab.key)"
        :style="{
          padding: '6px 14px', borderRadius: 99, border: 'none', fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
          background: activeTab === tab.key ? '#3b82f6' : '#fff',
          color: activeTab === tab.key ? '#fff' : '#666'
        }">{{ tab.label }}</button>
    </div>

    <!-- List -->
    <div v-if="loading" class="loading">加载中…</div>
    <div v-else-if="items.length === 0" class="empty">暂无内容</div>
    <PostCard v-for="item in items" :key="item.id" :post="item" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'
import PostCard from '../components/PostCard.vue'

const router = useRouter()
const userStore = useUserStore()
const summary = ref({})
const items = ref([])
const loading = ref(true)
const activeTab = ref('myPosts')

const tabs = [
  { key: 'myPosts', label: '我的帖子' },
  { key: 'myReplies', label: '收到回复' },
  { key: 'likedPosts', label: '点赞过' },
  { key: 'featuredPosts', label: '精选' },
  { key: 'notifications', label: '站内通知' }
]

async function switchTab(key) {
  activeTab.value = key
  loading.value = true
  try {
    const userId = userStore.userId
    let res
    switch (key) {
      case 'myPosts': res = await forumAPI.getMyPosts(userId); break
      case 'myReplies': res = await forumAPI.getMyReplies(userId); break
      case 'likedPosts': res = await forumAPI.getLikedPosts(userId); break
      case 'featuredPosts': res = await forumAPI.getFeaturedPosts(userId); break
      case 'notifications': res = await forumAPI.getMyNotifications(userId); break
    }
    items.value = res?.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await forumAPI.getMyCenterSummary(userStore.userId)
    summary.value = res.data || {}
  } catch {}
  switchTab('myPosts')
})
</script>
