<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('attendance.overtimeRequest') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('common.create') }}</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select
          v-model="statusFilter"
          :placeholder="$t('common.filter')"
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
        <el-table-column prop="overtimeDate" :label="$t('attendance.overtimeDate')" width="120" />
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
        <el-table-column :label="$t('attendance.compensationType')" width="100">
          <template #default="{ row }">
            {{ compensationTypeLabel(row.compensationType) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="100">
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
    <el-dialog v-model="dialogVisible" :title="$t('attendance.overtimeRequest')" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="$t('attendance.overtimeDate')" prop="overtimeDate">
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
        <el-form-item :label="$t('attendance.overtimeType')" prop="overtimeType">
          <el-select v-model="form.overtimeType" style="width: 100%">
            <el-option label="平日" value="weekday" />
            <el-option label="假日" value="weekend" />
            <el-option label="國定假日" value="holiday" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('attendance.compensationType')" prop="compensationType">
          <el-select v-model="form.compensationType" style="width: 100%">
            <el-option label="加班費" value="pay" />
            <el-option label="補休" value="leave" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('attendance.reason')" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請輸入加班原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { overtimeApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const { t } = useI18n()
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

const rules = computed<FormRules>(() => ({
  overtimeDate: [{ required: true, message: t('common.required'), trigger: 'change' }],
  startTime: [{ required: true, message: t('common.required'), trigger: 'change' }],
  endTime: [{ required: true, message: t('common.required'), trigger: 'change' }],
  overtimeType: [{ required: true, message: t('common.required'), trigger: 'change' }],
  compensationType: [{ required: true, message: t('common.required'), trigger: 'change' }],
  reason: [{ required: true, message: t('common.required'), trigger: 'blur' }],
}))

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => overtimeApi.getAll(params as any),
})

onMounted(() => {
  ui.setBreadcrumbs([{ title: t('nav.hrModule') }, { title: t('attendance.overtimeRequest') }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  try {
    fetch({ status: statusFilter.value || undefined })
  } catch {
    ElMessage.error(t('msg.loadFailed'))
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
    ElMessage.success(t('msg.submitSuccess'))
    dialogVisible.value = false
    onSearch()
  } catch {
    ElMessage.error(t('msg.submitFailed'))
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
