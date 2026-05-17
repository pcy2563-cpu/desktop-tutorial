<template>
  <div v-if="visible" class="publish-mask" @click.self="close">
    <section class="publish-panel">
      <header class="publish-head">
        <h3>发布动态</h3>
        <button class="publish-close" @click="close">×</button>
      </header>

      <textarea
        v-model="content"
        class="publish-textarea"
        placeholder="写下想分享的内容..."
        rows="6"
      />

      <div v-if="imageUrls.length" class="publish-images">
        <div v-for="(url, i) in imageUrls" :key="i" class="publish-image-item">
          <img :src="url" alt="">
          <button @click="removeImage(i)">×</button>
        </div>
      </div>

      <div class="publish-toolbar">
        <div class="publish-tools">
          <label class="publish-tool" title="上传图片">
            图片
            <input type="file" accept="image/*" multiple @change="onImagesSelected">
          </label>
          <button class="publish-tool" @click="showEmoji = !showEmoji">表情</button>
          <label class="publish-anonymous">
            <input type="checkbox" v-model="anonymous">
            匿名
          </label>
        </div>
        <button class="publish-submit" :disabled="submitting" @click="submit">
          {{ submitting ? '发布中...' : '发布' }}
        </button>
      </div>

      <div v-if="showEmoji" class="publish-emoji">
        <button v-for="e in emojis" :key="e" @click="insertEmoji(e)">{{ e }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { forumAPI } from '../api'
import { showToast } from '../utils'

const userStore = useUserStore()
const visible = ref(false)
const content = ref('')
const imageUrls = ref([])
const anonymous = ref(false)
const submitting = ref(false)
const showEmoji = ref(false)
const emojis = ['😀', '😂', '😊', '👍', '👏', '🔥', '❤️', '🎉', '🙏', '💡', '📌', '📚']

function open() {
  content.value = ''
  imageUrls.value = []
  anonymous.value = false
  showEmoji.value = false
  visible.value = true
}

function close() {
  visible.value = false
}

function insertEmoji(e) {
  content.value += e
  showEmoji.value = false
}

function removeImage(i) {
  imageUrls.value.splice(i, 1)
}

async function onImagesSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const remaining = 9 - imageUrls.value.length
  if (remaining <= 0) return showToast('最多上传9张图片')
  for (const file of files.slice(0, remaining)) {
    try {
      const res = await forumAPI.uploadImage(file)
      if (res.data?.url) imageUrls.value.push(res.data.url)
    } catch (err) {
      showToast(err.message || '上传失败')
    }
  }
  e.target.value = ''
}

async function submit() {
  const text = content.value.trim()
  if (!text && imageUrls.value.length === 0) return showToast('请填写内容或上传图片')
  submitting.value = true
  try {
    await forumAPI.addPost(userStore.userId, '', text, 0, JSON.stringify(imageUrls.value), anonymous.value)
    showToast('发布成功')
    close()
    window.dispatchEvent(new Event('post-published'))
  } catch (e) {
    showToast(e.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open, close })
</script>

<style scoped>
.publish-mask {
  position: fixed;
  inset: 0;
  z-index: 8000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(15, 23, 42, .45);
  backdrop-filter: blur(8px);
}

.publish-panel {
  width: 100%;
  max-width: 520px;
  max-height: 86vh;
  overflow-y: auto;
  border-radius: 22px 22px 0 0;
  background: rgba(255, 255, 255, .96);
  padding: 20px;
  box-shadow: 0 -22px 60px rgba(15, 23, 42, .18);
}

.publish-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.publish-head h3 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
}

.publish-close {
  border: 0;
  background: none;
  color: #64748b;
  font-size: 24px;
  cursor: pointer;
}

.publish-textarea {
  width: 100%;
  resize: none;
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  padding: 13px;
  background: #fff;
  color: #111827;
  font-size: 15px;
  line-height: 1.65;
}

.publish-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.publish-image-item {
  position: relative;
  width: 76px;
  height: 76px;
}

.publish-image-item img {
  width: 76px;
  height: 76px;
  border-radius: 12px;
  object-fit: cover;
}

.publish-image-item button {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, .72);
  color: #fff;
  cursor: pointer;
}

.publish-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #edf2f7;
}

.publish-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.publish-tool {
  border: 1px solid #dbe4ef;
  border-radius: 999px;
  padding: 7px 11px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
}

.publish-tool input {
  display: none;
}

.publish-anonymous {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
}

.publish-anonymous input {
  accent-color: #246bfe;
}

.publish-submit {
  border: 0;
  border-radius: 999px;
  padding: 10px 24px;
  background: #246bfe;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.publish-submit:disabled {
  opacity: .72;
  cursor: wait;
}

.publish-emoji {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 12px;
  border-radius: 14px;
  background: #f8fafc;
  padding: 8px;
}

.publish-emoji button {
  border: 0;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}
</style>
