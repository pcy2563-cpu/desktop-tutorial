<template>
  <div class="page-container">
    <div style="display:flex;align-items:center;padding:12px 16px;gap:12px">
      <button @click="router.back()" style="background:none;border:none;font-size:18px;cursor:pointer">← 返回</button>
      <span style="font-size:15px;font-weight:600">轮播管理</span>
    </div>
    <div style="padding:0 12px;margin-bottom:12px">
      <label style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:99px;font-size:14px;cursor:pointer">
        + 上传轮播图<input type="file" accept="image/*" @change="upload" style="display:none">
      </label>
    </div>
    <div v-for="b in banners" :key="b.id" style="background:#fff;margin:0 12px 8px;border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px">
      <img :src="b.image_url" alt="" style="width:100px;height:60px;object-fit:cover;border-radius:8px">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600">{{ b.title || '无标题' }}</div>
        <div style="font-size:12px;color:#999">排序: {{ b.sort_order }}</div>
      </div>
      <button @click="remove(b.id)" style="padding:6px 12px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer">删除</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'
const router = useRouter()
const userStore = useUserStore()
const banners = ref([])
async function load() {
  const res = await forumAPI.adminBannersList(userStore.adminToken)
  banners.value = res.data || []
}
async function upload(e) {
  const file = e.target.files[0]
  if (!file) return
  const imgRes = await forumAPI.uploadImage(file)
  await forumAPI.adminBannerSave(userStore.adminToken, { title: '', image_url: imgRes.data.url, sort_order: 0 })
  load()
}
async function remove(id) {
  if (!confirm('确认删除？')) return
  await forumAPI.adminBannerDelete(userStore.adminToken, id)
  load()
}
onMounted(load)
</script>
