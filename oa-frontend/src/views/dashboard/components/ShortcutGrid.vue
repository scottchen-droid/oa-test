<template>
  <div class="shortcut-section">
    <div class="section-title">{{ t('shell.dashboard.quickAccess') }} <span>QUICK ACCESS</span></div>
    <div v-if="items.length === 0" class="empty-text">{{ t('shell.dashboard.noShortcuts') }}</div>
    <div v-else class="shortcut-grid">
      <router-link
        v-for="item in items"
        :key="item.id"
        :to="item.route"
        class="shortcut-item"
        @click="onShortcutClick(item)"
      >
        <div class="shortcut-icon-wrap">
          <el-badge :value="item.badgeCount && item.badgeCount > 0 ? (item.badgeCount > 99 ? '99+' : item.badgeCount) : ''" :hidden="!item.badgeCount">
            <el-icon size="21">
              <component :is="iconMap[item.icon] || Bell" />
            </el-icon>
          </el-badge>
        </div>
        <span class="shortcut-name">{{ item.name }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell, Calendar, Notification, Clock, Check, List, User, Setting } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { ShortcutItem } from '@/types'

defineProps<{ items: ShortcutItem[] }>()
const emit = defineEmits<{ (e: 'click', item: ShortcutItem): void }>()
const { t } = useI18n()

const iconMap: Record<string, unknown> = {
  Bell, Calendar, Notification, Clock, Check, List, User, Setting,
}

function onShortcutClick(item: ShortcutItem) {
  emit('click', item)
}
</script>

<style scoped>
.shortcut-section {
  margin-bottom: 16px;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #405967;
  font-size: 12px;
  font-weight: 700;
}
.section-title span {
  color: #a1afb7;
  font-size: 8px;
  letter-spacing: 0.1em;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  min-height: 86px;
  padding: 11px 4px;
  border: 1px solid var(--oa-border);
  border-radius: 11px;
  background: var(--oa-surface-muted);
  cursor: pointer;
  text-decoration: none;
  color: var(--oa-text);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.shortcut-item:hover {
  transform: translateY(-2px);
  border-color: #b8dcd7;
  box-shadow: 0 7px 15px rgba(29, 74, 82, 0.08);
}
.shortcut-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--oa-primary);
  background: var(--oa-primary-soft);
  border-radius: 10px;
}
.shortcut-name {
  font-size: 11px;
  color: #4a616d;
  font-weight: 600;
  text-align: center;
}
.empty-text {
  font-size: 12px;
  color: #9ca3af;
  padding: 8px 0;
}
</style>
