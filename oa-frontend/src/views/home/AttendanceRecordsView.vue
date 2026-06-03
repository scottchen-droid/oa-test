<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('nav.records') }}</h2>
    </div>

    <!-- 查詢條件 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          value-format="YYYY-MM-DD"
          :shortcuts="dateShortcuts"
          style="width: 280px"
        />
        <el-button type="primary" :icon="Search" @click="doSearch">{{ $t('common.search') }}</el-button>
        <el-button @click="resetFilter">{{ $t('common.refresh') }}</el-button>
      </div>
    </el-card>

    <!-- 紀錄列表 -->
    <el-card style="margin-top: 16px;">
      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="workDate" :label="$t('common.date')" width="110">
          <template #default="{ row }">{{ formatDate(row.workDate) }}</template>
        </el-table-column>
        <el-table-column :label="$t('attendance.clockIn')" width="110">
          <template #default="{ row }">
            <span v-if="row.actualClockIn" class="time-text">{{ formatTime(row.actualClockIn) }}</span>
            <el-tag v-else type="danger" size="small">缺卡</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('attendance.clockOut')" width="110">
          <template #default="{ row }">
            <span v-if="row.actualClockOut" class="time-text">{{ formatTime(row.actualClockOut) }}</span>
            <el-tag v-else type="danger" size="small">缺卡</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工時" width="100">
          <template #default="{ row }">{{ formatWorkMinutes(row.workMinutes) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.remark')" min-width="120">
          <template #default="{ row }">{{ row.note ?? '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="needsPatch(row)"
              type="warning"
              size="small"
              :icon="Edit"
              @click="openPatchDialog(row)"
            >
              補卡
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 補卡申請 Dialog -->
    <el-dialog
      v-model="patchDialogVisible"
      :title="$t('attendance.clockPatch')"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form ref="patchFormRef" :model="patchForm" :rules="patchRules" label-width="90px">
        <el-form-item label="補卡日期">
          <el-input :value="patchForm.date" disabled />
        </el-form-item>
        <el-form-item label="補卡類型" prop="punchType">
          <el-radio-group v-model="patchForm.punchType">
            <el-radio value="clock_in" :disabled="!!selectedRecord?.actualClockIn">{{ $t('attendance.clockIn') }}</el-radio>
            <el-radio value="clock_out" :disabled="!!selectedRecord?.actualClockOut">{{ $t('attendance.clockOut') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="補卡時間" prop="punchTime">
          <el-time-picker
            v-model="patchForm.punchTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="選擇時間"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="補卡原因" prop="reason">
          <el-input
            v-model="patchForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請填寫補卡原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="patchDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPatch">{{ $t('common.submit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Search, Edit } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { attendanceApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const { t } = useI18n()

// Current month as default date range
const now = new Date()
const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const today = now.toISOString().slice(0, 10)

const dateRange = ref<[string, string]>([firstDay, today])

const dateShortcuts = [
  { text: '本月', value: () => {
    const d = new Date()
    return [new Date(d.getFullYear(), d.getMonth(), 1), d]
  }},
  { text: '上個月', value: () => {
    const d = new Date()
    return [new Date(d.getFullYear(), d.getMonth() - 1, 1), new Date(d.getFullYear(), d.getMonth(), 0)]
  }},
  { text: '近三個月', value: () => {
    const d = new Date()
    return [new Date(d.getFullYear(), d.getMonth() - 2, 1), d]
  }},
]

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => attendanceApi.getMyRecords(params as any),
})

// Patch dialog
const patchDialogVisible = ref(false)
const submitting = ref(false)
const patchFormRef = ref<FormInstance>()
const selectedRecord = ref<any>(null)
const patchForm = ref({ date: '', punchType: 'clock_in', punchTime: '', reason: '' })

const patchRules = computed(() => ({
  punchType: [{ required: true, message: t('common.required'), trigger: 'change' }],
  punchTime: [{ required: true, message: t('common.required'), trigger: 'change' }],
  reason: [{ required: true, message: t('common.required'), trigger: 'blur' }],
}))

onMounted(() => {
  ui.setBreadcrumbs([{ title: t('nav.attendance') }, { title: t('nav.records') }])
  doSearch()
})

function buildParams() {
  const base: any = { page: pagination.page, limit: pagination.limit }
  if (dateRange.value?.[0]) base.startDate = dateRange.value[0]
  if (dateRange.value?.[1]) base.endDate = dateRange.value[1]
  return base
}

function doSearch() {
  pagination.page = 1
  fetch(buildParams())
}

function resetFilter() {
  dateRange.value = [firstDay, today]
  doSearch()
}

function needsPatch(row: any): boolean {
  return !row.actualClockIn || !row.actualClockOut
}

function openPatchDialog(row: any) {
  selectedRecord.value = row
  patchForm.value = {
    date: formatDate(row.workDate),
    punchType: !row.actualClockIn ? 'clock_in' : 'clock_out',
    punchTime: '',
    reason: '',
  }
  patchDialogVisible.value = true
}

async function submitPatch() {
  if (!patchFormRef.value) return
  await patchFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const [h, m] = patchForm.value.punchTime.split(':')
      const dateStr = selectedRecord.value.workDate.slice(0, 10)
      const clockTime = `${dateStr}T${h}:${m}:00`
      await attendanceApi.createClockPatch({
        clockType: patchForm.value.punchType,
        clockTime,
        reason: patchForm.value.reason,
      })
      ElMessage.success(t('msg.submitSuccess'))
      patchDialogVisible.value = false
      fetch(buildParams())
    } catch (err: any) {
      ElMessage.error(err?.response?.data?.message ?? t('msg.submitFailed'))
    } finally {
      submitting.value = false
    }
  })
}

function formatDate(iso: string): string {
  return iso ? iso.slice(0, 10) : '—'
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

function formatWorkMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes === 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m}m`
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { normal: '正常', late: '遲到', absent: '缺勤', leave: '請假', holiday: '假日' }
  return map[status] ?? status
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    normal: 'success', late: 'warning', absent: 'danger', leave: 'info', holiday: 'info',
  }
  return map[status] ?? 'info'
}
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-card { }
.filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.time-text { font-weight: 500; color: #303133; }
</style>
