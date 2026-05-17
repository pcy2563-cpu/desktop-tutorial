<template>
  <div class="page-container" style="background:#f0f2f5;min-height:100vh;padding-bottom:70px">
    <!-- User Card (WeChat style) -->
    <div style="background:#fff;padding:20px 16px;margin-bottom:8px;cursor:pointer" @click="handleCardClick">
      <div style="display:flex;align-items:center;gap:12px">
        <img :src="userStore.displayAvatar" alt="" style="width:56px;height:56px;border-radius:8px;object-fit:cover">
        <div style="flex:1">
          <div style="font-size:17px;font-weight:600">{{ userStore.displayName }}</div>
          <div v-if="userStore.isLoggedIn" style="font-size:13px;color:#999;margin-top:2px">
            {{ maskedPhone || '未绑定手机号' }}
          </div>
          <div v-else style="font-size:13px;color:#999;margin-top:2px">点击登录</div>
        </div>
        <span style="color:#c8c8c8;font-size:20px">›</span>
      </div>

      <!-- Action buttons when logged in -->
      <div v-if="userStore.isLoggedIn" style="display:flex;gap:10px;margin-top:14px">
        <button @click.stop="$emit('publish')" style="flex:1;padding:10px;background:#3b82f6;color:#fff;border:none;border-radius:99px;font-size:14px;font-weight:600;cursor:pointer">去发布</button>
        <button @click.stop="doLogout" style="flex:1;padding:10px;background:#fff;color:#666;border:1px solid #e5e7eb;border-radius:99px;font-size:14px;cursor:pointer">退出登录</button>
      </div>
      <!-- Action buttons when guest -->
      <div v-else style="display:flex;gap:10px;margin-top:14px">
        <button @click.stop="openLogin" style="flex:1;padding:10px;background:#3b82f6;color:#fff;border:none;border-radius:99px;font-size:14px;font-weight:600;cursor:pointer">登录</button>
        <button @click.stop="openRegister" style="flex:1;padding:10px;background:#fff;color:#666;border:1px solid #e5e7eb;border-radius:99px;font-size:14px;cursor:pointer">注册</button>
      </div>
    </div>

    <!-- Entry Grid -->
    <div style="background:#fff;padding:0 16px;margin-bottom:8px">
      <!-- 行为画像 -->
      <button class="entry-row" @click="router.push('/behavior')" style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left">
        <span style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(145deg,#7c3aed,#a855f7)">像</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500;color:#333">行为画像</div>
          <div style="font-size:12px;color:#999;margin-top:2px">{{ behaviorHint }}</div>
        </div>
        <span style="color:#c8c8c8;font-size:18px">›</span>
      </button>

      <!-- 数据分析 -->
      <button class="entry-row" @click="router.push('/dashboard')" style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left">
        <span style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(145deg,#059669,#10b981)">数</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500;color:#333">数据分析</div>
          <div style="font-size:12px;color:#999;margin-top:2px">查看数据</div>
        </div>
        <span style="color:#c8c8c8;font-size:18px">›</span>
      </button>

      <!-- 内容中心 -->
      <button class="entry-row" @click="router.push('/content')" style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left">
        <span style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(145deg,#2563eb,#3b82f6)">内</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500;color:#333">内容中心</div>
          <div style="font-size:12px;color:#999;margin-top:2px">{{ contentHint }}</div>
        </div>
        <span style="color:#c8c8c8;font-size:18px">›</span>
      </button>

      <!-- 管理功能 (admin only) -->
      <button v-if="userStore.isAdmin" class="entry-row" @click="showAdmin = !showAdmin" style="display:flex;align-items:center;gap:12px;padding:14px 0;width:100%;background:none;border:none;cursor:pointer;text-align:left">
        <span style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(145deg,#f59e0b,#f97316)">管</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500;color:#333">管理功能</div>
          <div style="font-size:12px;color:#999;margin-top:2px">管理员</div>
        </div>
        <span style="color:#c8c8c8;font-size:18px;transform:rotate(90deg);display:inline-block">›</span>
      </button>

      <!-- Admin submenu -->
      <div v-if="showAdmin && userStore.isAdmin" style="padding:0 0 14px 44px">
        <button @click="router.push('/admin/banner')" style="display:block;padding:8px 0;font-size:13px;color:#3b82f6;background:none;border:none;cursor:pointer">轮播管理</button>
        <button @click="router.push('/admin/announcement')" style="display:block;padding:8px 0;font-size:13px;color:#3b82f6;background:none;border:none;cursor:pointer">公告设置</button>
        <button @click="router.push('/admin/user')" style="display:block;padding:8px 0;font-size:13px;color:#3b82f6;background:none;border:none;cursor:pointer">用户管理</button>
        <button @click="router.push('/admin/reports')" style="display:block;padding:8px 0;font-size:13px;color:#3b82f6;background:none;border:none;cursor:pointer">举报审核</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'
import { maskPhone, showToast } from '../utils'

const router = useRouter()
const userStore = useUserStore()
const loginModal = inject('loginModal')

const showAdmin = ref(false)
const behaviorHint = ref('查看画像')
const contentHint = ref('查看内容')
const maskedPhone = ref('')

function handleCardClick() {
  if (userStore.isLoggedIn) {
    router.push('/profile/edit')
  } else {
    openLogin()
  }
}

function openLogin() { loginModal.value?.open('login') }
function openRegister() { loginModal.value?.open('register') }

function doLogout() {
  userStore.logout()
  showToast('已退出登录')
  window.dispatchEvent(new Event('auth-changed'))
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    maskedPhone.value = maskPhone(userStore.user?.phone)
    try {
      const res = await forumAPI.getUserBehaviorSummary(userStore.userId)
      const s = res.data?.summary || {}
      const score = Number(s.active_score || 0)
      behaviorHint.value = score > 0 ? `活跃分 ${score}` : '画像建立中'
    } catch {}
    try {
      const res = await forumAPI.getMyCenterSummary(userStore.userId)
      const d = res.data || {}
      const count = Number(d.post_count || 0)
      contentHint.value = count > 0 ? `${count} 帖` : '暂无内容'
    } catch {}
  }
})
</script>
