<template>
  <div class="page-container">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">行为画像</span>
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#4f46e5,#0ea5e9);margin:12px;border-radius:18px;padding:24px;color:#fff">
      <p style="font-size:12px;opacity:0.8">行为画像</p>
      <h2 style="font-size:20px;font-weight:700;margin:4px 0">我的行为画像</h2>
      <div style="display:flex;gap:12px;margin-top:12px">
        <div style="background:rgba(255,255,255,0.2);padding:8px 12px;border-radius:12px;font-size:13px">
          活跃分 <strong>{{ summary.active_score || 0 }}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.2);padding:8px 12px;border-radius:12px;font-size:13px">
          {{ stageLabel }}
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="tags.length" style="padding:0 12px;margin-bottom:12px">
      <span v-for="t in tags" :key="t" style="display:inline-block;background:#eff6ff;color:#3b82f6;padding:4px 10px;border-radius:99px;font-size:12px;margin:2px 4px">{{ t }}</span>
    </div>

    <!-- Preferences -->
    <div style="background:#fff;margin:0 12px 12px;border-radius:18px;padding:16px">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">行为偏好</h3>
      <div v-if="preferences.length === 0" style="color:#999;font-size:13px">画像建立中...</div>
      <div v-for="p in preferences" :key="p.behavior_type" style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span>{{ p.label }}</span><strong>{{ p.score }}</strong>
        </div>
        <div style="background:#f0f0f0;height:8px;border-radius:4px;overflow:hidden">
          <div :style="{ width: (p.score / maxScore * 100) + '%', height: '100%', background: '#3b82f6', borderRadius: '4px' }"></div>
        </div>
      </div>
    </div>

    <!-- Keywords -->
    <div style="background:#fff;margin:0 12px 12px;border-radius:18px;padding:16px">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">高频关键词</h3>
      <div v-if="keywords.length === 0" style="color:#999;font-size:13px">继续搜索和浏览后会更准确</div>
      <span v-for="k in keywords" :key="k" style="display:inline-block;background:#f0fdf4;color:#059669;padding:4px 10px;border-radius:99px;font-size:12px;margin:2px 4px">{{ k }}</span>
    </div>

    <!-- Recent behaviors -->
    <div style="background:#fff;margin:0 12px 12px;border-radius:18px;padding:16px">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">最近行为</h3>
      <div v-if="behaviors.length === 0" style="color:#999;font-size:13px">继续使用后显示</div>
      <div v-for="b in behaviors" :key="b.created_at" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px">
        <div>
          <strong>{{ b.label || '浏览内容' }}</strong>
          <span style="color:#999;margin-left:8px">{{ getEventNote(b.behavior_type) }}</span>
        </div>
        <time style="color:#999">{{ formatTime(b.created_at) }}</time>
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
const summary = ref({})
const tags = ref([])
const preferences = ref([])
const keywords = ref([])
const behaviors = ref([])

const maxScore = computed(() => Math.max(1, ...preferences.value.map(p => p.score || 0)))
const stageLabel = computed(() => {
  const s = Number(summary.value.active_score || 0)
  const d = Number(summary.value.recent_active_days || 0)
  return s >= 60 || d >= 10 ? '深度活跃' : s >= 25 || d >= 5 ? '稳定成型' : s > 0 ? '持续成型' : '画像待建立'
})

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

function getEventNote(type) {
  const map = { search: '搜索记录', view_post: '浏览记录', like_post: '点赞记录', comment_post: '评论记录', create_post: '发帖记录', browse_category: '浏览路径' }
  return map[type] || '行为记录'
}

onMounted(async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await forumAPI.getUserBehaviorSummary(userStore.userId)
    const s = res.data?.summary || {}
    summary.value = s
    keywords.value = Array.isArray(s.top_keywords) ? s.top_keywords : []
    behaviors.value = Array.isArray(s.recent_behaviors) ? s.recent_behaviors : []
    // Build preferences
    const prefs = Array.isArray(s.behavior_preferences) ? s.behavior_preferences : []
    const weights = { create_post: 6, comment_post: 5, like_post: 4, view_post: 3, search: 2, browse_category: 2 }
    const labels = { create_post: '发帖', comment_post: '评论', like_post: '点赞', view_post: '浏览', search: '搜索', browse_category: '分类浏览' }
    preferences.value = Object.keys(weights).map(k => ({
      behavior_type: k, label: labels[k],
      score: Number((s.behavior_counts || {})[k] || 0) * weights[k]
    })).filter(p => p.score > 0).sort((a, b) => b.score - a.score)
    // Build tags
    const t = []
    const score = Number(s.active_score || 0)
    if (score >= 60) t.push('深度活跃')
    else if (score >= 25) t.push('稳定成型')
    else if (score > 0) t.push('持续成型')
    else t.push('画像建立中')
    if (keywords.value.length >= 3) t.push('关键词样本充足')
    tags.value = t
  } catch (e) { console.error(e) }
})
</script>
