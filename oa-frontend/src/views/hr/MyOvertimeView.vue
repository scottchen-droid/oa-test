<template>
  <div>
    <div class="page-header">
      <h2>加班申請</h2>
      <el-button type="primary" @click="openCreate">申請加班</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select
          v-model="statusFilter"
          placeholder="狀態篩選"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option label="草稿" value="draft" />
          <el-option label="審核中" value="submitted" />
          <el-option label="核准" value="approved" />
          <el-option label="駁回" value="rejected" />
          <el-option label="取消" value="canceled" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="requestNo" label="單號" width="160" />
        <el-table-column prop="overtimeDate" label="加班日期" width="120" />
        <el-table-column label="開始時間" prop="startTime" width="110">
          <template #default="{ row }">{{ row.startTime ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="結束時間" prop="endTime" width="110">
          <template #default="{ row }">{{ row.endTime ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="totalHours" label="小時數" width="90" />
        <el-table-column label="類型" width="110">
          <template #default="{ row }">
            {{ overtimeTypeLabel(row.overtimeType) }}
          </template>
        </el-table-column>
        <el-table-column label="補償方式" width="100">
          <template #default="{ row }">
            {{ compensationTypeLabel(row.compensationType) }}
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="overtimeTagType(row.status)" size="small">
              {{ overtimeStatusLabel(row.status) }}
            </el-tag>
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
          <el-date-picker
            v-model="form.overtimeDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="開始時間" prop="startTime">
          <el-time-picker
            v-model="form.startTime"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="選擇開始時間"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="結束時間" prop="endTime">
          <el-time-picker
            v-model="form.endTime"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="選擇結束時間"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="加班類型" prop="overtimeType">
          <el-select v-model="form.overtimeType" style="width: 100%">
            <el-option label="平日" value="weekday" />
            <el-option label="假日" value="weekend" />
            <el-option label="國定假日" value="holiday" />
          </el-select>
        </el-form-item>
        <el-form-item label="補償方式" prop="compensationType">
          <el-select v-model="form.compensationType" style="width: 100%">
            <el-option label="加班費" value="pay" />
            <el-option label="補休" value="leave" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請輸入加班原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">確定送出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { overtimeApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const statusFilter = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  overtimeDate: '',
  startTime: '',
  endTime: '',
  overtimeType: 'weekday',
  compensationType: 'pay',
  reason: '',
})

const rules: FormRules = {
  overtimeDate: [{ required: true, message: '請選擇加班日期', trigger: 'change' }],
  startTime: [{ required: true, message: '請選擇開始時間', trigger: 'change' }],
  endTime: [{ required: true, message: '請選擇結束時間', trigger: 'change' }],
  overtimeType: [{ required: true, message: '請選擇加班類型', trigger: 'change' }],
  compensationType: [{ required: true, message: '請選擇補償方式', trigger: 'change' }],
  reason: [{ required: true, message: '請輸入加班原因', trigger: 'blur' }],
}

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => overtimeApi.getAll(params as any),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: '人事模塊' }, { title: '加班申請' }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  try {
    fetch({ status: statusFilter.value || undefined })
  } catch {
    ElMessage.error('載入加班記錄失敗')
  }
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
    await overtimeApi.create({
      overtimeDate: form.overtimeDate,
      startTime: form.startTime,
      endTime: form.endTime,
      overtimeType: form.overtimeType,
      compensationType: form.compensationType,
      reason: form.reason,
    })
    ElMessage.success('加班申請已送出')
    dialogVisible.value = false
    onSearch()
  } catch {
    ElMessage.error('送出失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}

function overtimeTypeLabel(type: string): string {
  const map: Record<string, string> = { weekday: '平日', weekend: '假日', holiday: '國定假日' }
  return map[type] ?? type
}

function compensationTypeLabel(type: string): string {
  const map: Record<string, string> = { pay: '加班費', leave: '補休' }
  return map[type] ?? type
}

function overtimeStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '審核中',
    approved: '核准',
    rejected: '駁回',
    canceled: '取消',
  }
  return map[status] ?? status
}

function overtimeTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    canceled: 'info',
  }
  return map[status] ?? 'info'
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
