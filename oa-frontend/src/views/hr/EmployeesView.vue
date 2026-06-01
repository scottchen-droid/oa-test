<template>
  <div>
    <div class="page-header">
      <h2>員工管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增員工</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-input
          v-model="search"
          placeholder="搜尋姓名或員工編號"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @change="onSearch"
        />
        <el-select v-model="companyFilter" placeholder="篩選公司" clearable style="width: 180px" @change="onSearch">
          <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="帳號狀態" clearable style="width: 140px" @change="onSearch">
          <el-option label="待啟用" value="pending_activation" />
          <el-option label="啟用" value="active" />
          <el-option label="停用" value="suspended" />
          <el-option label="離職" value="resigned" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="employeeNo" label="員工編號" width="120" />
        <el-table-column label="姓名">
          <template #default="{ row }">
            <RouterLink :to="`/hr/employees/${row.id}`" class="name-link">{{ row.displayName }}</RouterLink>
            <div class="name-zh">{{ row.nameZh }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" />
        <el-table-column label="所屬公司">
          <template #default="{ row }">
            {{ row.orgAssignments?.find((a: any) => a.isPrimary)?.company?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="部門">
          <template #default="{ row }">
            {{ row.orgAssignments?.find((a: any) => a.isPrimary)?.department?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="職位">
          <template #default="{ row }">
            {{ row.orgAssignments?.find((a: any) => a.isPrimary)?.position?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="狀態" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="到職日" width="120">
          <template #default="{ row }">
            {{ row.employeeProfile?.hireDate ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <RouterLink :to="`/hr/employees/${row.id}`">
              <el-button text size="small">詳情</el-button>
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

    <el-dialog v-model="dialogVisible" title="新增員工" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-divider content-position="left">帳號資訊</el-divider>
        <el-form-item label="電子郵件" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="顯示名稱" prop="displayName">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item label="中文姓名">
          <el-input v-model="form.nameZh" />
        </el-form-item>
        <el-form-item label="員工編號">
          <el-input v-model="form.employeeNo" />
        </el-form-item>

        <el-divider content-position="left">組織資訊</el-divider>
        <el-form-item label="所屬公司" prop="companyId">
          <el-select v-model="form.companyId" style="width: 100%" @change="loadDepts">
            <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部門">
          <el-tree-select
            v-model="form.departmentId"
            :data="deptTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="職位">
          <el-select v-model="form.positionId" clearable style="width: 100%">
            <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="職級">
          <el-select v-model="form.jobLevelId" clearable style="width: 100%">
            <el-option v-for="j in jobLevels" :key="j.id" :label="j.name" :value="j.id" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">人事資訊</el-divider>
        <el-form-item label="到職日" prop="hireDate">
          <el-date-picker v-model="form.hireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="僱用類型" prop="employmentType">
          <el-select v-model="form.employmentType" style="width: 100%">
            <el-option label="全職" value="full_time" />
            <el-option label="兼職" value="part_time" />
            <el-option label="約聘" value="contract" />
            <el-option label="實習" value="intern" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { employeesApi } from '@/api/employees.api'
import { companiesApi, departmentsApi, positionsApi, jobLevelsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import type { User, Company, Department, Position, JobLevel } from '@/types'

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
  email: [{ required: true, message: '請輸入Email', trigger: 'blur' }, { type: 'email', message: '格式不正確', trigger: 'blur' }],
  displayName: [{ required: true, message: '請輸入姓名', trigger: 'blur' }],
  companyId: [{ required: true, message: '請選擇公司', trigger: 'change' }],
  hireDate: [{ required: true, message: '請選擇到職日', trigger: 'change' }],
  employmentType: [{ required: true, message: '請選擇僱用類型', trigger: 'change' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '員工管理' }])
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
    ElMessage.success('員工建立成功，啟動信已發送')
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
