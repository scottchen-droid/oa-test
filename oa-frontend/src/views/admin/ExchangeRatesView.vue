<template>
  <div>
    <div class="page-header">
      <h2>匯率管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增匯率</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="filterFrom" placeholder="來源幣別" clearable style="width:130px" @change="onSearch">
          <el-option v-for="c in currencyList" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterTo" placeholder="目標幣別" clearable style="width:130px" @change="onSearch">
          <el-option v-for="c in currencyList" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterActive" placeholder="狀態" clearable style="width:120px" @change="onSearch">
          <el-option label="有效" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column label="來源幣別" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.fromCurrency }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目標幣別" width="120">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.toCurrency }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="匯率" width="160">
          <template #default="{ row }">
            <span class="rate-value">{{ Number(row.rate).toFixed(6) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" width="120">
          <template #default="{ row }">{{ formatDate(row.effectiveDate) }}</template>
        </el-table-column>
        <el-table-column label="失效日期" width="120">
          <template #default="{ row }">{{ row.expiryDate ? formatDate(row.expiryDate) : '—' }}</template>
        </el-table-column>
        <el-table-column label="狀態" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '有效' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="備注" min-width="150" show-overflow-tooltip />
        <el-table-column label="建立者" width="100">
          <template #default="{ row }">{{ row.creator?.displayName ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">編輯</el-button>
            <el-button v-if="row.isActive" text size="small" type="danger" @click="handleDeactivate(row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '編輯匯率' : '新增匯率'" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="來源幣別" prop="fromCurrency">
          <el-select v-model="form.fromCurrency" :disabled="!!editingId" style="width:100%" filterable allow-create>
            <el-option v-for="c in allCurrencies" :key="c.code" :label="`${c.code} — ${c.name}`" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="目標幣別" prop="toCurrency">
          <el-select v-model="form.toCurrency" :disabled="!!editingId" style="width:100%" filterable allow-create>
            <el-option v-for="c in allCurrencies" :key="c.code" :label="`${c.code} — ${c.name}`" :value="c.code" />
          </el-select>
        </el-form-item>
        <div v-if="form.fromCurrency && form.toCurrency" class="rate-formula">
          1 {{ form.fromCurrency }} =
          <strong>{{ form.rate || '?' }}</strong>
          {{ form.toCurrency }}
        </div>
        <el-form-item label="匯率" prop="rate">
          <el-input-number v-model="form.rate" :min="0.000001" :precision="8" style="width:100%" />
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker v-model="form.effectiveDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="失效日期">
          <el-date-picker v-model="form.expiryDate" type="date" value-format="YYYY-MM-DD" style="width:100%" clearable placeholder="不填表示長期有效" />
        </el-form-item>
        <el-form-item label="備注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="資料來源或備注（選填）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { exchangeRatesApi } from '@/api/finance.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
onMounted(() => {
  ui.setBreadcrumbs([{ title: '系統管理' }, { title: '匯率管理' }])
  fetchCurrencies()
  fetch()
})

const filterFrom = ref('')
const filterTo = ref('')
const filterActive = ref('')
const currencyList = ref<string[]>([])
const submitting = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()

const allCurrencies = [
  { code: 'CNY', name: '人民幣' },
  { code: 'USD', name: '美元' },
  { code: 'TWD', name: '新台幣' },
  { code: 'HKD', name: '港幣' },
  { code: 'SGD', name: '新加坡元' },
  { code: 'JPY', name: '日圓' },
  { code: 'THB', name: '泰銖' },
  { code: 'MYR', name: '馬來西亞令吉' },
  { code: 'KRW', name: '韓元' },
  { code: 'EUR', name: '歐元' },
  { code: 'GBP', name: '英鎊' },
  { code: 'AUD', name: '澳幣' },
  { code: 'CAD', name: '加幣' },
  { code: 'VND', name: '越南盾' },
]

const form = reactive({
  fromCurrency: '',
  toCurrency: 'CNY',
  rate: 1,
  effectiveDate: dayjs().format('YYYY-MM-DD'),
  expiryDate: '',
  notes: '',
})

const rules = {
  fromCurrency: [{ required: true, message: '請選擇來源幣別', trigger: 'change' }],
  toCurrency: [{ required: true, message: '請選擇目標幣別', trigger: 'change' }],
  rate: [{ required: true, type: 'number', min: 0.000001, message: '請輸入有效匯率', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '請選擇生效日期', trigger: 'change' }],
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

async function fetchCurrencies() {
  try {
    const list = await exchangeRatesApi.getCurrencies()
    currencyList.value = list
  } catch { /* ignore */ }
}

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable({
  fetchFn: (params) => exchangeRatesApi.getAll({
    ...params as any,
    fromCurrency: filterFrom.value || undefined,
    toCurrency: filterTo.value || undefined,
    isActive: filterActive.value !== '' ? filterActive.value === 'true' : undefined,
  }),
})

function onSearch() {
  pagination.page = 1
  fetch()
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { fromCurrency: '', toCurrency: 'CNY', rate: 1, effectiveDate: dayjs().format('YYYY-MM-DD'), expiryDate: '', notes: '' })
  dialogVisible.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  Object.assign(form, {
    fromCurrency: row.fromCurrency,
    toCurrency: row.toCurrency,
    rate: Number(row.rate),
    effectiveDate: formatDate(row.effectiveDate),
    expiryDate: row.expiryDate ? formatDate(row.expiryDate) : '',
    notes: row.notes ?? '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const dto = {
        fromCurrency: form.fromCurrency,
        toCurrency: form.toCurrency,
        rate: form.rate,
        effectiveDate: form.effectiveDate,
        expiryDate: form.expiryDate || undefined,
        notes: form.notes || undefined,
      }
      if (editingId.value) {
        await exchangeRatesApi.update(editingId.value, dto)
        ElMessage.success('匯率已更新')
      } else {
        await exchangeRatesApi.create(dto)
        ElMessage.success('匯率已新增')
      }
      dialogVisible.value = false
      fetch()
      fetchCurrencies()
    } catch (err: any) {
      ElMessage.error(err?.response?.data?.message ?? '操作失敗')
    } finally {
      submitting.value = false
    }
  })
}

async function handleDeactivate(row: any) {
  await ElMessageBox.confirm(`確認停用 ${row.fromCurrency} → ${row.toCurrency} 的匯率記錄嗎？`, '確認停用', { type: 'warning' })
  try {
    await exchangeRatesApi.deactivate(row.id)
    ElMessage.success('已停用')
    fetch()
  } catch {
    ElMessage.error('操作失敗')
  }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.rate-value { font-weight: 600; color: #409eff; font-family: monospace; }
.rate-formula { text-align: center; padding: 8px; background: #f5f7fa; border-radius: 4px; margin-bottom: 16px; font-size: 14px; color: #606266; }
.rate-formula strong { color: #e6a23c; font-size: 16px; }
</style>
