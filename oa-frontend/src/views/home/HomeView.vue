<template>
  <div class="dashboard-wrapper">
    <section class="welcome-panel">
      <div class="welcome-content">
        <div class="eyebrow">{{ formattedDate }}</div>
        <h1>{{ greeting }}，{{ displayName }}</h1>
        <p>{{ t('shell.dashboard.intro') }}</p>
        <div class="welcome-actions">
          <router-link to="/home/forms/requests" class="primary-action">
            <el-icon><EditPen /></el-icon>
            {{ t('nav.initiateApply') }}
          </router-link>
          <router-link to="/home/manager/approvals" class="secondary-action">
            {{ t('shell.dashboard.viewApprovals') }}
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </div>
      </div>
      <div class="welcome-summary">
        <div class="summary-item">
          <span class="summary-icon summary-icon--amber"><Bell /></span>
          <span class="summary-copy">
            <strong>{{ pendingReminderCount }}</strong>
            <small>{{ t('shell.dashboard.todayReminders') }}</small>
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-icon summary-icon--teal"><DocumentChecked /></span>
          <span class="summary-copy">
            <strong>{{ unreadAnnouncementCount }}</strong>
            <small>{{ t('shell.dashboard.unreadAnnouncements') }}</small>
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-icon summary-icon--blue"><Calendar /></span>
          <span class="summary-copy">
            <strong>{{ tomorrowReminderCount }}</strong>
            <small>{{ t('shell.dashboard.tomorrowSchedule') }}</small>
          </span>
        </div>
      </div>
      <div class="welcome-decoration welcome-decoration--one"></div>
      <div class="welcome-decoration welcome-decoration--two"></div>
    </section>

    <div class="dashboard-layout">
      <!-- Left sidebar -->
      <aside class="dash-left">
        <div class="panel-heading">
          <div>
            <span class="panel-kicker">WORKSPACE</span>
            <h2>{{ t('shell.dashboard.workspace') }}</h2>
          </div>
        </div>
        <ShortcutGrid :items="data?.shortcuts ?? mockShortcuts" @click="handleShortcutClick" />

        <ReminderCard
          :title="t('shell.dashboard.todayReminders')"
          :items="data?.todayReminders ?? []"
          :loading="loading"
        />

        <ReminderCard
          :title="t('shell.dashboard.tomorrowReminders')"
          :items="data?.tomorrowReminders ?? []"
          :loading="loading"
        />

        <div v-if="recentFunctions.length > 0" class="recent-section">
          <div class="section-title">{{ t('shell.dashboard.recent') }}</div>
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
          <el-empty :description="t('shell.dashboard.comingSoon')" :image-size="80" />
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
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { dashboardApi } from '@/api/dashboard.api'
import type { DashboardData, ShortcutItem, AnnouncementItem, RecentFunctionItem } from '@/types'
import { ArrowRight, Bell, Calendar, DocumentChecked, EditPen } from '@element-plus/icons-vue'

import ShortcutGrid from '@/views/dashboard/components/ShortcutGrid.vue'
import ReminderCard from '@/views/dashboard/components/ReminderCard.vue'
import AnnouncementList from '@/views/dashboard/components/AnnouncementList.vue'
import UserLoginInfoCard from '@/views/dashboard/components/UserLoginInfoCard.vue'
import AssistantCard from '@/views/dashboard/components/AssistantCard.vue'
import FloatingHelpButton from '@/views/dashboard/components/FloatingHelpButton.vue'

const ui = useUiStore()
const auth = useAuthStore()
const { t, locale } = useI18n()

const data = ref<DashboardData | null>(null)
const loading = ref(true)
const hasError = ref(false)
const activeTab = ref('overview')

const displayName = computed(() =>
  data.value?.currentUser?.chineseName || auth.user?.displayName || t('shell.dashboard.partner'),
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return t('shell.dashboard.morning')
  if (hour < 18) return t('shell.dashboard.afternoon')
  return t('shell.dashboard.evening')
})

const formattedDate = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date()),
)

const pendingReminderCount = computed(() => data.value?.todayReminders?.length ?? 0)
const tomorrowReminderCount = computed(() => data.value?.tomorrowReminders?.length ?? 0)
const unreadAnnouncementCount = computed(() =>
  (data.value?.announcements ?? mockAnnouncements).filter((item) => item.readStatus === 'unread').length,
)

const tabs = computed(() => [
  { key: 'overview', label: t('shell.dashboard.overview') },
  { key: 'personal', label: t('shell.dashboard.personal') },
  { key: 'manager', label: t('shell.dashboard.manager') },
  { key: 'info', label: t('nav.infoCenter') },
])

const RECENT_KEY = 'oa_recent_functions'

const recentFunctions = computed<RecentFunctionItem[]>(() => {
  if (data.value?.recentFunctions?.length) return data.value.recentFunctions
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
})

const mockShortcuts = computed<ShortcutItem[]>(() => [
  { id: 'notifications', name: t('shell.dashboard.shortcuts.notifications'), icon: 'Bell', route: '/home/personal/notifications', badgeCount: 0 },
  { id: 'approvals', name: t('shell.dashboard.shortcuts.approvals'), icon: 'Check', route: '/home/manager/leave-approvals', badgeCount: 0 },
  { id: 'leaves', name: t('shell.dashboard.shortcuts.leave'), icon: 'Calendar', route: '/home/attendance/leaves', badgeCount: 0 },
  { id: 'announcements', name: t('shell.dashboard.shortcuts.announcements'), icon: 'Notification', route: '/home/info/announcements', badgeCount: 0 },
  { id: 'attendance', name: t('shell.dashboard.shortcuts.attendance'), icon: 'Clock', route: '/home/attendance/records', badgeCount: 0 },
])

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
  ui.setBreadcrumbs([{ title: t('nav.home') }])
  loadDashboard()
})
</script>

<style scoped>
.dashboard-wrapper {
  height: 100%;
  max-width: 1680px;
  margin: 0 auto;
}

.welcome-panel {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  min-height: 220px;
  margin-bottom: 22px;
  padding: 34px 38px;
  overflow: hidden;
  color: #fff;
  background:
    linear-gradient(105deg, rgba(12, 76, 74, 0.98), rgba(15, 118, 110, 0.92)),
    #0f766e;
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(12, 79, 74, 0.18);
}

.welcome-content {
  position: relative;
  z-index: 2;
}

.eyebrow {
  margin-bottom: 10px;
  color: #a9ded6;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.welcome-panel h1 {
  margin: 0 0 9px;
  font-size: clamp(27px, 3vw, 38px);
  font-weight: 750;
  letter-spacing: -0.035em;
}

.welcome-panel p {
  margin: 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 14px;
}

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 25px;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 39px;
  padding: 0 15px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
  transition: transform 0.2s, background 0.2s;
}

.primary-action {
  color: #11423f;
  background: #fff;
  box-shadow: 0 7px 18px rgba(4, 51, 48, 0.18);
}

.secondary-action {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-2px);
}

.secondary-action:hover {
  background: rgba(255, 255, 255, 0.16);
}

.welcome-summary {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  align-self: center;
  min-width: 410px;
  padding: 18px 12px;
  background: rgba(8, 54, 53, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 7px 13px;
  border-right: 1px solid rgba(255, 255, 255, 0.13);
}

.summary-item:last-child {
  border-right: 0;
}

.summary-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.summary-icon--amber { color: #ffdb8d; background: rgba(245, 158, 11, 0.16); }
.summary-icon--teal { color: #b8fff3; background: rgba(80, 220, 198, 0.14); }
.summary-icon--blue { color: #c6e0ff; background: rgba(96, 165, 250, 0.15); }

.summary-copy {
  display: flex;
  flex-direction: column;
}

.summary-copy strong {
  font-size: 22px;
  line-height: 1;
}

.summary-copy small {
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  white-space: nowrap;
}

.welcome-decoration {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.welcome-decoration--one {
  top: -140px;
  right: 23%;
  width: 300px;
  height: 300px;
}

.welcome-decoration--two {
  right: -70px;
  bottom: -140px;
  width: 280px;
  height: 280px;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 250px minmax(380px, 1fr) 292px;
  gap: 18px;
  align-items: start;
}

.dash-left {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--oa-surface);
  border-radius: 15px;
  border: 1px solid var(--oa-border);
  padding: 18px;
  box-shadow: var(--oa-shadow);
}

.dash-main {
  min-width: 0;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 17px;
}

.panel-heading h2 {
  margin: 2px 0 0;
  color: var(--oa-navy);
  font-size: 17px;
}

.panel-kicker {
  color: var(--oa-primary);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.14em;
}

.main-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  background: var(--oa-surface);
  border-radius: 13px;
  border: 1px solid var(--oa-border);
  padding: 6px;
  box-shadow: 0 6px 20px rgba(25, 55, 72, 0.05);
}

.tab-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--oa-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--oa-text);
  background: var(--oa-surface-muted);
}

.tab-btn.active {
  color: #fff;
  background: var(--oa-primary);
  box-shadow: 0 4px 10px rgba(15, 118, 110, 0.18);
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
  margin-top: 5px;
  padding-top: 15px;
  border-top: 1px solid var(--oa-border);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-item {
  font-size: 12px;
  color: var(--oa-text);
  padding: 7px 9px;
  border-radius: 7px;
  text-decoration: none;
  transition: background 0.1s;
}

.recent-item:hover {
  background: var(--oa-primary-soft);
  color: var(--oa-primary);
}

.placeholder-tab {
  background: var(--oa-surface);
  border-radius: 8px;
  border: 1px solid var(--oa-border);
  padding: 40px 20px;
}

@media (max-width: 1199px) {
  .welcome-panel {
    flex-direction: column;
    gap: 28px;
  }

  .welcome-summary {
    align-self: stretch;
    min-width: 0;
  }

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
  .welcome-panel {
    padding: 27px 22px;
  }

  .welcome-summary {
    grid-template-columns: 1fr;
  }

  .summary-item {
    justify-content: flex-start;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .summary-item:last-child {
    border-bottom: 0;
  }

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
