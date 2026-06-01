<template>
  <div class="announcement-section">
    <div class="section-header">
      <span class="section-title">公告</span>
      <router-link to="/announcements" class="more-link">查看更多 →</router-link>
    </div>

    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton :rows="4" animated />
    </div>

    <div v-else-if="error" class="error-state">
      <p>公告資料載入失敗，請稍後再試。</p>
      <el-button size="small" @click="emit('reload')">重新載入</el-button>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <el-empty description="目前沒有公告" :image-size="60" />
    </div>

    <div v-else class="announcement-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="announcement-item"
      >
        <div class="item-header">
          <el-tag v-if="item.isPinned" type="danger" size="small" effect="plain" class="pin-tag">置頂</el-tag>
          <span class="item-title" @click="router.push(`/announcements/${item.id}`)">{{ item.title }}</span>
        </div>
        <div class="item-meta">
          <span class="author">{{ item.authorName }}</span>
          <span class="separator">·</span>
          <span class="date">{{ formatDate(item.publishDate) }}</span>
        </div>
        <p v-if="item.contentPreview" class="item-preview">{{ item.contentPreview }}</p>
        <div v-if="item.attachments?.length" class="item-attachments">
          <a
            v-for="att in item.attachments"
            :key="att.id"
            :href="att.fileUrl"
            target="_blank"
            class="attachment-pill"
          >
            <el-icon size="12"><Document /></el-icon>
            {{ att.fileName }}
          </a>
        </div>
        <div class="item-footer">
          <span class="category-badge">【{{ item.category }}】{{ item.type }}</span>
          <a class="more-btn" @click.prevent="router.push(`/announcements/${item.id}`)">More &gt;</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Document } from '@element-plus/icons-vue'
import type { AnnouncementItem } from '@/types'

defineProps<{
  items: AnnouncementItem[]
  loading?: boolean
  error?: boolean
}>()

const emit = defineEmits<{ (e: 'reload'): void }>()
const router = useRouter()

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.announcement-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}
.more-link {
  font-size: 12px;
  color: #4d7cfe;
  text-decoration: none;
}
.more-link:hover {
  text-decoration: underline;
}
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.announcement-item {
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
}
.announcement-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.pin-tag {
  flex-shrink: 0;
}
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-title:hover {
  color: #4d7cfe;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}
.separator {
  color: #d1d5db;
}
.item-preview {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.attachment-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 11px;
  color: #374151;
  text-decoration: none;
  cursor: pointer;
}
.attachment-pill:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}
.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.category-badge {
  font-size: 11px;
  color: #9ca3af;
}
.more-btn {
  font-size: 12px;
  color: #4d7cfe;
  cursor: pointer;
}
.more-btn:hover {
  text-decoration: underline;
}
.skeleton-wrap {
  padding: 12px 0;
}
.error-state {
  text-align: center;
  padding: 24px 0;
  color: #6b7280;
  font-size: 13px;
}
</style>
