<template>
  <div>
    <div class="page-header">
      <h2>系統稽核日誌</h2>
    </div>

    <el-card>
      <div class="toolbar">
        <el-input
          v-model="filters.operatorUserId"
          placeholder="操作者搜尋"
          clearable
          style="width: 180px"
          @change="onFilter"
        />
        <el-input
          v-model="filters.action"
          placeholder="操作代碼搜尋"
          clearable
          style="width: 180px"
          @change="onFilter"
        />
        <el-select
          v-model="filters.targetType"
          placeholder="對象類型"
          clearable
          style="width: 150px"
          @change="onFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="user" value="user" />
          <el-option label="role" value="role" />
          <el-option label="employee" value="employee" />
          <el-option label="company" value="company" />
          <el-option label="department" value="department" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="開始日期"
          end-placeholder="結束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="onFilter"
        />
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column label="操作時間" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作者" width="130">
          <template #default="{ row }">{{ row.operatorName ?? row.operatorUserId ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="操作代碼" width="160">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="對象類型" width="120">
          <template #default="{ row }">{{ row.targetType ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="對象ID" width="130">
          <template #default="{ row }">
            <span v-if="row.targetId">
              {{ row.targetId.length > 8 ? row.targetId.slice(0, 8) + '...' : row.targetId }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="IP位址" width="140">
          <template #default="{ row }">{{ row.ipAddress ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openDetail(row)">詳情</el-button>
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

    <!-- Detail dialog -->
    <el-dialog v-model="detailVisible" title="日誌詳情" width="640px">
      <template v-if="detailItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作時間">{{ formatDate(detailItem.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="操作者">{{ detailItem.operatorName ?? detailItem.operatorUserId ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="操作代碼">{{ detailItem.action }}</el-descriptions-item>
          <el-descriptions-item label="對象類型">{{ detailItem.targetType ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="對象ID" :span="2">{{ detailItem.targetId ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="IP位址">{{ detailItem.ipAddress ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="User Agent">{{ detailItem.userAgent ?? '—' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detailItem.oldData != null" style="margin-top: 16px">
          <div class="data-block-title">變更前 (oldData)</div>
          <pre class="data-block">{{ JSON.stringify(detailItem.oldData, null, 2) }}</pre>
        </div>
        <div v-if="detailItem.newData != null" style="margin-top: 16px">
          <div class="data-block-title">變更後 (newData)</div>
          <pre class="data-block">{{ JSON.stringify(detailItem.newData, null, 2) }}</pre>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { auditLogsApi } from '@/api/approvals.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()

const filters = reactive({
  operatorUserId: '',
  action: '',
  targetType: '',
})
const dateRange = ref<[string, string] | null>(null)

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable({
  fetchFn: (params) =>
    auditLogsApi.getAll(
      params as {
        operatorUserId?: string
        action?: string
        targetType?: string
        startDate?: string
        endDate?: string
        page?: number
        limit?: number
      },
    ),
})

const detailVisible = ref(false)
const detailItem = ref<Record<string, unknown> | null>(null)

onMounted(() => {
  ui.setBreadcrumbs([{ title: '系統模塊' }, { title: '系統稽核日誌' }])
  fetch()
})

function onFilter() {
  pagination.page = 1
  fetch({
    operatorUserId: filters.operatorUserId || undefined,
    action: filters.action || undefined,
    targetType: filters.targetType || undefined,
    startDate: dateRange.value?.[0] ?? undefined,
    endDate: dateRange.value?.[1] ?? undefined,
  })
}

function openDetail(row: Record<string, unknown>) {
  detailItem.value = row
  detailVisible.value = true
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '—'
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.data-block-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 6px;
}
.data-block {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
