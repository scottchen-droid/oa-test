<template>
  <div class="reminder-section">
    <div class="section-title">{{ title }}</div>
    <div v-if="loading" class="skeleton-list">
      <el-skeleton :rows="2" animated />
    </div>
    <template v-else>
      <div v-if="items.length === 0" class="empty-text">{{ t('shell.dashboard.noReminders') }}</div>
      <div v-else class="reminder-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="reminder-item"
          :class="`priority-${item.priority ?? 'normal'}`"
          @click="navigate(item)"
        >
          <span class="reminder-title">{{ item.title }}</span>
          <span v-if="item.dueTime" class="reminder-time">{{ item.dueTime }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { ReminderItem } from '@/types'

const props = defineProps<{
  title: string
  items: ReminderItem[]
  loading?: boolean
}>()

const router = useRouter()
const { t } = useI18n()

function navigate(item: ReminderItem) {
  if (item.route) router.push(item.route)
}
</script>

<style scoped>
.reminder-section {
  margin-bottom: 16px;
}
.section-title {
  font-size: 12px;
  color: #405967;
  margin-bottom: 9px;
  font-weight: 700;
}
.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 10px;
  border-radius: 8px;
  background: var(--oa-surface-muted);
  font-size: 12px;
  color: var(--oa-text);
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.15s, transform 0.15s;
}
.reminder-item:hover {
  transform: translateX(2px);
  background: #edf7f5;
}
.priority-high {
  border-left-color: #ef4444;
}
.priority-normal {
  border-left-color: var(--oa-accent);
}
.priority-low {
  border-left-color: #10b981;
}
.reminder-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reminder-time {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 8px;
  flex-shrink: 0;
}
.empty-text {
  font-size: 12px;
  color: #9ca3af;
  padding: 4px 0;
}
.skeleton-list {
  padding: 4px 0;
}
</style>
