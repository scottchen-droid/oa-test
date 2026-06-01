<template>
  <div>
    <div class="page-header">
      <h2>薪資管理</h2>
      <el-button v-if="activeTab === 'periods'" type="primary" @click="openCreatePeriod">
        建立新期間
      </el-button>
    </div>

    <el-card>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">

        <!-- Tab 1: 薪資期間 -->
        <el-tab-pane label="薪資期間" name="periods">
          <div class="toolbar">
            <el-input-number
              v-model="yearFilter"
              :min="2000"
              :max="2099"
              placeholder="年份"
              style="width: 120px"
              @change="onSearchPeriods"
            />
            <el-select
              v-model="periodStatusFilter"
              placeholder="狀態篩選"
              clearable
              style="width: 140px"
              @change="onSearchPeriods"
            >
              <el-option label="草稿" value="draft" />
              <el-option label="計算中" value="calculating" />
              <el-option label="已鎖定" value="locked" />
              <el-option label="已發薪" value="paid" />
            </el-select>
          </div>

          <el-table v-loading="periodsLoading" :data="periodsData" border stripe>
            <el-table-column prop="year" label="年份" width="80" />
            <el-table-column prop="month" label="月份" width="80" />
            <el-table-column label="計算期間" width="200">
              <template #default="{ row }">{{ row.periodStart }} ~ {{ row.periodEnd }}</template>
            </el-table-column>
            <el-table-column prop="payDate" label="發薪日" width="120" />
            <el-table-column label="狀態" width="110">
              <template #default="{ row }">
                <el-tag :type="periodTagType(row.status)" size="small">
                  {{ periodLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="['draft', 'calculating'].includes(row.status)"
                  size="small"
                  type="primary"
                  :loading="calculatingId === row.id"
                  @click="handleCalculate(row)"
                >
                  計算薪資
                </el-button>
                <el-button
                  v-if="!['locked', 'paid'].includes(row.status)"
                  size="small"
                  type="warning"
                  :loading="lockingId === row.id"
                  @click="handleLock(row)"
                >
                  鎖定
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-if="periodsTotal > 0"
            v-model:current-page="periodsPagination.page"
            v-model:page-size="periodsPagination.limit"
            :total="periodsTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="handlePeriodsPageChange"
            @size-change="handlePeriodsSizeChange"
          />
        </el-tab-pane>

        <!-- Tab 2: 薪資明細 -->
        <el-tab-pane label="薪資明細" name="records">
          <div class="toolbar">
            <el-select
              v-model="selectedPeriodId"
              placeholder="選擇期間"
              clearable
              style="width: 200px"
              @change="onSearchRecords"
            >
              <el-option
                v-for="p in allPeriods"
                :key="p.id"
                :label="`${p.year}年${p.month}月`"
                :value="p.id"
              />
            </el-select>
            <el-input
              v-model="recordEmployeeSearch"
              placeholder="搜尋員工姓名"
              clearable
              style="width: 200px"
              @change="onSearchRecords"
            />
          </div>

          <el-table v-loading="recordsLoading" :data="recordsData" border stripe>
            <el-table-column prop="employeeName" label="員工姓名" width="120" />
            <el-table-column label="期間" width="120">
              <template #default="{ row }">
                {{ row.period ? `${row.period.year}年${row.period.month}月` : '—' }}
              </template>
            </el-table-column>
            <el-table-column label="基本薪資" width="130">
              <template #default="{ row }">{{ formatAmount(row.baseSalary) }}</template>
            </el-table-column>
            <el-table-column label="加班費" width="110">
              <template #default="{ row }">{{ formatAmount(row.overtimePay) }}</template>
            </el-table-column>
            <el-table-column label="應發合計" width="120">
              <template #default="{ row }">{{ formatAmount(row.grossSalary) }}</template>
            </el-table-column>
            <el-table-column label="扣款合計" width="120">
              <template #default="{ row }">{{ formatAmount(row.totalDeductions) }}</template>
            </el-table-column>
            <el-table-column label="實發薪資" width="120">
              <template #default="{ row }">{{ formatAmount(row.netSalary) }}</template>
            </el-table-column>
            <el-table-column prop="currencyCode" label="幣別" width="80" />
          </el-table>

          <el-pagination
            v-if="recordsTotal > 0"
            v-model:current-page="recordsPagination.page"
            v-model:page-size="recordsPagination.limit"
            :total="recordsTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="handleRecordsPageChange"
            @size-change="handleRecordsSizeChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 建立新期間 Dialog -->
    <el-dialog v-model="createDialogVisible" title="建立新薪資期間" width="480px">
      <el-form ref="createFormRef" :model="createForm" label-width="100px">
        <el-form-item label="年份" prop="year" :rules="[{ required: true, message: '請輸入年份' }]">
          <el-input-number v-model="createForm.year" :min="2000" :max="2099" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月份" prop="month" :rules="[{ required: true, message: '請輸入月份' }]">
          <el-input-number v-model="createForm.month" :min="1" :max="12" style="width: 100%" />
        </el-form-item>
        <el-form-item label="計算開始" prop="periodStart">
          <el-date-picker v-model="createForm.periodStart" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="計算結束" prop="periodEnd">
          <el-date-picker v-model="createForm.periodEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="發薪日" prop="payDate">
          <el-date-picker v-model="createForm.payDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSaving" @click="handleCreatePeriod">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { payrollApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const activeTab = ref('periods')

// Periods tab state
const yearFilter = ref<number | undefined>(undefined)
const periodStatusFilter = ref('')

const {
  loading: periodsLoading,
  data: periodsData,
  total: periodsTotal,
  pagination: periodsPagination,
  fetch: fetchPeriods,
  handlePageChange: handlePeriodsPageChange,
  handleSizeChange: handlePeriodsSizeChange,
} = useTable<any>({
  fetchFn: (params) => payrollApi.getPeriods(params as any),
})

// Records tab state
const selectedPeriodId = ref('')
const recordEmployeeSearch = ref('')
const allPeriods = ref<any[]>([])

const {
  loading: recordsLoading,
  data: recordsData,
  total: recordsTotal,
  pagination: recordsPagination,
  fetch: fetchRecords,
  handlePageChange: handleRecordsPageChange,
  handleSizeChange: handleRecordsSizeChange,
} = useTable<any>({
  fetchFn: (params) => payrollApi.getRecords(params as any),
})

const calculatingId = ref<string | null>(null)
const lockingId = ref<string | null>(null)

async function handleCalculate(row: any) {
  calculatingId.value = row.id
  try {
    const result = await payrollApi.calculateRecords(row.id)
    ElMessage.success(result?.message ?? '計算完成')
    fetchPeriods()
  } catch {
    ElMessage.error('計算失敗')
  } finally {
    calculatingId.value = null
  }
}

async function handleLock(row: any) {
  lockingId.value = row.id
  try {
    await payrollApi.lockPeriod(row.id)
    ElMessage.success('薪資期間已鎖定')
    fetchPeriods()
  } catch {
    ElMessage.error('鎖定失敗')
  } finally {
    lockingId.value = null
  }
}

// Create period dialog
const createDialogVisible = ref(false)
const createSaving = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, periodStart: '', periodEnd: '', payDate: '' })

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '人事模塊' }, { title: '薪資管理' }])
  fetchPeriods()
  try {
    const result = await payrollApi.getPeriods({ limit: 100 })
    allPeriods.value = result?.items ?? []
  } catch {
    allPeriods.value = []
  }
})

function onTabChange() {
  if (activeTab.value === 'records') {
    onSearchRecords()
  }
}

function onSearchPeriods() {
  periodsPagination.page = 1
  try {
    fetchPeriods({
      year: yearFilter.value || undefined,
      status: periodStatusFilter.value || undefined,
    })
  } catch {
    ElMessage.error('載入薪資期間失敗')
  }
}

function onSearchRecords() {
  recordsPagination.page = 1
  try {
    fetchRecords({
      periodId: selectedPeriodId.value || undefined,
      userId: recordEmployeeSearch.value || undefined,
    })
  } catch {
    ElMessage.error('載入薪資明細失敗')
  }
}

function openCreatePeriod() {
  Object.assign(createForm, { year: new Date().getFullYear(), month: new Date().getMonth() + 1, periodStart: '', periodEnd: '', payDate: '' })
  createDialogVisible.value = true
}

async function handleCreatePeriod() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  createSaving.value = true
  try {
    await payrollApi.createPeriod({ ...createForm })
    ElMessage.success('薪資期間建立成功')
    createDialogVisible.value = false
    fetchPeriods()
  } catch {
    ElMessage.error('建立失敗，請稍後再試')
  } finally {
    createSaving.value = false
  }
}

function formatAmount(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

function periodLabel(status: string): string {
  const map: Record<string, string> = { draft: '草稿', calculating: '計算中', locked: '已鎖定', paid: '已發薪' }
  return map[status] ?? status
}

function periodTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'info',
    calculating: 'warning',
    locked: 'warning',
    paid: 'success',
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
