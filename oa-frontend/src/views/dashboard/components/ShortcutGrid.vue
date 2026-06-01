<template>
  <div class="shortcut-section">
    <div class="section-title">快捷入口</div>
    <div v-if="items.length === 0" class="empty-text">目前沒有可使用的快捷功能</div>
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
            <el-icon size="22" :color="'#4d7cfe'">
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
import type { ShortcutItem } from '@/types'

defineProps<{ items: ShortcutItem[] }>()
const emit = defineEmits<{ (e: 'click', item: ShortcutItem): void }>()

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
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  font-weight: 600;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  text-decoration: none;
  color: #374151;
  transition: background 0.15s;
}
.shortcut-item:hover {
  background: #e8f0fe;
}
.shortcut-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.shortcut-name {
  font-size: 11px;
  color: #4b5563;
  text-align: center;
}
.empty-text {
  font-size: 12px;
  color: #9ca3af;
  padding: 8px 0;
}
</style>
