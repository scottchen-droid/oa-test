<template>
  <div>
    <div class="page-header">
      <h2>費用報銷</h2>
      <el-button type="primary" @click="ElMessage.info('功能開發中')">申請報銷</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="statusFilter" placeholder="狀態篩選" clearable style="width: 140px" @change="onSearch">
          <el-option label="草稿" value="draft" />
          <el-option label="審核中" value="submitted" />
          <el-option label="核准" value="approved" />
          <el-option label="駁回" value="rejected" />
          <el-option label="已付款" value="paid" />
          <el-option label="取消" value="canceled" />
        </el-select>
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
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="reimbursementNo" label="報銷單號" width="160" />
        <el-table-column prop="title" label="標題" min-width="180" />
        <el-table-column label="金額" width="150">
          <template #default="{ row }">
            <span class="amount">{{ row.totalAmount }} {{ row.currencyCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="關聯採購申請" width="160">
          <template #default="{ row }">
            {{ row.purchaseRequestId ? (row.requestNo ?? row.purchaseRequestId) : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="提交日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.submittedAt ?? row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status, STATUS_TYPE_MAP)" size="small">
              {{ statusLabel(row.status, STATUS_LABEL_MAP) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default>
            <el-button text size="small">詳情</el-button>
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
import dayjs from 'dayjs'
import { reimbursementsApi } from '@/api/finance.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)

const STATUS_LABEL_MAP: Record<string, string> = {
  draft: '草稿',
  submitted: '審核中',
  approved: '核准',
  rejected: '駁回',
  paid: '已付款',
  canceled: '取消',
}

const STATUS_TYPE_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'info',
  submitted: 'warning',
  approved: 'success',
  rejected: 'danger',
  paid: 'success',
  canceled: 'info',
}

function statusLabel(status: string, map: Record<string, string>) {
  return map[status] ?? status
}

function statusType(status: string, map: Record<string, 'success' | 'warning' | 'danger' | 'info'>) {
  return map[status] ?? 'info'
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '—'
}

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable({
  fetchFn: (params) => reimbursementsApi.getAll(params as Parameters<typeof reimbursementsApi.getAll>[0]),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '財務模塊' }, { title: '費用報銷' }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ status: statusFilter.value || undefined })
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.amount { font-weight: 600; color: #409eff; }
</style>
