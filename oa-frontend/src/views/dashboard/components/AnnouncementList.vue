<template>
  <div class="announcement-section">
    <div class="section-header">
      <div>
        <span class="section-kicker">COMPANY NEWS</span>
        <span class="section-title">{{ t('shell.dashboard.latestAnnouncements') }}</span>
      </div>
      <router-link to="/announcements" class="more-link">{{ t('shell.dashboard.viewAll') }} <span>→</span></router-link>
    </div>

    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton :rows="4" animated />
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ t('shell.dashboard.announcementsLoadFailed') }}</p>
      <el-button size="small" @click="emit('reload')">{{ t('shell.dashboard.reload') }}</el-button>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <el-empty :description="t('shell.dashboard.noAnnouncements')" :image-size="60" />
    </div>

    <div v-else class="announcement-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="announcement-item"
      >
        <div class="item-header">
          <el-tag v-if="item.isPinned" type="danger" size="small" effect="plain" class="pin-tag">{{ t('shell.dashboard.pinned') }}</el-tag>
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
import { useI18n } from 'vue-i18n'
import { Document } from '@element-plus/icons-vue'
import type { AnnouncementItem } from '@/types'

defineProps<{
  items: AnnouncementItem[]
  loading?: boolean
  error?: boolean
}>()

const emit = defineEmits<{ (e: 'reload'): void }>()
const router = useRouter()
const { t, locale } = useI18n()

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(locale.value === 'en' ? 'en-US' : locale.value, { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.announcement-section {
  background: var(--oa-surface);
  border-radius: 15px;
  padding: 21px;
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.section-header > div {
  display: flex;
  flex-direction: column;
}
.section-kicker {
  margin-bottom: 3px;
  color: var(--oa-primary);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.14em;
}
.section-title {
  font-size: 18px;
  font-weight: 750;
  color: var(--oa-navy);
}
.more-link {
  font-size: 12px;
  color: var(--oa-primary);
  font-weight: 650;
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
  padding: 18px 10px;
  border-bottom: 1px solid var(--oa-border);
  border-radius: 10px;
  transition: background 0.18s;
}
.announcement-item:hover {
  background: var(--oa-surface-muted);
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
  font-size: 15px;
  font-weight: 700;
  color: var(--oa-navy);
  cursor: pointer;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-title:hover {
  color: var(--oa-primary);
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
  border: 1px solid var(--oa-border);
  background: var(--oa-surface-muted);
  font-size: 11px;
  color: var(--oa-text);
  text-decoration: none;
  cursor: pointer;
}
.attachment-pill:hover {
  background: var(--oa-primary-soft);
  border-color: #9dcfc8;
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
  color: var(--oa-primary);
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
