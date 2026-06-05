<template>
  <div class="user-assignment-panel">
    <div class="panel-toolbar">
      <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新增審批職能</el-button>
    </div>

    <el-skeleton v-if="loading" :rows="3" animated />

    <el-empty v-else-if="groups.length === 0" description="尚未設定審批職能" :image-size="60" />

    <div v-for="g in groups" :key="g.roleCode" class="role-group">
      <div class="role-group-header">
        <el-tag type="primary" size="small">{{ roleLabel(g.roleCode) }}</el-tag>
      </div>
      <el-table :data="g.items" border size="small" style="margin-bottom:12px">
        <el-table-column label="分組類型" width="100">
          <template #default="{ row }">{{ scopeTypeLabel(row.scopeType) }}</template>
        </el-table-column>
        <el-table-column label="分組名稱">
          <template #default="{ row }">{{ resolveScopeName(row) }}</template>
        </el-table-column>
        <el-table-column label="預設" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">預設</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button v-if="!row.isDefault" text size="small" @click="confirmSetDefault(row)">設為預設</el-button>
            <el-button text size="small" type="danger" @click="confirmRemove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="addVisible" title="新增審批職能" width="460px" @closed="resetAdd" append-to-body>
      <el-form :model="addForm" label-width="90px">
        <el-form-item label="角色">
          <el-select v-model="addForm.roleCode" style="width:100%" placeholder="選擇角色" @change="onRoleChange">
            <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="addForm.roleCode && !isSpecialRole(addForm.roleCode)" label="分組類型">
          <el-select v-model="addForm.scopeType" style="width:100%" placeholder="選擇分組類型" @change="addForm.scopeId = ''">
            <el-option v-for="st in SCOPE_TYPE_OPTIONS" :key="st.value" :label="st.label" :value="st.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="addForm.scopeType && addForm.scopeType !== 'special'" label="指定分組">
          <el-select v-model="addForm.scopeId" style="width:100%" filterable placeholder="選擇具體分組">
            <el-option v-for="e in scopeEntities" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" :loading="addSaving" @click="doAdd">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { approvalsApi } from '@/api/approvals.api'
import { regionsApi, companiesApi, businessUnitsApi, projectsApi, departmentsApi } from '@/api/organizations.api'

const props = defineProps<{ userId: string }>()

const ROLE_OPTIONS = [
  { value: 'lead',            label: '負責人'   },
  { value: 'hr',              label: '人事專員' },
  { value: 'hr_manager',      label: '人事主管' },
  { value: 'finance',         label: '財務人員' },
  { value: 'finance_manager', label: '財務主管' },
  { value: 'ceo',             label: '執行長'   },
  { value: 'chairman',        label: '董事長'   },
]

const SCOPE_TYPE_OPTIONS = [
  { value: 'region',        label: '地區'   },
  { value: 'company',       label: '公司'   },
  { value: 'business_unit', label: '事業部' },
  { value: 'project',       label: '項目'   },
  { value: 'department',    label: '部門'   },
]

const SCOPE_TYPE_LABEL: Record<string, string> = {
  region: '地區', company: '公司', business_unit: '事業部', project: '項目', department: '部門', special: '特殊（集團）',
}

function roleLabel(code: string) { return ROLE_OPTIONS.find(r => r.value === code)?.label ?? code }
function scopeTypeLabel(t: string) { return SCOPE_TYPE_LABEL[t] ?? t }
function isSpecialRole(code: string) { return code === 'ceo' || code === 'chairman' }

// ── 組織實體快取 ──────────────────────────────────────────────
const orgCache = ref<Record<string, Record<string, string>>>({})

async function loadOrgCache() {
  const [regions, companies, bus, projects, depts] = await Promise.all([
    regionsApi.getAll(),
    companiesApi.getAll(),
    businessUnitsApi.getAll(),
    projectsApi.getAll(),
    departmentsApi.getTree().catch(() => [] as any[]),
  ])
  const flattenTree = (nodes: any[]): any[] =>
    nodes.flatMap(n => [n, ...flattenTree(n.children ?? [])])

  orgCache.value = {
    region:        Object.fromEntries(regions.map((x: any) => [x.id, x.name])),
    company:       Object.fromEntries(companies.map((x: any) => [x.id, x.name])),
    business_unit: Object.fromEntries(bus.map((x: any) => [x.id, x.name])),
    project:       Object.fromEntries(projects.map((x: any) => [x.id, x.name])),
    department:    Object.fromEntries(flattenTree(Array.isArray(depts) ? depts : []).map((x: any) => [x.id, x.name])),
  }
}

function resolveScopeName(row: any) {
  if (row.scopeType === 'special') return '特殊（集團層級）'
  if (!row.scopeId) return '—'
  return orgCache.value[row.scopeType]?.[row.scopeId] ?? row.scopeId.slice(0, 8)
}

// ── 載入分配資料 ──────────────────────────────────────────────
const loading    = ref(false)
const assignments = ref<any[]>([])

const groups = computed(() => {
  const map = new Map<string, any[]>()
  for (const a of assignments.value) {
    if (!map.has(a.roleCode)) map.set(a.roleCode, [])
    map.get(a.roleCode)!.push(a)
  }
  return Array.from(map.entries()).map(([roleCode, items]) => ({ roleCode, items }))
})

async function load() {
  loading.value = true
  try {
    const res = await approvalsApi.listAssignments({ userId: props.userId, limit: 200 })
    assignments.value = res.items ?? res
  } finally {
    loading.value = false
  }
}

watch(() => props.userId, async (id) => {
  if (id) { await loadOrgCache(); await load() }
}, { immediate: true })

// ── 設為預設 ──────────────────────────────────────────────────
async function confirmSetDefault(row: any) {
  await ElMessageBox.confirm(
    `將此帳號設為「${roleLabel(row.roleCode)}」在「${resolveScopeName(row)}」的預設審批人？`,
    '確認', { confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning' },
  )
  await approvalsApi.setDefaultAssignment(row.id)
  ElMessage.success('已設為預設')
  await load()
}

// ── 移除 ──────────────────────────────────────────────────────
async function confirmRemove(row: any) {
  await ElMessageBox.confirm(
    `確認移除此帳號在「${resolveScopeName(row)}」的「${roleLabel(row.roleCode)}」職能？`,
    '確認移除', { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' },
  )
  await approvalsApi.removeAssignment(row.id)
  ElMessage.success('已移除')
  await load()
}

// ── 新增 ──────────────────────────────────────────────────────
const addVisible  = ref(false)
const addSaving   = ref(false)
const addForm     = ref({ roleCode: '', scopeType: '', scopeId: '' })

const scopeEntities = computed(() => {
  const t = addForm.value.scopeType
  if (!t || t === 'special') return []
  return Object.entries(orgCache.value[t] ?? {}).map(([id, name]) => ({ id, name }))
})

function openAdd() {
  addForm.value = { roleCode: '', scopeType: '', scopeId: '' }
  addVisible.value = true
}

function resetAdd() {
  addForm.value = { roleCode: '', scopeType: '', scopeId: '' }
}

function onRoleChange() {
  if (isSpecialRole(addForm.value.roleCode)) {
    addForm.value.scopeType = 'special'
    addForm.value.scopeId = ''
  } else {
    addForm.value.scopeType = ''
    addForm.value.scopeId = ''
  }
}

async function doAdd() {
  const { roleCode, scopeType, scopeId } = addForm.value
  if (!roleCode) { ElMessage.warning('請選擇角色'); return }
  if (!scopeType) { ElMessage.warning('請選擇分組類型'); return }
  if (scopeType !== 'special' && !scopeId) { ElMessage.warning('請選擇具體分組'); return }

  addSaving.value = true
  try {
    await approvalsApi.addAssignment({
      scopeType,
      scopeId:  scopeType === 'special' ? null : scopeId,
      roleCode,
      userId:   props.userId,
    })
    ElMessage.success('已新增')
    addVisible.value = false
    await load()
  } catch {
    ElMessage.error('新增失敗（可能已存在相同設定）')
  } finally {
    addSaving.value = false
  }
}
</script>

<style scoped>
.panel-toolbar { margin-bottom: 16px; }
.role-group { margin-bottom: 8px; }
.role-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
</style>
