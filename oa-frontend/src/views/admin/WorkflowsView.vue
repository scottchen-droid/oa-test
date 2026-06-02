<template>
  <div>
    <div class="page-header">
      <h2>審批流設定</h2>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select
          v-model="formTypeFilter"
          placeholder="表單類型篩選"
          clearable
          style="width: 180px"
          @change="onFilter"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="opt in FORM_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="code" label="模板代碼" width="160" />
        <el-table-column prop="name" label="模板名稱" min-width="160" />
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
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '啟用' : '停用' }}
            </el-tag>
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
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- ═══ 編輯基本資訊 Dialog ═══ -->
    <el-dialog v-model="editVisible" title="編輯審批模板" width="520px" @closed="resetEdit">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="模板名稱" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="表單類型" prop="formType">
          <el-select v-model="editForm.formType" style="width: 100%">
            <el-option
              v-for="opt in FORM_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="審批路徑" prop="approvalRouteType">
          <el-select v-model="editForm.approvalRouteType" style="width: 100%">
            <el-option
              v-for="opt in ROUTE_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="優先序" prop="priority">
          <el-input-number v-model="editForm.priority" :min="1" :max="9999" style="width: 140px" />
          <span class="field-hint">數字越小優先套用</span>
        </el-form-item>
        <el-form-item label="最低金額">
          <el-input-number
            v-model="editForm.minAmount"
            :min="0"
            :precision="2"
            :controls="false"
            placeholder="不限"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="最高金額">
          <el-input-number
            v-model="editForm.maxAmount"
            :min="0"
            :precision="2"
            :controls="false"
            placeholder="不限"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="狀態">
          <el-switch
            v-model="editForm.isActive"
            active-text="啟用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSave">儲存</el-button>
      </template>
    </el-dialog>

    <!-- ═══ 步驟設定 Dialog ═══ -->
    <el-dialog
      v-model="stepsVisible"
      :title="`步驟設定 — ${stepsTemplate?.name ?? ''}`"
      width="780px"
      @closed="resetSteps"
    >
      <div class="steps-toolbar">
        <el-button type="primary" :icon="Plus" size="small" @click="addStep">新增步驟</el-button>
        <span class="steps-hint">共 {{ editSteps.length }} 個步驟</span>
      </div>

      <el-table :data="editSteps" border>
        <el-table-column label="步驟" width="60" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>

        <el-table-column label="節點名稱" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.stepName" size="small" placeholder="如：直屬主管審核" />
          </template>
        </el-table-column>

        <el-table-column label="審批人類型" width="200">
          <template #default="{ row }">
            <el-select v-model="row.approverType" size="small" style="width: 100%">
              <el-option
                v-for="opt in APPROVER_TYPE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="通過條件" width="160">
          <template #default="{ row }">
            <el-select v-model="row.approvalMode" size="small" style="width: 100%">
              <el-option
                v-for="opt in APPROVAL_MODE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button
              text
              size="small"
              :disabled="$index === 0"
              @click="moveStep($index, -1)"
            >↑</el-button>
            <el-button
              text
              size="small"
              :disabled="$index === editSteps.length - 1"
              @click="moveStep($index, 1)"
            >↓</el-button>
            <el-button
              text
              size="small"
              type="danger"
              @click="removeStep($index)"
            >刪除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="editSteps.length === 0" description="尚無步驟，請點擊「新增步驟」" :image-size="80" />

      <template #footer>
        <el-button @click="stepsVisible = false">取消</el-button>
        <el-button type="primary" :loading="stepsSaving" @click="handleStepsSave">儲存步驟</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { approvalsApi } from '@/api/approvals.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

// ── 常數 ────────────────────────────────────────────────
const FORM_TYPE_OPTIONS = [
  { value: 'leave_request',     label: '請假申請'     },
  { value: 'overtime_request',  label: '加班申請'     },
  { value: 'clock_patch_request', label: '補卡申請'   },
  { value: 'leave_without_pay', label: '留職停薪申請'  },
  { value: 'resignation',       label: '離職申請'     },
  { value: 'meal_allowance',    label: '誤餐費申請'   },
  { value: 'it_request',        label: '資訊需求申請'  },
  { value: 'asset_request',     label: 'OA 資產申請'  },
  { value: 'headcount_request', label: '人力需求申請'  },
  { value: 'purchase_request',  label: '採購申請'     },
  { value: 'reimbursement_request', label: '費用報銷' },
  { value: 'payroll_request',   label: '薪資申請'     },
  { value: 'business_trip',     label: '出差申請'     },
]

const ROUTE_TYPE_OPTIONS = [
  { value: 'group_org',   label: '集團業務組織'  },
  { value: 'office_org',  label: '辦公室組織'    },
  { value: 'mixed',       label: '混合模式'      },
  { value: 'custom',      label: '自訂'          },
]

const APPROVER_TYPE_OPTIONS = [
  { value: 'applicant_direct_manager', label: '申請人直屬主管'  },
  { value: 'department_manager',       label: '部門主管'        },
  { value: 'project_owner',            label: '項目負責人'      },
  { value: 'business_unit_head',       label: '事業部負責人'    },
  { value: 'company_hr',               label: '公司 HR'         },
  { value: 'company_finance',          label: '公司財務'        },
  { value: 'company_head',             label: '公司負責人'      },
]

const APPROVAL_MODE_OPTIONS = [
  { value: 'any',      label: '任一人通過即可' },
  { value: 'all',      label: '全部人員通過'   },
  { value: 'majority', label: '超過半數通過'   },
]

// ── Table ────────────────────────────────────────────────
const ui = useUiStore()
const formTypeFilter = ref('')

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } =
  useTable<any>({
    fetchFn: (params) => approvalsApi.getTemplates(params as any),
  })

onMounted(() => {
  ui.setBreadcrumbs([{ title: '系統模塊' }, { title: '審批流設定' }])
  fetch()
})

function onFilter() {
  pagination.page = 1
  fetch({ formType: formTypeFilter.value || undefined })
}

function formTypeLabel(type: string) {
  return FORM_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
function routeTypeLabel(type: string) {
  return ROUTE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

// ── 編輯基本資訊 Dialog ─────────────────────────────────
const editVisible  = ref(false)
const editSaving   = ref(false)
const editFormRef  = ref<FormInstance>()
const editingId    = ref<string>('')

const editForm = reactive({
  name: '',
  formType: '',
  approvalRouteType: 'group_org',
  priority: 100,
  minAmount: null as number | null,
  maxAmount: null as number | null,
  isActive: true,
})

const editRules: FormRules = {
  name:             [{ required: true, message: '請輸入模板名稱', trigger: 'blur' }],
  formType:         [{ required: true, message: '請選擇表單類型', trigger: 'change' }],
  approvalRouteType:[{ required: true, message: '請選擇審批路徑', trigger: 'change' }],
  priority:         [{ required: true, message: '請輸入優先序',   trigger: 'blur'  }],
}

function openEdit(row: any) {
  editingId.value = row.id
  Object.assign(editForm, {
    name:              row.name,
    formType:          row.formType,
    approvalRouteType: row.approvalRouteType ?? 'group_org',
    priority:          row.priority ?? 100,
    minAmount:         row.minAmount ?? null,
    maxAmount:         row.maxAmount ?? null,
    isActive:          row.isActive ?? true,
  })
  editVisible.value = true
}

function resetEdit() {
  editFormRef.value?.resetFields()
  editingId.value = ''
}

async function handleEditSave() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  editSaving.value = true
  try {
    await approvalsApi.updateTemplate(editingId.value, {
      name:              editForm.name,
      formType:          editForm.formType,
      approvalRouteType: editForm.approvalRouteType,
      priority:          editForm.priority,
      minAmount:         editForm.minAmount ?? undefined,
      maxAmount:         editForm.maxAmount ?? undefined,
      isActive:          editForm.isActive,
    })
    ElMessage.success('儲存成功')
    editVisible.value = false
    fetch({ formType: formTypeFilter.value || undefined })
  } catch {
    ElMessage.error('儲存失敗')
  } finally {
    editSaving.value = false
  }
}

// ── 步驟設定 Dialog ──────────────────────────────────────
const stepsVisible  = ref(false)
const stepsSaving   = ref(false)
const stepsTemplate = ref<any>(null)

interface StepRow {
  stepName:     string
  approverType: string
  approvalMode: string
  isRequired:   boolean
}
const editSteps = ref<StepRow[]>([])

function openSteps(row: any) {
  stepsTemplate.value = row
  // Deep-copy existing steps, normalise shape
  editSteps.value = (row.steps ?? [])
    .slice()
    .sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    .map((s: any) => ({
      stepName:     s.stepName,
      approverType: s.approvers?.[0]?.approverType ?? 'applicant_direct_manager',
      approvalMode: s.approvalMode ?? 'any',
      isRequired:   s.isRequired ?? true,
    }))
  stepsVisible.value = true
}

function resetSteps() {
  stepsTemplate.value = null
  editSteps.value = []
}

function addStep() {
  editSteps.value.push({
    stepName:     `步驟 ${editSteps.value.length + 1}`,
    approverType: 'applicant_direct_manager',
    approvalMode: 'any',
    isRequired:   true,
  })
}

function removeStep(index: number) {
  editSteps.value.splice(index, 1)
}

function moveStep(index: number, dir: -1 | 1) {
  const arr   = editSteps.value
  const other = index + dir
  if (other < 0 || other >= arr.length) return
  ;[arr[index], arr[other]] = [arr[other], arr[index]]
}

async function handleStepsSave() {
  if (!stepsTemplate.value) return
  for (const [i, s] of editSteps.value.entries()) {
    if (!s.stepName.trim()) {
      ElMessage.warning(`步驟 ${i + 1} 的節點名稱不能為空`)
      return
    }
  }
  stepsSaving.value = true
  try {
    const payload = editSteps.value.map((s, i) => ({
      stepOrder:    i + 1,
      stepName:     s.stepName.trim(),
      approverType: s.approverType,
      approvalMode: s.approvalMode,
      isRequired:   s.isRequired,
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.field-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.steps-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.steps-hint {
  font-size: 13px;
  color: #606266;
}
</style>
