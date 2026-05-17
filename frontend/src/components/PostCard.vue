<template>
  <article class="post-item" :data-post-id="post.id" @click="router.push(`/post/${post.id}`)">
    <header class="post-header">
      <img class="post-avatar" :src="pAvatar" alt="" width="40" height="40" loading="lazy">
      <div class="post-info">
        <div class="post-name-row">
          <span class="post-nickname">{{ pName }}</span>
          <span v-if="Number(post.is_anonymous)" class="post-anonymous-tag">匿名</span>
        </div>
        <div class="post-meta">{{ formatTime(post.created_at) }}</div>
      </div>
      <div class="post-header-right">
        <span v-if="Number(post.is_top)" class="post-pin">置顶</span>
        <button class="post-action-btn report" title="举报" @click.stop="reportPost">举报</button>
        <button v-if="canDelete" class="post-action-btn danger" title="删除" @click.stop="deletePost">删除</button>
      </div>
    </header>

    <p v-if="displayContent" class="post-content">{{ displayContent }}</p>

    <div v-if="images.length" class="post-preview-grid" :class="gridClass">
      <button
        v-for="(img, i) in images.slice(0, 9)"
        :key="i"
        class="post-preview-item"
        @click.stop="openViewer(i)"
      >
        <img :src="img" alt="" width="120" height="120" loading="lazy">
        <span v-if="i === 8 && images.length > 9" class="post-preview-more">+{{ images.length - 9 }}</span>
      </button>
    </div>

    <footer class="post-stats">
      <span class="stat-item">浏览 {{ post.view_count ?? 0 }}</span>
      <span class="stat-item likeable" :class="{ active: Number(post.liked_by_me) }" @click.stop="toggleLike">
        赞 {{ postLikeCount }}
      </span>
      <span class="stat-item">评 {{ post.comment_count ?? 0 }}</span>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { forumAPI, clearApiCache } from '../api'
import { getPostAvatar, getPostDisplayName, parsePostImages, formatTime, showToast } from '../utils'

const props = defineProps({ post: Object })

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const pName = computed(() => getPostDisplayName(props.post))
const pAvatar = computed(() => getPostAvatar(props.post))
const images = computed(() => parsePostImages(props.post?.image_thumbnails || props.post?.images))
const viewerImages = computed(() => parsePostImages(props.post?.image_originals || props.post?.images))
const postLikeCount = computed(() => Number(props.post?.likes ?? props.post?.like_count ?? 0))
const displayContent = computed(() => String(props.post?.content || props.post?.title || '').trim())
const gridClass = computed(() => {
  const count = images.value.length
  if (count === 1) return 'single'
  if (count === 2) return 'double'
  return 'multi'
})

const canDelete = computed(() => {
  if (!props.post || !userStore.isLoggedIn) return false
  return Number(props.post.can_manage) === 1 || userStore.isAdmin
})

async function deletePost() {
  if (!confirm('确定删除这条帖子？')) return
  try {
    await forumAPI.deletePost(props.post.id, userStore.userId)
    clearApiCache()
    window.dispatchEvent(new Event('post-updated'))
    showToast('已删除')
  } catch (e) {
    showToast(e.message || '删除失败')
  }
}

function openViewer(index) {
  const urls = viewerImages.value.length ? viewerImages.value : images.value
  if (urls.length) appStore.openImageViewer(urls, index)
}

async function toggleLike() {
  if (!userStore.isLoggedIn) return showToast('请先登录')
  try {
    await forumAPI.togglePostLike(props.post.id, userStore.userId)
    const liked = Number(props.post.liked_by_me)
    props.post.liked_by_me = liked ? 0 : 1
    props.post.likes = postLikeCount.value + (liked ? -1 : 1)
    props.post.like_count = props.post.likes
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

function reportPost() {
  window.dispatchEvent(new CustomEvent('community-report', {
    detail: { targetType: 'post', targetId: props.post.id }
  }))
}
</script>

<style scoped>
.post-item {
  background: #fff;
  margin: 0 0 8px;
  padding: 14px 16px;
  cursor: pointer;
}

.post-item:active {
  background: #f9fafb;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
}

.post-info {
  min-width: 0;
  flex: 1;
}

.post-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-nickname {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  margin-top: 2px;
  color: #999;
  font-size: 12px;
}

.post-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.post-pin,
.post-anonymous-tag {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

.post-pin {
  background: #eff6ff;
  color: #3b82f6;
}

.post-anonymous-tag {
  background: #fef3c7;
  color: #92400e;
}

.post-action-btn {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 4px 9px;
  background: #fff;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
}

.post-action-btn.report:hover {
  border-color: #f59e0b;
  color: #92400e;
}

.post-action-btn.danger:hover {
  border-color: #dc2626;
  color: #dc2626;
}

.post-content {
  display: -webkit-box;
  overflow: hidden;
  margin: 0 0 10px;
  color: #333;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.65;
  text-overflow: ellipsis;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.post-preview-grid {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.post-preview-grid.single {
  grid-template-columns: 1fr;
}

.post-preview-grid.double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.post-preview-grid.multi {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.post-preview-item {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1;
  border: 0;
  border-radius: 14px;
  background: #e8eef6;
  cursor: pointer;
}

.post-preview-grid.single .post-preview-item {
  aspect-ratio: 16 / 10;
}

.post-preview-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-preview-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .42);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.post-stats {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  color: #999;
  font-size: 13px;
}

.stat-item.likeable {
  cursor: pointer;
}

.stat-item.likeable.active {
  color: #3b82f6;
}
</style>
