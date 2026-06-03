<template>
  <div>
    <div class="page-header">
      <h2>加班申請</h2>
      <el-button type="primary" @click="openCreate">新增申請</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-date-picker
          v-model="monthFilter"
          type="month"
          placeholder="選擇月份"
          value-format="YYYY-MM"
          style="width:140px"
          clearable
          @change="onSearch"
        />
        <el-select v-model="statusFilter" placeholder="狀態篩選" clearable style="width:140px" @change="onSearch">
          <el-option label="待審核" value="submitted" />
          <el-option label="核准" value="approved" />
          <el-option label="駁回" value="rejected" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="requestNo" label="單號" width="160" />
        <el-table-column label="加班日期" width="120">
          <template #default="{ row }">{{ fmtDate(row.overtimeDate) }}</template>
        </el-table-column>
        <el-table-column label="時間" width="140">
          <template #default="{ row }">{{ fmtTime(row.startTime) }} ~ {{ fmtTime(row.endTime) }}</template>
        </el-table-column>
        <el-table-column prop="totalHours" label="時數" width="70" />
        <el-table-column label="類型" width="100">
          <template #default="{ row }">{{ overtimeTypeLabel(row.overtimeType) }}</template>
        </el-table-column>
        <el-table-column label="補償方式" width="90">
          <template #default="{ row }">{{ compensationLabel(row.compensationType) }}</template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="showStatus(row)">審批狀態</el-button>
            <el-button v-if="canDelete(row)" text size="small" type="danger" @click="handleDelete(row)">刪除</el-button>
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

    <!-- 申請加班 Dialog -->
    <el-dialog v-model="dialogVisible" title="申請加班" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="加班日期" prop="overtimeDate">
          <el-date-picker v-model="form.overtimeDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="開始時間" prop="startTime">
          <el-time-picker v-model="form.startTime" value-format="HH:mm" format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="結束時間" prop="endTime">
          <el-time-picker v-model="form.endTime" value-format="HH:mm" format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="加班類型" prop="overtimeType">
          <el-select v-model="form.overtimeType" style="width:100%">
            <el-option label="平日加班" value="weekday" />
            <el-option label="假日加班" value="weekend" />
            <el-option label="國定假日" value="holiday" />
          </el-select>
        </el-form-item>
        <el-form-item label="補償方式" prop="compensationType">
          <el-select v-model="form.compensationType" style="width:100%">
            <el-option label="加班費" value="pay" />
            <el-option label="補休" value="leave" />
          </el-select>
        </el-form-item>
        <el-form-item label="加班原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請說明加班原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">確定送出</el-button>
      </template>
    </el-dialog>

    <!-- 審批狀態 -->
    <el-dialog v-model="statusDialogVisible" title="審批狀態" width="440px">
      <approval-status-panel v-if="statusRow" :row="statusRow" type="overtime" />
      <template #footer>
        <el-button @click="statusDialogVisible = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { overtimeApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import ApprovalStatusPanel from './ApprovalStatusPanel.vue'

const ui = useUiStore()
const monthFilter = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const statusRow = ref<any>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({ overtimeDate: '', startTime: '', endTime: '', overtimeType: 'weekday', compensationType: 'pay', reason: '' })
const rules = computed<FormRules>(() => ({
  overtimeDate: [{ required: true, message: '請選擇加班日期', trigger: 'change' }],
  startTime: [{ required: true, message: '請選擇開始時間', trigger: 'change' }],
  endTime: [{ required: true, message: '請選擇結束時間', trigger: 'change' }],
  reason: [{ required: true, message: '請填寫加班原因', trigger: 'blur' }],
}))

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => overtimeApi.getMy(params as any),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '首頁' }, { title: '加班申請' }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ status: statusFilter.value || undefined, month: monthFilter.value || undefined })
}

function openCreate() {
  Object.assign(form, { overtimeDate: '', startTime: '', endTime: '', overtimeType: 'weekday', compensationType: 'pay', reason: '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await overtimeApi.create({ overtimeDate: form.overtimeDate, startTime: form.startTime, endTime: form.endTime, overtimeType: form.overtimeType, compensationType: form.compensationType, reason: form.reason })
    ElMessage.success('加班申請已送出')
    dialogVisible.value = false
    onSearch()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '送出失敗')
  } finally {
    saving.value = false
  }
}

function canDelete(row: any) {
  return row.status === 'submitted' && !row.deletedAt
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`確認刪除加班申請「${row.requestNo}」？`, '確認刪除', { type: 'warning', confirmButtonText: '刪除', confirmButtonClass: 'el-button--danger' })
  try {
    await overtimeApi.softDelete(row.id)
    ElMessage.success('加班申請已刪除')
    onSearch()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '刪除失敗')
  }
}

function showStatus(row: any) { statusRow.value = row; statusDialogVisible.value = true }

function fmtDate(d?: string) { return d ? d.slice(0, 10) : '—' }
function fmtTime(t?: string) { return t ? new Date(t).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '—' }

const STATUS_MAP: Record<string, string> = { submitted: '待審核', approved: '核准', rejected: '駁回' }
const TAG_MAP: Record<string, any> = { submitted: 'warning', approved: 'success', rejected: 'danger' }
function statusLabel(s: string) { return STATUS_MAP[s] ?? s }
function tagType(s: string) { return TAG_MAP[s] ?? 'info' }
function overtimeTypeLabel(t: string) { return { weekday: '平日', weekend: '假日', holiday: '國定假日' }[t] ?? t }
function compensationLabel(t: string) { return { pay: '加班費', leave: '補休' }[t] ?? t }
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
