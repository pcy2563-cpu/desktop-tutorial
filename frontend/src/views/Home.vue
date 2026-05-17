<template>
  <div class="page-container home-page">
    <section v-if="banners.length" id="heroCarouselRoot" class="hero-carousel-root">
      <div class="hero-scroller" ref="heroScroller">
        <div v-for="b in banners" :key="b.id" class="hero-card">
          <a v-if="b.link_url" :href="b.link_url" target="_blank" rel="noopener noreferrer">
            <img :src="b.image" :alt="b.title || '轮播图'" loading="lazy">
          </a>
          <img v-else :src="b.image" :alt="b.title || '轮播图'" loading="lazy">
        </div>
      </div>
      <div v-if="banners.length > 1" class="hero-dots">
        <button
          v-for="(_, i) in banners"
          :key="i"
          class="hero-dot"
          :class="{ active: carouselIndex === i }"
          @click="gotoSlide(i)"
        />
      </div>
    </section>

    <section class="home-search-wrap">
      <div class="home-search">
        <span class="home-search-icon">⌕</span>
        <input
          v-model="searchQuery"
          autocomplete="off"
          inputmode="search"
          placeholder="搜索帖子内容"
          @keydown.enter="doSearch"
        >
        <button v-if="searchQuery" class="home-search-clear" @click="clearSearch">清空</button>
      </div>
    </section>

    <section class="feed-tabs" aria-label="帖子栏目">
      <button
        v-for="tab in feedTabs"
        :key="tab.key"
        class="feed-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </section>

    <div v-if="loading && posts.length === 0" class="loading">
      <span class="loading-dot"></span>加载中...
    </div>

    <div v-else-if="posts.length === 0" class="empty">
      <strong>{{ emptyTitle }}</strong>
      <span>{{ emptyHint }}</span>
    </div>

    <template v-else>
      <PostCard v-for="p in posts" :key="p.id" :post="p" />
    </template>

    <div v-if="hasMore && posts.length" class="load-more-wrap">
      <button class="load-more-btn" :disabled="loading" @click="loadMore">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>

    <div v-if="showAnnouncement && announcement" class="announcement-overlay" @click.self="closeAnnouncement">
      <div class="announcement-modal">
        <div class="announcement-header">
          <h3 class="announcement-title">{{ announcement.title || '站内公告' }}</h3>
          <button class="announcement-close" @click="closeAnnouncement">×</button>
        </div>
        <div class="announcement-body">
          <img v-if="announcement.image" :src="announcement.image" alt="" class="announcement-image">
          <div v-if="announcement.body" class="announcement-text">{{ announcement.body }}</div>
        </div>
        <div class="announcement-footer">
          <button v-if="announcement.link" class="announcement-btn announcement-btn-primary" @click="openAnnouncementLink">查看详情</button>
          <button class="announcement-btn" @click="closeAnnouncement">我知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { forumAPI, clearApiCache } from '../api'
import PostCard from '../components/PostCard.vue'
import { useUserStore } from '../stores/user'
import { showToast } from '../utils'

const userStore = useUserStore()
const loginModal = inject('loginModal', null)

const feedTabs = [
  { key: 'new', label: '新发' },
  { key: 'myPosts', label: '我发', auth: true },
  { key: 'myReplies', label: '我回', auth: true },
  { key: 'likedPosts', label: '我赞', auth: true },
  { key: 'featured', label: '精选' },
  { key: 'notifications', label: '通知', auth: true }
]

const posts = ref([])
const loading = ref(false)
const activeTab = ref('new')
const page = ref(1)
const hasMore = ref(true)
const searchQuery = ref('')
const banners = ref([])
const carouselIndex = ref(0)
const heroScroller = ref(null)
const announcement = ref(null)
const showAnnouncement = ref(false)
let carouselTimer = null

const emptyTitle = computed(() => {
  const tab = feedTabs.find(item => item.key === activeTab.value)
  return tab ? `${tab.label}暂无内容` : '暂无内容'
})

const emptyHint = computed(() => {
  if (searchQuery.value.trim()) return '换个关键词再试试'
  if (activeTab.value === 'new') return '还没有帖子，点击底部加号发布第一条动态'
  if (!userStore.isLoggedIn) return '登录后可以查看自己的互动记录'
  return '有新的互动后会显示在这里'
})

function requireLoginForTab(key) {
  const tab = feedTabs.find(item => item.key === key)
  if (!tab?.auth || userStore.isLoggedIn) return true
  showToast('请先登录')
  loginModal?.value?.open?.('login')
  return false
}

function normalizeList(res) {
  const data = res?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.posts)) return data.posts
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.list)) return data.list
  return []
}

async function fetchTabPosts() {
  const userId = userStore.userId || 0
  const q = searchQuery.value.trim() || undefined
  switch (activeTab.value) {
    case 'myPosts':
      return forumAPI.getMyPosts(userId)
    case 'myReplies':
      return forumAPI.getMyReplies(userId)
    case 'likedPosts':
      return forumAPI.getLikedPosts(userId)
    case 'featured':
      return forumAPI.getFeaturedPosts(userId)
    case 'notifications':
      return forumAPI.getMyNotifications(userId)
    default:
      return forumAPI.getPosts({
        page: page.value,
        pageSize: 10,
        q,
        userId
      })
  }
}

async function loadPosts(reset = false) {
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  if (loading.value) return
  if (!requireLoginForTab(activeTab.value)) {
    posts.value = []
    hasMore.value = false
    return
  }

  loading.value = true
  try {
    const res = await fetchTabPosts()
    const list = normalizeList(res)
    posts.value = reset ? list : [...posts.value, ...list]
    const pagination = res?.pagination || {}
    hasMore.value = activeTab.value === 'new' && Number(pagination.has_more) === 1
  } catch (e) {
    console.error(e)
    showToast(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function switchTab(key) {
  if (activeTab.value === key) return
  if (!requireLoginForTab(key)) return
  activeTab.value = key
  searchQuery.value = ''
  loadPosts(true)
}

function loadMore() {
  if (activeTab.value !== 'new') return
  page.value += 1
  loadPosts()
}

function doSearch() {
  activeTab.value = 'new'
  loadPosts(true)
}

function clearSearch() {
  searchQuery.value = ''
  loadPosts(true)
}

async function loadBanners() {
  try {
    const res = await forumAPI.getBanners()
    banners.value = Array.isArray(res.data) ? res.data.filter(b => b && String(b.image || '').trim()) : []
  } catch {
    banners.value = []
  }
}

function gotoSlide(i) {
  carouselIndex.value = i
  if (heroScroller.value) {
    heroScroller.value.scrollTo({ left: heroScroller.value.clientWidth * i, behavior: 'smooth' })
  }
}

function startCarousel() {
  if (banners.value.length <= 1) return
  carouselTimer = setInterval(() => {
    carouselIndex.value = (carouselIndex.value + 1) % banners.value.length
    gotoSlide(carouselIndex.value)
  }, 4800)
}

function onAuthChanged() {
  loadPosts(true)
}

const ANNOUNCEMENT_SEEN_KEY = 'forum_announcement_seen_v2'

async function loadAnnouncement() {
  try {
    const res = await forumAPI.getSiteAnnouncement()
    const data = res.data || {}
    if (data.enabled && (data.title || data.body || data.image)) {
      announcement.value = data
      const sig = [data.enabled ? '1' : '0', data.title || '', data.body || '', data.image || '', data.link || ''].join('|')
      try {
        if (sessionStorage.getItem(ANNOUNCEMENT_SEEN_KEY) !== sig) {
          showAnnouncement.value = true
          sessionStorage.setItem(ANNOUNCEMENT_SEEN_KEY, sig)
        }
      } catch {
        showAnnouncement.value = true
      }
    }
  } catch {}
}

function closeAnnouncement() {
  showAnnouncement.value = false
}

function openAnnouncementLink() {
  if (announcement.value?.link) window.open(announcement.value.link, '_blank', 'noopener,noreferrer')
  closeAnnouncement()
}

onMounted(async () => {
  clearApiCache()
  await loadBanners()
  startCarousel()
  loadPosts(true)
  loadAnnouncement()
  window.addEventListener('auth-changed', onAuthChanged)
  window.addEventListener('post-published', () => { clearApiCache(); activeTab.value = 'new'; loadPosts(true) })
  window.addEventListener('post-updated', () => { clearApiCache(); loadPosts(true) })
})

onUnmounted(() => {
  clearInterval(carouselTimer)
  window.removeEventListener('auth-changed', onAuthChanged)
})
</script>

<style scoped>
.home-page {
  background: transparent;
  min-height: 100vh;
  padding-bottom: 78px;
}

.hero-carousel-root {
  position: relative;
  overflow: hidden;
}

.hero-scroller {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.hero-scroller::-webkit-scrollbar {
  display: none;
}

.hero-card {
  flex: 0 0 100%;
  scroll-snap-align: start;
}

.hero-card img {
  width: 100%;
  aspect-ratio: 2.2/1;
  object-fit: cover;
  display: block;
}

.hero-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}

.hero-dot {
  width: 6px;
  height: 6px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .55);
  cursor: pointer;
}

.hero-dot.active {
  width: 16px;
  border-radius: 999px;
  background: #fff;
}

.home-search-wrap {
  padding: 12px 14px 6px;
}

.home-search {
  position: relative;
}

.home-search input {
  width: 100%;
  padding: 11px 68px 11px 38px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  font-size: 14px;
  box-sizing: border-box;
}

.home-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  color: #64748b;
  transform: translateY(-50%);
}

.home-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  border: 0;
  border-radius: 999px;
  padding: 6px 10px;
  background: #eef4ff;
  color: #246bfe;
  transform: translateY(-50%);
  cursor: pointer;
}

.feed-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 12px 10px;
  scrollbar-width: none;
}

.feed-tabs::-webkit-scrollbar {
  display: none;
}

.feed-tab {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  padding: 7px 15px;
  background: #fff;
  color: #566173;
  font-size: 13px;
  cursor: pointer;
}

.feed-tab.active {
  background: #246bfe;
  color: #fff;
  font-weight: 700;
}

.loading,
.empty {
  margin: 16px 12px;
  padding: 34px 18px;
  text-align: center;
  color: #64748b;
}

.empty {
  display: grid;
  gap: 8px;
}

.empty strong {
  color: #172033;
  font-size: 16px;
}

.load-more-wrap {
  padding: 16px;
  text-align: center;
}

.load-more-btn {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 9px 24px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

.announcement-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, .5);
}

.announcement-modal {
  display: flex;
  width: 90%;
  max-width: 360px;
  max-height: 80vh;
  overflow: hidden;
  flex-direction: column;
  border-radius: 18px;
  background: #fff;
  animation: fadeIn .3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.announcement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}

.announcement-title {
  margin: 0;
  color: #0f172a;
  font-size: 17px;
  font-weight: 700;
}

.announcement-close {
  border: 0;
  background: none;
  color: #999;
  font-size: 22px;
  cursor: pointer;
}

.announcement-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 12px;
}

.announcement-image {
  display: block;
  width: 80px;
  height: 80px;
  margin-bottom: 10px;
  border-radius: 8px;
  object-fit: cover;
}

.announcement-text {
  color: #333;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.announcement-footer {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 8px 16px 16px;
}

.announcement-btn {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 10px 24px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.announcement-btn-primary {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
}
</style>
