<template>
  <div class="page-container">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">个人信息</span>
    </div>

    <div style="background:#fff;margin:12px;border-radius:18px;padding:20px;text-align:center">
      <div style="position:relative;display:inline-block">
        <img :src="previewAvatar || userStore.user?.avatar_url || '/default-avatar.png'" alt=""
          style="width:80px;height:80px;border-radius:8px;object-fit:cover">
        <label style="position:absolute;bottom:0;right:0;background:#3b82f6;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer">
          📷<input type="file" accept="image/*" @change="onAvatarChange" style="display:none">
        </label>
      </div>
    </div>

    <div style="background:#fff;margin:12px;border-radius:18px;padding:0 16px">
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f0f0f0">
        <span style="color:#666">昵称</span>
        <input v-model="form.nickname" style="text-align:right;border:none;font-size:14px;width:200px">
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0">
        <span style="color:#666">手机号</span>
        <span>{{ userStore.user?.phone || '-' }}</span>
      </div>
    </div>

    <div style="padding:16px">
      <button @click="save" :disabled="saving"
        style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:12px;font-size:16px;cursor:pointer">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'

const router = useRouter()
const userStore = useUserStore()
const saving = ref(false)
const previewAvatar = ref('')
const avatarFile = ref(null)
const form = reactive({ nickname: userStore.user?.nickname || '' })

function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { previewAvatar.value = ev.target.result }
  reader.readAsDataURL(file)
}

async function save() {
  saving.value = true
  try {
    if (avatarFile.value) {
      const res = await forumAPI.uploadImage(avatarFile.value)
      await forumAPI.updateUserAvatar(userStore.userId, res.data.url)
      userStore.updateAvatar(res.data.url)
    }
    alert('保存成功')
    router.back()
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}
</script>
