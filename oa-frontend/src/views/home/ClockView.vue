<template>
  <div class="clock-page">
    <div class="page-header">
      <h2>{{ $t('nav.clock') }}</h2>
    </div>

    <el-card class="clock-card">
      <div class="clock-area">
        <div class="current-time">{{ currentTime }}</div>
        <div class="current-date">{{ currentDate }}</div>

        <div class="today-status" v-if="todayRecord">
          <div class="status-item" :class="{ done: !!todayRecord.actualClockIn }">
            <el-icon size="20"><Timer /></el-icon>
            <span class="label">{{ $t('attendance.clockIn') }}</span>
            <span class="time">{{ todayRecord.actualClockIn ? formatTime(todayRecord.actualClockIn) : $t('attendance.notClocked') }}</span>
          </div>
          <div class="status-divider" />
          <div class="status-item" :class="{ done: !!todayRecord.actualClockOut }">
            <el-icon size="20"><Check /></el-icon>
            <span class="label">{{ $t('attendance.clockOut') }}</span>
            <span class="time">{{ todayRecord.actualClockOut ? formatTime(todayRecord.actualClockOut) : $t('attendance.notClocked') }}</span>
          </div>
        </div>

        <div class="clock-buttons">
          <el-button
            type="primary"
            size="large"
            :icon="Timer"
            :loading="clockingIn"
            :disabled="!!todayRecord?.actualClockIn"
            @click="handleClockIn"
          >
            {{ todayRecord?.actualClockIn ? $t('attendance.clockedIn') : $t('attendance.clockIn') }}
          </el-button>
          <el-button
            type="success"
            size="large"
            :icon="Check"
            :loading="clockingOut"
            :disabled="!todayRecord?.actualClockIn || !!todayRecord?.actualClockOut"
            @click="handleClockOut"
          >
            {{ todayRecord?.actualClockOut ? $t('attendance.clockedOut') : $t('attendance.clockOut') }}
          </el-button>
        </div>

        <div v-if="lastMessage" class="result-message" :class="lastMessageType">
          {{ lastMessage }}
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Timer, Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { attendanceApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const { t } = useI18n()
const clockingIn = ref(false)
const clockingOut = ref(false)
const todayRecord = ref<any>(null)
const currentTime = ref('')
const currentDate = ref('')
const lastMessage = ref('')
const lastMessageType = ref<'success' | 'error'>('success')
let timer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  ui.setBreadcrumbs([{ title: t('nav.attendance') }, { title: t('nav.clock') }])
  updateClock()
  timer = setInterval(updateClock, 1000)
  await loadToday()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function loadToday() {
  try {
    todayRecord.value = await attendanceApi.getToday()
  } catch {
    todayRecord.value = null
  }
}

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-TW', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

async function handleClockIn() {
  clockingIn.value = true
  lastMessage.value = ''
  try {
    await attendanceApi.clockIn({ clockMethod: 'web' })
    ElMessage.success(t('msg.operationSuccess'))
    lastMessage.value = `${t('attendance.clockIn')}：${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`
    lastMessageType.value = 'success'
    await loadToday()
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? t('msg.loadFailed')
    ElMessage.error(msg)
    lastMessage.value = msg
    lastMessageType.value = 'error'
  } finally {
    clockingIn.value = false
  }
}

async function handleClockOut() {
  clockingOut.value = true
  lastMessage.value = ''
  try {
    await attendanceApi.clockOut({ clockMethod: 'web' })
    ElMessage.success(t('msg.operationSuccess'))
    lastMessage.value = `${t('attendance.clockOut')}：${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`
    lastMessageType.value = 'success'
    await loadToday()
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? t('msg.loadFailed')
    ElMessage.error(msg)
    lastMessage.value = msg
    lastMessageType.value = 'error'
  } finally {
    clockingOut.value = false
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.clock-page { max-width: 560px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.clock-card { border-radius: 12px; }
.clock-area { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0; }

.current-time { font-size: 64px; font-weight: 700; color: #303133; letter-spacing: 4px; line-height: 1; }
.current-date { font-size: 15px; color: #909399; }

.today-status {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f5f7fa;
  border-radius: 10px;
  padding: 16px 32px;
  width: 100%;
  justify-content: center;
}
.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 120px;
  color: #c0c4cc;
}
.status-item.done { color: #67c23a; }
.status-item .label { font-size: 13px; }
.status-item .time { font-size: 18px; font-weight: 600; }
.status-divider { width: 1px; height: 48px; background: #dcdfe6; margin: 0 24px; }

.clock-buttons { display: flex; gap: 20px; }
.clock-buttons .el-button { min-width: 150px; height: 52px; font-size: 16px; }

.result-message { font-size: 14px; padding: 8px 16px; border-radius: 6px; }
.result-message.success { color: #67c23a; background: #f0f9eb; }
.result-message.error { color: #f56c6c; background: #fef0f0; }
</style>
