<template>
  <div v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" @click="router.back()">返回</el-button>
        <h2>{{ employee?.displayName }}</h2>
        <el-tag v-if="employee" :type="statusTagType(employee.status)" size="small">{{ statusLabel(employee.status) }}</el-tag>
      </div>
    </div>

    <template v-if="employee">
      <el-tabs v-model="activeTab">

        <!-- ── 基本資訊 ────────────────────────────────── -->
        <el-tab-pane :label="$t('employee.basic')" name="basic">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>{{ $t('user.accountInfo') }}</span>
                <el-button text size="small" @click="openEditBasic">{{ $t('common.edit') }}</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="員工編號">{{ employee.employeeNo ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="電子郵件">{{ employee.email }}</el-descriptions-item>
              <el-descriptions-item label="顯示名稱">{{ employee.displayName }}</el-descriptions-item>
              <el-descriptions-item label="中文姓名">{{ employee.nameZh ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="英文姓名">{{ employee.nameEn ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="帳號狀態">
                <el-tag :type="statusTagType(employee.status)" size="small">{{ statusLabel(employee.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最後登入">{{ formatDate(employee.lastLoginAt) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span>{{ $t('user.hrInfo') }}</span>
                <el-button text size="small" @click="openEditProfile">{{ $t('common.edit') }}</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="到職日">{{ profile?.hireDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="僱用類型">{{ employmentTypeLabel(profile?.employmentType) }}</el-descriptions-item>
              <el-descriptions-item label="性別">{{ genderLabel(profile?.gender) }}</el-descriptions-item>
              <el-descriptions-item label="出生日期">{{ profile?.birthDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="國籍">{{ profile?.nationality ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="試用期結束">{{ profile?.probationEndDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="轉正日">{{ profile?.regularDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="合約開始">{{ profile?.contractStartDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="合約結束">{{ profile?.contractEndDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="個人Email">{{ profile?.personalEmail ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="手機">{{ profile?.mobilePhone ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="辦公室電話">{{ profile?.workPhone ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="現居地址" :span="2">{{ profile?.currentAddress ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="緊急聯絡人">{{ profile?.emergencyContactName ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="緊急聯絡電話">{{ profile?.emergencyContactPhone ?? '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <!-- ── 組織配置 ────────────────────────────────── -->
        <el-tab-pane :label="$t('employee.orgConfig')" name="org">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>組織歸屬</span>
                <el-button type="primary" size="small" @click="openEditOrg">編輯主要歸屬</el-button>
              </div>
            </template>
            <el-table :data="employee.orgAssignments ?? []" border>
              <el-table-column label="主要" width="70" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.isPrimary" color="#67c23a"><Check /></el-icon>
                </template>
              </el-table-column>
              <el-table-column label="類型" width="90">
                <template #default="{ row }">{{ assignmentTypeLabel(row.assignmentType) }}</template>
              </el-table-column>
              <el-table-column label="地區">
                <template #default="{ row }">{{ row.region?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="公司">
                <template #default="{ row }">{{ row.company?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="事業部">
                <template #default="{ row }">{{ row.businessUnit?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="項目">
                <template #default="{ row }">{{ row.project?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="部門">
                <template #default="{ row }">{{ row.department?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="職位">
                <template #default="{ row }">{{ row.position?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="職級">
                <template #default="{ row }">{{ row.jobLevel?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="直屬主管">
                <template #default="{ row }">{{ row.directManager?.displayName ?? '—' }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- ── 角色權限 ────────────────────────────────── -->
        <el-tab-pane :label="$t('employee.rolePermission')" name="roles">
          <el-card>
            <template #header>已指派系統角色</template>
            <el-table :data="employee.userRoles ?? []" border>
              <el-table-column label="角色名稱">
                <template #default="{ row }">{{ row.role?.name }}</template>
              </el-table-column>
              <el-table-column label="角色代碼">
                <template #default="{ row }">{{ row.role?.code }}</template>
              </el-table-column>
              <el-table-column label="授權範圍" prop="scopeType" />
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 審批職能角色已移至「審批流設定 → 審批群組」統一管理 -->

      </el-tabs>
    </template>

    <!-- ── 編輯帳號資訊 Dialog ───────────────────────────── -->
    <el-dialog v-model="editBasicDialog" title="編輯帳號資訊" width="520px">
      <el-form ref="basicFormRef" :model="basicForm" label-width="100px">
        <el-form-item label="顯示名稱" :rules="[{ required: true, message: '必填' }]">
          <el-input v-model="basicForm.displayName" />
        </el-form-item>
        <el-form-item label="中文姓名">
          <el-input v-model="basicForm.nameZh" />
        </el-form-item>
        <el-form-item label="英文姓名">
          <el-input v-model="basicForm.nameEn" />
        </el-form-item>
        <el-form-item label="員工編號">
          <el-input v-model="basicForm.employeeNo" />
        </el-form-item>
        <el-form-item label="電子郵件">
          <el-input v-model="basicForm.email" type="email" />
        </el-form-item>
        <el-form-item label="帳號狀態">
          <el-select v-model="basicForm.status" style="width:100%">
            <el-option label="待啟用" value="pending_activation" />
            <el-option label="啟用"   value="active" />
            <el-option label="停用"   value="suspended" />
            <el-option label="離職"   value="resigned" />
            <el-option label="終止"   value="terminated" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editBasicDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveBasic">儲存</el-button>
      </template>
    </el-dialog>

    <!-- ── 編輯人事資料 Dialog ───────────────────────────── -->
    <el-dialog v-model="editProfileDialog" title="編輯人事資料" width="600px">
      <el-form :model="profileForm" label-width="120px">
        <el-divider content-position="left">基本</el-divider>
        <el-form-item label="到職日">
          <el-date-picker v-model="profileForm.hireDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="僱用類型">
          <el-select v-model="profileForm.employmentType" style="width:100%">
            <el-option label="全職"   value="full_time" />
            <el-option label="兼職"   value="part_time" />
            <el-option label="約聘"   value="contract" />
            <el-option label="實習"   value="intern" />
          </el-select>
        </el-form-item>
        <el-form-item label="性別">
          <el-select v-model="profileForm.gender" clearable style="width:100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="profileForm.birthDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="國籍">
          <el-input v-model="profileForm.nationality" placeholder="如 TW / JP / UK" />
        </el-form-item>

        <el-divider content-position="left">合約</el-divider>
        <el-form-item label="試用期結束">
          <el-date-picker v-model="profileForm.probationEndDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="轉正日">
          <el-date-picker v-model="profileForm.regularDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="合約開始">
          <el-date-picker v-model="profileForm.contractStartDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="合約結束">
          <el-date-picker v-model="profileForm.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>

        <el-divider content-position="left">聯絡資訊</el-divider>
        <el-form-item label="個人Email">
          <el-input v-model="profileForm.personalEmail" />
        </el-form-item>
        <el-form-item label="手機">
          <el-input v-model="profileForm.mobilePhone" />
        </el-form-item>
        <el-form-item label="辦公室電話">
          <el-input v-model="profileForm.workPhone" />
        </el-form-item>
        <el-form-item label="現居地址">
          <el-input v-model="profileForm.currentAddress" />
        </el-form-item>
        <el-form-item label="緊急聯絡人">
          <el-input v-model="profileForm.emergencyContactName" />
        </el-form-item>
        <el-form-item label="緊急聯絡電話">
          <el-input v-model="profileForm.emergencyContactPhone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProfileDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProfile">儲存</el-button>
      </template>
    </el-dialog>

    <!-- ── 編輯主要組織歸屬 Dialog ───────────────────────── -->
    <el-dialog v-model="editOrgDialog" title="編輯主要組織歸屬" width="600px">
      <el-form :model="orgForm" label-width="110px">
        <el-form-item label="地區">
          <el-select v-model="orgForm.regionId" clearable style="width:100%" @change="onRegionChange">
            <el-option v-for="r in orgOptions.regions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="公司">
          <el-select v-model="orgForm.companyId" clearable style="width:100%">
            <el-option v-for="c in filteredCompanies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="事業部">
          <el-select v-model="orgForm.businessUnitId" clearable style="width:100%" @change="onBuChange">
            <el-option v-for="b in orgOptions.businessUnits" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="項目">
          <el-select v-model="orgForm.projectId" clearable style="width:100%">
            <el-option v-for="p in filteredProjects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部門">
          <el-select v-model="orgForm.departmentId" clearable style="width:100%">
            <el-option v-for="d in orgOptions.departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="職位">
          <el-select v-model="orgForm.positionId" clearable style="width:100%">
            <el-option v-for="p in orgOptions.positions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="職級">
          <el-select v-model="orgForm.jobLevelId" clearable style="width:100%">
            <el-option v-for="j in orgOptions.jobLevels" :key="j.id" :label="j.name" :value="j.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="歸屬類型">
          <el-select v-model="orgForm.assignmentType" style="width:100%">
            <el-option label="主要" value="primary" />
            <el-option label="兼任" value="secondary" />
            <el-option label="臨時" value="temporary" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOrgDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveOrg">儲存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { employeesApi } from '@/api/employees.api'
import {
  regionsApi, companiesApi, businessUnitsApi, projectsApi,
  departmentsApi, positionsApi, jobLevelsApi,
} from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import type { User, Region, Company, BusinessUnit, Project, Department, Position, JobLevel } from '@/types'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()
const { t }  = useI18n()

const loading  = ref(false)
const saving   = ref(false)
const employee = ref<User | null>(null)
const activeTab = ref('basic')

const editBasicDialog   = ref(false)
const editProfileDialog = ref(false)
const editOrgDialog     = ref(false)
const basicFormRef      = ref()

// ── Forms ──────────────────────────────────────────────────────
const basicForm = reactive({
  displayName: '', nameZh: '', nameEn: '', employeeNo: '', email: '', status: '',
})

const profileForm = reactive({
  hireDate: '', employmentType: 'full_time', gender: '', birthDate: '',
  nationality: '', probationEndDate: '', regularDate: '',
  contractStartDate: '', contractEndDate: '',
  personalEmail: '', mobilePhone: '', workPhone: '', currentAddress: '',
  emergencyContactName: '', emergencyContactPhone: '',
})

const orgForm = reactive({
  regionId: '', companyId: '', businessUnitId: '', projectId: '',
  departmentId: '', positionId: '', jobLevelId: '', assignmentType: 'primary',
})

// ── Org options ────────────────────────────────────────────────
const orgOptions = reactive<{
  regions: Region[];
  companies: Company[];
  businessUnits: BusinessUnit[];
  projects: Project[];
  departments: Department[];
  positions: Position[];
  jobLevels: JobLevel[];
}>({
  regions: [], companies: [], businessUnits: [], projects: [],
  departments: [], positions: [], jobLevels: [],
})

const filteredCompanies = computed(() =>
  orgForm.regionId
    ? orgOptions.companies.filter((c: any) => c.regionId === orgForm.regionId)
    : orgOptions.companies,
)

const filteredProjects = computed(() =>
  orgForm.businessUnitId
    ? orgOptions.projects.filter((p: any) => p.businessUnitId === orgForm.businessUnitId)
    : orgOptions.projects,
)

// ── Computed ───────────────────────────────────────────────────
const profile = computed(() => employee.value?.employeeProfile)

// ── Lifecycle ──────────────────────────────────────────────────
onMounted(async () => {
  ui.setBreadcrumbs([{ title: t('nav.employees'), path: '/hr/employees' }, { title: t('employee.employeeDetail') }])
  await load()
})

async function load() {
  loading.value = true
  try {
    employee.value = await employeesApi.getOne(route.params.id as string)
  } finally {
    loading.value = false
  }
}

// ── Open dialogs ───────────────────────────────────────────────
function openEditBasic() {
  if (!employee.value) return
  Object.assign(basicForm, {
    displayName: employee.value.displayName,
    nameZh:      employee.value.nameZh ?? '',
    nameEn:      employee.value.nameEn ?? '',
    employeeNo:  employee.value.employeeNo ?? '',
    email:       employee.value.email,
    status:      employee.value.status,
  })
  editBasicDialog.value = true
}

function openEditProfile() {
  const p = profile.value
  Object.assign(profileForm, {
    hireDate:              p?.hireDate            ?? '',
    employmentType:        p?.employmentType       ?? 'full_time',
    gender:                p?.gender              ?? '',
    birthDate:             p?.birthDate           ?? '',
    nationality:           p?.nationality         ?? '',
    probationEndDate:      p?.probationEndDate    ?? '',
    regularDate:           p?.regularDate         ?? '',
    contractStartDate:     p?.contractStartDate   ?? '',
    contractEndDate:       p?.contractEndDate     ?? '',
    personalEmail:         p?.personalEmail       ?? '',
    mobilePhone:           p?.mobilePhone         ?? '',
    workPhone:             p?.workPhone           ?? '',
    currentAddress:        p?.currentAddress      ?? '',
    emergencyContactName:  p?.emergencyContactName  ?? '',
    emergencyContactPhone: p?.emergencyContactPhone ?? '',
  })
  editProfileDialog.value = true
}

async function openEditOrg() {
  // Load org data lazily
  if (!orgOptions.regions.length) {
    const [regions, companies, bus, projects, depts, positions, jobLevels] = await Promise.all([
      regionsApi.getAll(true),
      companiesApi.getAll(),
      businessUnitsApi.getAll(true),
      projectsApi.getAll(),
      departmentsApi.getTree(''),
      positionsApi.getAll(),
      jobLevelsApi.getAll(true),
    ])
    orgOptions.regions      = regions
    orgOptions.companies    = companies
    orgOptions.businessUnits = bus
    orgOptions.projects     = projects
    orgOptions.departments  = depts
    orgOptions.positions    = positions
    orgOptions.jobLevels    = jobLevels
  }

  const primary = employee.value?.orgAssignments?.find((a: any) => a.isPrimary)
  Object.assign(orgForm, {
    regionId:       (primary as any)?.region?.id       ?? primary?.regionId      ?? '',
    companyId:      primary?.company?.id               ?? primary?.companyId     ?? '',
    businessUnitId: primary?.businessUnit?.id          ?? primary?.businessUnitId ?? '',
    projectId:      primary?.project?.id               ?? primary?.projectId     ?? '',
    departmentId:   primary?.department?.id            ?? primary?.departmentId  ?? '',
    positionId:     primary?.position?.id              ?? primary?.positionId    ?? '',
    jobLevelId:     primary?.jobLevel?.id              ?? primary?.jobLevelId    ?? '',
    assignmentType: primary?.assignmentType            ?? 'primary',
  })
  editOrgDialog.value = true
}

function onRegionChange() {
  orgForm.companyId = ''
}

function onBuChange() {
  orgForm.projectId = ''
}

// ── Save ───────────────────────────────────────────────────────
async function saveBasic() {
  saving.value = true
  try {
    await employeesApi.update(employee.value!.id, {
      displayName: basicForm.displayName,
      nameZh:      basicForm.nameZh      || undefined,
      nameEn:      basicForm.nameEn      || undefined,
      employeeNo:  basicForm.employeeNo  || undefined,
      email:       basicForm.email       || undefined,
      status:      basicForm.status      || undefined,
    })
    ElMessage.success(t('msg.saveSuccess'))
    editBasicDialog.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const payload: Record<string, any> = {}
    const fields = [
      'hireDate', 'employmentType', 'gender', 'birthDate', 'nationality',
      'probationEndDate', 'regularDate', 'contractStartDate', 'contractEndDate',
      'personalEmail', 'mobilePhone', 'workPhone', 'currentAddress',
      'emergencyContactName', 'emergencyContactPhone',
    ]
    for (const f of fields) {
      const v = (profileForm as any)[f]
      payload[f] = v === '' ? null : v
    }
    await employeesApi.update(employee.value!.id, payload)
    ElMessage.success(t('msg.saveSuccess'))
    editProfileDialog.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function saveOrg() {
  saving.value = true
  try {
    const payload: Record<string, string | null> = {}
    const orgFields = ['regionId', 'companyId', 'businessUnitId', 'projectId', 'departmentId', 'positionId', 'jobLevelId', 'assignmentType']
    for (const f of orgFields) {
      payload[f] = (orgForm as any)[f] || null
    }
    await employeesApi.updateOrgAssignment(employee.value!.id, payload as any)
    ElMessage.success(t('msg.saveSuccess'))
    editOrgDialog.value = false
    await load()
  } finally {
    saving.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────
function statusLabel(status: string) {
  const m: Record<string, string> = { pending_activation: '待啟用', active: '啟用', suspended: '停用', resigned: '離職', terminated: '終止' }
  return m[status] ?? status
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const m: Record<string, 'success' | 'warning' | 'danger' | 'info'> = { active: 'success', pending_activation: 'warning', suspended: 'danger', resigned: 'info', terminated: 'info' }
  return m[status] ?? 'info'
}

function employmentTypeLabel(t?: string) {
  const m: Record<string, string> = { full_time: '全職', part_time: '兼職', contract: '約聘', intern: '實習' }
  return t ? (m[t] ?? t) : '—'
}

function genderLabel(g?: string) {
  const m: Record<string, string> = { male: '男', female: '女', other: '其他' }
  return g ? (m[g] ?? g) : '—'
}

function assignmentTypeLabel(t?: string) {
  const m: Record<string, string> = { primary: '主要', secondary: '兼任', temporary: '臨時' }
  return t ? (m[t] ?? t) : '—'
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '—'
}

</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
