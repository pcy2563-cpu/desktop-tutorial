<template>
  <div class="page-container">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">数据分析</span>
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#059669,#10b981);margin:12px;border-radius:18px;padding:24px;color:#fff">
      <p style="font-size:12px;opacity:0.8">数据分析</p>
      <h2 style="font-size:20px;font-weight:700;margin:4px 0">论坛数据分析看板</h2>
      <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">
        <div v-for="m in heroMetrics" :key="m.label" style="background:rgba(255,255,255,0.2);padding:8px 12px;border-radius:12px;font-size:13px">
          {{ m.label }} <strong>{{ m.value }}</strong>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 12px">
      <div v-for="(card, i) in summaryCards" :key="i" style="background:#fff;border-radius:18px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <span style="font-size:12px;color:#999">{{ card.label }}</span>
        <div style="font-size:24px;font-weight:700;color:#3b82f6;margin:4px 0">{{ card.value }}</div>
        <p style="font-size:11px;color:#999">{{ card.hint }}</p>
      </div>
    </div>

    <!-- Top Posts -->
    <div v-if="stats.top_posts && stats.top_posts.length" style="background:#fff;margin:12px;border-radius:18px;padding:16px">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">热门帖子</h3>
      <div v-for="(p, i) in stats.top_posts" :key="p.id" @click="router.push(`/post/${p.id}`)"
        style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer">
        <span style="width:20px;height:20px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px">{{ i+1 }}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.title || '未命名帖子' }}</div>
          <div style="font-size:11px;color:#999">{{ p.like_count || 0 }} 赞 · {{ p.comment_count || 0 }} 评论</div>
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div v-if="stats.category_stats && stats.category_stats.length" style="background:#fff;margin:12px;border-radius:18px;padding:16px">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">分类分布</h3>
      <div v-for="c in stats.category_stats" :key="c.category" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span>{{ categoryLabel(c.category) }}</span><strong>{{ c.count }}</strong>
        </div>
        <div style="background:#f0f0f0;height:8px;border-radius:4px;overflow:hidden">
          <div :style="{ width: (c.count / maxCategory * 100) + '%', height: '100%', background: '#059669', borderRadius: '4px' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'

const router = useRouter()
const userStore = useUserStore()
const stats = ref({})
const loading = ref(true)

const heroMetrics = computed(() => [
  { label: '帖子', value: stats.value.post_count || 0 },
  { label: '用户', value: stats.value.user_count || 0 },
  { label: '评论', value: stats.value.comment_count || 0 }
])

const summaryCards = computed(() => [
  { label: '总帖子', value: stats.value.post_count || 0, hint: '累计发布' },
  { label: '总用户', value: stats.value.user_count || 0, hint: '注册用户' },
  { label: '总评论', value: stats.value.comment_count || 0, hint: '累计评论' },
  { label: '总点赞', value: stats.value.like_count || 0, hint: '累计点赞' }
])

const maxCategory = computed(() => Math.max(1, ...(stats.value.category_stats || []).map(c => Number(c.count || 0))))

function categoryLabel(c) {
  const map = { life: '生活', study: '学习', trade: '交易', lost: '失物招领' }
  return map[c] || c
}

onMounted(async () => {
  try {
    const userId = userStore.isAdmin ? userStore.userId : 0
    const res = await forumAPI.getPublicDashboardStats(userId)
    stats.value = res.data || {}
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
