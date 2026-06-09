<template>
  <div>
    <div class="page-header">
      <h2>我的填寫模板</h2>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="items" border stripe empty-text="目前沒有填寫模板">
        <el-table-column label="模板名稱" min-width="180">
          <template #default="{ row }">
            <div class="template-name">
              <el-icon v-if="row.isFavorite" color="#f7ba2a" style="margin-right:4px"><Star /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="表單類型" width="140">
          <template #default="{ row }">
            <el-tag :type="formTypeTagColor(row.formType)" size="small">{{ formTypeLabel(row.formType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模板說明" min-width="180">
          <template #default="{ row }">
            <span class="description">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近使用" width="140">
          <template #default="{ row }">{{ row.lastUsedAt ? formatDateTime(row.lastUsedAt) : '—' }}</template>
        </el-table-column>
        <el-table-column label="建立時間" width="140">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">編輯</el-button>
            <el-button size="small" @click="toggleFavorite(row)">
              {{ row.isFavorite ? '取消常用' : '設為常用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteTemplate(row)">刪除</el-button>
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

    <!-- 編輯模板 Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="編輯填寫模板"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="模板名稱" required>
          <el-input v-model="editForm.name" placeholder="請輸入模板名稱" />
        </el-form-item>
        <el-form-item label="模板說明">
          <el-input v-model="editForm.description" type="textarea" :rows="2" placeholder="說明此模板用途（選填）" />
        </el-form-item>
        <el-form-item label="設為常用">
          <el-switch v-model="editForm.isFavorite" />
        </el-form-item>
        <el-form-item label="啟用">
          <el-switch v-model="editForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmEdit">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { formsApi } from '@/api/forms.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()

const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const editDialogVisible = ref(false)
const editingId = ref('')
const editForm = ref({ name: '', description: '', isFavorite: false, isEnabled: true })

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '電子表單' }, { title: '我的填寫模板' }])
  await loadList()
})

async function loadList(p = 1) {
  page.value = p
  loading.value = true
  try {
    const result = await formsApi.getMyFillTemplates({ page: p, limit: pageSize })
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

function openEditDialog(row: any) {
  editingId.value = row.id
  editForm.value = {
    name: row.name,
    description: row.description ?? '',
    isFavorite: row.isFavorite,
    isEnabled: row.isEnabled,
  }
  editDialogVisible.value = true
}

async function confirmEdit() {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('請輸入模板名稱')
    return
  }
  saving.value = true
  try {
    await formsApi.updateFillTemplate(editingId.value, {
      name: editForm.value.name.trim(),
      description: editForm.value.description.trim() || undefined,
      isFavorite: editForm.value.isFavorite,
      isEnabled: editForm.value.isEnabled,
    })
    ElMessage.success('填寫模板已更新')
    editDialogVisible.value = false
    await loadList(page.value)
  } catch {
    ElMessage.error('更新失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}

async function toggleFavorite(row: any) {
  try {
    await formsApi.updateFillTemplate(row.id, { isFavorite: !row.isFavorite })
    row.isFavorite = !row.isFavorite
    ElMessage.success(row.isFavorite ? '已設為常用' : '已取消常用')
  } catch {
    ElMessage.error('操作失敗，請稍後再試')
  }
}

async function deleteTemplate(row: any) {
  try {
    await ElMessageBox.confirm('確定要刪除此填寫模板嗎？此操作無法復原。', '確認刪除', { type: 'warning' })
    await formsApi.deleteFillTemplate(row.id)
    ElMessage.success('填寫模板已刪除')
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
.template-name { display: flex; align-items: center; font-size: 13px; font-weight: 500; }
.description { color: #909399; font-size: 13px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
