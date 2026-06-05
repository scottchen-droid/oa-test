<template>
  <div>
    <div class="page-header">
      <h2>審批流設定</h2>
    </div>

    <el-tabs v-model="mainTab" type="border-card">

      <!-- ══════════════════════════════════════════════
           Tab 1: 審批模板
      ══════════════════════════════════════════════ -->
      <el-tab-pane label="審批模板" name="templates">
        <div class="tab-toolbar">
          <el-select v-model="formTypeFilter" placeholder="表單類型篩選" clearable style="width:200px" @change="onFilter">
            <el-option label="全部" value="" />
            <el-option v-for="opt in FORM_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增模板</el-button>
        </div>

        <el-table v-loading="loading" :data="data" border stripe>
          <el-table-column prop="code"   label="模板代碼"  width="160" />
          <el-table-column prop="name"   label="模板名稱"  min-width="160" />
          <el-table-column label="表單類型" width="130">
            <template #default="{ row }">{{ formTypeLabel(row.formType) }}</template>
          </el-table-column>
          <el-table-column label="審批路徑" width="110">
            <template #default="{ row }">{{ routeTypeLabel(row.approvalRouteType) }}</template>
          </el-table-column>
          <el-table-column label="優先序" width="80" align="center" prop="priority" />
          <el-table-column label="步驟數" width="80" align="center">
            <template #default="{ row }">{{ row.steps?.length ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="狀態" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '啟用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit(row)">編輯</el-button>
              <el-button text size="small" type="primary" @click="openSteps(row)">步驟設定</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-if="total > 0"
          v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :total="total" :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next" class="pagination"
          @current-change="handlePageChange" @size-change="handleSizeChange"
        />
      </el-tab-pane>

      <!-- ══════════════════════════════════════════════
           Tab 2: 審批角色（說明頁，唯讀）
      ══════════════════════════════════════════════ -->
      <el-tab-pane label="審批角色" name="roles">
        <el-alert type="info" :closable="false" style="margin-bottom:16px">
          <template #title>
            審批角色定義流程節點的語意（「這一關要找哪一類人？」），
            實際負責人透過<strong>帳號管理</strong>或<strong>分組管理</strong>中的「審批職能」設定。
            動態解析類型（直屬主管、部門主管等）從組織架構直接解析，無需設定。
          </template>
        </el-alert>

        <el-table :data="APPROVAL_ROLE_DEFS" border stripe>
          <el-table-column prop="code" label="角色代碼" width="220" />
          <el-table-column prop="name" label="角色名稱" width="160" />
          <el-table-column prop="category" label="解析方式" width="130">
            <template #default="{ row }">
              <el-tag :type="row.category === 'dynamic' ? 'success' : 'primary'" size="small">
                {{ row.category === 'dynamic' ? '組織動態解析' : '審批對應解析' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="說明" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

    </el-tabs>

    <!-- ════ 模板基本資訊 Dialog ════ -->
    <el-dialog v-model="editVisible" :title="editingId ? '編輯審批模板' : '新增審批模板'" width="540px" @closed="resetEdit">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="模板名稱" prop="name"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="表單類型" prop="formType">
          <el-select v-model="editForm.formType" style="width:100%">
            <el-option v-for="opt in FORM_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="審批路徑">
          <el-select v-model="editForm.approvalRouteType" style="width:100%">
            <el-option v-for="opt in ROUTE_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="優先序">
          <el-input-number v-model="editForm.priority" :min="1" style="width:100%" />
          <div class="field-hint">數字越小越優先</div>
        </el-form-item>
        <el-form-item label="金額下限"><el-input-number v-model="editForm.minAmount" :min="0" placeholder="不限" style="width:100%" /></el-form-item>
        <el-form-item label="金額上限"><el-input-number v-model="editForm.maxAmount" :min="0" placeholder="不限" style="width:100%" /></el-form-item>
        <el-form-item label="狀態"><el-switch v-model="editForm.isActive" active-text="啟用" inactive-text="停用" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSave">確定</el-button>
      </template>
    </el-dialog>

    <!-- ════ 步驟設定 Drawer ════ -->
    <el-drawer v-model="stepsVisible" :title="`步驟設定 — ${stepsTemplate?.name ?? ''}`" size="720px" @closed="resetSteps">
      <div class="steps-help">
        <el-alert type="info" :closable="false">
          <template #title>
            <b>串簽</b>：<code>approvalMode=any</code> 任一人通過即可。
            <b>並簽</b>：<code>approvalMode=all</code> 全部審批人都需簽核。
            職能角色類型（HR、財務等）透過<b>審批對應</b>解析，在帳號管理或分組管理中設定。
          </template>
        </el-alert>
      </div>

      <div class="steps-toolbar">
        <el-button type="primary" :icon="Plus" size="small" @click="addStep">新增步驟</el-button>
        <span class="steps-hint">共 {{ editSteps.length }} 個步驟</span>
      </div>

      <el-empty v-if="editSteps.length === 0" description="尚無步驟，請點擊「新增步驟」" :image-size="80" />

      <div v-for="(step, si) in editSteps" :key="si" class="step-card">
        <div class="step-header">
          <span class="step-num">步驟 {{ si + 1 }}</span>
          <el-input v-model="step.stepName" size="small" placeholder="步驟名稱" class="step-name-input" />
          <div class="step-header-actions">
            <el-button text size="small" :disabled="si === 0" @click="moveStep(si, -1)">↑</el-button>
            <el-button text size="small" :disabled="si === editSteps.length - 1" @click="moveStep(si, 1)">↓</el-button>
            <el-button text size="small" type="danger" @click="removeStep(si)">刪除</el-button>
          </div>
        </div>

        <div class="step-settings">
          <div class="step-setting-item">
            <span class="setting-label">簽署方式</span>
            <el-radio-group v-model="step.approvalMode" size="small">
              <el-radio-button value="any">串簽／任一</el-radio-button>
              <el-radio-button value="all">並簽／全部</el-radio-button>
              <el-radio-button value="majority">多數通過</el-radio-button>
            </el-radio-group>
          </div>
          <div class="step-setting-item">
            <span class="setting-label">允許加簽</span>
            <el-switch v-model="step.allowDynamicAdding" size="small" />
          </div>
        </div>

        <div class="approvers-section">
          <div class="approvers-header">
            <span class="approvers-title">審批人設定</span>
            <el-button text size="small" type="primary" :icon="Plus" @click="addApprover(si)">新增審批人</el-button>
          </div>

          <div v-for="(apv, ai) in step.approvers" :key="ai" class="approver-row">
            <span class="approver-seq">{{ ai + 1 }}</span>

            <!-- 角色選擇 -->
            <el-select v-model="apv.approverType" size="small" style="width:180px" @change="onApproverTypeChange(apv)">
              <el-option-group v-for="g in APPROVER_GROUPS" :key="g.label" :label="g.label">
                <el-option v-for="opt in g.options" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-option-group>
            </el-select>

            <!-- 群組解析型：分組選擇 -->
            <template v-if="isGroupBased(apv.approverType)">
              <template v-if="!isSpecialType(apv.approverType)">
                <el-select v-model="apv.scopeConfig.groupType" size="small" style="width:100px"
                  placeholder="分組" @change="onGroupTypeChange(apv)">
                  <el-option v-for="g in GROUP_TYPE_OPTIONS" :key="g.value" :label="g.label" :value="g.value" />
                </el-select>
                <!-- 項目：申請人所在 or 指定 -->
                <template v-if="apv.scopeConfig.groupType === 'project'">
                  <el-select v-model="apv.scopeConfig.groupResolution" size="small" style="width:130px">
                    <el-option value="applicant_project" label="申請人所在項目" />
                    <el-option value="specific_project"  label="指定項目" />
                  </el-select>
                  <el-select v-if="apv.scopeConfig.groupResolution === 'specific_project'"
                    v-model="apv.scopeConfig.projectId" size="small" filterable style="width:130px" placeholder="選擇項目">
                    <el-option v-for="p in orgProjects" :key="p.id" :label="p.name" :value="p.id" />
                  </el-select>
                </template>
                <!-- 事業部：申請人所在 or 指定 -->
                <template v-else-if="apv.scopeConfig.groupType === 'business_unit'">
                  <el-select v-model="apv.scopeConfig.groupResolution" size="small" style="width:130px">
                    <el-option value="applicant_bu" label="申請人所在事業部" />
                    <el-option value="specific_bu"  label="指定事業部" />
                  </el-select>
                  <el-select v-if="apv.scopeConfig.groupResolution === 'specific_bu'"
                    v-model="apv.scopeConfig.businessUnitId" size="small" filterable style="width:130px" placeholder="選擇事業部">
                    <el-option v-for="b in orgBUs" :key="b.id" :label="b.name" :value="b.id" />
                  </el-select>
                </template>
              </template>
              <span v-else class="group-hint">特殊層級（全集團）</span>
            </template>

            <!-- 指定人員 -->
            <template v-else-if="apv.approverType === 'user'">
              <el-select v-model="apv.approverUserId" size="small" filterable remote
                :remote-method="searchUsers" :loading="userSearchLoading" style="width:200px" placeholder="搜尋並指定人員">
                <el-option v-for="u in userSearchResults" :key="u.id" :label="`${u.displayName} (${u.employeeNo})`" :value="u.id" />
              </el-select>
            </template>

            <el-button v-if="step.approvers.length > 1" text size="small" type="danger"
              style="margin-left:auto" @click="removeApprover(si, ai)">移除</el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="stepsVisible = false">取消</el-button>
        <el-button type="primary" :loading="stepsSaving" @click="handleStepsSave">儲存步驟</el-button>
      </template>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { approvalsApi, type ApproverConfig, type StepPayload } from '@/api/approvals.api'
import { companiesApi, businessUnitsApi, projectsApi } from '@/api/organizations.api'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const { t } = useI18n()
const ui = useUiStore()

// ══════════════════════════════════════════════════════════════
// 常數與設定
// ══════════════════════════════════════════════════════════════

const FORM_TYPE_OPTIONS = [
  { value: 'leave_request',         label: '請假申請'      },
  { value: 'overtime_request',      label: '加班申請'      },
  { value: 'clock_patch_request',   label: '補卡申請'      },
  { value: 'leave_without_pay',     label: '留職停薪申請'  },
  { value: 'resignation',           label: '離職申請'      },
  { value: 'meal_allowance',        label: '誤餐費申請'    },
  { value: 'it_request',            label: '資訊需求申請'  },
  { value: 'asset_request',         label: 'OA 資產申請'  },
  { value: 'headcount_request',     label: '人力需求申請'  },
  { value: 'purchase_request',      label: '採購申請'      },
  { value: 'reimbursement_request', label: '費用報銷'      },
  { value: 'payroll_request',       label: '薪資申請'      },
  { value: 'business_trip',         label: '出差申請'      },
]

const ROUTE_TYPE_OPTIONS = [
  { value: 'group_org',  label: '集團業務組織' },
  { value: 'office_org', label: '辦公室組織'   },
  { value: 'mixed',      label: '混合模式'     },
  { value: 'custom',     label: '自訂'         },
]

// 審批角色定義（說明用）
const APPROVAL_ROLE_DEFS = [
  { code: 'applicant_direct_manager', name: '申請人直屬主管', category: 'dynamic', description: '從員工組織歸屬中取得直屬主管，動態解析，無需設定群組' },
  { code: 'department_manager',       name: '部門主管',       category: 'dynamic', description: '從部門資料解析部門主管，動態解析，無需設定群組' },
  { code: 'lead',                     name: '負責人',         category: 'group',   description: '依分組類型從審批對應解析對應負責人（需同時選擇分組）' },
  { code: 'hr',                       name: '人事專員',       category: 'group',   description: '依分組類型從審批對應解析對應人事專員' },
  { code: 'hr_manager',               name: '人事主管',       category: 'group',   description: '依分組類型從審批對應解析對應人事主管' },
  { code: 'finance',                  name: '財務人員',       category: 'group',   description: '依分組類型從審批對應解析對應財務人員' },
  { code: 'finance_manager',          name: '財務主管',       category: 'group',   description: '依分組類型從審批對應解析對應財務主管' },
  { code: 'ceo',                      name: '執行長',         category: 'group',   description: '特殊層級，從審批對應解析，需在帳號管理設定 scopeType=special' },
  { code: 'chairman',                 name: '董事長',         category: 'group',   description: '特殊層級，從審批對應解析，需在帳號管理設定 scopeType=special' },
]

// 步驟審批人分組選項（角色欄位）
const APPROVER_GROUPS = [
  {
    label: '動態解析型（從組織架構自動找人）',
    options: [
      { value: 'applicant_direct_manager', label: '申請人直屬主管' },
      { value: 'department_manager',       label: '部門主管' },
    ],
  },
  {
    label: '分組 + 角色（透過審批對應解析）',
    options: [
      { value: 'lead',            label: '負責人' },
      { value: 'hr',              label: '人事專員' },
      { value: 'hr_manager',      label: '人事主管' },
      { value: 'finance',         label: '財務人員' },
      { value: 'finance_manager', label: '財務主管' },
      { value: 'ceo',             label: '執行長（特殊）' },
      { value: 'chairman',        label: '董事長（特殊）' },
    ],
  },
  {
    label: '固定指定型',
    options: [{ value: 'user', label: '指定人員' }],
  },
]

// 分組類型選項
const GROUP_TYPE_OPTIONS = [
  { value: 'company',       label: '公司' },
  { value: 'business_unit', label: '事業部' },
  { value: 'project',       label: '項目' },
  { value: 'department',    label: '部門' },
]

const GROUP_BASED_TYPES = new Set(['lead', 'hr', 'hr_manager', 'finance', 'finance_manager', 'ceo', 'chairman'])
const SPECIAL_TYPES     = new Set(['ceo', 'chairman'])

function isGroupBased(t: string)  { return GROUP_BASED_TYPES.has(t) }
function isSpecialType(t: string) { return SPECIAL_TYPES.has(t) }

function roleName(code: string) {
  return APPROVAL_ROLE_DEFS.find(r => r.code === code)?.name ?? code
}

// ── Org data ───────────────────────────────────────────────────
const orgCompanies = ref<any[]>([])
const orgBUs       = ref<any[]>([])
const orgProjects  = ref<any[]>([])

async function loadOrgData() {
  const [companies, bus, projects] = await Promise.all([
    companiesApi.getAll(),
    businessUnitsApi.getAll(),
    projectsApi.getAll(),
  ])
  orgCompanies.value = companies
  orgBUs.value       = bus
  orgProjects.value  = projects
}

// ── User search ────────────────────────────────────────────────
const userSearchLoading = ref(false)
const userSearchResults = ref<any[]>([])
async function searchUsers(q: string) {
  if (!q) return
  userSearchLoading.value = true
  try { const r = await usersApi.getAll({ search: q, limit: 20 }); userSearchResults.value = r.items ?? [] }
  finally { userSearchLoading.value = false }
}

// ══════════════════════════════════════════════════════════════
// Tab 狀態
// ══════════════════════════════════════════════════════════════
const mainTab = ref('templates')

// ── 審批模板 ───────────────────────────────────────────────────
const formTypeFilter = ref('')
const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } =
  useTable<any>({ fetchFn: (p) => approvalsApi.getTemplates(p as any) })

onMounted(() => {
  ui.setBreadcrumbs([{ title: t('nav.systemModule') }, { title: t('nav.workflows') }])
  fetch()
  loadOrgData()
})

function onFilter() { pagination.page = 1; fetch({ formType: formTypeFilter.value || undefined }) }
function formTypeLabel(v: string) { return FORM_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v }
function routeTypeLabel(v: string) { return ROUTE_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v }

// ── 模板基本資訊 Dialog ────────────────────────────────────────
const editVisible = ref(false)
const editSaving  = ref(false)
const editFormRef = ref<FormInstance>()
const editingId   = ref('')
const editForm    = reactive({ name: '', formType: '', approvalRouteType: 'group_org', priority: 100, minAmount: null as number|null, maxAmount: null as number|null, isActive: true })
const editRules: FormRules = {
  name:     [{ required: true, message: '請輸入模板名稱', trigger: 'blur' }],
  formType: [{ required: true, message: '請選擇表單類型', trigger: 'change' }],
}

function openCreate() {
  editingId.value = ''
  Object.assign(editForm, { name: '', formType: '', approvalRouteType: 'group_org', priority: 100, minAmount: null, maxAmount: null, isActive: true })
  editVisible.value = true
}
function openEdit(row: any) {
  editingId.value = row.id
  Object.assign(editForm, { name: row.name, formType: row.formType, approvalRouteType: row.approvalRouteType, priority: row.priority, minAmount: row.minAmount ?? null, maxAmount: row.maxAmount ?? null, isActive: row.isActive })
  editVisible.value = true
}
function resetEdit() { editingId.value = '' }

async function handleEditSave() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  editSaving.value = true
  try {
    editingId.value ? await approvalsApi.updateTemplate(editingId.value, editForm) : await approvalsApi.createTemplate(editForm)
    ElMessage.success('儲存成功')
    editVisible.value = false
    fetch({ formType: formTypeFilter.value || undefined })
  } catch { ElMessage.error('儲存失敗') } finally { editSaving.value = false }
}

// ── 步驟設定 Drawer ────────────────────────────────────────────
const stepsVisible  = ref(false)
const stepsSaving   = ref(false)
const stepsTemplate = ref<any>(null)

interface EditApprover { approverType: string; approverUserId?: string; scopeConfig: Record<string, any> }
interface EditStep { stepName: string; approvalMode: string; isRequired: boolean; allowDynamicAdding: boolean; approvers: EditApprover[] }

const editSteps = ref<EditStep[]>([])

function makeDefaultApprover(): EditApprover { return { approverType: 'applicant_direct_manager', scopeConfig: {} } }

function openSteps(row: any) {
  stepsTemplate.value = row
  editSteps.value = (row.steps ?? []).slice().sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    .map((s: any) => ({
      stepName: s.stepName, approvalMode: s.approvalMode ?? 'any', isRequired: s.isRequired ?? true,
      allowDynamicAdding: s.allowDynamicAdding ?? false,
      approvers: (s.approvers?.length ? s.approvers : [{ approverType: 'applicant_direct_manager' }])
        .map((a: any) => ({ approverType: a.approverType, approverUserId: a.approverUserId ?? undefined, scopeConfig: a.scopeConfig ?? {} })),
    }))
  stepsVisible.value = true
}

function resetSteps() { stepsTemplate.value = null; editSteps.value = [] }
function addStep() {
  editSteps.value.push({ stepName: `步驟 ${editSteps.value.length + 1}`, approvalMode: 'any', isRequired: true, allowDynamicAdding: false, approvers: [makeDefaultApprover()] })
}
function removeStep(i: number) { editSteps.value.splice(i, 1) }
function moveStep(i: number, dir: -1|1) {
  const arr = editSteps.value, j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}
function addApprover(si: number) { editSteps.value[si].approvers.push(makeDefaultApprover()) }
function removeApprover(si: number, ai: number) { editSteps.value[si].approvers.splice(ai, 1) }
function onApproverTypeChange(apv: EditApprover) {
  apv.scopeConfig = {}
  apv.approverUserId = undefined
  if (isGroupBased(apv.approverType)) {
    if (isSpecialType(apv.approverType)) {
      apv.scopeConfig.groupType = 'special'
    } else {
      apv.scopeConfig.groupType = 'company'
      apv.scopeConfig.groupResolution = 'applicant_company'
    }
  }
}

function onGroupTypeChange(apv: EditApprover) {
  const defaults: Record<string, string> = {
    company:       'applicant_company',
    business_unit: 'applicant_bu',
    project:       'applicant_project',
    department:    'applicant_department',
  }
  apv.scopeConfig.groupResolution = defaults[apv.scopeConfig.groupType] ?? 'applicant_company'
  delete apv.scopeConfig.projectId
  delete apv.scopeConfig.businessUnitId
}

async function handleStepsSave() {
  if (!stepsTemplate.value) return
  for (const [i, s] of editSteps.value.entries()) {
    if (!s.stepName.trim()) { ElMessage.warning(`步驟 ${i+1} 名稱不能為空`); return }
    if (s.approvers.length === 0) { ElMessage.warning(`步驟 ${i+1} 至少需要一個審批人`); return }
    for (const apv of s.approvers) {
      if (apv.approverType === 'user' && !apv.approverUserId) { ElMessage.warning(`步驟 ${i+1} 有「指定人員」未選擇`); return }
    }
  }
  stepsSaving.value = true
  try {
    const payload: StepPayload[] = editSteps.value.map((s, i) => ({
      stepOrder: i+1, stepName: s.stepName.trim(), approvalMode: s.approvalMode,
      isRequired: s.isRequired, allowDynamicAdding: s.allowDynamicAdding,
      approvers: s.approvers.map(a => ({
        approverType: a.approverType,
        approverUserId: a.approverUserId || undefined,
        scopeConfig: Object.keys(a.scopeConfig).length ? a.scopeConfig : undefined,
      } as ApproverConfig)),
    }))
    await approvalsApi.replaceSteps(stepsTemplate.value.id, payload)
    ElMessage.success('步驟儲存成功')
    stepsVisible.value = false
    fetch({ formType: formTypeFilter.value || undefined })
  } catch { ElMessage.error('儲存失敗') } finally { stepsSaving.value = false }
}

</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.page-header h2 { font-size:20px; font-weight:600; margin:0; }
.tab-toolbar { display:flex; gap:12px; margin-bottom:16px; }
.pagination  { margin-top:16px; justify-content:flex-end; }
.field-hint  { font-size:12px; color:#909399; margin-top:4px; }

/* Steps */
.steps-help { margin-bottom:14px; }
.steps-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
.steps-hint { font-size:13px; color:#606266; }

.step-card { border:1px solid #e4e7ed; border-radius:8px; padding:14px; margin-bottom:12px; background:#fafafa; }
.step-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.step-num { font-size:13px; font-weight:700; color:#1D4ED8; min-width:48px; }
.step-name-input { flex:1; }
.step-header-actions { display:flex; gap:4px; margin-left:auto; }

.step-settings { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:12px; padding:8px 12px; background:#fff; border-radius:6px; border:1px solid #ebeef5; }
.step-setting-item { display:flex; align-items:center; gap:8px; }
.setting-label { font-size:13px; color:#606266; min-width:60px; }

.approvers-section { margin-top:4px; }
.approvers-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.approvers-title { font-size:13px; font-weight:600; color:#303133; }
.approver-row { display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fff; border-radius:6px; border:1px solid #ebeef5; margin-bottom:6px; flex-wrap:wrap; }
.approver-seq { font-size:12px; color:#909399; min-width:20px; text-align:center; }
.group-hint { font-size:12px; color:#67c23a; }

</style>
