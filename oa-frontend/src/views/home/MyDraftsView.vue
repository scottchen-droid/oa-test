<template>
  <div>
    <div class="page-header">
      <h2>我的草稿</h2>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="items" border stripe empty-text="目前沒有草稿">
        <el-table-column label="表單類型" width="140">
          <template #default="{ row }">
            <el-tag :type="formTypeTagColor(row.formType)" size="small">{{ formTypeLabel(row.formType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="草稿標題" min-width="200">
          <template #default="{ row }">
            <span class="draft-title">{{ row.title || '（未命名草稿）' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最後保存時間" width="160">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="建立時間" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="submitDraft(row)">送出申請</el-button>
            <el-button size="small" @click="deleteDraft(row)">刪除</el-button>
          </template>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { formsApi } from '@/api/forms.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()

const loading = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '電子表單' }, { title: '我的草稿' }])
  await loadList()
})

async function loadList(p = 1) {
  page.value = p
  loading.value = true
  try {
    const result = await formsApi.getMyDrafts({ page: p, limit: pageSize })
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

async function submitDraft(row: any) {
  try {
    await ElMessageBox.confirm(
      '送出後將依目前表單內容重新產生審批流程，確定要送出嗎？',
      '確認送出草稿',
      { type: 'warning' },
    )
    await formsApi.submitDraft(row.id)
    ElMessage.success('草稿已送出，等待主管審核')
    await loadList(page.value)
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.response?.data?.message ?? '送出失敗，請稍後再試')
    }
  }
}

async function deleteDraft(row: any) {
  try {
    await ElMessageBox.confirm('確定要刪除此草稿嗎？此操作無法復原。', '確認刪除', { type: 'warning' })
    await formsApi.deleteDraft(row.id)
    ElMessage.success('草稿已刪除')
    await loadList(page.value)
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.response?.data?.message ?? '刪除失敗，請稍後再試')
    }
  }
}

const formTypeMap: Record<string, string> = {
  purchase_request: '採購申請',
  business_trip: '出差申請',
  expense_reimbursement: '費用報銷',
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
    expense_reimbursement: 'warning',
    asset_request: '',
    meal_allowance: 'success',
    it_request: 'warning',
    headcount_request: 'info',
    resignation: 'danger',
  }
  return map[type] ?? 'info'
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
.draft-title { color: #303133; font-size: 13px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
