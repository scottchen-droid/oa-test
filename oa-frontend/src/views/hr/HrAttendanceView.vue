<template>
  <div>
    <div class="page-header">
      <h2>出勤管理</h2>
    </div>

    <el-card>
      <div class="toolbar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="開始日期"
          end-placeholder="結束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="onSearch"
        />
        <el-input
          v-model="userSearch"
          placeholder="搜尋員工姓名"
          clearable
          style="width: 200px"
          @change="onSearch"
        />
        <el-select
          v-model="statusFilter"
          placeholder="狀態篩選"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option label="正常" value="normal" />
          <el-option label="遲到" value="late" />
          <el-option label="缺勤" value="absent" />
          <el-option label="請假" value="leave" />
          <el-option label="假日" value="holiday" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="employeeName" label="員工姓名" width="120" />
        <el-table-column prop="workDate" label="日期" width="120" />
        <el-table-column prop="actualClockIn" label="實際上班" width="120">
          <template #default="{ row }">
            {{ row.actualClockIn ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="actualClockOut" label="實際下班" width="120">
          <template #default="{ row }">
            {{ row.actualClockOut ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="工時" width="120">
          <template #default="{ row }">
            {{ formatWorkMinutes(row.workMinutes) }}
          </template>
        </el-table-column>
        <el-table-column label="遲到(分)" prop="lateMinutes" width="100">
          <template #default="{ row }">
            {{ row.lateMinutes ?? 0 }}
          </template>
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
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { attendanceApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const dateRange = ref<[string, string] | null>(null)
const userSearch = ref('')
const statusFilter = ref('')

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => attendanceApi.getRecords(params as any),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '人事模塊' }, { title: '出勤管理' }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  const [startDate, endDate] = dateRange.value ?? [undefined, undefined]
  try {
    fetch({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userSearch.value || undefined,
      status: statusFilter.value || undefined,
    })
  } catch {
    ElMessage.error('載入出勤記錄失敗')
  }
}

function formatWorkMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}小時${m}分`
}

function attendanceLabel(status: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    late: '遲到',
    absent: '缺勤',
    leave: '請假',
    holiday: '假日',
  }
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
</style>
