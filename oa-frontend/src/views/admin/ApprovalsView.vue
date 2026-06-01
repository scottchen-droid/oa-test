<template>
  <div>
    <div class="page-header">
      <h2>審批中心</h2>
    </div>

    <el-card>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- Tab 1: 待我審批 -->
        <el-tab-pane name="pending">
          <template #label>
            <span>待我審批</span>
            <el-badge v-if="pendingTotal > 0" :value="pendingTotal" style="margin-left: 6px" />
          </template>
          <el-table v-loading="pendingLoading" :data="pendingData" border stripe>
            <el-table-column label="表單類型" width="120">
              <template #default="{ row }">{{ formTypeLabel(row.formType) }}</template>
            </el-table-column>
            <el-table-column label="標題/摘要" min-width="180">
              <template #default="{ row }">{{ row.title ?? row.summary ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="申請人" width="120">
              <template #default="{ row }">{{ row.applicantName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="申請時間" width="160">
              <template #default="{ row }">{{ formatDate(row.submittedAt) }}</template>
            </el-table-column>
            <el-table-column label="目前步驟" width="150">
              <template #default="{ row }">{{ row.currentStepName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default>
                <el-button type="primary" size="small" @click="ElMessage.info('審核功能開發中')">審核</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!pendingLoading && pendingData.length === 0" description="暫無待審批事項" />
          <el-pagination
            v-if="pendingTotal > 0"
            v-model:current-page="pendingPagination.page"
            v-model:page-size="pendingPagination.limit"
            :total="pendingTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="pendingHandlePageChange"
            @size-change="pendingHandleSizeChange"
          />
        </el-tab-pane>

        <!-- Tab 2: 我已審批 -->
        <el-tab-pane label="我已審批" name="completed">
          <el-table v-loading="completedLoading" :data="completedData" border stripe>
            <el-table-column label="表單類型" width="120">
              <template #default="{ row }">{{ formTypeLabel(row.formType) }}</template>
            </el-table-column>
            <el-table-column label="標題" min-width="180">
              <template #default="{ row }">{{ row.title ?? row.summary ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="申請人" width="120">
              <template #default="{ row }">{{ row.applicantName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="審核時間" width="160">
              <template #default="{ row }">{{ formatDate(row.actionAt ?? row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="結果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.result === 'approved' ? 'success' : 'danger'" size="small">
                  {{ row.result === 'approved' ? '核准' : '駁回' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!completedLoading && completedData.length === 0" description="暫無已審批記錄" />
          <el-pagination
            v-if="completedTotal > 0"
            v-model:current-page="completedPagination.page"
            v-model:page-size="completedPagination.limit"
            :total="completedTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="completedHandlePageChange"
            @size-change="completedHandleSizeChange"
          />
        </el-tab-pane>

        <!-- Tab 3: 抄送我 -->
        <el-tab-pane label="抄送我" name="cc">
          <el-table v-loading="ccLoading" :data="ccData" border stripe>
            <el-table-column label="表單類型" width="120">
              <template #default="{ row }">{{ formTypeLabel(row.formType) }}</template>
            </el-table-column>
            <el-table-column label="標題" min-width="180">
              <template #default="{ row }">{{ row.title ?? row.summary ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="申請人" width="120">
              <template #default="{ row }">{{ row.applicantName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="時間" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt ?? row.submittedAt) }}</template>
            </el-table-column>
            <el-table-column label="是否已讀" width="100">
              <template #default="{ row }">
                <el-tag :type="row.hasRead ? 'success' : 'warning'" size="small">
                  {{ row.hasRead ? '已讀' : '未讀' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!ccLoading && ccData.length === 0" description="暫無抄送記錄" />
          <el-pagination
            v-if="ccTotal > 0"
            v-model:current-page="ccPagination.page"
            v-model:page-size="ccPagination.limit"
            :total="ccTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="ccHandlePageChange"
            @size-change="ccHandleSizeChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { approvalsApi } from '@/api/approvals.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const activeTab = ref('pending')

const {
  loading: pendingLoading,
  data: pendingData,
  total: pendingTotal,
  pagination: pendingPagination,
  fetch: fetchPending,
  handlePageChange: pendingHandlePageChange,
  handleSizeChange: pendingHandleSizeChange,
} = useTable({
  fetchFn: (params) => approvalsApi.getPending(params as { page?: number; limit?: number }),
})

const {
  loading: completedLoading,
  data: completedData,
  total: completedTotal,
  pagination: completedPagination,
  fetch: fetchCompleted,
  handlePageChange: completedHandlePageChange,
  handleSizeChange: completedHandleSizeChange,
} = useTable({
  fetchFn: (params) => approvalsApi.getCompleted(params as { page?: number; limit?: number }),
})

const {
  loading: ccLoading,
  data: ccData,
  total: ccTotal,
  pagination: ccPagination,
  fetch: fetchCc,
  handlePageChange: ccHandlePageChange,
  handleSizeChange: ccHandleSizeChange,
} = useTable({
  fetchFn: (params) => approvalsApi.getCc(params as { page?: number; limit?: number }),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '行政模塊' }, { title: '審批中心' }])
  fetchPending()
})

function onTabChange(tab: string) {
  if (tab === 'pending') fetchPending()
  else if (tab === 'completed') fetchCompleted()
  else if (tab === 'cc') fetchCc()
}

function formTypeLabel(type: string) {
  const map: Record<string, string> = {
    purchase_request: '採購申請',
    reimbursement: '報銷單',
    leave: '請假單',
    overtime: '加班申請',
  }
  return map[type] ?? type
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '—'
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
