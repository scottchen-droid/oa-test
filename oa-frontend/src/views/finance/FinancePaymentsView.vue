<template>
  <div>
    <div class="page-header">
      <h2>付款管理</h2>
    </div>

    <el-alert
      title="付款管理功能正在建置中，目前顯示已核准待付款的報銷單"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    />

    <el-card>
      <div class="toolbar">
        <el-select v-model="statusFilter" placeholder="付款狀態" clearable style="width: 160px" @change="onSearch">
          <el-option label="全部" value="" />
          <el-option label="待付款" value="approved" />
          <el-option label="已付款" value="paid" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="reimbursementNo" label="報銷單號" width="160" />
        <el-table-column prop="applicantName" label="申請人" width="110" />
        <el-table-column prop="companyName" label="公司" width="140" />
        <el-table-column label="金額" width="150">
          <template #default="{ row }">
            <span class="amount">{{ row.totalAmount }} {{ row.currencyCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="核准日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.approvedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="付款狀態" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">
              {{ row.status === 'paid' ? '已付款' : '待付款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="付款日期" width="120">
          <template #default="{ row }">
            {{ row.paidAt ? formatDate(row.paidAt) : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'approved'" text size="small" type="primary">標記付款</el-button>
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
import dayjs from 'dayjs'
import { reimbursementsApi } from '@/api/finance.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const statusFilter = ref('')

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '—'
}

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable({
  fetchFn: (params) => reimbursementsApi.getAll(params as Parameters<typeof reimbursementsApi.getAll>[0]),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '財務模塊' }, { title: '付款管理' }])
  // Default: show approved + paid reimbursements
  fetch({ status: 'approved' })
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
