<!--
  AdminReports.vue — 举报审核页面
  功能：
    1. 查看待处理举报列表（支持 pending/resolved/rejected 切换）
    2. 处理举报：隐藏内容、驳回举报、标记已处理
    3. 点击被举报内容跳转查看详情
-->
<template>
  <div class="page-container">
    <!-- 顶栏 -->
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">举报审核</span>
      <span v-if="total > 0" style="font-size:12px;color:#999;margin-left:auto">共 {{ total }} 条</span>
    </div>

    <!-- 状态 Tab -->
    <div style="display:flex;gap:8px;padding:0 16px 12px">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        @click="switchStatus(tab.value)"
        :style="{
          padding: '6px 14px', border: 'none', borderRadius: 99, fontSize: 13, cursor: 'pointer',
          background: currentStatus === tab.value ? '#3b82f6' : '#f1f5f9',
          color: currentStatus === tab.value ? '#fff' : '#64748b'
        }"
      >{{ tab.label }}</button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading" style="padding:40px 0;text-align:center;color:#999">
      <span class="loading-dot"></span>加载中...
    </div>

    <!-- 空状态 -->
    <div v-else-if="reports.length === 0" style="text-align:center;padding:60px 0;color:#999;font-size:14px">
      {{ currentStatus === 'pending' ? '🎉 暂无待处理举报' : '暂无记录' }}
    </div>

    <!-- 举报列表 -->
    <div v-for="r in reports" :key="r.id" style="background:#fff;margin:0 12px 8px;border-radius:12px;padding:14px">
      <!-- 头部：举报类型 + 原因 + 时间 -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span :style="{
          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          background: r.target_type === 'post' ? '#eff6ff' : '#f0fdf4',
          color: r.target_type === 'post' ? '#2563eb' : '#16a34a'
        }">{{ r.target_type === 'post' ? '帖子' : '评论' }}</span>
        <span style="padding:2px 8px;border-radius:99px;font-size:11px;background:#fef3c7;color:#92400e">
          {{ r.reason_label }}
        </span>
        <span style="font-size:12px;color:#999;margin-left:auto">{{ formatTime(r.created_at) }}</span>
      </div>

      <!-- 被举报内容 -->
      <div style="margin-bottom:10px">
        <div v-if="r.target_type === 'post' && r.post_title" style="font-size:14px;color:#333;font-weight:500">
          📄 {{ r.post_title }}
        </div>
        <div v-else-if="r.target_type === 'comment' && r.comment_content" style="font-size:13px;color:#555;line-height:1.5">
          💬 {{ r.comment_content.slice(0, 100) }}{{ r.comment_content.length > 100 ? '...' : '' }}
          <span v-if="r.comment_post_title" style="font-size:12px;color:#999;display:block;margin-top:4px">
            所在帖子：{{ r.comment_post_title }}
          </span>
        </div>
      </div>

      <!-- 举报人信息 -->
      <div style="font-size:12px;color:#999;margin-bottom:10px">
        举报人：{{ r.reporter_nickname || '未知' }}（{{ maskPhone(r.reporter_phone) }}）
        <span v-if="r.detail" style="display:block;margin-top:4px;color:#666">
          补充说明：{{ r.detail }}
        </span>
      </div>

      <!-- 已处理信息 -->
      <div v-if="r.status !== 'pending'" style="font-size:12px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:10px">
        <span :style="{ color: r.status === 'resolved' ? '#16a34a' : '#dc2626' }">
          {{ r.status === 'resolved' ? '✅ 已处理' : '❌ 已驳回' }}
        </span>
        <span v-if="r.handle_action" style="color:#666;margin-left:8px">操作：{{ actionLabel(r.handle_action) }}</span>
        <span v-if="r.handle_note" style="color:#666;display:block;margin-top:2px">备注：{{ r.handle_note }}</span>
      </div>

      <!-- 操作按钮（仅 pending 状态） -->
      <div v-if="r.status === 'pending'" style="display:flex;gap:8px;flex-wrap:wrap">
        <button @click="handleReport(r, 'hide')" :disabled="handling === r.id"
          style="padding:6px 14px;border:none;border-radius:8px;font-size:13px;cursor:pointer;background:#ef4444;color:#fff">
          隐藏内容
        </button>
        <button @click="handleReport(r, 'resolve')" :disabled="handling === r.id"
          style="padding:6px 14px;border:none;border-radius:8px;font-size:13px;cursor:pointer;background:#10b981;color:#fff">
          标记已处理
        </button>
        <button @click="handleReport(r, 'reject')" :disabled="handling === r.id"
          style="padding:6px 14px;border:none;border-radius:8px;font-size:13px;cursor:pointer;background:#6b7280;color:#fff">
          驳回
        </button>
        <!-- 跳转查看 -->
        <button v-if="r.target_type === 'post'" @click="router.push(`/post/${r.target_id}`)"
          style="padding:6px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;cursor:pointer;background:#fff;color:#3b82f6">
          查看帖子 →
        </button>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" style="text-align:center;padding:16px">
      <button @click="loadMore" style="padding:8px 24px;border:1px solid #e5e7eb;border-radius:99px;background:#fff;font-size:13px;cursor:pointer;color:#3b82f6">
        加载更多
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI, clearApiCache } from '../api'
import { formatTime, showToast, maskPhone } from '../utils'

const router = useRouter()
const userStore = useUserStore()

const statusTabs = [
  { label: '待处理', value: 'pending' },
  { label: '已处理', value: 'resolved' },
  { label: '已驳回', value: 'rejected' }
]

const currentStatus = ref('pending')
const reports = ref([])
const loading = ref(false)
const handling = ref(null)
const total = ref(0)
const page = ref(1)
const hasMore = ref(false)

async function loadReports(append = false) {
  loading.value = true
  try {
    const res = await forumAPI.adminReportsList(
      userStore.adminToken,
      currentStatus.value,
      append ? page.value : 1,
      20
    )
    if (append) {
      reports.value.push(...(res.data || []))
    } else {
      reports.value = res.data || []
    }
    total.value = res.pagination?.total || 0
    hasMore.value = !!res.pagination?.has_more
  } catch (e) {
    showToast(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function switchStatus(status) {
  currentStatus.value = status
  page.value = 1
  loadReports()
}

function loadMore() {
  page.value++
  loadReports(true)
}

async function handleReport(report, action) {
  const actionNames = { hide: '隐藏内容', resolve: '标记已处理', reject: '驳回举报' }
  const note = prompt(`处理备注（可选，${actionNames[action]}）`)

  handling.value = report.id
  try {
    await forumAPI.adminReportHandle(userStore.adminToken, report.id, action, note || '')
    showToast('处理成功')
    clearApiCache()
    // 从列表中移除已处理的举报
    reports.value = reports.value.filter(r => r.id !== report.id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    showToast(e.message || '处理失败')
  } finally {
    handling.value = null
  }
}

function actionLabel(action) {
  const map = { hide: '隐藏内容', resolve: '标记已处理', reject: '驳回' }
  return map[action] || action
}

onMounted(() => {
  if (!userStore.isAdmin) {
    showToast('仅管理员可访问')
    router.replace('/home')
    return
  }
  loadReports()
})
</script>
