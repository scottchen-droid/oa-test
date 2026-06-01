<template>
  <div>
    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="item">
      <div class="page-header">
        <div>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/announcements' }">公告</el-breadcrumb-item>
            <el-breadcrumb-item>{{ item.title }}</el-breadcrumb-item>
          </el-breadcrumb>
          <h2 class="title">{{ item.title }}</h2>
          <div class="meta">
            <el-tag v-if="item.isPinned" type="danger" size="small" effect="plain">置頂</el-tag>
            <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
            <span>{{ item.authorName }}</span>
            <span class="sep">·</span>
            <span>{{ formatDate(item.publishDate) }}</span>
            <span class="sep">·</span>
            <span>{{ item.category }}</span>
          </div>
        </div>
      </div>

      <el-card class="content-card">
        <div class="content-body" v-html="item.content.replace(/\n/g, '<br>')" />

        <div v-if="item.attachments?.length" class="attachments-section">
          <div class="att-title">附件</div>
          <div class="att-list">
            <a
              v-for="att in item.attachments"
              :key="att.id"
              :href="att.fileUrl"
              target="_blank"
              class="att-pill"
            >
              <el-icon size="14"><Document /></el-icon>
              {{ att.fileName }}
              <span v-if="att.fileSize" class="file-size">（{{ formatSize(att.fileSize) }}）</span>
            </a>
          </div>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="公告不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Document } from '@element-plus/icons-vue'
import { useUiStore } from '@/stores/ui.store'
import { announcementsApi } from '@/api/dashboard.api'
import type { AnnouncementItem } from '@/types'

const ui = useUiStore()
const route = useRoute()
const item = ref<AnnouncementItem | null>(null)
const loading = ref(true)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '公告', path: '/announcements' }, { title: '詳情' }])
  loading.value = true
  try {
    item.value = await announcementsApi.getOne(route.params.id as string)
  } catch {
    item.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 10px 0 8px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
}
.sep {
  color: #d1d5db;
}
.content-card {
  padding: 8px 0;
}
.content-body {
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
}
.attachments-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}
.att-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 10px;
}
.att-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.att-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  text-decoration: none;
  transition: background 0.15s;
}
.att-pill:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}
.file-size {
  color: #9ca3af;
  font-size: 11px;
}
.skeleton-wrap {
  padding: 20px 0;
}
</style>
