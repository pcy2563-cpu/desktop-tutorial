<template>
  <nav class="bottom-nav">
    <!-- Home -->
    <button @click="goHome" class="bottom-nav-item" :class="{ active: isHome }">
      <span style="font-size:20px">🏠</span>
      <span>首页</span>
    </button>

    <!-- Publish (center, larger) -->
    <button @click="openPublish" class="bottom-nav-item" style="flex:1">
      <span class="bottom-nav-plus">+</span>
      <span style="font-size:11px;color:#666">发布</span>
    </button>

    <!-- Profile -->
    <button @click="goProfile" class="bottom-nav-item" :class="{ active: isProfile }">
      <span style="font-size:20px">👤</span>
      <span>我的</span>
    </button>
  </nav>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { showToast } from '../utils'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginModal = inject('loginModal')
const publishModal = inject('publishModal')

const isHome = computed(() => route.path === '/' || route.path === '/home')
const isProfile = computed(() => route.path === '/profile')

function goHome() { router.push('/home') }
function goProfile() { router.push('/profile') }

function openPublish() {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    loginModal.value?.open('login')
    return
  }
  if (userStore.isMuted) {
    showToast('您已被禁言，无法发帖')
    return
  }
  publishModal.value?.open()
}
</script>
