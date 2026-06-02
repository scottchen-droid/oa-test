<template>
  <div>
    <div class="page-header">
      <h2>我的申請進度</h2>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="items" border stripe empty-text="尚無電子表單申請紀錄">
        <el-table-column label="表單類型" width="140">
          <template #default="{ row }">
            <el-tag :type="formTypeTagColor(row.formType)" size="small">{{ formTypeLabel(row.formType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申請摘要" min-width="200">
          <template #default="{ row }">
            <span class="content-summary">{{ contentSummary(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagColor(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申請時間" width="150">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="更新時間" width="150">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="loadList"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { formsApi } from '@/api/forms.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()

const loading = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '電子表單' }, { title: '簽核' }])
  await loadList()
})

async function loadList(p = 1) {
  page.value = p
  loading.value = true
  try {
    const result = await formsApi.getMyRequests({ page: p, limit: pageSize })
    items.value = result?.items ?? []
    total.value = result?.total ?? 0
  } catch {
    ElMessage.error('載入失敗，請稍後再試')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const formTypeMap: Record<string, string> = {
  purchase_request: '採購申請',
  business_trip: '出差申請',
  asset_request: 'OA資產申請',
  meal_allowance: '誤餐費申請',
  it_request: '資訊需求申請',
  headcount_request: '人力需求申請',
  resignation: '離職申請',
}

function formTypeLabel(type: string) {
  return formTypeMap[type] ?? type
}

function formTypeTagColor(type: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    purchase_request: '',
    business_trip: 'success',
    asset_request: '',
    meal_allowance: 'success',
    it_request: 'warning',
    headcount_request: 'info',
    resignation: 'danger',
  }
  return map[type] ?? 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '審核中',
    approved: '已通過',
    rejected: '已駁回',
    canceled: '已取消',
  }
  return map[status] ?? status
}

function statusTagColor(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    canceled: 'info',
  }
  return map[status] ?? 'info'
}

function contentSummary(row: any): string {
  const c = row.content ?? {}
  switch (row.formType) {
    case 'purchase_request': return `${c.itemName ?? '—'} × ${c.quantity ?? 1}，預估 NT$${c.estimatedAmount ?? '?'}`
    case 'business_trip': return `${c.destination ?? '—'}，${c.startDate ?? '?'} ~ ${c.endDate ?? '?'}`
    case 'asset_request': return `${c.assetType ?? '—'} × ${c.quantity ?? 1}`
    case 'meal_allowance': return `${c.workDate ?? '—'} 加班 ${c.hours ?? '?'} 小時，申請 NT$${c.amount ?? '?'}`
    case 'it_request': return c.title ?? '—'
    case 'headcount_request': return `${c.positionName ?? '—'} × ${c.headcount ?? 1} 人`
    case 'resignation': return `預計 ${c.resignDate ?? '—'} 離職`
    default: return JSON.stringify(c).slice(0, 60)
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
}
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.content-summary { color: #606266; font-size: 13px; }
</style>
