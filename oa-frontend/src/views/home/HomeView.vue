<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-layout">
      <!-- Left sidebar -->
      <aside class="dash-left">
        <ShortcutGrid :items="data?.shortcuts ?? mockShortcuts" @click="handleShortcutClick" />

        <ReminderCard
          title="今日提醒"
          :items="data?.todayReminders ?? []"
          :loading="loading"
        />

        <ReminderCard
          title="明日提醒"
          :items="data?.tomorrowReminders ?? []"
          :loading="loading"
        />

        <div v-if="recentFunctions.length > 0" class="recent-section">
          <div class="section-title">最近使用</div>
          <div class="recent-list">
            <router-link
              v-for="fn in recentFunctions"
              :key="fn.id"
              :to="fn.route"
              class="recent-item"
            >
              {{ fn.name }}
            </router-link>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="dash-main">
        <div class="main-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="activeTab === 'overview'">
          <AnnouncementList
            :items="data?.announcements ?? mockAnnouncements"
            :loading="loading"
            :error="hasError"
            @reload="loadDashboard"
          />
        </div>
        <div v-else class="placeholder-tab">
          <el-empty description="功能建置中，敬請期待" :image-size="80" />
        </div>
      </main>

      <!-- Right panel -->
      <aside class="dash-right">
        <AssistantCard />

        <UserLoginInfoCard
          :user="data?.currentUser"
          :loading="loading"
        />
      </aside>
    </div>

    <FloatingHelpButton />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import { dashboardApi } from '@/api/dashboard.api'
import type { DashboardData, ShortcutItem, AnnouncementItem, RecentFunctionItem } from '@/types'

import ShortcutGrid from '@/views/dashboard/components/ShortcutGrid.vue'
import ReminderCard from '@/views/dashboard/components/ReminderCard.vue'
import AnnouncementList from '@/views/dashboard/components/AnnouncementList.vue'
import UserLoginInfoCard from '@/views/dashboard/components/UserLoginInfoCard.vue'
import AssistantCard from '@/views/dashboard/components/AssistantCard.vue'
import FloatingHelpButton from '@/views/dashboard/components/FloatingHelpButton.vue'

const ui = useUiStore()

const data = ref<DashboardData | null>(null)
const loading = ref(true)
const hasError = ref(false)
const activeTab = ref('overview')

const tabs = [
  { key: 'overview', label: '總覽' },
  { key: 'personal', label: '個人' },
  { key: 'manager', label: '主管' },
  { key: 'info', label: '資訊中心' },
]

const RECENT_KEY = 'oa_recent_functions'

const recentFunctions = computed<RecentFunctionItem[]>(() => {
  if (data.value?.recentFunctions?.length) return data.value.recentFunctions
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
})

const mockShortcuts: ShortcutItem[] = [
  { id: 'notifications', name: '通知', icon: 'Bell', route: '/home/personal/notifications', badgeCount: 0 },
  { id: 'approvals', name: '簽核', icon: 'Check', route: '/home/manager/leave-approvals', badgeCount: 0 },
  { id: 'leaves', name: '請假', icon: 'Calendar', route: '/home/attendance/leaves', badgeCount: 0 },
  { id: 'announcements', name: '公告', icon: 'Notification', route: '/home/info/announcements', badgeCount: 0 },
  { id: 'attendance', name: '考勤', icon: 'Clock', route: '/home/attendance/records', badgeCount: 0 },
]

const mockAnnouncements: AnnouncementItem[] = [
  {
    id: '1',
    title: '教育訓練管理辦法',
    category: '人資公告',
    type: '制度文件',
    authorName: 'HR-1',
    publishDate: '2026-04-24',
    contentPreview: 'Dear all, 此為「教育訓練管理辦法」，煩請各位詳閱，如有問題請洽人資組，謝謝。',
    attachments: [
      { id: 'a1', fileName: 'TRD-QM-HR-006_教育訓練管理辦法V6.pdf', fileUrl: '#', fileType: 'application/pdf', fileSize: 204800 },
    ],
    tags: ['工作規則辦法'],
    isPinned: true,
    readStatus: 'unread',
  },
  {
    id: '2',
    title: '員工手冊',
    category: '人資公告',
    type: '制度文件',
    authorName: 'HR-1',
    publishDate: '2026-04-20',
    contentPreview: '本員工手冊包含公司各項規定及員工應知事項，請詳閱後簽名確認。',
    attachments: [],
    tags: [],
    isPinned: false,
    readStatus: 'unread',
  },
  {
    id: '3',
    title: '健康檢查管理辦法',
    category: '行政公告',
    type: '一般公告',
    authorName: 'HR-2',
    publishDate: '2026-04-10',
    contentPreview: '年度健康檢查安排通知，請各同仁配合預約時間。',
    attachments: [
      { id: 'a2', fileName: '健康檢查說明.pdf', fileUrl: '#', fileType: 'application/pdf' },
    ],
    tags: [],
    isPinned: false,
    readStatus: 'read',
  },
]

async function loadDashboard() {
  loading.value = true
  hasError.value = false
  try {
    data.value = await dashboardApi.get()
  } catch {
    hasError.value = true
  } finally {
    loading.value = false
  }
}

function handleShortcutClick(item: ShortcutItem) {
  const recent: RecentFunctionItem[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  const filtered = recent.filter((r) => r.id !== item.id)
  const updated = [
    { id: item.id, name: item.name, route: item.route, lastUsedAt: new Date().toISOString() },
    ...filtered,
  ].slice(0, 5)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

onMounted(() => {
  ui.setBreadcrumbs([{ title: '首頁' }])
  loadDashboard()
})
</script>

<style scoped>
.dashboard-wrapper {
  height: 100%;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 240px 1fr 300px;
  gap: 16px;
  align-items: start;
}

.dash-left {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 16px;
}

.dash-main {
  min-width: 0;
}

.main-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 6px;
}

.tab-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

.tab-btn.active {
  color: #4d7cfe;
  background: #eff3ff;
}

.dash-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  font-weight: 600;
}

.recent-section {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-item {
  font-size: 12px;
  color: #374151;
  padding: 4px 6px;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.1s;
}

.recent-item:hover {
  background: #f3f4f6;
  color: #4d7cfe;
}

.placeholder-tab {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 40px 20px;
}

@media (max-width: 1199px) {
  .dashboard-layout {
    grid-template-columns: 220px 1fr;
  }
  .dash-right {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  .dash-left {
    order: 2;
  }
  .dash-main {
    order: 1;
  }
  .dash-right {
    order: 3;
    grid-template-columns: 1fr;
  }
}
</style>
