/**
 * 应用全局状态 Store（Pinia）
 * 管理与用户无关的 UI 状态：当前 Tab、图片查看器、公告/品牌配置等
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ---- 导航状态 ----
  const currentTab = ref('home')       // 当前底部导航 Tab：home / publish / profile
  const currentCategory = ref(0)       // 当前帖子分类 ID（0=新发，5=推荐，6=精选，7+=特殊 Tab）

  // ---- 站点配置（从后端加载） ----
  const siteAnnouncement = ref(null)   // 站内公告 { enabled, title, body, image, link }
  const siteBranding = ref(null)       // 品牌设置 { mode, text, image }

  // ---- UI 弹窗状态 ----
  const showPublishModal = ref(false)  // 发帖弹窗是否打开

  // ---- 图片查看器（全屏 ImageViewer） ----
  // visible：是否显示，images：图片 URL 数组，index：当前查看第几张
  const imageViewer = ref({ visible: false, images: [], index: 0 })

  // ---- 操作函数 ----

  function setTab(tab) {
    currentTab.value = tab
  }

  // 打开图片查看器：传入图片数组和起始索引
  function openImageViewer(images, index = 0) {
    imageViewer.value = { visible: true, images, index }
  }

  // 关闭图片查看器
  function closeImageViewer() {
    imageViewer.value = { visible: false, images: [], index: 0 }
  }

  return {
    currentTab, currentCategory,
    siteAnnouncement, siteBranding,
    showPublishModal, imageViewer,
    setTab, openImageViewer, closeImageViewer
  }
})
