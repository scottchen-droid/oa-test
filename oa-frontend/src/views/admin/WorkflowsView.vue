<template>
  <div>
    <div class="page-header">
      <h2>審批流設定</h2>
      <el-button type="primary" @click="ElMessage.info('審批流設計器開發中')">新增審批流</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select
          v-model="formTypeFilter"
          placeholder="表單類型篩選"
          clearable
          style="width: 160px"
          @change="onFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="採購申請" value="purchase_request" />
          <el-option label="報銷單" value="reimbursement" />
          <el-option label="請假" value="leave" />
          <el-option label="加班" value="overtime" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="code" label="模板代碼" width="160" />
        <el-table-column prop="name" label="模板名稱" min-width="160" />
        <el-table-column label="適用表單" width="120">
          <template #default="{ row }">{{ formTypeLabel(row.formType) }}</template>
        </el-table-column>
        <el-table-column label="適用範圍" width="160">
          <template #default="{ row }">
            <span v-if="row.company || row.region">
              {{ [row.company, row.region].filter(Boolean).join(' / ') }}
            </span>
            <span v-else>全域</span>
          </template>
        </el-table-column>
        <el-table-column label="金額範圍" width="160">
          <template #default="{ row }">
            <span v-if="row.minAmount != null || row.maxAmount != null">
              {{ row.minAmount ?? '0' }} ~ {{ row.maxAmount ?? '∞' }}
            </span>
            <span v-else>不限</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="優先序" width="80" align="center" />
        <el-table-column label="步驟數" width="80" align="center">
          <template #default="{ row }">{{ row.stepsCount ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="狀態" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default>
            <el-button text size="small" @click="ElMessage.info('功能開發中')">編輯</el-button>
            <el-button text size="small" @click="ElMessage.info('功能開發中')">步驟設定</el-button>
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
import { approvalsApi } from '@/api/approvals.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const formTypeFilter = ref('')

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable({
  fetchFn: (params) =>
    approvalsApi.getTemplates(params as { formType?: string; page?: number; limit?: number }),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '系統模塊' }, { title: '審批流設定' }])
  fetch()
})

function onFilter() {
  pagination.page = 1
  fetch({ formType: formTypeFilter.value || undefined })
}

function formTypeLabel(type: string) {
  const map: Record<string, string> = {
    purchase_request: '採購申請',
    reimbursement: '報銷單',
    leave: '請假',
    overtime: '加班',
  }
  return map[type] ?? type
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
</style>
