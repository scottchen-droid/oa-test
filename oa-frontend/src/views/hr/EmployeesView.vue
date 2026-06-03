<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('nav.employees') }}</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('employee.createEmployee') }}</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-input
          v-model="search"
          :placeholder="$t('users.searchPlaceholder')"
          clearable
          style="width: 260px"
          :prefix-icon="Search"
          @change="onSearch"
        />
        <el-select v-model="companyFilter" :placeholder="$t('employee.filterCompany')" clearable style="width: 180px" @change="onSearch">
          <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="statusFilter" :placeholder="$t('common.status')" clearable style="width: 140px" @change="onSearch">
          <el-option :label="$t('status.pending_activation')" value="pending_activation" />
          <el-option :label="$t('status.active')"             value="active" />
          <el-option :label="$t('status.suspended')"          value="suspended" />
          <el-option :label="$t('status.resigned')"           value="resigned" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="employeeNo" :label="$t('user.employeeNo')" width="120" />
        <el-table-column :label="$t('user.displayName')">
          <template #default="{ row }">
            <RouterLink :to="`/hr/employees/${row.id}`" class="name-link">{{ row.displayName }}</RouterLink>
            <div class="name-zh">{{ row.nameZh }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" />
        <el-table-column :label="$t('org.company')">
          <template #default="{ row }">
            {{ row.orgAssignments?.find((a: any) => a.isPrimary)?.company?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('org.department')">
          <template #default="{ row }">
            {{ row.orgAssignments?.find((a: any) => a.isPrimary)?.department?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('org.position')">
          <template #default="{ row }">
            {{ row.orgAssignments?.find((a: any) => a.isPrimary)?.position?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ $t(`status.${row.status}`) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('user.hireDate')" width="120">
          <template #default="{ row }">
            {{ row.employeeProfile?.hireDate ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="170" fixed="right">
          <template #default="{ row }">
            <RouterLink :to="`/hr/employees/${row.id}`">
              <el-button text size="small">{{ $t('common.detail') }}</el-button>
            </RouterLink>
            <el-button text size="small" type="primary" @click="openApproverRoles(row)">審批角色</el-button>
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

    <el-dialog v-model="dialogVisible" :title="$t('employee.createEmployee')" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-divider content-position="left">{{ $t('user.accountInfo') }}</el-divider>
        <el-form-item :label="$t('user.email')" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item :label="$t('user.displayName')" prop="displayName">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item :label="$t('user.nameZh')">
          <el-input v-model="form.nameZh" />
        </el-form-item>
        <el-form-item :label="$t('user.employeeNo')">
          <el-input v-model="form.employeeNo" />
        </el-form-item>

        <el-divider content-position="left">{{ $t('user.orgInfo') }}</el-divider>
        <el-form-item :label="$t('org.company')" prop="companyId">
          <el-select v-model="form.companyId" style="width: 100%" @change="loadDepts">
            <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('org.department')">
          <el-tree-select
            v-model="form.departmentId"
            :data="deptTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('org.position')">
          <el-select v-model="form.positionId" clearable style="width: 100%">
            <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('org.jobLevel')">
          <el-select v-model="form.jobLevelId" clearable style="width: 100%">
            <el-option v-for="j in jobLevels" :key="j.id" :label="j.name" :value="j.id" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">{{ $t('user.hrInfo') }}</el-divider>
        <el-form-item :label="$t('user.hireDate')" prop="hireDate">
          <el-date-picker v-model="form.hireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('user.employmentType')" prop="employmentType">
          <el-select v-model="form.employmentType" style="width: 100%">
            <el-option :label="$t('user.fullTime')"  value="full_time" />
            <el-option :label="$t('user.partTime')"  value="part_time" />
            <el-option :label="$t('user.contract')"  value="contract" />
            <el-option :label="$t('user.intern')"    value="intern" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 審批職能角色 Drawer ─────────────────────────── -->
    <el-drawer
      v-model="approverRolesDrawer"
      :title="`審批職能角色 — ${approverRolesEmployee?.displayName ?? ''}`"
      size="480px"
      direction="rtl"
    >
      <div v-if="approverRolesDrawer">
        <el-alert type="info" :closable="false" style="margin-bottom:14px">
          <template #title>
            每個職能角色在同一公司/集團層級只能有一人擔任。
            指派新人員時，若已有人持有，系統會提示轉移。
          </template>
        </el-alert>

        <!-- 新增表單 -->
        <el-card class="add-role-card" shadow="never">
          <template #header><span style="font-size:13px;font-weight:600">新增角色</span></template>
          <el-form :model="quickRoleForm" label-width="90px" size="small">
            <el-form-item label="職能角色">
              <el-select v-model="quickRoleForm.roleType" style="width:100%" @change="onQuickRoleChange">
                <el-option-group label="人事類">
                  <el-option value="hr_specialist" label="人事專員" />
                  <el-option value="hr_manager"    label="人事主管" />
                </el-option-group>
                <el-option-group label="財務類">
                  <el-option value="finance_specialist" label="財務人員" />
                  <el-option value="finance_manager"    label="財務主管" />
                </el-option-group>
                <el-option-group label="管理類">
                  <el-option value="company_head" label="公司負責人" />
                </el-option-group>
              </el-select>
            </el-form-item>
            <el-form-item label="層級">
              <el-radio-group v-model="quickRoleForm.scopeType" size="small" @change="quickRoleForm.scopeId = ''; quickRoleHolder = null">
                <el-radio-button value="company">公司層級</el-radio-button>
                <el-radio-button value="group">集團層級</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="quickRoleForm.scopeType === 'company'" label="所屬公司">
              <el-select v-model="quickRoleForm.scopeId" style="width:100%" @change="checkQuickRoleHolder">
                <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>

            <el-alert
              v-if="quickRoleHolder"
              type="warning"
              :closable="false"
              style="margin-bottom:8px"
            >
              <template #title>
                目前由 <strong>{{ quickRoleHolder.displayName }}（{{ quickRoleHolder.employeeNo }}）</strong> 擔任，儲存後將轉移。
              </template>
            </el-alert>

            <el-button
              :type="quickRoleHolder ? 'warning' : 'primary'"
              size="small"
              :loading="quickRoleSaving"
              @click="saveQuickRole"
            >
              {{ quickRoleHolder ? '確認轉移' : '指派' }}
            </el-button>
          </el-form>
        </el-card>

        <!-- 目前持有的角色 -->
        <div class="current-roles-title">目前角色</div>
        <el-table v-loading="approverRolesLoading" :data="approverRolesList" border size="small">
          <el-table-column label="職能角色" width="120">
            <template #default="{ row }">
              <el-tag :type="quickRoleTagType(row.roleType)" size="small">{{ ROLE_LABELS[row.roleType] ?? row.roleType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="層級" width="90">
            <template #default="{ row }">
              <el-tag :type="row.scopeType === 'group' ? 'warning' : ''" size="small">
                {{ row.scopeType === 'group' ? '集團' : '公司' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="公司">
            <template #default="{ row }">{{ row.company?.name ?? '（集團）' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="70" align="center">
            <template #default="{ row }">
              <el-button text size="small" type="danger" @click="removeQuickRole(row.id)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { employeesApi } from '@/api/employees.api'
import { approvalsApi } from '@/api/approvals.api'
import { companiesApi, departmentsApi, positionsApi, jobLevelsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import type { User, Company, Department, Position, JobLevel } from '@/types'

const { t } = useI18n()
const ui = useUiStore()
const search = ref('')
const statusFilter = ref('')
const companyFilter = ref('')

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<User>({
  fetchFn: (params) => employeesApi.getAll(params as Parameters<typeof employeesApi.getAll>[0]),
})

const companies = ref<Company[]>([])
const deptTree = ref<Department[]>([])
const positions = ref<Position[]>([])
const jobLevels = ref<JobLevel[]>([])

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  email: '', displayName: '', nameZh: '', employeeNo: '',
  companyId: '', departmentId: '', positionId: '', jobLevelId: '',
  hireDate: '', employmentType: 'full_time',
})

const rules: FormRules = {
  email: [{ required: true, message: t('common.required'), trigger: 'blur' }, { type: 'email', message: t('common.required'), trigger: 'blur' }],
  displayName: [{ required: true, message: t('common.required'), trigger: 'blur' }],
  companyId: [{ required: true, message: t('common.required'), trigger: 'change' }],
  hireDate: [{ required: true, message: t('common.required'), trigger: 'change' }],
  employmentType: [{ required: true, message: t('common.required'), trigger: 'change' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: t('nav.hrModule') }, { title: t('nav.employees') }])
  const [c, p, j] = await Promise.all([companiesApi.getAll(), positionsApi.getAll(), jobLevelsApi.getAll()])
  companies.value = c
  positions.value = p
  jobLevels.value = j
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ search: search.value || undefined, status: statusFilter.value || undefined, companyId: companyFilter.value || undefined })
}

async function loadDepts() {
  if (!form.companyId) return
  deptTree.value = await departmentsApi.getTree(form.companyId)
}

function openCreate() {
  Object.assign(form, {
    email: '', displayName: '', nameZh: '', employeeNo: '',
    companyId: '', departmentId: '', positionId: '', jobLevelId: '',
    hireDate: '', employmentType: 'full_time',
  })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await employeesApi.create({
      email: form.email,
      displayName: form.displayName,
      nameZh: form.nameZh || undefined,
      employeeNo: form.employeeNo || undefined,
      hireDate: form.hireDate,
      employmentType: form.employmentType,
      companyId: form.companyId || undefined,
      departmentId: form.departmentId || undefined,
      positionId: form.positionId || undefined,
      jobLevelId: form.jobLevelId || undefined,
    })
    ElMessage.success(t('msg.saveSuccess'))
    dialogVisible.value = false
    onSearch()
  } finally {
    saving.value = false
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending_activation: '待啟用', active: '啟用', suspended: '停用', resigned: '離職', terminated: '終止' }
  return map[status] ?? status
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = { active: 'success', pending_activation: 'warning', suspended: 'danger', resigned: 'info', terminated: 'info' }
  return map[status] ?? 'info'
}

// ── 審批職能角色 Quick Drawer ─────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  hr_specialist: '人事專員', hr_manager: '人事主管',
  finance_specialist: '財務人員', finance_manager: '財務主管',
  company_head: '公司負責人',
}

const approverRolesDrawer    = ref(false)
const approverRolesEmployee  = ref<User | null>(null)
const approverRolesLoading   = ref(false)
const approverRolesList      = ref<any[]>([])
const quickRoleSaving        = ref(false)
const quickRoleHolder        = ref<any>(null)

const quickRoleForm = reactive({ roleType: 'hr_specialist', scopeType: 'company', scopeId: '' })

function quickRoleTagType(type?: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const m: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    hr_specialist: '', hr_manager: 'success',
    finance_specialist: 'warning', finance_manager: 'danger', company_head: 'info',
  }
  return m[type ?? ''] ?? 'info'
}

async function openApproverRoles(row: User) {
  approverRolesEmployee.value = row
  quickRoleHolder.value = null
  Object.assign(quickRoleForm, { roleType: 'hr_specialist', scopeType: 'company', scopeId: '' })
  approverRolesDrawer.value = true
  await loadApproverRolesList()
}

async function loadApproverRolesList() {
  if (!approverRolesEmployee.value) return
  approverRolesLoading.value = true
  try {
    approverRolesList.value = await approvalsApi.getEmployeeApproverRoles(approverRolesEmployee.value.id)
  } finally {
    approverRolesLoading.value = false
  }
}

function onQuickRoleChange() { quickRoleHolder.value = null; checkQuickRoleHolder() }

async function checkQuickRoleHolder() {
  const { roleType, scopeType, scopeId } = quickRoleForm
  if (!roleType || !scopeType) return
  if (scopeType === 'company' && !scopeId) return
  try {
    const holder = await approvalsApi.findApproverRoleHolder({
      roleType, scopeType, scopeId: scopeId || undefined,
    })
    if (holder && holder.userId !== approverRolesEmployee.value?.id) {
      quickRoleHolder.value = holder.user ?? holder
    } else {
      quickRoleHolder.value = null
    }
  } catch { quickRoleHolder.value = null }
}

async function saveQuickRole() {
  if (!approverRolesEmployee.value) return
  quickRoleSaving.value = true
  try {
    await approvalsApi.createEmployeeApproverRole(approverRolesEmployee.value.id, {
      roleType:     quickRoleForm.roleType,
      scopeType:    quickRoleForm.scopeType,
      scopeId:      quickRoleForm.scopeType === 'company' ? (quickRoleForm.scopeId || undefined) : undefined,
      forceReplace: !!quickRoleHolder.value,
    })
    ElMessage.success(quickRoleHolder.value ? '角色轉移成功' : '角色指派成功')
    quickRoleHolder.value = null
    await loadApproverRolesList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '操作失敗')
  } finally {
    quickRoleSaving.value = false
  }
}

async function removeQuickRole(roleId: string) {
  await approvalsApi.deleteEmployeeApproverRole(roleId)
  ElMessage.success('已移除')
  await loadApproverRolesList()
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.name-link { color: #409eff; text-decoration: none; font-weight: 500; }
.name-zh { font-size: 12px; color: #999; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.add-role-card { margin-bottom: 16px; }
.current-roles-title { font-size: 13px; font-weight: 600; color: #303133; margin: 0 0 10px; }
</style>
