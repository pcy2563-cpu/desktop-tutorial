<template>
  <div class="page-container" style="background:#f0f2f5;min-height:100vh;padding-bottom:70px">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;background:#fff;border-bottom:1px solid #f0f0f0">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#3b82f6">← 返回</button>
      <span style="font-size:15px;font-weight:600">公告设置</span>
    </div>

    <div style="background:#fff;margin:12px;border-radius:18px;padding:16px">
      <!-- Enabled toggle -->
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:14px;cursor:pointer">
        <input type="checkbox" v-model="enabled" style="accent-color:#3b82f6;width:18px;height:18px">
        <span style="font-weight:600">启用公告</span>
        <span style="font-size:12px;color:#999;margin-left:4px">启用后首页自动弹出</span>
      </label>

      <!-- Title -->
      <div style="margin-bottom:14px">
        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px">标题</label>
        <input v-model="title" placeholder="公告标题（最多50字）" maxlength="50"
          style="width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;box-sizing:border-box">
      </div>

      <!-- Body -->
      <div style="margin-bottom:14px">
        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px">正文</label>
        <textarea v-model="body" rows="5" placeholder="公告内容（最多500字）" maxlength="500"
          style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;resize:vertical;box-sizing:border-box"></textarea>
      </div>

      <!-- Image -->
      <div style="margin-bottom:14px">
        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px">配图（可选）</label>
        <div v-if="image" style="position:relative;display:inline-block;margin-bottom:8px">
          <img :src="image" alt="" style="max-width:200px;max-height:150px;border-radius:8px;object-fit:cover">
          <button @click="image = ''" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
        </div>
        <div v-else style="display:flex;gap:8px;align-items:center">
          <label style="padding:8px 16px;background:#f3f4f6;border:1px dashed #d1d5db;border-radius:12px;cursor:pointer;font-size:13px;color:#666">
            📷 上传图片
            <input type="file" accept="image/*" @change="onImageSelect" style="display:none">
          </label>
          <span style="font-size:12px;color:#999">支持 jpg/png/gif</span>
        </div>
      </div>

      <!-- Link -->
      <div style="margin-bottom:16px">
        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px">跳转链接（可选）</label>
        <input v-model="link" placeholder="https://... 或 /path" 
          style="width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;box-sizing:border-box">
      </div>

      <!-- Save button -->
      <button @click="save" :disabled="saving"
        style="padding:12px 32px;background:#3b82f6;color:#fff;border:none;border-radius:99px;font-size:15px;font-weight:600;cursor:pointer;width:100%">
        {{ saving ? '保存中...' : '保存公告' }}
      </button>
    </div>

    <!-- Preview -->
    <div v-if="enabled && (title || body || image)" style="background:#fff;margin:12px;border-radius:18px;padding:16px">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;color:#555">预览</h3>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
        <div v-if="title" style="font-size:16px;font-weight:700;margin-bottom:8px">{{ title }}</div>
        <img v-if="image" :src="image" alt="" style="max-width:100%;border-radius:8px;margin-bottom:8px">
        <div v-if="body" style="font-size:14px;line-height:1.6;color:#333;white-space:pre-wrap">{{ body }}</div>
        <div v-if="link" style="margin-top:8px;font-size:13px;color:#3b82f6">🔗 点击查看详情</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'
import { showToast } from '../utils'

const router = useRouter()
const userStore = useUserStore()

const enabled = ref(false)
const title = ref('')
const body = ref('')
const image = ref('')
const link = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const res = await forumAPI.getSiteAnnouncement()
    const data = res.data || {}
    enabled.value = !!data.enabled
    title.value = data.title || ''
    body.value = data.body || ''
    image.value = data.image || ''
    link.value = data.link || ''
  } catch {}
})

async function onImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const res = await forumAPI.uploadImage(file)
    if (res.data?.url) {
      image.value = res.data.url
    } else {
      showToast('图片上传失败')
    }
  } catch (err) {
    showToast(err.message || '图片上传失败')
  }
  e.target.value = ''
}

async function save() {
  if (enabled.value && !title.value.trim() && !body.value.trim() && !image.value) {
    return showToast('启用公告前请至少填写标题、正文或上传图片')
  }
  saving.value = true
  try {
    await forumAPI.adminSaveSiteAnnouncement(userStore.adminToken, {
      enabled: enabled.value ? 1 : 0,
      title: title.value.trim(),
      body: body.value.trim(),
      image: image.value,
      link: link.value.trim()
    })
    showToast('公告已保存')
  } catch (e) {
    showToast(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
