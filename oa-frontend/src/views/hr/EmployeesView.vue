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
        <el-table-column :label="$t('common.actions')" width="100" fixed="right">
          <template #default="{ row }">
            <RouterLink :to="`/hr/employees/${row.id}`">
              <el-button text size="small">{{ $t('common.detail') }}</el-button>
            </RouterLink>
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

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { employeesApi } from '@/api/employees.api'
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

</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.name-link { color: #409eff; text-decoration: none; font-weight: 500; }
.name-zh { font-size: 12px; color: #999; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
