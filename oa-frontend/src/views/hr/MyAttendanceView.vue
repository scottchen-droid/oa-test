<template>
  <div>
    <div class="page-header">
      <h2>出勤打卡</h2>
    </div>

    <!-- 今日打卡 Card -->
    <el-card class="clock-card">
      <template #header>
        <span class="card-title">今日打卡</span>
      </template>

      <div class="clock-area">
        <div class="current-time">{{ currentTime }}</div>
        <div class="clock-buttons">
          <el-button
            type="primary"
            size="large"
            :icon="TimerIcon"
            :loading="clockingIn"
            @click="handleClockIn"
          >
            上班打卡
          </el-button>
          <el-button
            type="success"
            size="large"
            :icon="CheckIcon"
            :loading="clockingOut"
            @click="handleClockOut"
          >
            下班打卡
          </el-button>
        </div>
        <div v-if="todayRecord?.actualClockIn || todayRecord?.actualClockOut" class="today-summary">
          <span v-if="todayRecord?.actualClockIn">上班：{{ formatDateTime(todayRecord.actualClockIn) }}</span>
          <span v-if="todayRecord?.actualClockOut">下班：{{ formatDateTime(todayRecord.actualClockOut) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 打卡記錄 Card -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span class="card-title">打卡記錄（近30天）</span>
      </template>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="workDate" label="日期" width="120" />
        <el-table-column label="上班時間" width="120">
          <template #default="{ row }">{{ row.actualClockIn ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="下班時間" width="120">
          <template #default="{ row }">{{ row.actualClockOut ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="工時" width="120">
          <template #default="{ row }">{{ formatWorkMinutes(row.workMinutes) }}</template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="attendanceTagType(row.status)" size="small">
              {{ attendanceLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        :page-sizes="[20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Timer as TimerIcon, Check as CheckIcon } from '@element-plus/icons-vue'
import { attendanceApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const clockingIn = ref(false)
const clockingOut = ref(false)
const todayRecord = ref<any>(null)
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const currentMonth = new Date().toISOString().slice(0, 7)

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => attendanceApi.getMyRecords(params as any),
})

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '個人中心' }, { title: '出勤打卡' }])
  updateClock()
  timer = setInterval(updateClock, 1000)

  fetch({ month: currentMonth })
  loadToday()
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
  currentTime.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
}

async function handleClockIn() {
  clockingIn.value = true
  try {
    await attendanceApi.clockIn({ clockMethod: 'web' })
    ElMessage.success('上班打卡成功')
    await loadToday()
    fetch({ month: currentMonth })
  } catch {
    ElMessage.error('打卡失敗，請稍後再試')
  } finally {
    clockingIn.value = false
  }
}

async function handleClockOut() {
  clockingOut.value = true
  try {
    await attendanceApi.clockOut({ clockMethod: 'web' })
    ElMessage.success('下班打卡成功')
    await loadToday()
    fetch({ month: currentMonth })
  } catch {
    ElMessage.error('打卡失敗，請稍後再試')
  } finally {
    clockingOut.value = false
  }
}

function formatWorkMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}小時${m}分`
}

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

function attendanceLabel(status: string): string {
  const map: Record<string, string> = { normal: '正常', late: '遲到', absent: '缺勤', leave: '請假', holiday: '假日' }
  return map[status] ?? status
}

function attendanceTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    normal: 'success',
    late: 'warning',
    absent: 'danger',
    leave: 'info',
    holiday: 'info',
  }
  return map[status] ?? 'info'
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }

.clock-card { margin-bottom: 0; }
.card-title { font-weight: 600; font-size: 15px; }
.clock-area { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 12px 0; }
.current-time { font-size: 48px; font-weight: 700; color: #303133; letter-spacing: 2px; }
.clock-buttons { display: flex; gap: 24px; }
.clock-buttons .el-button { min-width: 140px; height: 48px; font-size: 16px; }
.today-summary { display: flex; gap: 32px; color: #606266; font-size: 14px; }
</style>
