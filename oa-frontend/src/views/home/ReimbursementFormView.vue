<template>
  <div class="reimb-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
      <h2>費用報銷申請</h2>
      <div class="header-actions">
        <el-button @click="saveDraft" :loading="saving">暫存草稿</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">送出審核</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="reimb-form">

      <!-- ── Section 1: 基本資訊 ── -->
      <el-card class="section-card">
        <template #header><span class="section-title">基本資訊</span></template>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="報銷標題" prop="title">
              <el-input v-model="form.title" placeholder="請輸入報銷標題" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="報銷幣別" prop="currencyCode">
              <el-select v-model="form.currencyCode" style="width:100%" placeholder="選擇基礎幣別">
                <el-option v-for="c in commonCurrencies" :key="c.code" :label="`${c.code} - ${c.name}`" :value="c.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="備注說明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可說明報銷目的或補充說明（選填）" />
        </el-form-item>
      </el-card>

      <!-- ── Section 2: 關聯申請單 ── -->
      <el-card class="section-card">
        <template #header>
          <span class="section-title">關聯申請單</span>
          <span class="section-hint">選擇此費用所對應的原始申請單（可不選）</span>
        </template>

        <el-form-item label="來源類型">
          <el-radio-group v-model="sourceType" @change="onSourceTypeChange">
            <el-radio value="">無關聯申請單</el-radio>
            <el-radio value="purchase_request">採購申請單</el-radio>
            <el-radio value="business_trip">出差申請單</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 採購申請 -->
        <template v-if="sourceType === 'purchase_request'">
          <el-form-item label="採購申請單號" prop="purchaseRequestId">
            <el-select
              v-model="form.purchaseRequestId"
              filterable
              remote
              :remote-method="searchPurchaseRequests"
              :loading="prLoading"
              placeholder="輸入申請單號或標題搜尋"
              style="width:100%"
              @change="onPurchaseRequestChange"
              clearable
            >
              <el-option
                v-for="pr in purchaseRequestOptions"
                :key="pr.id"
                :label="`${pr.requestNo} — ${pr.title}`"
                :value="pr.id"
              />
            </el-select>
          </el-form-item>

          <template v-if="selectedPR">
            <el-form-item label="申請金額">
              <span class="amount-display">{{ selectedPR.totalAmount }} {{ selectedPR.currencyCode }}</span>
            </el-form-item>

            <el-form-item label="費用分攤項目" prop="purchaseAllocationId">
              <el-select v-model="form.purchaseAllocationId" style="width:100%" placeholder="選擇要報銷的分攤項目" @change="onAllocationChange" clearable>
                <el-option
                  v-for="alloc in selectedPR.allocations"
                  :key="alloc.id"
                  :value="alloc.id"
                >
                  <div class="alloc-option">
                    <span>{{ alloc.company?.name }}{{ alloc.project ? ` / ${alloc.project.name}` : '' }}</span>
                    <span class="alloc-amounts">
                      分攤：{{ alloc.amount }} {{ alloc.currencyCode }}
                      <el-tag size="small" :type="getAllocStatusType(alloc)">
                        已報銷 {{ alloc.reimbursedAmount }}/{{ alloc.amount }}
                      </el-tag>
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <div v-if="selectedAllocation" class="alloc-info-bar">
              <el-alert type="info" :closable="false">
                <template #title>
                  分攤金額：<strong>{{ selectedAllocation.amount }} {{ selectedAllocation.currencyCode }}</strong>
                  ｜ 已報銷：<strong>{{ selectedAllocation.reimbursedAmount }}</strong>
                  ｜ 可報銷剩餘：<strong class="remaining">{{ remainingAmount }}</strong>
                </template>
              </el-alert>
            </div>
          </template>
        </template>

        <!-- 出差申請 -->
        <template v-if="sourceType === 'business_trip'">
          <el-form-item label="出差申請單號" prop="businessTripFormId">
            <el-select
              v-model="form.businessTripFormId"
              filterable
              remote
              :remote-method="searchBusinessTrips"
              :loading="btLoading"
              placeholder="輸入目的地或申請說明搜尋"
              style="width:100%"
              @change="onBusinessTripChange"
              clearable
            >
              <el-option
                v-for="bt in businessTripOptions"
                :key="bt.id"
                :label="formatBTLabel(bt)"
                :value="bt.id"
              />
            </el-select>
          </el-form-item>

          <template v-if="selectedBT">
            <el-form-item label="出差目的地">
              <span>{{ (selectedBT.content as any)?.destination }}</span>
            </el-form-item>
            <el-form-item label="出差預算">
              <span class="amount-display">{{ (selectedBT.content as any)?.estimatedBudget }} {{ form.currencyCode }}</span>
            </el-form-item>
          </template>
        </template>
      </el-card>

      <!-- ── Section 3: 費用明細 ── -->
      <el-card class="section-card">
        <template #header>
          <div class="section-header-row">
            <span class="section-title">費用明細</span>
            <el-button type="primary" plain size="small" :icon="Plus" @click="addItem">新增費用項目</el-button>
          </div>
        </template>

        <div v-if="form.items.length === 0" class="empty-items">
          <el-empty description="尚未新增費用明細，請點擊「新增費用項目」" :image-size="80" />
        </div>

        <div v-for="(item, idx) in form.items" :key="idx" class="item-card">
          <div class="item-header">
            <span class="item-no">費用 {{ idx + 1 }}</span>
            <el-button type="danger" text :icon="Delete" size="small" @click="removeItem(idx)">刪除</el-button>
          </div>

          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item :label="`費用類型`" :prop="`items.${idx}.expenseType`">
                <el-select v-model="item.expenseType" style="width:100%" placeholder="選擇費用類型">
                  <el-option label="餐費" value="meal" />
                  <el-option label="交通費" value="transport" />
                  <el-option label="住宿費" value="accommodation" />
                  <el-option label="採購費用" value="purchase" />
                  <el-option label="簽証/簽注費" value="visa" />
                  <el-option label="通訊費" value="communication" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label="`消費日期`" :prop="`items.${idx}.expenseDate`">
                <el-date-picker v-model="item.expenseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" @change="onExpenseDateChange(idx)" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label="`供應商/商家`">
                <el-input v-model="item.vendorName" placeholder="商家名稱（選填）" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label="`發票號碼`">
                <el-input v-model="item.invoiceNo" placeholder="發票/收據號碼（選填）" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item :label="`收據幣別`" :prop="`items.${idx}.originalCurrencyCode`" :rules="[{ required: true, message: '請選擇幣別' }]">
                <el-select v-model="item.originalCurrencyCode" style="width:100%" placeholder="收據幣別" @change="onCurrencyChange(idx)">
                  <el-option v-for="c in commonCurrencies" :key="c.code" :label="c.code" :value="c.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label="`收據金額`" :prop="`items.${idx}.originalAmount`" :rules="[{ required: true, type: 'number', min: 0.01, message: '請輸入大於0的金額' }]">
                <el-input-number v-model="item.originalAmount" :min="0" :precision="2" style="width:100%" @change="recalcItem(idx)" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label="`匯率`">
                <div class="rate-input-group">
                  <el-input-number
                    v-model="item.exchangeRateSnapshot"
                    :min="0"
                    :precision="6"
                    :disabled="item.originalCurrencyCode === form.currencyCode"
                    style="width:100%"
                    @change="recalcItem(idx)"
                  />
                  <el-button
                    v-if="item.originalCurrencyCode !== form.currencyCode"
                    text
                    type="primary"
                    size="small"
                    :loading="item._rateLoading"
                    @click="lookupRate(idx)"
                  >查詢</el-button>
                </div>
                <div v-if="item.originalCurrencyCode !== form.currencyCode && item.exchangeRateSnapshot" class="rate-hint">
                  1 {{ item.originalCurrencyCode }} = {{ item.exchangeRateSnapshot }} {{ form.currencyCode }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label="`換算金額（${form.currencyCode}）`">
                <el-input-number :model-value="item.amount" :min="0" :precision="2" style="width:100%" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item :label="`費用說明`">
                <el-input v-model="item.description" placeholder="費用說明（選填）" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 合計 -->
        <div v-if="form.items.length > 0" class="total-row">
          <span>報銷總金額：</span>
          <span class="total-amount">{{ totalAmount.toFixed(2) }} {{ form.currencyCode }}</span>
          <el-tag v-if="selectedAllocation" :type="totalExceedsLimit ? 'danger' : 'success'" size="small">
            {{ totalExceedsLimit ? '⚠ 超過分攤上限' : '✓ 未超過分攤上限' }}
          </el-tag>
        </div>
      </el-card>

      <!-- ── Section 4: 收款資訊 ── -->
      <el-card class="section-card">
        <template #header><span class="section-title">收款資訊</span></template>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="收款銀行">
              <el-input v-model="form.bankName" placeholder="銀行名稱（選填）" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收款帳號">
              <el-input v-model="form.bankAccountNo" placeholder="銀行帳號（選填）" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="開戶名稱">
              <el-input v-model="form.bankAccountName" placeholder="開戶名稱（選填）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- ── Section 5: 單據附件 ── -->
      <el-card class="section-card">
        <template #header>
          <span class="section-title">單據附件</span>
          <span class="section-hint">支援 JPG、PNG、PDF，單檔最大 10MB，可多選</span>
        </template>

        <el-upload
          v-model:file-list="attachmentFiles"
          action="#"
          :auto-upload="false"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          :on-change="onAttachmentChange"
          :on-remove="onAttachmentRemove"
          list-type="text"
        >
          <el-button :icon="Upload">選擇附件檔案</el-button>
          <template #tip>
            <div class="upload-tip">請上傳發票、收據或相關憑證。每張報銷費用建議至少附一張單據。</div>
          </template>
        </el-upload>
      </el-card>

    </el-form>

    <!-- 底部提交 -->
    <div class="bottom-actions">
      <el-button @click="$router.back()">取消</el-button>
      <el-button @click="saveDraft" :loading="saving">暫存草稿</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitting" :disabled="totalExceedsLimit">送出審核</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, UploadUserFile } from 'element-plus'
import { ArrowLeft, Plus, Delete, Upload } from '@element-plus/icons-vue'
import { reimbursementsApi, exchangeRatesApi, purchaseRequestsApi } from '@/api/finance.api'
import { formsApi } from '@/api/forms.api'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
ui.setBreadcrumbs([{ title: '首頁' }, { title: '電子表單' }, { title: '費用報銷申請' }])


const formRef = ref<FormInstance>()
const saving = ref(false)
const submitting = ref(false)
const prLoading = ref(false)
const btLoading = ref(false)
const sourceType = ref<'' | 'purchase_request' | 'business_trip'>('')
const purchaseRequestOptions = ref<any[]>([])
const businessTripOptions = ref<any[]>([])
const selectedPR = ref<any>(null)
const selectedBT = ref<any>(null)
const selectedAllocation = ref<any>(null)
const attachmentFiles = ref<UploadUserFile[]>([])

const commonCurrencies = [
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
]

interface ItemForm {
  expenseDate: string
  expenseType: string
  originalCurrencyCode: string
  originalAmount: number
  exchangeRateId: string | null
  exchangeRateSnapshot: number | null
  amount: number
  currencyCode: string
  vendorName: string
  invoiceNo: string
  description: string
  sortOrder: number
  _rateLoading: boolean
}

const form = reactive({
  title: '',
  description: '',
  currencyCode: 'CNY',
  purchaseRequestId: '',
  purchaseAllocationId: '',
  businessTripFormId: '',
  reimbursementCompanyId: '',
  reimbursementRegionId: '',
  bankName: '',
  bankAccountNo: '',
  bankAccountName: '',
  items: [] as ItemForm[],
})

onMounted(() => {
  // Auto-fill company/region from user's primary org
  const org = auth.user?.orgAssignments?.find(a => a.isPrimary) ?? auth.user?.orgAssignments?.[0]
  if (org?.companyId) form.reimbursementCompanyId = org.companyId
  if (org?.company?.regionId) form.reimbursementRegionId = org.company.regionId
})

const rules = {
  title: [{ required: true, message: '請輸入報銷標題', trigger: 'blur' }],
  currencyCode: [{ required: true, message: '請選擇報銷幣別', trigger: 'change' }],
}

const totalAmount = computed(() =>
  form.items.reduce((sum, item) => sum + (item.amount ?? 0), 0),
)

const remainingAmount = computed(() => {
  if (!selectedAllocation.value) return null
  return (
    Number(selectedAllocation.value.amount) -
    Number(selectedAllocation.value.reimbursedAmount)
  ).toFixed(2)
})

const totalExceedsLimit = computed(() => {
  if (!selectedAllocation.value || !remainingAmount.value) return false
  return totalAmount.value > Number(remainingAmount.value)
})

function addItem() {
  form.items.push({
    expenseDate: '',
    expenseType: '',
    originalCurrencyCode: form.currencyCode,
    originalAmount: 0,
    exchangeRateId: null,
    exchangeRateSnapshot: 1,
    amount: 0,
    currencyCode: form.currencyCode,
    vendorName: '',
    invoiceNo: '',
    description: '',
    sortOrder: form.items.length,
    _rateLoading: false,
  })
}

function removeItem(idx: number) {
  form.items.splice(idx, 1)
}

function recalcItem(idx: number) {
  const item = form.items[idx]
  if (!item) return
  if (item.originalCurrencyCode === form.currencyCode) {
    item.exchangeRateSnapshot = 1
    item.amount = Number(item.originalAmount) || 0
  } else {
    const rate = item.exchangeRateSnapshot ?? 1
    item.amount = parseFloat(((Number(item.originalAmount) || 0) * rate).toFixed(2))
  }
  item.currencyCode = form.currencyCode
}

async function lookupRate(idx: number) {
  const item = form.items[idx]
  if (!item || item.originalCurrencyCode === form.currencyCode) return

  item._rateLoading = true
  try {
    const result = await exchangeRatesApi.getCurrent(
      item.originalCurrencyCode,
      form.currencyCode,
      item.expenseDate || undefined,
    )
    if (result && result.rate) {
      item.exchangeRateId = result.exchangeRateId
      item.exchangeRateSnapshot = Number(result.rate)
      recalcItem(idx)
      ElMessage.success(`匯率已更新：1 ${item.originalCurrencyCode} = ${result.rate} ${form.currencyCode}`)
    } else {
      ElMessage.warning(`未找到 ${item.originalCurrencyCode} → ${form.currencyCode} 的有效匯率，請手動輸入`)
    }
  } catch {
    ElMessage.error('查詢匯率失敗')
  } finally {
    item._rateLoading = false
  }
}

function onCurrencyChange(idx: number) {
  const item = form.items[idx]
  if (!item) return
  if (item.originalCurrencyCode === form.currencyCode) {
    item.exchangeRateSnapshot = 1
  } else {
    item.exchangeRateSnapshot = null
  }
  recalcItem(idx)
}

function onExpenseDateChange(idx: number) {
  // Auto-lookup rate when date changes
  const item = form.items[idx]
  if (item && item.originalCurrencyCode !== form.currencyCode) {
    lookupRate(idx)
  }
}

function onSourceTypeChange() {
  form.purchaseRequestId = ''
  form.purchaseAllocationId = ''
  form.businessTripFormId = ''
  selectedPR.value = null
  selectedBT.value = null
  selectedAllocation.value = null
}

async function searchPurchaseRequests(query: string) {
  if (!query || query.length < 2) return
  prLoading.value = true
  try {
    const res = await purchaseRequestsApi.getAll({ status: 'approved' })
    purchaseRequestOptions.value = (res.items ?? []).filter(
      (pr: any) => pr.requestNo?.includes(query) || pr.title?.includes(query),
    )
  } catch {
    // ignore
  } finally {
    prLoading.value = false
  }
}

async function onPurchaseRequestChange(id: string) {
  if (!id) { selectedPR.value = null; return }
  try {
    const pr = await purchaseRequestsApi.getOne(id)
    selectedPR.value = pr
    // Auto-fill currency
    if (pr.currencyCode) form.currencyCode = pr.currencyCode
    // Auto-fill company/region from PR
    if (pr.applicantCompanyId) form.reimbursementCompanyId = pr.applicantCompanyId
  } catch {
    selectedPR.value = null
  }
}

async function onAllocationChange(id: string) {
  if (!id || !selectedPR.value) { selectedAllocation.value = null; return }
  selectedAllocation.value = selectedPR.value.allocations?.find((a: any) => a.id === id) ?? null
}

async function searchBusinessTrips(query: string) {
  if (!query || query.length < 1) return
  btLoading.value = true
  try {
    // Query via formsApi - get my approved business_trip forms
    const res = await formsApi.getMyRequests({ page: 1, limit: 50 })
    businessTripOptions.value = (res.items ?? []).filter(
      (f: any) => f.formType === 'business_trip' && f.status === 'approved' &&
        (JSON.stringify(f.content)?.includes(query)),
    )
  } catch {
    // ignore
  } finally {
    btLoading.value = false
  }
}

function onBusinessTripChange(id: string) {
  if (!id) { selectedBT.value = null; return }
  selectedBT.value = businessTripOptions.value.find(bt => bt.id === id) ?? null
}

function formatBTLabel(bt: any) {
  const c = bt.content as any
  return `${c?.destination ?? '出差'} (${c?.startDate ?? ''} ~ ${c?.endDate ?? ''})`
}

function getAllocStatusType(alloc: any) {
  const ratio = Number(alloc.reimbursedAmount) / Number(alloc.amount)
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.8) return 'warning'
  return 'success'
}

function onAttachmentChange() { /* handled by el-upload file-list */ }
function onAttachmentRemove() { /* handled by el-upload file-list */ }

function buildPayload(status: 'draft' | 'submit') {
  return {
    title: form.title,
    description: form.description,
    currencyCode: form.currencyCode,
    purchaseRequestId: form.purchaseRequestId || undefined,
    purchaseAllocationId: form.purchaseAllocationId || undefined,
    businessTripFormId: form.businessTripFormId || undefined,
    sourceFormType: sourceType.value || undefined,
    reimbursementCompanyId: form.reimbursementCompanyId,
    reimbursementRegionId: form.reimbursementRegionId,
    bankName: form.bankName || undefined,
    bankAccountNo: form.bankAccountNo || undefined,
    bankAccountName: form.bankAccountName || undefined,
    items: form.items.map(({ _rateLoading, ...item }, idx) => ({
      ...item,
      sortOrder: idx,
      exchangeRateId: item.exchangeRateId || undefined,
    })),
  }
}

async function saveDraft() {
  saving.value = true
  try {
    await reimbursementsApi.create(buildPayload('draft'))
    ElMessage.success('草稿已儲存')
    router.push('/home/forms/reimbursements')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '儲存失敗')
  } finally {
    saving.value = false
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (form.items.length === 0) {
      ElMessage.warning('請至少新增一筆費用明細')
      return
    }

    if (totalExceedsLimit.value) {
      ElMessage.error('報銷總金額超過採購分攤上限，請確認金額')
      return
    }

    await ElMessageBox.confirm(
      `確認提交報銷申請？報銷金額：${totalAmount.value.toFixed(2)} ${form.currencyCode}`,
      '確認送出', { type: 'warning' },
    )

    submitting.value = true
    try {
      const created = await reimbursementsApi.create(buildPayload('submit'))
      await reimbursementsApi.submit(created.id)
      ElMessage.success('報銷申請已送出，等待審核')
      router.push('/home/forms/reimbursements')
    } catch (err: any) {
      ElMessage.error(err?.response?.data?.message ?? '送出失敗')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.reimb-page { max-width: 1100px; margin: 0 auto; padding: 0 0 60px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; flex: 1; }
.header-actions { display: flex; gap: 8px; }

.section-card { margin-bottom: 20px; }
.section-card :deep(.el-card__header) { padding: 12px 20px; background: #f5f7fa; }
.section-title { font-weight: 600; font-size: 14px; }
.section-hint { margin-left: 12px; font-size: 12px; color: #909399; }
.section-header-row { display: flex; align-items: center; justify-content: space-between; }

.amount-display { font-weight: 600; color: #409eff; font-size: 15px; }

.alloc-option { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.alloc-amounts { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 8px; }

.alloc-info-bar { margin-bottom: 16px; }

.item-card { border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fafafa; }
.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.item-no { font-weight: 600; color: #606266; }

.rate-input-group { display: flex; align-items: center; gap: 4px; width: 100%; }
.rate-hint { font-size: 11px; color: #67c23a; margin-top: 2px; }

.empty-items { padding: 20px 0; }

.total-row { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 0 0; border-top: 2px solid #f0f0f0; font-size: 15px; font-weight: 600; }
.total-amount { color: #e6a23c; font-size: 20px; }
.remaining { color: #67c23a; }

.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }

.bottom-actions { position: sticky; bottom: 0; background: white; border-top: 1px solid #ebeef5; padding: 16px 0; display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
</style>
