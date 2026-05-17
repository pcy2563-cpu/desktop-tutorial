/**
 * Vue Router 路由配置
 * 使用 HTML5 History 模式（无 # 号），base 路径为 /vue-test/
 *
 * 路由结构：
 *   /               → 重定向到 /home
 *   /home           → 首页（帖子列表 + 轮播图 + 分类 Tab）
 *   /post/:id       → 帖子详情（正文 + 评论 + 图片）
 *   /profile        → 个人中心
 *   /profile/edit   → 编辑资料
 *   /behavior       → 行为画像
 *   /dashboard      → 数据看板
 *   /content        → 内容中心
 *   /admin/banner   → 管理后台 - 轮播图管理
 *   /admin/announcement → 管理后台 - 公告管理
 *   /admin/user     → 管理后台 - 用户管理
 *
 * 所有路由都使用懒加载（() => import(...)），首屏只加载 Home 组件
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/post/:id', name: 'PostDetail', component: () => import('../views/PostDetail.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
  { path: '/profile/edit', name: 'ProfileEdit', component: () => import('../views/ProfileDetail.vue') },
  { path: '/behavior', name: 'Behavior', component: () => import('../views/Behavior.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/content', name: 'ContentCenter', component: () => import('../views/ContentCenter.vue') },
  { path: '/admin/banner', name: 'AdminBanner', component: () => import('../views/AdminBanner.vue') },
  { path: '/admin/announcement', name: 'AdminAnnouncement', component: () => import('../views/AdminAnnouncement.vue') },
  { path: '/admin/user', name: 'AdminUser', component: () => import('../views/AdminUser.vue') },
  { path: '/admin/reports', name: 'AdminReports', component: () => import('../views/AdminReports.vue') }
]

const router = createRouter({
  history: createWebHistory('/vue-test/'),  // History 模式，base 为 /vue-test/
  routes
})

export default router
