<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('attendance.leaveRequest') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('common.create') }}</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-date-picker
          v-model="monthFilter"
          type="month"
          placeholder="選擇月份"
          value-format="YYYY-MM"
          style="width: 140px"
          @change="onSearch"
          clearable
        />
        <el-select
          v-model="statusFilter"
          placeholder="狀態篩選"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option label="審核中" value="submitted" />
          <el-option label="核准" value="approved" />
          <el-option label="駁回" value="rejected" />
          <el-option label="取消" value="canceled" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="requestNo" label="單號" width="160" />
        <el-table-column label="假別" width="120">
          <template #default="{ row }">{{ row.leaveType?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="起訖日期" width="200">
          <template #default="{ row }">{{ fmtDate(row.startDate) }} ~ {{ fmtDate(row.endDate) }}</template>
        </el-table-column>
        <el-table-column prop="totalDays" label="天數" width="70" />
        <el-table-column prop="reason" label="事由" show-overflow-tooltip />
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="leaveTagType(row.status)" size="small">{{ leaveLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="showStatus(row)">審批狀態</el-button>
            <el-button
              v-if="canDelete(row)"
              text size="small" type="danger"
              @click="handleDelete(row)"
            >刪除</el-button>
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

    <!-- 申請請假 Dialog -->
    <el-dialog v-model="dialogVisible" title="申請請假" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="假別" prop="leaveTypeId">
          <el-select v-model="form.leaveTypeId" placeholder="請選擇假別" style="width: 100%">
            <el-option v-for="t in leaveTypes" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="開始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="結束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="天數" prop="totalDays">
          <el-input-number v-model="form.totalDays" :min="0.5" :step="0.5" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="事由" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請輸入請假事由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">確定送出</el-button>
      </template>
    </el-dialog>

    <!-- 審批狀態 Dialog -->
    <el-dialog v-model="statusDialogVisible" title="審批狀態" width="440px">
      <approval-status-panel v-if="statusRow" :row="statusRow" type="leave" />
      <template #footer>
        <el-button @click="statusDialogVisible = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { leavesApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import ApprovalStatusPanel from './ApprovalStatusPanel.vue'

const ui = useUiStore()
const { t } = useI18n()
const monthFilter = ref('')
const statusFilter = ref('')
const leaveTypes = ref<any[]>([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const statusRow = ref<any>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({ leaveTypeId: '', startDate: '', endDate: '', totalDays: 1, reason: '' })
const rules = computed<FormRules>(() => ({
  leaveTypeId: [{ required: true, message: '請選擇假別', trigger: 'change' }],
  startDate: [{ required: true, message: '請選擇開始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '請選擇結束日期', trigger: 'change' }],
  totalDays: [{ required: true, message: '請填寫天數', trigger: 'blur' }],
  reason: [{ required: true, message: '請填寫事由', trigger: 'blur' }],
}))

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => leavesApi.getMy(params as any),
})

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '首頁' }, { title: '假期申請' }])
  try { leaveTypes.value = (await leavesApi.getTypes())?.items ?? [] } catch { leaveTypes.value = [] }
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ status: statusFilter.value || undefined, month: monthFilter.value || undefined })
}

function openCreate() {
  Object.assign(form, { leaveTypeId: '', startDate: '', endDate: '', totalDays: 1, reason: '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await leavesApi.create({ leaveTypeId: form.leaveTypeId, startDate: form.startDate, endDate: form.endDate, totalDays: form.totalDays, reason: form.reason })
    ElMessage.success('請假申請已送出')
    dialogVisible.value = false
    onSearch()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '送出失敗')
  } finally {
    saving.value = false
  }
}

function canDelete(row: any) {
  return ['draft', 'submitted'].includes(row.status) && !row.deletedAt
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`確認刪除假單「${row.requestNo}」？此操作不可復原。`, '確認刪除', { type: 'warning', confirmButtonText: '刪除', confirmButtonClass: 'el-button--danger' })
  try {
    await leavesApi.softDelete(row.id)
    ElMessage.success('假單已刪除')
    onSearch()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '刪除失敗')
  }
}

function showStatus(row: any) {
  statusRow.value = row
  statusDialogVisible.value = true
}

function fmtDate(d?: string) { return d ? d.slice(0, 10) : '—' }

function leaveLabel(s: string) {
  const m: Record<string, string> = { draft: '草稿', submitted: '審核中', approved: '核准', rejected: '駁回', canceled: '取消' }
  return m[s] ?? s
}
function leaveTagType(s: string): 'success' | 'warning' | 'danger' | 'info' {
  const m: Record<string, any> = { draft: 'info', submitted: 'warning', approved: 'success', rejected: 'danger', canceled: 'info' }
  return m[s] ?? 'info'
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
