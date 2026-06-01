<template>
  <div>
    <div class="page-header">
      <h2>我的請假</h2>
      <el-button type="primary" @click="openCreate">申請請假</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-date-picker
          v-model="yearFilter"
          type="year"
          placeholder="選擇年份"
          value-format="YYYY"
          style="width: 140px"
          @change="onSearch"
        />
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
        <el-table-column label="假別" width="120">
          <template #default="{ row }">{{ row.leaveType?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="起訖" width="200">
          <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
        </el-table-column>
        <el-table-column prop="totalDays" label="天數" width="80" />
        <el-table-column prop="reason" label="事由" show-overflow-tooltip />
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="leaveTagType(row.status)" size="small">
              {{ leaveLabel(row.status) }}
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

    <!-- 申請請假 Dialog -->
    <el-dialog v-model="dialogVisible" title="申請請假" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="假別" prop="leaveTypeId">
          <el-select v-model="form.leaveTypeId" placeholder="請選擇假別" style="width: 100%">
            <el-option v-for="t in leaveTypes" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="結束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="半天選項">
          <el-select v-model="form.halfDayOption" placeholder="不指定" clearable style="width: 100%">
            <el-option label="上半天" value="morning" />
            <el-option label="下半天" value="afternoon" />
          </el-select>
        </el-form-item>
        <el-form-item label="天數" prop="totalDays">
          <el-input-number v-model="form.totalDays" :min="0.5" :step="0.5" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="事由" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請輸入請假事由" />
        </el-form-item>
        <el-form-item label="代理人">
          <el-input v-model="form.proxyName" placeholder="代理人姓名（選填）" />
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
import { leavesApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const statusFilter = ref('')
const yearFilter = ref('')
const leaveTypes = ref<any[]>([])
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  halfDayOption: '',
  totalDays: 1,
  reason: '',
  proxyName: '',
})

const rules: FormRules = {
  leaveTypeId: [{ required: true, message: '請選擇假別', trigger: 'change' }],
  startDate: [{ required: true, message: '請選擇起始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '請選擇結束日期', trigger: 'change' }],
  totalDays: [{ required: true, message: '請輸入天數', trigger: 'blur' }],
  reason: [{ required: true, message: '請輸入請假事由', trigger: 'blur' }],
}

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => leavesApi.getAll(params as any),
})

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '人事模塊' }, { title: '我的請假' }])
  try {
    leaveTypes.value = await leavesApi.getTypes()
  } catch {
    leaveTypes.value = []
  }
  fetch()
})

function onSearch() {
  pagination.page = 1
  try {
    fetch({
      status: statusFilter.value || undefined,
      startDate: yearFilter.value ? `${yearFilter.value}-01-01` : undefined,
      endDate: yearFilter.value ? `${yearFilter.value}-12-31` : undefined,
    })
  } catch {
    ElMessage.error('載入請假記錄失敗')
  }
}

function openCreate() {
  Object.assign(form, { leaveTypeId: '', startDate: '', endDate: '', halfDayOption: '', totalDays: 1, reason: '', proxyName: '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await leavesApi.create({
      leaveTypeId: form.leaveTypeId,
      startDate: form.startDate,
      endDate: form.endDate,
      halfDayOption: form.halfDayOption || undefined,
      totalDays: form.totalDays,
      reason: form.reason,
      proxyName: form.proxyName || undefined,
    })
    ElMessage.success('請假申請已送出')
    dialogVisible.value = false
    onSearch()
  } catch {
    ElMessage.error('送出失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}

function leaveLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '審核中',
    approved: '核准',
    rejected: '駁回',
    canceled: '取消',
  }
  return map[status] ?? status
}

function leaveTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
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
