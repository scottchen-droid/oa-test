<template>
  <div>
    <div class="page-header">
      <h2>電子表單設定</h2>
    </div>

    <!-- 表單定義列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表單定義列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="definitions" border stripe>
        <el-table-column label="表單名稱" prop="name" min-width="140" />
        <el-table-column label="類型代碼" prop="formType" min-width="150">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.formType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分類" prop="category" width="110">
          <template #default="{ row }">
            <el-tag size="small">{{ CATEGORY_LABELS[row.category] ?? row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申請對象" min-width="120">
          <template #default="{ row }">
            <span>{{ permCountMap[row.id] ?? 0 }} 條規則</span>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'danger'" size="small">
              {{ row.isEnabled ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">編輯基本設定</el-button>
            <el-button size="small" type="primary" @click="openPermDialog(row)">設定申請對象</el-button>
            <el-button
              size="small"
              :type="row.isEnabled ? 'warning' : 'success'"
              :loading="togglingId === row.id"
              @click="toggleEnabled(row)"
            >
              {{ row.isEnabled ? '停用' : '啟用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 編輯基本設定 Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="編輯基本設定"
      width="480px"
      :close-on-click-modal="false"
      @closed="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <el-form-item label="表單名稱" prop="name">
          <el-input v-model="editForm.name" placeholder="請輸入表單名稱" />
        </el-form-item>
        <el-form-item label="分類" prop="category">
          <el-select v-model="editForm.category" style="width:100%">
            <el-option
              v-for="opt in CATEGORY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="說明" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="2" placeholder="選填" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="editForm.sortOrder" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="是否啟用">
          <el-switch v-model="editForm.isEnabled" />
        </el-form-item>
        <el-form-item label="允許草稿">
          <el-switch v-model="editForm.allowDraft" />
        </el-form-item>
        <el-form-item label="允許填寫模板">
          <el-switch v-model="editForm.allowFillTemplate" />
        </el-form-item>
        <el-form-item label="允許複製歷史">
          <el-switch v-model="editForm.allowCopyHistory" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveEdit">儲存</el-button>
      </template>
    </el-dialog>

    <!-- 設定申請對象 Dialog -->
    <el-dialog
      v-model="permDialogVisible"
      :title="`設定申請對象 — ${permTargetDef?.name ?? ''}`"
      width="520px"
      :close-on-click-modal="false"
      @opened="loadPermissions"
      @closed="resetPermForm"
    >
      <div v-loading="permLoading">
        <!-- 現有規則列表 -->
        <div v-if="permRules.length > 0" class="perm-list">
          <div
            v-for="(rule, idx) in permRules"
            :key="idx"
            class="perm-rule-row"
          >
            <el-tag type="info" size="small" class="perm-type-tag">
              {{ TARGET_TYPE_LABELS[rule.targetType] ?? rule.targetType }}
            </el-tag>
            <span v-if="rule.targetName" class="perm-name">{{ rule.targetName }}</span>
            <span v-else-if="rule.targetId" class="perm-name perm-id">{{ rule.targetId }}</span>
            <span v-else class="perm-name">（全體員工）</span>
            <el-button
              size="small"
              type="danger"
              text
              @click="removePermRule(idx)"
            >
              刪除
            </el-button>
          </div>
        </div>
        <div v-else class="perm-empty">尚無規則，點擊下方新增</div>

        <el-divider />

        <!-- 新增規則表單 -->
        <div class="perm-add-form">
          <el-form :model="newRule" label-width="80px">
            <el-form-item label="對象類型">
              <el-select v-model="newRule.targetType" style="width:160px" @change="onTargetTypeChange">
                <el-option
                  v-for="opt in TARGET_TYPE_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>

            <!-- 指定角色 -->
            <el-form-item v-if="newRule.targetType === 'role'" label="選擇角色">
              <el-select
                v-model="newRule.targetId"
                placeholder="請選擇角色"
                style="width:280px"
                filterable
              >
                <el-option
                  v-for="r in roleOptions"
                  :key="r.id"
                  :label="`${r.name}（${r.code}）`"
                  :value="r.id"
                />
              </el-select>
            </el-form-item>

            <!-- 指定人員 (remote search) -->
            <el-form-item v-else-if="newRule.targetType === 'user'" label="搜尋人員">
              <el-select
                v-model="newRule.targetId"
                filterable
                remote
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                placeholder="輸入姓名或員工編號搜尋"
                style="width:280px"
                no-data-text="輸入關鍵字搜尋"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.id"
                  :label="`${u.displayName}（${u.employeeNo ?? u.email}）`"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>

            <!-- 指定公司 -->
            <el-form-item v-else-if="newRule.targetType === 'company'" label="選擇公司">
              <el-select
                v-model="newRule.targetId"
                placeholder="請選擇公司"
                style="width:280px"
                filterable
              >
                <el-option
                  v-for="c in companyOptions"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>

            <!-- 指定部門：先選公司（選填篩選）再選部門 -->
            <template v-else-if="newRule.targetType === 'department'">
              <el-form-item label="篩選公司">
                <el-select
                  v-model="newRule.filterCompanyId"
                  placeholder="選填，依公司篩選部門"
                  clearable
                  style="width:280px"
                  filterable
                  @change="onDeptCompanyChange"
                >
                  <el-option
                    v-for="c in companyOptions"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="選擇部門">
                <el-select
                  v-model="newRule.targetId"
                  placeholder="請選擇部門"
                  style="width:280px"
                  filterable
                  :loading="deptLoading"
                >
                  <el-option
                    v-for="d in departmentOptions"
                    :key="d.id"
                    :label="d.name"
                    :value="d.id"
                  />
                </el-select>
              </el-form-item>
            </template>
          </el-form>
          <el-button type="primary" size="small" :disabled="!canAddRule" @click="addPermRule">新增規則</el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="permSaving" @click="savePermissions">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { formDefinitionsApi, type FormDefinition, type FormPermissionRule } from '@/api/form-definitions.api'
import { rolesApi } from '@/api/roles.api'
import { usersApi } from '@/api/users.api'
import { companiesApi, departmentsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'

const { t } = useI18n()
const ui = useUiStore()
ui.setBreadcrumbs([{ title: t('nav.systemModule') }, { title: t('nav.formDefinitions') }])

// ─── 常數 ──────────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  business: '商務',
  contract: '合同',
  finance: '財務',
  administration: '行政',
  pmo: 'PMO',
  hr: 'HR',
}

const CATEGORY_OPTIONS = [
  { value: 'business', label: '商務' },
  { value: 'contract', label: '合同' },
  { value: 'finance', label: '財務' },
  { value: 'administration', label: '行政' },
  { value: 'pmo', label: 'PMO' },
  { value: 'hr', label: 'HR' },
]

const TARGET_TYPE_LABELS: Record<string, string> = {
  all: '全體員工',
  company: '指定公司',
  department: '指定部門',
  role: '指定角色',
  user: '指定人員',
}

const TARGET_TYPE_OPTIONS = [
  { value: 'all', label: '全體員工' },
  { value: 'company', label: '指定公司' },
  { value: 'department', label: '指定部門' },
  { value: 'role', label: '指定角色' },
  { value: 'user', label: '指定人員' },
]

// ─── 列表狀態 ──────────────────────────────────────────────────────────────────
const loading = ref(false)
const definitions = ref<FormDefinition[]>([])
const permCountMap = ref<Record<string, number>>({})
const togglingId = ref<string | null>(null)

onMounted(async () => {
  await loadDefinitions()
})

async function loadDefinitions() {
  loading.value = true
  try {
    definitions.value = await formDefinitionsApi.adminList()
  } catch {
    ElMessage.error('載入表單定義失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}

// ─── 啟用 / 停用 ───────────────────────────────────────────────────────────────
async function toggleEnabled(row: FormDefinition) {
  togglingId.value = row.id
  try {
    const updated = await formDefinitionsApi.adminUpdate(row.id, { isEnabled: !row.isEnabled })
    const idx = definitions.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      definitions.value = [
        ...definitions.value.slice(0, idx),
        updated,
        ...definitions.value.slice(idx + 1),
      ]
    }
    ElMessage.success('狀態已更新')
  } catch {
    ElMessage.error('更新失敗，請稍後再試')
  } finally {
    togglingId.value = null
  }
}

// ─── 編輯基本設定 Dialog ────────────────────────────────────────────────────────
interface EditForm {
  name: string
  category: string
  description: string
  sortOrder: number
  isEnabled: boolean
  allowDraft: boolean
  allowFillTemplate: boolean
  allowCopyHistory: boolean
}

const editDialogVisible = ref(false)
const editSaving = ref(false)
const editFormRef = ref<FormInstance>()
const editTargetId = ref<string>('')
const editForm = ref<EditForm>({
  name: '',
  category: 'business',
  description: '',
  sortOrder: 0,
  isEnabled: true,
  allowDraft: true,
  allowFillTemplate: true,
  allowCopyHistory: true,
})

const editRules: FormRules = {
  name: [{ required: true, message: '請填寫表單名稱', trigger: 'blur' }],
  category: [{ required: true, message: '請選擇分類', trigger: 'change' }],
}

function openEditDialog(row: FormDefinition) {
  editTargetId.value = row.id
  editForm.value = {
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    sortOrder: row.sortOrder,
    isEnabled: row.isEnabled,
    allowDraft: row.allowDraft,
    allowFillTemplate: row.allowFillTemplate,
    allowCopyHistory: row.allowCopyHistory,
  }
  editDialogVisible.value = true
}

function resetEditForm() {
  editTargetId.value = ''
  editFormRef.value?.resetFields()
}

async function saveEdit() {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    editSaving.value = true
    try {
      const updated = await formDefinitionsApi.adminUpdate(editTargetId.value, {
        name: editForm.value.name,
        category: editForm.value.category,
        description: editForm.value.description || undefined,
        sortOrder: editForm.value.sortOrder,
        isEnabled: editForm.value.isEnabled,
        allowDraft: editForm.value.allowDraft,
        allowFillTemplate: editForm.value.allowFillTemplate,
        allowCopyHistory: editForm.value.allowCopyHistory,
      })
      const idx = definitions.value.findIndex(d => d.id === editTargetId.value)
      if (idx !== -1) {
        definitions.value = [
          ...definitions.value.slice(0, idx),
          updated,
          ...definitions.value.slice(idx + 1),
        ]
      }
      ElMessage.success('設定已儲存')
      editDialogVisible.value = false
    } catch {
      ElMessage.error('儲存失敗，請稍後再試')
    } finally {
      editSaving.value = false
    }
  })
}

// ─── 設定申請對象 Dialog ────────────────────────────────────────────────────────
const permDialogVisible = ref(false)
const permLoading = ref(false)
const permSaving = ref(false)
const permTargetDef = ref<FormDefinition | null>(null)
const permRules = ref<FormPermissionRule[]>([])

interface NewRule {
  targetType: string
  targetId: string
  filterCompanyId: string  // 部門篩選用，不送後端
}
const newRule = ref<NewRule>({ targetType: 'all', targetId: '', filterCompanyId: '' })

// ─── 下拉選項資料 ──────────────────────────────────────────────────────────────
interface SimpleOption { id: string; name: string; code?: string; employeeNo?: string; email?: string; displayName?: string }
const roleOptions = ref<SimpleOption[]>([])
const companyOptions = ref<SimpleOption[]>([])
const departmentOptions = ref<SimpleOption[]>([])
const deptLoading = ref(false)
const userOptions = ref<SimpleOption[]>([])
const userSearchLoading = ref(false)

// 不能新增已有相同 targetType+targetId 的規則
const canAddRule = computed(() => {
  const { targetType, targetId } = newRule.value
  if (targetType === 'all') return !permRules.value.some(r => r.targetType === 'all')
  if (!targetId) return false
  return !permRules.value.some(r => r.targetType === targetType && r.targetId === targetId)
})

async function loadSelectOptions() {
  const [roles, companies] = await Promise.all([
    rolesApi.getAll().catch(() => []),
    companiesApi.getAll({ isActive: true }).catch(() => []),
  ])
  roleOptions.value = roles.map((r: { id: string; name: string; code: string }) => ({
    id: r.id, name: r.name, code: r.code,
  }))
  companyOptions.value = companies.map((c: { id: string; name: string }) => ({
    id: c.id, name: c.name,
  }))
  // 預載全部部門（未選公司時顯示）
  await loadDepartments(undefined)
}

async function loadDepartments(companyId: string | undefined) {
  deptLoading.value = true
  try {
    const depts = await departmentsApi.getTree(companyId)
    departmentOptions.value = depts.map((d: { id: string; name: string }) => ({
      id: d.id, name: d.name,
    }))
  } catch {
    departmentOptions.value = []
  } finally {
    deptLoading.value = false
  }
}

async function searchUsers(keyword: string) {
  if (!keyword.trim()) {
    userOptions.value = []
    return
  }
  userSearchLoading.value = true
  try {
    const result = await usersApi.getAll({ search: keyword, limit: 15 })
    const items = Array.isArray(result) ? result : (result as { items?: SimpleOption[] }).items ?? []
    userOptions.value = items.map((u: { id: string; displayName: string; employeeNo?: string; email?: string }) => ({
      id: u.id, name: u.displayName, displayName: u.displayName,
      employeeNo: u.employeeNo, email: u.email,
    }))
  } catch {
    userOptions.value = []
  } finally {
    userSearchLoading.value = false
  }
}

function onTargetTypeChange() {
  newRule.value = { ...newRule.value, targetId: '', filterCompanyId: '' }
  userOptions.value = []
}

async function onDeptCompanyChange(companyId: string) {
  newRule.value = { ...newRule.value, targetId: '' }
  await loadDepartments(companyId || undefined)
}

// 取得目前 newRule 選定目標的顯示名稱（用於加入 permRules 時顯示）
function getSelectedTargetName(): string | undefined {
  const { targetType, targetId } = newRule.value
  if (targetType === 'all' || !targetId) return undefined
  if (targetType === 'role') {
    const r = roleOptions.value.find(o => o.id === targetId)
    return r ? `${r.name}（${r.code}）` : undefined
  }
  if (targetType === 'user') {
    const u = userOptions.value.find(o => o.id === targetId)
    return u ? `${u.displayName}（${u.employeeNo ?? u.email}）` : undefined
  }
  if (targetType === 'company') {
    return companyOptions.value.find(o => o.id === targetId)?.name
  }
  if (targetType === 'department') {
    return departmentOptions.value.find(o => o.id === targetId)?.name
  }
  return undefined
}

function openPermDialog(row: FormDefinition) {
  permTargetDef.value = row
  permRules.value = []
  newRule.value = { targetType: 'all', targetId: '', filterCompanyId: '' }
  userOptions.value = []
  permDialogVisible.value = true
}

async function loadPermissions() {
  if (!permTargetDef.value) return
  permLoading.value = true
  try {
    await loadSelectOptions()
    permRules.value = await formDefinitionsApi.getPermissions(permTargetDef.value.id)
  } catch {
    ElMessage.error('載入權限設定失敗')
  } finally {
    permLoading.value = false
  }
}

function resetPermForm() {
  permTargetDef.value = null
  permRules.value = []
  newRule.value = { targetType: 'all', targetId: '', filterCompanyId: '' }
  roleOptions.value = []
  companyOptions.value = []
  departmentOptions.value = []
  userOptions.value = []
}

function addPermRule() {
  const { targetType, targetId } = newRule.value
  permRules.value = [
    ...permRules.value,
    {
      targetType,
      targetId: targetType === 'all' ? undefined : targetId,
      targetName: getSelectedTargetName(),
    },
  ]
  newRule.value = { targetType, targetId: '', filterCompanyId: '' }
  userOptions.value = []
}

function removePermRule(idx: number) {
  permRules.value = permRules.value.filter((_, i) => i !== idx)
}

async function savePermissions() {
  if (!permTargetDef.value) return
  permSaving.value = true
  try {
    const rules = permRules.value.map(r => ({
      targetType: r.targetType,
      targetId: r.targetId,
    }))
    const saved = await formDefinitionsApi.setPermissions(permTargetDef.value.id, rules)
    permCountMap.value = {
      ...permCountMap.value,
      [permTargetDef.value.id]: saved.length,
    }
    ElMessage.success('申請對象設定已儲存')
    permDialogVisible.value = false
  } catch {
    ElMessage.error('儲存失敗，請稍後再試')
  } finally {
    permSaving.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
}

.perm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.perm-rule-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.perm-type-tag { flex-shrink: 0; }

.perm-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.perm-id { color: #909399; font-family: monospace; font-size: 12px; }

.perm-empty {
  text-align: center;
  color: #909399;
  padding: 16px 0;
  font-size: 13px;
}

.perm-add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
