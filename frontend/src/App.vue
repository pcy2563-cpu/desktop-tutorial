<!--
  App.vue —— 应用根组件
  功能：
    1. 渲染全局布局：router-view（页面内容）+ BottomNav（底部导航）+ 弹窗层
    2. 通过 provide/inject 向子组件提供 loginModal 和 publishModal 引用
    3. 手机返回键「再按一次退出」机制
    4. 初始化用户登录状态（从 localStorage 恢复）
-->
<template>
  <div id="app-root">
    <!-- 路由出口：Home / PostDetail / Profile 等页面在这里渲染 -->
    <router-view />
    <!-- 底部导航栏：始终固定在页面底部 -->
    <BottomNav />
    <!-- 全局弹窗组件（始终挂载，通过 store/refs 控制显隐） -->
    <ImageViewer />
    <PublishModal ref="publishModal" />
    <LoginModal ref="loginModal" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import ImageViewer from './components/ImageViewer.vue'
import PublishModal from './components/PublishModal.vue'
import LoginModal from './components/LoginModal.vue'
import { useUserStore } from './stores/user'
import { showToast } from './utils'

const userStore = useUserStore()
const router = useRouter()

// ---- 弹窗引用：通过 provide 注入给任意子组件 ----
// 子组件通过 inject('loginModal') 获取，调用 loginModal.value.open() 打开弹窗
const loginModal = ref(null)
const publishModal = ref(null)
provide('loginModal', loginModal)
provide('publishModal', publishModal)

// ================================================================
// 手机返回键「再按一次退出」机制
// ================================================================
// 原理：
//   1. 每次进入首页时，往浏览器历史栈推入一个 _exitGuard 状态
//   2. 用户按返回键时，popstate 事件触发
//   3. 如果在首页且停留 >500ms，显示「再按一次退出」toast
//   4. 2秒内再按一次 → 放行退出；超时则重置
//   5. 500ms 时间差过滤：从其他页面快速返回首页时不会误触
let homeEnterTime = 0      // 进入首页的时间戳
let exitToastShown = false  // 是否已显示退出提示
let exitTimer = null         // toast 超时计时器

// 路由守卫：每次导航到首页时，推入 guard 状态
router.afterEach((to) => {
  if (to.path === '/' || to.path === '/home') {
    homeEnterTime = Date.now()
    requestAnimationFrame(() => {
      window.history.pushState({ _exitGuard: true }, '')
    })
  }
})

// popstate 监听器：拦截手机返回键
function handlePopState() {
  const path = window.location.pathname
  const isHome = path.endsWith('/home') || path.endsWith('/vue-test/') || path === '/vue-test'
  if (!isHome) return
  // 忽略从其他页面快速返回的情况（<500ms），避免误触退出提示
  if (Date.now() - homeEnterTime < 500) return

  if (exitToastShown) {
    // 第二次按返回 → 放行退出
    clearTimeout(exitTimer)
    exitToastShown = false
    return
  }

  // 第一次按返回 → 显示提示，再推一个 guard 拦截下一次返回
  exitToastShown = true
  showToast('再按一次退出')
  requestAnimationFrame(() => {
    window.history.pushState({ _exitGuard: true }, '')
  })
  exitTimer = setTimeout(() => { exitToastShown = false }, 2000)
}

// ---- 生命周期 ----
onMounted(() => {
  userStore.initFromStorage()  // 从 localStorage 恢复登录状态
  window.addEventListener('popstate', handlePopState)
})
onUnmounted(() => {
  clearTimeout(exitTimer)
  window.removeEventListener('popstate', handlePopState)
})
</script>

<style>
/* ---- 全局重置 ---- */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f0f2f5;
  color: #333;
  -webkit-font-smoothing: antialiased;
}
/* 页面容器：居中，最大宽度 768px（移动端优化） */
.page-container {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
}
button { font-family: inherit; }
input, textarea { font-family: inherit; }
a { color: #3b82f6; text-decoration: none; }

/* ---- 加载动画：蓝色脉冲圆点 ---- */
.loading-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  margin: 0 3px;
  animation: dotPulse 1.2s infinite ease-in-out;
}
@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ---- 弹窗基础样式 ---- */
.modal { backdrop-filter: blur(2px); }
body.modal-open { overflow: hidden; }
</style>
