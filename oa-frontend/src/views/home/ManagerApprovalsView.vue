<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('manager.pendingApprovals') }}</h2>
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
            <el-table v-loading="loading" :data="items" border stripe :empty-text="$t('manager.noData')">
              <el-table-column label="ID" min-width="160">
                <template #default="{ row }">
                  <span class="form-id">{{ row.formId?.slice(0, 8) ?? '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="formType" :label="$t('common.type')" width="110">
                <template #default="{ row }">
                  <el-tag size="small" :type="formTypeTagType(row.formType)">{{ formTypeLabel(row.formType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.status')" width="130">
                <template #default="{ row }">
                  {{ row.currentStepOrder ? `Step ${row.currentStepOrder}` : '—' }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('form.submittedAt')" width="150">
                <template #default="{ row }">{{ formatDateTime(row.startedAt ?? row.createdAt) }}</template>
              </el-table-column>
              <el-table-column :label="$t('common.actions')" width="160" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" type="success" @click="openApprove(row)">{{ $t('manager.approve') }}</el-button>
                  <el-button size="small" type="danger" @click="openReject(row)">{{ $t('manager.reject') }}</el-button>
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

    <el-dialog v-model="approveDialogVisible" :title="$t('manager.approve')" width="420px">
      <el-form label-width="90px">
        <el-form-item :label="$t('manager.comment')">
          <el-input v-model="approveComment" type="textarea" :rows="3" :placeholder="$t('common.optional')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="success" :loading="actionLoading" @click="confirmApprove">{{ $t('manager.approve') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" :title="$t('manager.reject')" width="420px">
      <el-form label-width="90px">
        <el-form-item :label="$t('manager.comment')" required>
          <el-input v-model="rejectComment" type="textarea" :rows="3" :placeholder="$t('manager.commentRequired')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="danger" :loading="actionLoading" :disabled="!rejectComment.trim()" @click="confirmReject">{{ $t('manager.reject') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { approvalsApi } from '@/api/approvals.api'
import { useUiStore } from '@/stores/ui.store'

const { t } = useI18n()
const ui = useUiStore()

const tabs = computed(() => [
  { formType: 'leave',       label: t('manager.leaveApproval') },
  { formType: 'clock_patch', label: t('manager.clockPatch') },
  { formType: 'overtime',    label: t('manager.overtimeApproval') },
  { formType: 'form',        label: t('manager.formApproval') },
])

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
  ui.setBreadcrumbs([{ title: t('nav.manager') }, { title: t('manager.pendingApprovals') }])
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
    ElMessage.success(t('msg.approveSuccess'))
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
    ElMessage.success(t('msg.rejectSuccess'))
    rejectDialogVisible.value = false
    await Promise.all([loadCounts(), loadList(page.value)])
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '操作失敗')
  } finally {
    actionLoading.value = false
  }
}

function formTypeLabel(type: string): string {
  const map: Record<string, string> = {
    leave: t('attendance.leaveRequest'), clock_patch: t('attendance.clockPatch'),
    overtime: t('attendance.overtimeRequest'), form: t('nav.forms'),
  }
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
