<template>
  <div>
    <div class="page-header">
      <h2>審批流設定</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增模板</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="formTypeFilter" placeholder="表單類型篩選" clearable style="width:200px" @change="onFilter">
          <el-option label="全部" value="" />
          <el-option v-for="opt in FORM_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="code"   label="模板代碼"  width="160" />
        <el-table-column prop="name"   label="模板名稱"  min-width="160" />
        <el-table-column label="表單類型"  width="130">
          <template #default="{ row }">{{ formTypeLabel(row.formType) }}</template>
        </el-table-column>
        <el-table-column label="審批路徑"  width="110">
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

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total" :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- ═══ 基本資訊 Dialog ═══ -->
    <el-dialog v-model="editVisible" :title="editingId ? '編輯審批模板' : '新增審批模板'" width="540px" @closed="resetEdit">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="模板名稱" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
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
          <div class="field-hint">數字越小越優先（同條件多模板時取最小值）</div>
        </el-form-item>
        <el-form-item label="適用金額下限">
          <el-input-number v-model="editForm.minAmount" :min="0" placeholder="不限" style="width:100%" />
        </el-form-item>
        <el-form-item label="適用金額上限">
          <el-input-number v-model="editForm.maxAmount" :min="0" placeholder="不限" style="width:100%" />
        </el-form-item>
        <el-form-item label="狀態">
          <el-switch v-model="editForm.isActive" active-text="啟用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSave">確定</el-button>
      </template>
    </el-dialog>

    <!-- ═══ 步驟設定 Drawer ═══ -->
    <el-drawer
      v-model="stepsVisible"
      :title="`步驟設定 — ${stepsTemplate?.name ?? ''}`"
      size="720px"
      direction="rtl"
      @closed="resetSteps"
    >
      <div class="steps-help">
        <el-alert type="info" :closable="false">
          <template #title>
            <b>串簽</b>：步驟中只有一位審批人，或 <code>approvalMode=any</code>（任一人通過即可）。
            <b>並簽</b>：步驟中有多位審批人且 <code>approvalMode=all</code>（所有人都需簽）。
            每個步驟可各自設定。
          </template>
        </el-alert>
      </div>

      <div class="steps-toolbar">
        <el-button type="primary" :icon="Plus" size="small" @click="addStep">新增步驟</el-button>
        <span class="steps-hint">共 {{ editSteps.length }} 個步驟</span>
      </div>

      <el-empty v-if="editSteps.length === 0" description="尚無步驟，請點擊「新增步驟」" :image-size="80" />

      <div v-for="(step, si) in editSteps" :key="si" class="step-card">
        <!-- Step header -->
        <div class="step-header">
          <span class="step-num">步驟 {{ si + 1 }}</span>
          <el-input v-model="step.stepName" size="small" placeholder="步驟名稱" class="step-name-input" />
          <div class="step-header-actions">
            <el-button text size="small" :disabled="si === 0" @click="moveStep(si, -1)">↑</el-button>
            <el-button text size="small" :disabled="si === editSteps.length - 1" @click="moveStep(si, 1)">↓</el-button>
            <el-button text size="small" type="danger" @click="removeStep(si)">刪除</el-button>
          </div>
        </div>

        <!-- Step settings row -->
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
            <span class="setting-hint">審批人可臨時新增加簽節點</span>
          </div>
        </div>

        <!-- Approvers list -->
        <div class="approvers-section">
          <div class="approvers-header">
            <span class="approvers-title">審批人設定</span>
            <el-button text size="small" type="primary" :icon="Plus" @click="addApprover(si)">新增審批人</el-button>
          </div>

          <div v-for="(apv, ai) in step.approvers" :key="ai" class="approver-row">
            <span class="approver-seq">{{ ai + 1 }}</span>

            <!-- Approver type -->
            <el-select v-model="apv.approverType" size="small" style="width:200px" @change="onApproverTypeChange(apv)">
              <el-option-group v-for="g in APPROVER_GROUPS" :key="g.label" :label="g.label">
                <el-option
                  v-for="opt in g.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-option-group>
            </el-select>

            <!-- Scope config — dynamic based on type -->
            <template v-if="needsProjectScope(apv.approverType)">
              <el-select v-model="apv.scopeConfig.projectResolution" size="small" style="width:160px">
                <el-option value="applicant_project" label="申請人所在項目" />
                <el-option value="specific_project"  label="指定項目" />
              </el-select>
              <el-select
                v-if="apv.scopeConfig.projectResolution === 'specific_project'"
                v-model="apv.scopeConfig.projectId"
                size="small" filterable
                style="width:160px"
                placeholder="選擇項目"
              >
                <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </template>

            <template v-else-if="needsCompanyScope(apv.approverType)">
              <el-select v-model="apv.scopeConfig.companyResolution" size="small" style="width:160px">
                <el-option value="applicant_company" label="申請人所在公司" />
                <el-option value="specific_company"  label="指定公司" />
              </el-select>
              <el-select
                v-if="apv.scopeConfig.companyResolution === 'specific_company'"
                v-model="apv.scopeConfig.companyId"
                size="small" filterable
                style="width:160px"
                placeholder="選擇公司"
              >
                <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </template>

            <template v-else-if="needsBUScope(apv.approverType)">
              <el-select v-model="apv.scopeConfig.buResolution" size="small" style="width:160px">
                <el-option value="applicant_bu"  label="申請人所在事業部" />
                <el-option value="specific_bu"   label="指定事業部" />
              </el-select>
              <el-select
                v-if="apv.scopeConfig.buResolution === 'specific_bu'"
                v-model="apv.scopeConfig.businessUnitId"
                size="small" filterable
                style="width:160px"
                placeholder="選擇事業部"
              >
                <el-option v-for="b in businessUnits" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </template>

            <template v-else-if="apv.approverType === 'user'">
              <el-select
                v-model="apv.approverUserId"
                size="small" filterable remote
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                style="width:200px"
                placeholder="搜尋並指定人員"
              >
                <el-option v-for="u in userSearchResults" :key="u.id" :label="`${u.displayName} (${u.employeeNo})`" :value="u.id" />
              </el-select>
            </template>

            <template v-else-if="apv.approverType === 'role'">
              <el-select v-model="apv.approverRoleCode" size="small" style="width:200px" placeholder="選擇系統角色">
                <el-option v-for="r in systemRoles" :key="r.code" :label="r.name" :value="r.code" />
              </el-select>
            </template>

            <el-button
              v-if="step.approvers.length > 1"
              text size="small" type="danger"
              style="margin-left:auto"
              @click="removeApprover(si, ai)"
            >移除</el-button>
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
import { rolesApi } from '@/api/roles.api'
import { companiesApi, businessUnitsApi, projectsApi } from '@/api/organizations.api'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const { t } = useI18n()
const ui = useUiStore()

// ── 常數 ────────────────────────────────────────────────

const FORM_TYPE_OPTIONS = [
  { value: 'leave_request',       label: '請假申請'     },
  { value: 'overtime_request',    label: '加班申請'     },
  { value: 'clock_patch_request', label: '補卡申請'     },
  { value: 'leave_without_pay',   label: '留職停薪申請'  },
  { value: 'resignation',         label: '離職申請'     },
  { value: 'meal_allowance',      label: '誤餐費申請'   },
  { value: 'it_request',          label: '資訊需求申請'  },
  { value: 'asset_request',       label: 'OA 資產申請'  },
  { value: 'headcount_request',   label: '人力需求申請'  },
  { value: 'purchase_request',    label: '採購申請'     },
  { value: 'reimbursement_request', label: '費用報銷'   },
  { value: 'payroll_request',     label: '薪資申請'     },
  { value: 'business_trip',       label: '出差申請'     },
]

const ROUTE_TYPE_OPTIONS = [
  { value: 'group_org',  label: '集團業務組織' },
  { value: 'office_org', label: '辦公室組織'   },
  { value: 'mixed',      label: '混合模式'     },
  { value: 'custom',     label: '自訂'         },
]

// 審批人類型分組
const APPROVER_GROUPS = [
  {
    label: '動態解析型（從組織結構自動找人）',
    options: [
      { value: 'applicant_direct_manager', label: '申請人直屬主管' },
      { value: 'department_manager',       label: '部門主管' },
      { value: 'project_owner',            label: '項目負責人' },
      { value: 'business_unit_head',       label: '事業部負責人' },
    ],
  },
  {
    label: '職能角色型（從員工審批職能角色設定解析）',
    options: [
      { value: 'company_hr',              label: '公司人事專員' },
      { value: 'company_hr_manager',      label: '公司人事主管' },
      { value: 'company_finance',         label: '公司財務人員' },
      { value: 'company_finance_manager', label: '公司財務主管' },
      { value: 'group_hr',                label: '集團人事人員' },
      { value: 'group_finance',           label: '集團財務人員' },
    ],
  },
  {
    label: '固定指定型',
    options: [
      { value: 'user', label: '指定人員' },
      { value: 'role', label: '指定系統角色' },
    ],
  },
]

// 需要範圍設定的審批人類型
const PROJECT_SCOPE_TYPES  = ['project_owner']
const COMPANY_SCOPE_TYPES  = ['company_hr','company_hr_manager','company_finance','company_finance_manager']
const BU_SCOPE_TYPES       = ['business_unit_head']

function needsProjectScope (t: string) { return PROJECT_SCOPE_TYPES.includes(t) }
function needsCompanyScope (t: string) { return COMPANY_SCOPE_TYPES.includes(t) }
function needsBUScope      (t: string) { return BU_SCOPE_TYPES.includes(t) }

// ── Org data for scope selectors ─────────────────────────
const companies    = ref<any[]>([])
const businessUnits = ref<any[]>([])
const projects     = ref<any[]>([])
const systemRoles  = ref<any[]>([])

async function loadOrgData() {
  const [c, b, p, r] = await Promise.all([
    companiesApi.getAll(),
    businessUnitsApi.getAll(),
    projectsApi.getAll(),
    rolesApi.getAll(),
  ])
  companies.value     = c
  businessUnits.value = b
  projects.value      = p
  systemRoles.value   = r
}

// ── User search ───────────────────────────────────────────
const userSearchLoading = ref(false)
const userSearchResults = ref<any[]>([])

async function searchUsers(q: string) {
  if (!q) return
  userSearchLoading.value = true
  try {
    const res = await usersApi.getAll({ search: q, limit: 20 })
    userSearchResults.value = res.items ?? []
  } finally {
    userSearchLoading.value = false
  }
}

// ── Table ─────────────────────────────────────────────────
const formTypeFilter = ref('')
const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } =
  useTable<any>({ fetchFn: (p) => approvalsApi.getTemplates(p as any) })

onMounted(() => {
  ui.setBreadcrumbs([{ title: t('nav.systemModule') }, { title: t('nav.workflows') }])
  fetch()
  loadOrgData()
})

function onFilter() {
  pagination.page = 1
  fetch({ formType: formTypeFilter.value || undefined })
}

function formTypeLabel(type: string) { return FORM_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type }
function routeTypeLabel(type: string) { return ROUTE_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type }

// ── 基本資訊 Dialog ───────────────────────────────────────
const editVisible = ref(false)
const editSaving  = ref(false)
const editFormRef = ref<FormInstance>()
const editingId   = ref('')

const editForm = reactive({
  name: '', formType: '', approvalRouteType: 'group_org',
  priority: 100, minAmount: null as number | null,
  maxAmount: null as number | null, isActive: true,
})

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
    if (editingId.value) {
      await approvalsApi.updateTemplate(editingId.value, editForm)
    } else {
      await approvalsApi.createTemplate(editForm)
    }
    ElMessage.success('儲存成功')
    editVisible.value = false
    fetch({ formType: formTypeFilter.value || undefined })
  } catch {
    ElMessage.error('儲存失敗')
  } finally {
    editSaving.value = false
  }
}

// ── 步驟設定 Drawer ───────────────────────────────────────
const stepsVisible  = ref(false)
const stepsSaving   = ref(false)
const stepsTemplate = ref<any>(null)

interface EditStep {
  stepName:           string
  approvalMode:       string
  isRequired:         boolean
  allowDynamicAdding: boolean
  approvers:          EditApprover[]
}

interface EditApprover {
  approverType:     string
  approverUserId?:  string
  approverRoleCode?: string
  scopeConfig:      Record<string, any>
}

const editSteps = ref<EditStep[]>([])

function makeDefaultApprover(): EditApprover {
  return { approverType: 'applicant_direct_manager', scopeConfig: {} }
}

function openSteps(row: any) {
  stepsTemplate.value = row
  editSteps.value = (row.steps ?? [])
    .slice()
    .sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    .map((s: any) => ({
      stepName:           s.stepName,
      approvalMode:       s.approvalMode ?? 'any',
      isRequired:         s.isRequired ?? true,
      allowDynamicAdding: s.allowDynamicAdding ?? false,
      approvers:          (s.approvers?.length ? s.approvers : [{ approverType: 'applicant_direct_manager' }])
        .map((a: any) => ({
          approverType:     a.approverType,
          approverUserId:   a.approverUserId ?? undefined,
          approverRoleCode: a.approverRoleCode ?? undefined,
          scopeConfig:      a.scopeConfig ?? {},
        })),
    }))
  stepsVisible.value = true
}

function resetSteps() { stepsTemplate.value = null; editSteps.value = [] }

function addStep() {
  editSteps.value.push({
    stepName: `步驟 ${editSteps.value.length + 1}`,
    approvalMode: 'any',
    isRequired: true,
    allowDynamicAdding: false,
    approvers: [makeDefaultApprover()],
  })
}

function removeStep(i: number) { editSteps.value.splice(i, 1) }

function moveStep(i: number, dir: -1 | 1) {
  const arr = editSteps.value, j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

function addApprover(si: number) {
  editSteps.value[si].approvers.push(makeDefaultApprover())
}

function removeApprover(si: number, ai: number) {
  editSteps.value[si].approvers.splice(ai, 1)
}

function onApproverTypeChange(apv: EditApprover) {
  apv.scopeConfig = {}
  apv.approverUserId  = undefined
  apv.approverRoleCode = undefined
  // Set sensible defaults for scope
  if (needsProjectScope(apv.approverType))  apv.scopeConfig.projectResolution = 'applicant_project'
  if (needsCompanyScope(apv.approverType))  apv.scopeConfig.companyResolution  = 'applicant_company'
  if (needsBUScope(apv.approverType))       apv.scopeConfig.buResolution       = 'applicant_bu'
}

async function handleStepsSave() {
  if (!stepsTemplate.value) return

  for (const [i, s] of editSteps.value.entries()) {
    if (!s.stepName.trim()) { ElMessage.warning(`步驟 ${i + 1} 名稱不能為空`); return }
    if (!s.approvers.length) { ElMessage.warning(`步驟 ${i + 1} 至少需要一個審批人`); return }
    for (const apv of s.approvers) {
      if (apv.approverType === 'user' && !apv.approverUserId) {
        ElMessage.warning(`步驟 ${i + 1} 有「指定人員」審批人尚未選擇`); return
      }
      if (apv.approverType === 'role' && !apv.approverRoleCode) {
        ElMessage.warning(`步驟 ${i + 1} 有「指定角色」審批人尚未選擇`); return
      }
    }
  }

  stepsSaving.value = true
  try {
    const payload: StepPayload[] = editSteps.value.map((s, i) => ({
      stepOrder:          i + 1,
      stepName:           s.stepName.trim(),
      approvalMode:       s.approvalMode,
      isRequired:         s.isRequired,
      allowDynamicAdding: s.allowDynamicAdding,
      approvers:          s.approvers.map(a => ({
        approverType:     a.approverType,
        approverUserId:   a.approverUserId   || undefined,
        approverRoleCode: a.approverRoleCode || undefined,
        scopeConfig:      Object.keys(a.scopeConfig).length ? a.scopeConfig : undefined,
      } as ApproverConfig)),
    }))
    await approvalsApi.replaceSteps(stepsTemplate.value.id, payload)
    ElMessage.success('步驟儲存成功')
    stepsVisible.value = false
    fetch({ formType: formTypeFilter.value || undefined })
  } catch {
    ElMessage.error('儲存失敗')
  } finally {
    stepsSaving.value = false
  }
}
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.page-header h2 { font-size:20px; font-weight:600; margin:0; }
.toolbar { display:flex; gap:12px; margin-bottom:16px; }
.pagination { margin-top:16px; justify-content:flex-end; }
.field-hint { font-size:12px; color:#909399; margin-top:4px; }

/* Steps */
.steps-help  { margin-bottom:16px; }
.steps-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.steps-hint  { font-size:13px; color:#606266; }

.step-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 14px;
  background: #fafafa;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.step-num { font-size:13px; font-weight:700; color:#1D4ED8; min-width:48px; }
.step-name-input { flex:1; }
.step-header-actions { display:flex; gap:4px; margin-left:auto; }

.step-settings {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
.step-setting-item { display:flex; align-items:center; gap:8px; }
.setting-label { font-size:13px; color:#606266; min-width:64px; }
.setting-hint  { font-size:12px; color:#909399; }

.approvers-section { margin-top: 4px; }
.approvers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.approvers-title { font-size:13px; font-weight:600; color:#303133; }

.approver-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.approver-seq {
  font-size:12px;
  color:#909399;
  min-width:20px;
  text-align:center;
}
</style>
