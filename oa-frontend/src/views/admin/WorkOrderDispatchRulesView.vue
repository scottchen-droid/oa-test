<template>
  <div>
    <div class="page-header">
      <h2>工作單派發規則</h2>
    </div>

    <!-- 資源項目選擇 -->
    <div class="filter-row">
      <label class="filter-label">選擇資源項目：</label>
      <el-select
        v-model="selectedResourceItemId"
        filterable
        clearable
        placeholder="請選擇資源項目"
        style="width: 280px"
        @change="loadRules"
      >
        <el-option
          v-for="item in resourceItems"
          :key="item.id"
          :label="`${item.name}（${item.code}）`"
          :value="item.id"
        />
      </el-select>
      <el-button
        v-if="selectedResourceItemId"
        type="primary"
        style="margin-left: 12px"
        @click="openCreate"
      >
        新增規則
      </el-button>
    </div>

    <template v-if="selectedResourceItemId">
      <el-table v-loading="loading" :data="rules" border>
        <el-table-column label="處理群組" min-width="130">
          <template #default="{ row }">{{ row.workOrderGroup?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="地區" min-width="80">
          <template #default="{ row }">{{ regionName(row.regionId) }}</template>
        </el-table-column>
        <el-table-column label="公司" min-width="100">
          <template #default="{ row }">{{ companyName(row.companyId) }}</template>
        </el-table-column>
        <el-table-column label="部門" min-width="100">
          <template #default="{ row }">{{ departmentName(row.departmentId) }}</template>
        </el-table-column>
        <el-table-column label="事業部" min-width="100">
          <template #default="{ row }">{{ buName(row.businessUnitId) }}</template>
        </el-table-column>
        <el-table-column label="項目" min-width="100">
          <template #default="{ row }">{{ projectName(row.projectId) }}</template>
        </el-table-column>
        <el-table-column label="優先順序" width="90" align="center" prop="priority" />
        <el-table-column label="啟用" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row.id)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <el-empty v-else description="請選擇資源項目以查看派發規則" />

    <!-- 新增規則 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="新增派發規則"
      width="540px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules_form" label-width="100px">
        <el-form-item label="處理群組" prop="workOrderGroupId">
          <el-select v-model="form.workOrderGroupId" filterable style="width:100%">
            <el-option
              v-for="g in workOrderGroups"
              :key="g.id"
              :label="g.name"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="left"><span class="divider-text">組織條件（留空表示不限定）</span></el-divider>
        <el-form-item label="地區">
          <el-select v-model="form.regionId" clearable filterable style="width:100%" @change="onRegionChange">
            <el-option v-for="r in regions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="公司">
          <el-select v-model="form.companyId" clearable filterable style="width:100%" @change="onCompanyChange">
            <el-option v-for="c in filteredCompanies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部門">
          <el-select v-model="form.departmentId" clearable filterable style="width:100%">
            <el-option v-for="d in filteredDepartments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="事業部">
          <el-select v-model="form.businessUnitId" clearable filterable style="width:100%">
            <el-option v-for="bu in businessUnits" :key="bu.id" :label="bu.name" :value="bu.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="項目">
          <el-select v-model="form.projectId" clearable filterable style="width:100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="優先順序">
          <el-input-number v-model="form.priority" :min="0" style="width:100%" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { dispatchRulesApi, type DispatchRule } from '@/api/dispatch-rules.api'
import { resourceItemsApi, type ResourceItem } from '@/api/resource-items.api'
import { workOrderGroupsApi, type WorkOrderGroup } from '@/api/work-order-groups.api'
import { regionsApi, companiesApi, departmentsApi, businessUnitsApi, projectsApi } from '@/api/organizations.api'
import type { Region, Company, Department, BusinessUnit, Project } from '@/types'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
ui.setBreadcrumbs([{ title: '系統設定' }, { title: '工作單派發規則' }])

// ─── 靜態資料 ─────────────────────────────────────────────────────────────────
const resourceItems = ref<ResourceItem[]>([])
const workOrderGroups = ref<WorkOrderGroup[]>([])
const regions = ref<Region[]>([])
const companies = ref<Company[]>([])
const departments = ref<Department[]>([])
const businessUnits = ref<BusinessUnit[]>([])
const projects = ref<Project[]>([])

async function loadStaticData() {
  try {
    const [ri, wog, reg, comp, dept, bu, proj] = await Promise.all([
      resourceItemsApi.adminList(),
      workOrderGroupsApi.adminList(),
      regionsApi.getAll(),
      companiesApi.getAll(),
      departmentsApi.getTree(),
      businessUnitsApi.getAll(),
      projectsApi.getAll(),
    ])
    resourceItems.value = ri
    workOrderGroups.value = wog.filter(g => g.isEnabled)
    regions.value = reg
    companies.value = comp
    departments.value = dept
    businessUnits.value = bu
    projects.value = proj
  } catch {
    ElMessage.error('載入基礎資料失敗')
  }
}

onMounted(loadStaticData)

// ─── 名稱輔助 ─────────────────────────────────────────────────────────────────
function regionName(id?: string | null): string {
  if (!id) return '不限'
  return regions.value.find(r => r.id === id)?.name ?? id
}

function companyName(id?: string | null): string {
  if (!id) return '不限'
  return companies.value.find(c => c.id === id)?.name ?? id
}

function departmentName(id?: string | null): string {
  if (!id) return '不限'
  return departments.value.find(d => d.id === id)?.name ?? id
}

function buName(id?: string | null): string {
  if (!id) return '不限'
  return businessUnits.value.find(b => b.id === id)?.name ?? id
}

function projectName(id?: string | null): string {
  if (!id) return '不限'
  return projects.value.find(p => p.id === id)?.name ?? id
}

// ─── 規則列表 ─────────────────────────────────────────────────────────────────
const selectedResourceItemId = ref('')
const loading = ref(false)
const rules = ref<DispatchRule[]>([])

async function loadRules() {
  if (!selectedResourceItemId.value) { rules.value = []; return }
  loading.value = true
  try {
    rules.value = await dispatchRulesApi.list(selectedResourceItemId.value)
  } catch {
    ElMessage.error('載入規則失敗')
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('確定要刪除此規則？此操作無法復原。', '確認', { type: 'warning' })
    await dispatchRulesApi.delete(id)
    await loadRules()
    ElMessage.success('刪除成功')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('刪除失敗')
  }
}

// ─── 表單中的級聯篩選 ─────────────────────────────────────────────────────────
const filteredCompanies = computed(() => {
  if (!form.value.regionId) return companies.value
  return companies.value.filter(c => {
    const region = regions.value.find(r => r.id === form.value.regionId)
    return !region || c.regionId === form.value.regionId
  })
})

const filteredDepartments = computed(() => {
  if (!form.value.companyId) return departments.value
  return departments.value.filter(d => (d as Department & { companyId?: string }).companyId === form.value.companyId)
})

function onRegionChange() {
  form.value.companyId = ''
  form.value.departmentId = ''
}

function onCompanyChange() {
  form.value.departmentId = ''
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

interface RuleForm {
  workOrderGroupId: string
  regionId: string
  companyId: string
  departmentId: string
  businessUnitId: string
  projectId: string
  priority: number
}

const form = ref<RuleForm>({
  workOrderGroupId: '',
  regionId: '',
  companyId: '',
  departmentId: '',
  businessUnitId: '',
  projectId: '',
  priority: 0,
})

const rules_form: FormRules = {
  workOrderGroupId: [{ required: true, message: '請選擇處理群組', trigger: 'change' }],
}

function openCreate() {
  form.value = {
    workOrderGroupId: '',
    regionId: '',
    companyId: '',
    departmentId: '',
    businessUnitId: '',
    projectId: '',
    priority: 0,
  }
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
}

async function handleSave() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      await dispatchRulesApi.create({
        resourceItemId: selectedResourceItemId.value,
        workOrderGroupId: form.value.workOrderGroupId,
        regionId: form.value.regionId || undefined,
        companyId: form.value.companyId || undefined,
        departmentId: form.value.departmentId || undefined,
        businessUnitId: form.value.businessUnitId || undefined,
        projectId: form.value.projectId || undefined,
        priority: form.value.priority,
      })
      dialogVisible.value = false
      await loadRules()
      ElMessage.success('規則已新增')
    } catch {
      ElMessage.error('新增規則失敗')
    } finally {
      saving.value = false
    }
  })
}
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.filter-label { font-size: 14px; color: #606266; margin-right: 8px; }

.divider-text { font-size: 12px; color: #909399; }
</style>
