<template>
  <div>
    <div class="page-header">
      <h2>我的費用報銷</h2>
      <el-button type="primary" @click="$router.push('/home/forms/reimbursement/new')">新增報銷申請</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="statusFilter" placeholder="狀態篩選" clearable style="width:140px" @change="onSearch">
          <el-option label="草稿" value="draft" />
          <el-option label="審核中" value="submitted" />
          <el-option label="核准" value="approved" />
          <el-option label="駁回" value="rejected" />
          <el-option label="已付款" value="paid" />
          <el-option label="取消" value="canceled" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="reimbursementNo" label="報銷單號" width="160" />
        <el-table-column prop="title" label="標題" min-width="180" />
        <el-table-column label="報銷金額" width="160">
          <template #default="{ row }">
            <span class="amount">{{ Number(row.totalAmount).toFixed(2) }} {{ row.currencyCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="關聯申請單" width="160">
          <template #default="{ row }">
            {{ row.purchaseRequest?.requestNo ?? (row.businessTripFormId ? '出差申請' : '—') }}
          </template>
        </el-table-column>
        <el-table-column label="提交日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.submittedAt ?? row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="STATUS_TYPE_MAP[row.status] ?? 'info'" size="small">
              {{ STATUS_LABEL_MAP[row.status] ?? row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="viewDetail(row)">詳情</el-button>
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { reimbursementsApi } from '@/api/finance.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const router = useRouter()
const statusFilter = ref('')

const STATUS_LABEL_MAP: Record<string, string> = {
  draft: '草稿', submitted: '審核中', approved: '核准', rejected: '駁回', paid: '已付款', canceled: '取消',
}
const STATUS_TYPE_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'info', submitted: 'warning', approved: 'success', rejected: 'danger', paid: 'success', canceled: 'info',
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '—'
}

function viewDetail(row: any) {
  ElMessage.info(`報銷單 ${row.reimbursementNo} 詳情功能開發中`)
}

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable({
  fetchFn: (params) => reimbursementsApi.getMy(params as any),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '首頁' }, { title: '電子表單' }, { title: '我的報銷' }])
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
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.amount { font-weight: 600; color: #e6a23c; }
</style>
