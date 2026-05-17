<template>
  <div v-if="appStore.imageViewer.visible" class="viewer-overlay" @click.self="appStore.closeImageViewer()">
    <div class="viewer-close" @click="appStore.closeImageViewer()">✕</div>
    <div class="viewer-counter">{{ currentIndex + 1 }}/{{ images.length }}</div>
    <div class="viewer-body" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <img :src="images[currentIndex]" alt="" class="viewer-img">
    </div>
    <div v-if="images.length > 1" class="viewer-nav">
      <button @click="prev" :disabled="currentIndex === 0">‹</button>
      <button @click="next" :disabled="currentIndex === images.length - 1">›</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const state = reactive({
  startX: 0
})

// Use computed to reactively track store changes
const images = computed(() => appStore.imageViewer.images)
const currentIndex = computed(() => appStore.imageViewer.index)

function prev() {
  if (appStore.imageViewer.index > 0) appStore.imageViewer.index--
}
function next() {
  if (appStore.imageViewer.index < appStore.imageViewer.images.length - 1) appStore.imageViewer.index++
}
function onTouchStart(e) { state.startX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - state.startX
  if (Math.abs(dx) > 50) { dx > 0 ? prev() : next() }
}
</script>

<style scoped>
.viewer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
}
.viewer-close { position: absolute; top: 16px; right: 16px; color: #fff; font-size: 24px; cursor: pointer; z-index: 10; }
.viewer-counter { position: absolute; top: 16px; left: 16px; color: #fff; font-size: 14px; z-index: 10; }
.viewer-body { max-width: 100%; max-height: 90vh; display: flex; align-items: center; justify-content: center; }
.viewer-img { max-width: 100%; max-height: 90vh; object-fit: contain; }
.viewer-nav {
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 20px;
}
.viewer-nav button {
  width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2);
  color: #fff; font-size: 24px; border: none; cursor: pointer;
}
.viewer-nav button:disabled { opacity: 0.3; }
</style>
