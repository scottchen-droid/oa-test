<template>
  <div>
    <div class="page-header">
      <h2>簽核</h2>
    </div>

    <el-card>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.formType"
          :name="tab.formType"
        >
          <template #label>
            <span class="tab-label">
              {{ tab.label }}
              <el-badge v-if="counts[tab.formType]" :value="counts[tab.formType]" class="tab-badge" />
            </span>
          </template>

          <div class="tab-content">
            <el-table v-loading="loading" :data="items" border stripe empty-text="目前無待簽核項目">
              <el-table-column label="單號 / 說明" min-width="160">
                <template #default="{ row }">
                  <span class="form-id">{{ row.formId?.slice(0, 8) ?? '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="formType" label="類型" width="110">
                <template #default="{ row }">
                  <el-tag size="small" :type="formTypeTagType(row.formType)">{{ formTypeLabel(row.formType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="目前步驟" width="130">
                <template #default="{ row }">
                  <span>第 {{ row.currentStepOrder ?? '—' }} 關</span>
                </template>
              </el-table-column>
              <el-table-column label="提交時間" width="150">
                <template #default="{ row }">{{ formatDateTime(row.startedAt ?? row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" type="success" @click="openApprove(row)">通過</el-button>
                  <el-button size="small" type="danger" @click="openReject(row)">駁回</el-button>
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
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 通過確認 -->
    <el-dialog v-model="approveDialogVisible" title="確認通過" width="420px">
      <el-form label-width="80px">
        <el-form-item label="簽核意見">
          <el-input v-model="approveComment" type="textarea" :rows="3" placeholder="選填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="actionLoading" @click="confirmApprove">確認通過</el-button>
      </template>
    </el-dialog>

    <!-- 駁回確認 -->
    <el-dialog v-model="rejectDialogVisible" title="確認駁回" width="420px">
      <el-form label-width="80px">
        <el-form-item label="駁回原因" required>
          <el-input v-model="rejectComment" type="textarea" :rows="3" placeholder="請填寫駁回原因（必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" :disabled="!rejectComment.trim()" @click="confirmReject">確認駁回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { approvalsApi } from '@/api/approvals.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()

const tabs = [
  { formType: 'leave', label: '請假簽核' },
  { formType: 'clock_patch', label: '補卡簽核' },
  { formType: 'overtime', label: '加班簽核' },
  { formType: 'form', label: '電子表單簽核' },
]

const activeTab = ref('leave')
const loading = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const counts = ref<Record<string, number>>({})

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const actionLoading = ref(false)
const selectedInstance = ref<any>(null)
const approveComment = ref('')
const rejectComment = ref('')

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '主管' }, { title: '簽核' }])
  await Promise.all([loadCounts(), loadList()])
})

async function loadCounts() {
  try {
    counts.value = await approvalsApi.getPendingCounts()
  } catch {
    counts.value = {}
  }
}

async function loadList(p = 1) {
  page.value = p
  loading.value = true
  try {
    const result = await approvalsApi.getPending({ formType: activeTab.value, page: p, limit: pageSize })
    items.value = result?.items ?? []
    total.value = result?.total ?? 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  page.value = 1
  loadList()
}

function openApprove(row: any) {
  selectedInstance.value = row
  approveComment.value = ''
  approveDialogVisible.value = true
}

function openReject(row: any) {
  selectedInstance.value = row
  rejectComment.value = ''
  rejectDialogVisible.value = true
}

async function confirmApprove() {
  if (!selectedInstance.value) return
  actionLoading.value = true
  try {
    await approvalsApi.approve(selectedInstance.value.id, { comment: approveComment.value || undefined })
    ElMessage.success('已通過')
    approveDialogVisible.value = false
    await Promise.all([loadCounts(), loadList(page.value)])
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '操作失敗')
  } finally {
    actionLoading.value = false
  }
}

async function confirmReject() {
  if (!selectedInstance.value || !rejectComment.value.trim()) return
  actionLoading.value = true
  try {
    await approvalsApi.reject(selectedInstance.value.id, { comment: rejectComment.value })
    ElMessage.success('已駁回')
    rejectDialogVisible.value = false
    await Promise.all([loadCounts(), loadList(page.value)])
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '操作失敗')
  } finally {
    actionLoading.value = false
  }
}

function formTypeLabel(type: string): string {
  const map: Record<string, string> = { leave: '請假', clock_patch: '補卡', overtime: '加班', form: '表單' }
  return map[type] ?? type
}

function formTypeTagType(type: string): 'success' | 'warning' | 'info' | '' {
  const map: Record<string, 'success' | 'warning' | 'info' | ''> = {
    leave: 'info', clock_patch: 'warning', overtime: '', form: 'success',
  }
  return map[type] ?? ''
}

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.tab-label { display: flex; align-items: center; gap: 6px; }
.tab-badge { transform: translateY(-2px); }
.tab-content { padding-top: 4px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.form-id { font-family: monospace; color: #606266; }
</style>
