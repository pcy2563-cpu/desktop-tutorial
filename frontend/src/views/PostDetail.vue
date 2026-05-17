<!--
  PostDetail.vue —— 帖子详情页
  功能：
    1. 显示帖子完整内容（作者信息、标题、正文、图片网格、互动数据）
    2. 评论区（顶部输入框 + 树状评论列表 + 图片/表情支持）
    3. 帖子操作：点赞、删除（作者/管理员）
    4. 管理员功能：查看帖子真实作者信息（匿名帖也能看到）+ 禁言操作
-->
<template>
  <div class="page-container" style="background:#f0f2f5;min-height:100vh;padding-bottom:70px">

    <!-- ===== 顶部工具栏：返回 + 标题 + 操作按钮 ===== -->
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;background:#fff;border-bottom:1px solid #f0f0f0">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#3b82f6">← 返回</button>
      <span style="font-size:15px;font-weight:600">帖子详情</span>
      <!-- 右侧操作按钮：查看作者（管理员） + 删除（作者/管理员） -->
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <button v-if="userStore.isAdmin" @click="showAdminAuthor"
          style="padding:4px 10px;font-size:12px;border:1px solid #3b82f6;border-radius:99px;background:#eff6ff;color:#3b82f6;cursor:pointer">查看作者</button>
        <button @click="reportPost" style="padding:4px 10px;font-size:12px;border:1px solid #f59e0b;border-radius:99px;background:#fffbeb;color:#92400e;cursor:pointer">举报</button>
        <button v-if="canDelete" @click="deletePost"
          style="padding:4px 10px;font-size:12px;border:1px solid #dc2626;border-radius:99px;background:#fef2f2;color:#dc2626;cursor:pointer">删除</button>
      </div>
    </div>

    <!-- 加载中 / 帖子不存在 状态 -->
    <div v-if="loading" style="text-align:center;padding:60px;color:#999">加载中…</div>
    <div v-else-if="!post" style="text-align:center;padding:60px;color:#999">帖子不存在</div>

    <template v-else>
      <!-- ===== 作者信息栏：头像 + 昵称 + 时间 + 置顶标签 ===== -->
      <div style="background:#fff;padding:16px;display:flex;align-items:center;gap:10px">
        <img :src="pAvatar" alt="" width="40" height="40" style="border-radius:50%;object-fit:cover">
        <div>
          <div style="font-size:14px;font-weight:600">{{ pName }}</div>
          <div style="font-size:12px;color:#999">{{ formatTime(post.created_at) }}</div>
        </div>
        <span v-if="Number(post.is_top)" style="margin-left:auto;font-size:11px;color:#3b82f6;background:#eff6ff;padding:2px 8px;border-radius:99px">置顶</span>
      </div>

      <!-- ===== 正文：保留换行，白色背景 ===== -->
      <div v-if="post.content" style="background:#fff;padding:0 16px 8px;font-size:15px;line-height:1.7;white-space:pre-wrap">{{ post.content }}</div>

      <!-- ===== 图片网格：2列，正方形裁切，无圆角无间距 ===== -->
      <div v-if="images.length" style="background:#fff;padding:0 16px 4px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px">
          <button v-for="(img, i) in images" :key="i" @click="openViewer(i)"
            style="display:block;padding:0;margin:0;border:0;background:none;overflow:hidden;cursor:pointer;outline:0">
            <img :src="img" alt="" style="display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:0">
          </button>
        </div>
      </div>

      <!-- ===== 互动数据栏：浏览 / 点赞 / 评论 ===== -->
      <div style="background:#fff;display:flex;gap:20px;padding:12px 16px;font-size:13px;color:#999;border-bottom:1px solid #f0f0f0">
        <span>👁 {{ post.view_count || 0 }}</span>
        <!-- 点赞：可交互，已点赞时蓝色高亮 -->
        <span @click="toggleLike" :style="{ cursor: 'pointer', color: Number(post.liked_by_me) ? '#3b82f6' : '#999' }">
          👍 {{ postLikeCount }}
        </span>
        <span>💬 {{ post.comment_count || 0 }}</span>
      </div>

      <!-- ===== 评论区 ===== -->
      <div style="background:#fff;margin-top:8px;padding:16px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">评论 ({{ allComments.length }})</h3>

        <!-- ---- 评论输入区（顶部，固定可见） ---- -->
        <!-- 包含：回复目标提示、图片预览、图片上传、表情选择、输入框、发送按钮 -->
        <div style="border-bottom:1px solid #f0f0f0;padding-bottom:12px;margin-bottom:16px">
          <!-- 回复目标提示：点击某条评论的"回复"后显示 -->
          <div v-if="replyTarget" style="font-size:12px;color:#3b82f6;margin-bottom:8px">
            回复 @{{ getCName(replyTarget) }}
            <button @click="replyTarget = null" style="background:none;border:none;color:#999;cursor:pointer;margin-left:8px">取消</button>
          </div>
          <!-- 已上传的图片预览（最多9张） -->
          <div v-if="commentImages.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
            <div v-for="(url, i) in commentImages" :key="i" style="position:relative;width:64px;height:64px">
              <img :src="url" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:6px">
              <!-- 删除按钮（右上角 × ） -->
              <button @click="commentImages.splice(i, 1)" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
            </div>
          </div>
          <!-- 工具栏：图片上传 + 表情 + 输入框 + 发送 -->
          <div style="display:flex;gap:8px;align-items:center">
            <label style="cursor:pointer;font-size:18px;flex-shrink:0" title="上传图片">
              📷<input type="file" accept="image/*" multiple @change="onCommentImageSelect" style="display:none">
            </label>
            <button @click="showCommentEmoji = !showCommentEmoji" style="background:none;border:none;font-size:18px;cursor:pointer;flex-shrink:0" title="表情">😊</button>
            <input v-model="commentText" placeholder="写评论..." @keydown.enter.exact="submitComment"
              style="flex:1;padding:10px;border:1px solid #e5e7eb;border-radius:99px;font-size:14px">
            <button @click="submitComment" :disabled="!commentText.trim() && !commentImages.length"
              style="padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:99px;font-size:14px;cursor:pointer">发送</button>
          </div>
          <!-- 表情面板：80+ emoji，点击插入到输入框 -->
          <div v-if="showCommentEmoji" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;padding:8px;background:#f9fafb;border-radius:12px">
            <button v-for="e in emojis" :key="e" @click="insertCommentEmoji(e)"
              style="background:none;border:none;font-size:20px;padding:4px;cursor:pointer">{{ e }}</button>
          </div>
        </div>

        <!-- ---- 评论列表 ---- -->
        <div v-if="allComments.length === 0" style="text-align:center;color:#999;padding:20px">暂无评论，抢沙发～</div>

        <!-- 评论树：父评论 + 子评论（缩进显示，左边框连接线） -->
        <div v-for="thread in commentTree" :key="thread.comment.id" class="comment-thread">
          <!-- 父评论行 -->
          <div class="comment-row">
            <img :src="getCAvatar(thread.comment)" alt="" class="comment-avatar">
            <div class="comment-body">
              <div class="comment-head">
                <span class="comment-name">{{ getCName(thread.comment) }}</span>
                <span class="comment-time">{{ formatTime(thread.comment.created_at) }}</span>
              </div>
              <div v-if="thread.comment.content" class="comment-text">{{ thread.comment.content }}</div>
              <!-- 评论图片（最多3张缩略图，点击查看大图） -->
              <div v-if="getCommentImages(thread.comment).length" class="comment-images">
                <button v-for="(img, i) in getCommentImages(thread.comment).slice(0, 3)" :key="i" @click.stop="openCommentViewer(getCommentImages(thread.comment), i)"
                  style="display:inline-block;width:80px;height:80px;padding:0;margin:0;border:0;background:none;overflow:hidden;cursor:pointer">
                  <img :src="img" alt="" style="width:80px;height:80px;object-fit:cover;display:block;border-radius:0">
                </button>
              </div>
              <button @click="startReply(thread.comment)" class="comment-reply-btn">回复</button>
              <button @click="reportComment(thread.comment)" class="comment-reply-btn community-comment-report">举报</button>
            </div>
          </div>
          <!-- 子评论列表（缩进 + 左侧连接线） -->
          <div v-if="thread.children.length" class="comment-replies">
            <div v-for="childNode in thread.children" :key="childNode.comment.id" class="comment-row">
              <img :src="getCAvatar(childNode.comment)" alt="" class="comment-avatar">
              <div class="comment-body">
                <div class="comment-head">
                  <span class="comment-name">{{ getCName(childNode.comment) }}</span>
                  <span class="comment-time">{{ formatTime(childNode.comment.created_at) }}</span>
                </div>
                <!-- 子评论内容：带 @父评论作者 提示 -->
                <div v-if="childNode.comment.content" class="comment-text">
                  <span v-if="childNode.comment.parent_id && commentAuthorMap[childNode.comment.parent_id]" style="color:#3b82f6">@{{ commentAuthorMap[childNode.comment.parent_id] }} </span>
                  {{ childNode.comment.content }}
                </div>
                <!-- 子评论图片 -->
                <div v-if="getCommentImages(childNode.comment).length" class="comment-images">
                  <button v-for="(img, i) in getCommentImages(childNode.comment).slice(0, 3)" :key="i" @click.stop="openCommentViewer(getCommentImages(childNode.comment), i)"
                    style="display:inline-block;width:80px;height:80px;padding:0;margin:0;border:0;background:none;overflow:hidden;cursor:pointer">
                    <img :src="img" alt="" style="width:80px;height:80px;object-fit:cover;display:block;border-radius:0">
                  </button>
                </div>
                <button @click="startReply(childNode.comment)" class="comment-reply-btn">回复</button>
                <button @click="reportComment(childNode.comment)" class="comment-reply-btn community-comment-report">举报</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 管理员：帖子作者信息弹窗 ===== -->
    <!-- 显示帖子真实作者信息（匿名帖也能看到用户名和手机号） -->
    <!-- 包含：状态标签（匿名/实名、禁言/正常、角色）+ 九宫格信息 + 禁言操作 -->
    <div v-if="adminInfoVisible"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px"
      @click.self="adminInfoVisible=false">
      <div style="background:#fff;border-radius:18px;width:90%;max-width:360px;max-height:80vh;overflow-y:auto;padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:700">帖子作者信息</h3>
          <button @click="adminInfoVisible=false" style="background:none;border:none;font-size:22px;color:#999;cursor:pointer">×</button>
        </div>
        <p style="font-size:12px;color:#999;margin-bottom:12px">仅管理员可见，匿名帖也能看到真实信息。</p>
        <div v-if="adminInfoLoading" style="text-align:center;padding:20px;color:#999">加载中…</div>
        <div v-else-if="adminInfo">
          <!-- 状态标签行 -->
          <div style="display:flex;gap:6px;margin-bottom:12px">
            <span :style="{ fontSize:'11px', padding:'2px 8px', borderRadius:99, background: adminInfo.is_anonymous ? '#fef3c7' : '#eff6ff', color: adminInfo.is_anonymous ? '#92400e' : '#1e40af' }">{{ adminInfo.is_anonymous ? '匿名发布' : '实名发布' }}</span>
            <span :style="{ fontSize:'11px', padding:'2px 8px', borderRadius:99, background: adminInfo.is_muted ? '#fef2f2' : '#f0fdf4', color: adminInfo.is_muted ? '#dc2626' : '#16a34a' }">{{ adminInfo.is_muted ? '已禁言' : '正常' }}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:99px;background:#f3e8ff;color:#7c3aed">{{ adminInfo.role === 'admin' ? '管理员' : '普通用户' }}</span>
          </div>
          <!-- 九宫格信息卡片 -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div v-for="field in adminInfoFields" :key="field.label" style="background:#f9fafb;border-radius:10px;padding:10px">
              <div style="font-size:11px;color:#999;margin-bottom:2px">{{ field.label }}</div>
              <div style="font-size:14px;font-weight:600;color:#333">{{ field.value }}</div>
            </div>
          </div>
          <!-- 禁言操作（非管理员才显示，防止管理员禁言自己） -->
          <div v-if="adminInfo.role !== 'admin'" style="margin-top:12px;display:flex;gap:8px">
            <button v-if="adminInfo.is_muted" @click="adminToggleMute(false)" style="flex:1;padding:10px;background:#16a34a;color:#fff;border:none;border-radius:99px;font-size:13px;cursor:pointer">解除禁言</button>
            <button v-else @click="adminToggleMute(true)" style="flex:1;padding:10px;background:#dc2626;color:#fff;border:none;border-radius:99px;font-size:13px;cursor:pointer">禁言此用户</button>
          </div>
          <p v-else style="margin-top:12px;font-size:12px;color:#999;text-align:center">管理员账号不能在此处禁言。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { forumAPI, clearApiCache } from '../api'
import { getPostAvatar, getPostDisplayName, getCommentAvatar, getCommentDisplayName, parsePostImages, formatTime, showToast } from '../utils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

// ---- 核心状态 ----
const post = ref(null)                   // 帖子数据对象
const allComments = ref([])              // 评论列表（扁平结构，前端构建树）
const loading = ref(true)                // 页面加载中
const commentText = ref('')              // 评论输入框文本
const replyTarget = ref(null)            // 当前回复的目标评论（null=顶级评论）
const commentAuthorMap = ref({})         // 评论 ID → 作者昵称映射（用于 @回复 显示）
const commentImages = ref([])            // 待上传的评论图片 URL 列表
const showCommentEmoji = ref(false)      // 表情面板是否展开
const adminInfoVisible = ref(false)      // 管理员查看作者弹窗
const adminInfoLoading = ref(false)      // 作者信息加载中
const adminInfo = ref(null)              // 作者信息数据
const emojis = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','🤗','🤩','🤔','😐','😑','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','😖','😞','😟','😤','😢','😭','😨','😩','🤯','😬','😰','😱','👍','👎','❤️','🔥','⭐','🎉','💪','🙏','👏','🤝','✌️','💯','✅','❌','⚡','💡','🎯','🏆','🎵','☕','🍕','🌈','🌙','☀️','🌸','🐱','🐶']

// ---- 计算属性 ----
const pName = computed(() => getPostDisplayName(post.value))
const pAvatar = computed(() => getPostAvatar(post.value))
const images = computed(() => parsePostImages(post.value?.image_medium || post.value?.images))
const viewerImages = computed(() => parsePostImages(post.value?.image_originals || post.value?.images))
const postLikeCount = computed(() => Number(post.value?.likes ?? post.value?.like_count ?? 0))

// 标题显示逻辑：自动截取的标题（"...结尾" 且是正文前缀）不显示
const showTitle = computed(() => {
  const p = post.value
  if (!p?.title || !p?.content) return true
  if (p.title === p.content) return false
  if (p.title.endsWith('...') && p.content.startsWith(p.title.slice(0, -3))) return false
  return true
})

// 删除权限：帖子作者 或 管理员
const canDelete = computed(() => {
  if (!post.value || !userStore.isLoggedIn) return false
  return Number(post.value.can_manage) === 1 || userStore.isAdmin
})

// 管理员作者信息弹窗的九宫格字段
const adminInfoFields = computed(() => {
  if (!adminInfo.value) return []
  const d = adminInfo.value
  return [
    { label: '帖子 ID', value: d.post_id || '暂无' },
    { label: '发帖时间', value: d.post_created_at ? formatTime(d.post_created_at) : '暂无' },
    { label: '用户 ID', value: d.user_id || '暂无' },
    { label: '昵称', value: d.nickname || '未设置' },
    { label: '用户名', value: d.username || '未设置' },
    { label: '手机号', value: d.phone || '未绑定' },
    { label: '账号角色', value: d.role === 'admin' ? '管理员' : '普通用户' },
    { label: '账号状态', value: d.is_muted ? '已禁言' : '正常' },
    { label: '注册时间', value: d.user_created_at ? formatTime(d.user_created_at) : '暂无' }
  ]
})

// ---- 评论树构建 ----
// 将扁平评论列表转换为 { comment, children } 树结构
const commentTree = computed(() => buildCommentTree(allComments.value))

function getCName(c) { return getCommentDisplayName(c) }
function getCAvatar(c) { return getCommentAvatar(c) }

function buildCommentTree(list) {
  const map = {}
  const roots = []
  // 第一遍：为每条评论创建节点
  list.forEach(c => { map[c.id] = { comment: c, children: [] } })
  // 第二遍：有 parent_id 的挂到父节点下，否则作为根节点
  list.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

// ---- 帖子操作 ----

// 设置回复目标
function startReply(c) {
  replyTarget.value = c
  commentText.value = ''
}

// 删除帖子：确认 → API → 清缓存 → 通知列表刷新 → 返回上一页
async function deletePost() {
  if (!confirm('确定删除这条帖子？删除后无法恢复。')) return
  try {
    await forumAPI.deletePost(post.value.id, userStore.userId)
    clearApiCache()
    window.dispatchEvent(new Event('post-updated'))
    showToast('已删除')
    router.back()
  } catch (e) { showToast(e.message || '删除失败') }
}

// 管理员查看帖子作者真实信息
async function showAdminAuthor() {
  adminInfoVisible.value = true
  adminInfoLoading.value = true
  adminInfo.value = null
  try {
    const res = await forumAPI.adminPostAuthorInfo(userStore.adminToken, post.value.id)
    adminInfo.value = res.data || null
  } catch (e) { showToast(e.message || '读取失败') }
  finally { adminInfoLoading.value = false }
}

// 管理员禁言/解除禁言
async function adminToggleMute(mute) {
  if (!adminInfo.value?.user_id) return
  try {
    await forumAPI.adminMuteUser(userStore.adminToken, { userId: adminInfo.value.user_id, muted: mute ? 1 : 0 })
    showToast(mute ? '已禁言' : '已解除禁言')
    await showAdminAuthor()  // 刷新作者信息
  } catch (e) { showToast(e.message || '操作失败') }
}

// ---- 图片查看器 ----
function openViewer(i) { appStore.openImageViewer(viewerImages.value.length ? viewerImages.value : images.value, i) }
function openCommentViewer(imgs, i) { appStore.openImageViewer(imgs, i) }
function getCommentImages(c) { return parsePostImages(c?.images) }

// ---- 评论表情 ----
function insertCommentEmoji(e) {
  commentText.value += e
  showCommentEmoji.value = false
}

// ---- 评论图片上传 ----
async function onCommentImageSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const remaining = 9 - commentImages.value.length
  if (remaining <= 0) return showToast('最多9张图片')
  for (const file of files.slice(0, remaining)) {
    try {
      const res = await forumAPI.uploadImage(file)
      if (res.data?.url) commentImages.value.push(res.data.url)
    } catch (err) { showToast(err.message || '上传失败') }
  }
  e.target.value = ''  // 清空 input 允许重复选择同一文件
}

// ---- 点赞（乐观更新） ----
async function toggleLike() {
  if (!userStore.isLoggedIn) return showToast('请先登录')
  try {
    await forumAPI.togglePostLike(post.value.id, userStore.userId)
    const liked = Number(post.value.liked_by_me)
    post.value.liked_by_me = liked ? 0 : 1
    post.value.likes = postLikeCount.value + (liked ? -1 : 1)
    post.value.like_count = post.value.likes
  } catch (e) { showToast(e.message) }
}

// ---- 提交评论 ----
async function submitComment() {
  if (!commentText.value.trim() && !commentImages.value.length) return
  if (!userStore.isLoggedIn) return showToast('请先登录')
  try {
    await forumAPI.addComment(
      post.value.id, userStore.userId, commentText.value,
      JSON.stringify(commentImages.value), false, replyTarget.value?.id || 0
    )
    // 重置输入状态
    commentText.value = ''
    commentImages.value = []
    showCommentEmoji.value = false
    replyTarget.value = null
    showToast('评论成功')
    // 清除帖子详情缓存 + 通知首页刷新评论数
    clearApiCache('getPostDetail')
    window.dispatchEvent(new Event('post-updated'))
    await loadDetail()  // 重新加载帖子详情（含新评论）
  } catch (e) { showToast(e.message || '评论失败') }
}

// ---- 加载帖子详情 ----
async function loadDetail() {
  try {
    const res = await forumAPI.getPostDetail(route.params.id, { userId: userStore.userId || 0 })
    post.value = res.data.post
    const comments = Array.isArray(res.data.comments) ? res.data.comments : []
    allComments.value = comments
    // 构建评论作者映射：评论 ID → 昵称（用于 @回复 显示）
    comments.forEach(c => {
      commentAuthorMap.value[c.id] = getCommentDisplayName(c)
    })
  } catch (e) {
    console.error(e)
    showToast(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// ---- 生命周期：页面挂载时加载帖子详情 ----
onMounted(() => loadDetail())
</script>

<style scoped>
/* ---- 评论线程 ---- */
.comment-thread { margin-bottom: 12px; }
.comment-row { display: flex; gap: 10px; padding: 8px 0; }
.comment-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.comment-body { flex: 1; min-width: 0; }
.comment-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.comment-name { font-size: 13px; font-weight: 600; }
.comment-time { font-size: 11px; color: #999; }
.comment-text { font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 4px; }
.comment-reply-btn { background: none; border: none; font-size: 12px; color: #3b82f6; cursor: pointer; padding: 0; }
/* 子评论缩进 + 左侧连接线 */
.comment-replies { padding-left: 46px; border-left: 2px solid #f0f0f0; margin-left: 18px; }
/* 评论图片行 */
.comment-images { display: flex; gap: 4px; margin: 6px 0; }
</style>
