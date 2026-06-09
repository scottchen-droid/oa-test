<template>
  <div>
    <div class="page-header">
      <h2>發起申請</h2>
    </div>

    <!-- 分類 Tab -->
    <el-tabs v-model="activeCategory" class="category-tabs">
      <el-tab-pane
        v-for="tab in visibleTabs"
        :key="tab.value"
        :label="tab.label + (tab.value !== 'all' ? ` (${categoryCounts[tab.value] ?? 0})` : '')"
        :name="tab.value"
      />
    </el-tabs>

    <!-- 載入中 -->
    <div v-if="loading" class="loading-placeholder">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 表單 Grid -->
    <div v-else class="form-grid">
      <el-card
        v-for="ft in filteredFormTypes"
        :key="ft.formType"
        class="form-card"
        shadow="hover"
        @click="openForm(ft)"
      >
        <div class="form-card-inner">
          <el-icon :size="36" class="form-icon" :style="{ color: ft.iconColor || '#409eff' }">
            <component :is="resolveIcon(ft.icon)" />
          </el-icon>
          <div class="form-name">{{ ft.name }}</div>
          <div class="form-desc">{{ ft.description }}</div>
        </div>
      </el-card>

      <div v-if="filteredFormTypes.length === 0" class="no-forms">
        <el-empty description="此分類暫無可用表單" />
      </div>
    </div>

    <!-- 申請 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="activeFormDef?.name"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="activeRules" label-width="110px">
        <template v-if="activeFormDef?.formType === 'purchase_request'">
          <el-form-item label="採購品項" prop="itemName">
            <el-input v-model="formData.itemName" placeholder="如：筆記型電腦、辦公桌椅" />
          </el-form-item>
          <el-form-item label="數量" prop="quantity">
            <el-input-number v-model="formData.quantity" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="預估金額（元）" prop="estimatedAmount">
            <el-input-number v-model="formData.estimatedAmount" :min="0" style="width:100%" />
          </el-form-item>
          <el-form-item label="供應商" prop="vendor">
            <el-input v-model="formData.vendor" placeholder="供應商名稱（選填）" />
          </el-form-item>
          <el-form-item label="預計交貨日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="採購原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="3" placeholder="說明採購用途及必要性" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'business_trip'">
          <el-form-item label="出差目的地" prop="destination">
            <el-input v-model="formData.destination" placeholder="如：台北、上海、東京" />
          </el-form-item>
          <el-form-item label="出差開始日期" prop="startDate">
            <el-date-picker v-model="formData.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="出差結束日期" prop="endDate">
            <el-date-picker v-model="formData.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="出差目的" prop="purpose">
            <el-input v-model="formData.purpose" type="textarea" :rows="3" placeholder="說明出差目的及預期成果" />
          </el-form-item>
          <el-form-item label="預估差旅費（元）" prop="estimatedBudget">
            <el-input-number v-model="formData.estimatedBudget" :min="0" style="width:100%" />
          </el-form-item>
          <el-form-item label="需要住宿" prop="needAccommodation">
            <el-switch v-model="formData.needAccommodation" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'asset_request'">
          <el-form-item label="資產類型" prop="assetType">
            <el-input v-model="formData.assetType" placeholder="如：筆電、螢幕、辦公椅" />
          </el-form-item>
          <el-form-item label="數量" prop="quantity">
            <el-input-number v-model="formData.quantity" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="預計使用日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="申請原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'meal_allowance'">
          <el-form-item label="加班日期" prop="workDate">
            <el-date-picker v-model="formData.workDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="加班時數" prop="hours">
            <el-input-number v-model="formData.hours" :min="1" :max="24" style="width:100%" />
          </el-form-item>
          <el-form-item label="申請金額（元）" prop="amount">
            <el-input-number v-model="formData.amount" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="備註" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'it_request'">
          <el-form-item label="需求標題" prop="title">
            <el-input v-model="formData.title" placeholder="簡述需求" />
          </el-form-item>
          <el-form-item label="需求描述" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="詳述需求內容" />
          </el-form-item>
          <el-form-item label="優先程度" prop="priority">
            <el-select v-model="formData.priority" style="width:100%">
              <el-option label="緊急" value="urgent" />
              <el-option label="一般" value="normal" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>
          <el-form-item label="期望完成日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'headcount_request'">
          <el-form-item label="職位名稱" prop="positionName">
            <el-input v-model="formData.positionName" />
          </el-form-item>
          <el-form-item label="招募人數" prop="headcount">
            <el-input-number v-model="formData.headcount" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="招募原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="期望到職日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'resignation'">
          <el-form-item label="預計離職日期" prop="resignDate">
            <el-date-picker v-model="formData.resignDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="離職原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="4" placeholder="請填寫離職原因" />
          </el-form-item>
          <el-form-item label="交接備註" prop="handoverNote">
            <el-input v-model="formData.handoverNote" type="textarea" :rows="2" placeholder="工作交接事項（選填）" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormDef?.formType === 'personnel_resource_request'">
          <el-form-item label="申請類型" prop="requestType">
            <el-select
              v-model="formData.requestType"
              style="width:100%"
              @change="onResourceRequestTypeChange"
            >
              <el-option label="入職開通" value="onboard" />
              <el-option label="在職新增" value="add" />
              <el-option label="在職變更" value="change" />
              <el-option label="離職回收" value="offboard" />
            </el-select>
          </el-form-item>
          <el-form-item label="申請對象" prop="targetUserId">
            <el-select
              v-model="formData.targetUserId"
              filterable
              remote
              :remote-method="searchTargetUsers"
              :loading="targetUserSearchLoading"
              placeholder="搜尋員工"
              style="width:100%"
              clearable
            >
              <el-option
                v-for="u in targetUserOptions"
                :key="u.id"
                :label="`${u.displayName}（${u.employeeNo ?? ''}）`"
                :value="u.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="生效日期" prop="effectiveDate">
            <el-date-picker
              v-model="formData.effectiveDate"
              type="date"
              value-format="YYYY-MM-DD"
              style="width:100%"
              placeholder="請選擇生效日期"
            />
          </el-form-item>
          <el-form-item label="資源項目" prop="resourceItemIds">
            <div v-if="resourceItemsLoading" class="loading-hint">載入中...</div>
            <el-checkbox-group v-else v-model="formData.resourceItemIds" style="display:flex;flex-direction:column;gap:6px">
              <el-checkbox
                v-for="item in filteredResourceItems"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
                <span class="item-code">（{{ item.code }}）</span>
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="申請原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="3" placeholder="請填寫申請原因" />
          </el-form-item>
          <el-form-item label="備註">
            <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="選填" />
          </el-form-item>
        </template>

        <!-- 通用佔位（未知表單類型） -->
        <template v-else>
          <el-form-item label="備註" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="4" placeholder="請填寫申請說明" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="activeFormDef?.allowDraft !== false" :loading="saving" @click="handleSaveDraft">儲存草稿</el-button>
        <el-button v-if="activeFormDef?.allowFillTemplate !== false" :loading="savingTemplate" @click="handleSaveTemplate">另存為填寫模板</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">送出申請</el-button>
      </template>
    </el-dialog>

    <!-- 另存為填寫模板 Dialog -->
    <el-dialog
      v-model="templateDialogVisible"
      title="另存為填寫模板"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="templateForm" label-width="90px">
        <el-form-item label="模板名稱" required>
          <el-input v-model="templateForm.name" placeholder="請輸入模板名稱" />
        </el-form-item>
        <el-form-item label="模板說明">
          <el-input v-model="templateForm.description" type="textarea" :rows="2" placeholder="說明此模板用途（選填）" />
        </el-form-item>
        <el-form-item label="設為常用">
          <el-switch v-model="templateForm.isFavorite" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingTemplate" @click="confirmSaveTemplate">確認儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Briefcase, Monitor, User, Remove, ShoppingCart, Suitcase, Tickets,
  Document, Money, Setting, DataLine, Grid, Promotion,
} from '@element-plus/icons-vue'
import { formDefinitionsApi, type FormDefinition } from '@/api/form-definitions.api'
import { formsApi } from '@/api/forms.api'
import { resourceItemsApi, type ResourceItem } from '@/api/resource-items.api'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const ui = useUiStore()
const router = useRouter()
ui.setBreadcrumbs([{ title: t('nav.forms') }, { title: t('nav.initiateApply') }])

// ─── 分類設定 ─────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  all: '全部',
  business: '商務',
  contract: '合同',
  finance: '財務',
  administration: '行政',
  pmo: 'PMO',
  hr: 'HR',
}

const ALL_CATEGORIES = ['all', 'business', 'contract', 'finance', 'administration', 'pmo', 'hr']

// ─── 圖示映射 ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, unknown> = {
  Briefcase,
  Monitor,
  User,
  Remove,
  ShoppingCart,
  Suitcase,
  Tickets,
  Document,
  Money,
  Setting,
  DataLine,
  Grid,
  Promotion,
}

function resolveIcon(iconName?: string): unknown {
  if (!iconName) return Document
  return ICON_MAP[iconName] ?? Document
}

// ─── 有 Dialog 實作的表單類型 ──────────────────────────────────────────────────
const DIALOG_FORM_TYPES = new Set([
  'purchase_request',
  'business_trip',
  'asset_request',
  'meal_allowance',
  'it_request',
  'headcount_request',
  'resignation',
  'personnel_resource_request',
])

// ─── 狀態 ─────────────────────────────────────────────────────────────────────
const loading = ref(false)
const definitions = ref<FormDefinition[]>([])
const activeCategory = ref('all')

// ─── 計算 ─────────────────────────────────────────────────────────────────────
const categoryCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const def of definitions.value) {
    counts[def.category] = (counts[def.category] ?? 0) + 1
  }
  return counts
})

const visibleTabs = computed(() =>
  ALL_CATEGORIES
    .filter(cat => cat === 'all' || (categoryCounts.value[cat] ?? 0) > 0)
    .map(cat => ({ value: cat, label: CATEGORY_LABELS[cat] ?? cat })),
)

const filteredFormTypes = computed(() =>
  activeCategory.value === 'all'
    ? definitions.value
    : definitions.value.filter(d => d.category === activeCategory.value),
)

// ─── 載入表單定義 ──────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    definitions.value = await formDefinitionsApi.getAccessible()
  } catch {
    ElMessage.error('載入表單列表失敗，請稍後再試')
  } finally {
    loading.value = false
  }
})

// ─── Dialog 狀態 ──────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const submitting = ref(false)
const saving = ref(false)
const savingTemplate = ref(false)
const templateDialogVisible = ref(false)
const formRef = ref<FormInstance>()
const activeFormDef = ref<FormDefinition | null>(null)
const formData = ref<Record<string, unknown>>({})
const templateForm = ref({ name: '', description: '', isFavorite: false })

// ─── 表單驗證規則 ──────────────────────────────────────────────────────────────
const rulesMap: Record<string, FormRules> = {
  purchase_request: {
    itemName: [{ required: true, message: '請填寫採購品項', trigger: 'blur' }],
    quantity: [{ required: true, message: '請填寫數量', trigger: 'change' }],
    estimatedAmount: [{ required: true, message: '請填寫預估金額', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫採購原因', trigger: 'blur' }],
  },
  business_trip: {
    destination: [{ required: true, message: '請填寫出差目的地', trigger: 'blur' }],
    startDate: [{ required: true, message: '請選擇出差開始日期', trigger: 'change' }],
    endDate: [{ required: true, message: '請選擇出差結束日期', trigger: 'change' }],
    purpose: [{ required: true, message: '請填寫出差目的', trigger: 'blur' }],
  },
  asset_request: {
    assetType: [{ required: true, message: '請填寫資產類型', trigger: 'blur' }],
    quantity: [{ required: true, message: '請填寫數量', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫申請原因', trigger: 'blur' }],
  },
  meal_allowance: {
    workDate: [{ required: true, message: '請選擇加班日期', trigger: 'change' }],
    hours: [{ required: true, message: '請填寫加班時數', trigger: 'change' }],
    amount: [{ required: true, message: '請填寫申請金額', trigger: 'change' }],
  },
  it_request: {
    title: [{ required: true, message: '請填寫需求標題', trigger: 'blur' }],
    description: [{ required: true, message: '請填寫需求描述', trigger: 'blur' }],
    priority: [{ required: true, message: '請選擇優先程度', trigger: 'change' }],
  },
  headcount_request: {
    positionName: [{ required: true, message: '請填寫職位名稱', trigger: 'blur' }],
    headcount: [{ required: true, message: '請填寫招募人數', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫招募原因', trigger: 'blur' }],
  },
  resignation: {
    resignDate: [{ required: true, message: '請選擇預計離職日期', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫離職原因', trigger: 'blur' }],
  },
  personnel_resource_request: {
    requestType: [{ required: true, message: '請選擇申請類型', trigger: 'change' }],
    targetUserId: [{ required: true, message: '請選擇申請對象', trigger: 'change' }],
    effectiveDate: [{ required: true, message: '請選擇生效日期', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫申請原因', trigger: 'blur' }],
  },
}

const activeRules = computed<FormRules>(() =>
  activeFormDef.value ? (rulesMap[activeFormDef.value.formType] ?? {}) : {},
)

// ─── 人員資源申請（personnel_resource_request）相關狀態 ────────────────────────
const targetUserSearchLoading = ref(false)
const targetUserOptions = ref<{ id: string; displayName: string; employeeNo?: string }[]>([])
const resourceItemsLoading = ref(false)
const allResourceItems = ref<ResourceItem[]>([])

async function loadResourceItems() {
  if (allResourceItems.value.length) return
  resourceItemsLoading.value = true
  try {
    allResourceItems.value = await resourceItemsApi.list()
  } catch {
    ElMessage.error('載入資源項目失敗')
  } finally {
    resourceItemsLoading.value = false
  }
}

const filteredResourceItems = computed<ResourceItem[]>(() => {
  const reqType = formData.value.requestType as string | undefined
  if (!reqType) return allResourceItems.value
  return allResourceItems.value.filter(item => {
    if (reqType === 'onboard') return item.availableOnOnboard
    if (reqType === 'add') return item.availableOnAdd
    if (reqType === 'change') return item.availableOnChange
    return true // offboard: 全部
  })
})

function onResourceRequestTypeChange() {
  // 若為 offboard，自動勾選 requiredOnOffboard=true 的項目
  const reqType = formData.value.requestType as string | undefined
  if (reqType === 'offboard') {
    const required = allResourceItems.value.filter(i => i.requiredOnOffboard).map(i => i.id)
    formData.value.resourceItemIds = required
  } else {
    formData.value.resourceItemIds = []
  }
}

async function searchTargetUsers(query: string) {
  if (!query.trim()) { targetUserOptions.value = []; return }
  targetUserSearchLoading.value = true
  try {
    const result = await usersApi.getAll({ search: query, limit: 20 })
    targetUserOptions.value = result.items.map(u => ({
      id: u.id,
      displayName: u.displayName,
      employeeNo: u.employeeNo,
    }))
  } catch {
    targetUserOptions.value = []
  } finally {
    targetUserSearchLoading.value = false
  }
}

// 當 Dialog 開啟且為 personnel_resource_request 時載入資源項目
watch(
  () => activeFormDef.value?.formType,
  (type) => {
    if (type === 'personnel_resource_request') {
      loadResourceItems()
    }
  },
)

// ─── 開啟表單 ──────────────────────────────────────────────────────────────────
function openForm(def: FormDefinition) {
  // expense_reimbursement 直接跳轉
  if (def.formType === 'expense_reimbursement') {
    router.push('/home/forms/reimbursement/new')
    return
  }

  // 有 Dialog 實作的表單類型
  if (DIALOG_FORM_TYPES.has(def.formType)) {
    activeFormDef.value = def
    formData.value = {
      quantity: 1,
      hours: 1,
      amount: 100,
      headcount: 1,
      priority: 'normal',
      estimatedAmount: 0,
      estimatedBudget: 0,
      needAccommodation: false,
      // personnel_resource_request
      requestType: '',
      targetUserId: '',
      effectiveDate: '',
      resourceItemIds: [] as string[],
      reason: '',
      remark: '',
    }
    dialogVisible.value = true
    return
  }

  // 其他未知表單類型跳轉 placeholder 頁面
  router.push(`/home/forms/${def.formType}/new`)
}

function resetForm() {
  formData.value = {}
  activeFormDef.value = null
  formRef.value?.resetFields()
}

// ─── 草稿 ─────────────────────────────────────────────────────────────────────
async function handleSaveDraft() {
  if (!activeFormDef.value) return
  saving.value = true
  try {
    await formsApi.saveDraft({
      formType: activeFormDef.value.formType,
      content: { ...formData.value },
    })
    ElMessage.success('草稿已儲存，可在「我的草稿」中繼續編輯')
    dialogVisible.value = false
  } catch {
    ElMessage.error('儲存草稿失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}

// ─── 填寫模板 ──────────────────────────────────────────────────────────────────
function handleSaveTemplate() {
  if (!activeFormDef.value) return
  templateForm.value = { name: `${activeFormDef.value.name}模板`, description: '', isFavorite: false }
  templateDialogVisible.value = true
}

async function confirmSaveTemplate() {
  if (!activeFormDef.value) return
  if (!templateForm.value.name.trim()) {
    ElMessage.warning('請輸入模板名稱')
    return
  }
  savingTemplate.value = true
  try {
    await formsApi.createFillTemplate({
      formType: activeFormDef.value.formType,
      name: templateForm.value.name.trim(),
      description: templateForm.value.description.trim() || undefined,
      content: { ...formData.value },
      isFavorite: templateForm.value.isFavorite,
    })
    ElMessage.success('填寫模板已儲存，可在「我的填寫模板」中使用')
    templateDialogVisible.value = false
  } catch {
    ElMessage.error('儲存填寫模板失敗，請稍後再試')
  } finally {
    savingTemplate.value = false
  }
}

// ─── 送出申請 ──────────────────────────────────────────────────────────────────
async function submitForm() {
  if (!formRef.value || !activeFormDef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await formsApi.create({ formType: activeFormDef.value!.formType, content: { ...formData.value } })
      ElMessage.success('申請送出成功，等待主管審核')
      dialogVisible.value = false
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      ElMessage.error(axiosErr?.response?.data?.message ?? '送出失敗，請稍後再試')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.category-tabs {
  margin-bottom: 20px;
}

.loading-placeholder {
  padding: 20px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.form-card {
  cursor: pointer;
  transition: transform 0.15s;
}
.form-card:hover { transform: translateY(-3px); }

.form-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0 8px;
  text-align: center;
}

.form-name { font-size: 15px; font-weight: 600; color: #303133; }
.form-desc { font-size: 12px; color: #909399; line-height: 1.4; }

.no-forms {
  grid-column: 1 / -1;
  padding: 40px 0;
}

.loading-hint { color: #909399; font-size: 13px; }

.item-code { color: #909399; font-size: 12px; }
</style>
