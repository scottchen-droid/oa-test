<template>
  <div>
    <div class="page-header">
      <h2>補卡申請</h2>
      <el-button type="primary" @click="openCreate">新增補卡申請</el-button>
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
          <el-option label="待審核" value="pending" />
          <el-option label="已核准" value="approved" />
          <el-option label="已駁回" value="rejected" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="patchRequestNo" label="補卡單號" width="160" />
        <el-table-column label="補卡類型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.clockType === 'clock_in' ? 'success' : 'warning'" size="small">
              {{ row.clockType === 'clock_in' ? '上班補卡' : '下班補卡' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="補卡日期" width="110">
          <template #default="{ row }">{{ fmtDate(row.clockTime) }}</template>
        </el-table-column>
        <el-table-column label="補卡時間" width="100">
          <template #default="{ row }">{{ fmtTime(row.clockTime) }}</template>
        </el-table-column>
        <el-table-column prop="manualReason" label="補卡原因" show-overflow-tooltip />
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="patchTagType(row.patchStatus)" size="small">{{ patchStatusLabel(row.patchStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="showStatus(row)">審批狀態</el-button>
            <el-button v-if="row.patchStatus === 'pending'" text size="small" type="danger" @click="handleDelete(row)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        :page-sizes="[20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 新增補卡 Dialog -->
    <el-dialog v-model="dialogVisible" title="補卡申請" width="480px" :close-on-click-modal="false">
      <el-alert type="info" :closable="false" style="margin-bottom:16px">
        補卡申請送出後需主管審核，核准後才會更新您的出勤記錄。
      </el-alert>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="補卡類型" prop="clockType">
          <el-radio-group v-model="form.clockType">
            <el-radio value="clock_in">上班補卡</el-radio>
            <el-radio value="clock_out">下班補卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="補卡日期" prop="patchDate">
          <el-date-picker v-model="form.patchDate" type="date" value-format="YYYY-MM-DD" style="width:100%" placeholder="選擇補卡日期" />
        </el-form-item>
        <el-form-item label="補卡時間" prop="patchTime">
          <el-time-picker v-model="form.patchTime" value-format="HH:mm" format="HH:mm" placeholder="選擇補卡時間" style="width:100%" />
        </el-form-item>
        <el-form-item label="補卡原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請說明忘記打卡的原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">送出申請</el-button>
      </template>
    </el-dialog>

    <!-- 審批狀態 -->
    <el-dialog v-model="statusDialogVisible" title="審批狀態" width="440px">
      <approval-status-panel v-if="statusRow" :row="statusRow" type="clock_patch" />
      <template #footer>
        <el-button @click="statusDialogVisible = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { attendanceApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import ApprovalStatusPanel from '@/views/hr/ApprovalStatusPanel.vue'

const ui = useUiStore()
const monthFilter = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const statusRow = ref<any>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({ clockType: 'clock_in', patchDate: '', patchTime: '', reason: '' })
const rules = computed<FormRules>(() => ({
  clockType: [{ required: true, message: '請選擇補卡類型', trigger: 'change' }],
  patchDate: [{ required: true, message: '請選擇補卡日期', trigger: 'change' }],
  patchTime: [{ required: true, message: '請選擇補卡時間', trigger: 'change' }],
  reason: [{ required: true, message: '請填寫補卡原因', trigger: 'blur' }],
}))

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => attendanceApi.getMyClockPatches(params as any),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '首頁' }, { title: '考勤管理' }, { title: '補卡申請' }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ status: statusFilter.value || undefined, month: monthFilter.value || undefined })
}

function openCreate() {
  Object.assign(form, { clockType: 'clock_in', patchDate: '', patchTime: '', reason: '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await attendanceApi.createClockPatch({
      clockType: form.clockType,
      patchDate: form.patchDate,
      patchTime: form.patchTime,
      reason: form.reason,
    })
    ElMessage.success('補卡申請已送出，等待審核')
    dialogVisible.value = false
    onSearch()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '送出失敗')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`確認刪除補卡申請「${row.patchRequestNo}」？`, '確認刪除', { type: 'warning', confirmButtonText: '刪除', confirmButtonClass: 'el-button--danger' })
  try {
    await attendanceApi.deleteClockPatch(row.id)
    ElMessage.success('補卡申請已刪除')
    onSearch()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '刪除失敗')
  }
}

function showStatus(row: any) { statusRow.value = row; statusDialogVisible.value = true }

function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('zh-TW') : '—' }
function fmtTime(d?: string) { return d ? new Date(d).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '—' }

const PATCH_STATUS: Record<string, string> = { pending: '待審核', approved: '已核准', rejected: '已駁回', deleted: '已刪除' }
const PATCH_TAG: Record<string, any> = { pending: 'warning', approved: 'success', rejected: 'danger', deleted: 'info' }
function patchStatusLabel(s: string) { return PATCH_STATUS[s] ?? s }
function patchTagType(s: string) { return PATCH_TAG[s] ?? 'info' }
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
