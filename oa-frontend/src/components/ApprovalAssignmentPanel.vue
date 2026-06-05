<template>
  <div class="assignment-panel">
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
        <el-table-column label="人員">
          <template #default="{ row }">
            <span>{{ row.user?.displayName }}</span>
            <span v-if="row.user?.employeeNo" class="emp-no">{{ row.user.employeeNo }}</span>
          </template>
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

    <el-dialog v-model="addVisible" title="新增審批職能" width="420px" @closed="resetAdd" append-to-body>
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="角色">
          <el-select v-model="addForm.roleCode" style="width:100%" placeholder="選擇角色">
            <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="人員">
          <el-select v-model="addForm.userId" filterable remote :remote-method="searchUsers"
            :loading="userSearchLoading" style="width:100%" placeholder="搜尋員工姓名或工號">
            <el-option v-for="u in userResults" :key="u.id" :label="`${u.displayName} (${u.employeeNo})`" :value="u.id" />
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
import { usersApi } from '@/api/users.api'

const props = defineProps<{
  scopeType: string
  scopeId: string | null
}>()

const ROLE_OPTIONS = [
  { value: 'lead',            label: '負責人'   },
  { value: 'hr',              label: '人事專員' },
  { value: 'hr_manager',      label: '人事主管' },
  { value: 'finance',         label: '財務人員' },
  { value: 'finance_manager', label: '財務主管' },
  { value: 'ceo',             label: '執行長'   },
  { value: 'chairman',        label: '董事長'   },
]

function roleLabel(code: string) {
  return ROLE_OPTIONS.find(r => r.value === code)?.label ?? code
}

const loading = ref(false)
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
    const res = await approvalsApi.listAssignments({
      scopeType: props.scopeType,
      scopeId:   props.scopeId,
      limit:     200,
    })
    assignments.value = res.items ?? res
  } finally {
    loading.value = false
  }
}

watch(() => [props.scopeType, props.scopeId], load, { immediate: true })

// ── 設為預設 ─────────────────────────────────────────────────

async function confirmSetDefault(row: any) {
  await ElMessageBox.confirm(
    `將「${row.user?.displayName}」設為「${roleLabel(row.roleCode)}」的預設審批人？`,
    '確認', { confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning' },
  )
  await approvalsApi.setDefaultAssignment(row.id)
  ElMessage.success('已設為預設')
  await load()
}

// ── 移除 ──────────────────────────────────────────────────────

async function confirmRemove(row: any) {
  await ElMessageBox.confirm(
    `確認移除「${row.user?.displayName}」的「${roleLabel(row.roleCode)}」職能？`,
    '確認移除', { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' },
  )
  await approvalsApi.removeAssignment(row.id)
  ElMessage.success('已移除')
  await load()
}

// ── 新增 ──────────────────────────────────────────────────────

const addVisible     = ref(false)
const addSaving      = ref(false)
const addForm        = ref({ roleCode: '', userId: '' })
const userSearchLoading = ref(false)
const userResults    = ref<any[]>([])

function openAdd() {
  addForm.value = { roleCode: '', userId: '' }
  userResults.value = []
  addVisible.value = true
}

function resetAdd() {
  addForm.value = { roleCode: '', userId: '' }
}

async function searchUsers(q: string) {
  if (!q) return
  userSearchLoading.value = true
  try {
    const res = await usersApi.getAll({ search: q, limit: 20 })
    userResults.value = res.items ?? res
  } finally {
    userSearchLoading.value = false
  }
}

async function doAdd() {
  if (!addForm.value.roleCode || !addForm.value.userId) {
    ElMessage.warning('請選擇角色與人員')
    return
  }
  addSaving.value = true
  try {
    await approvalsApi.addAssignment({
      scopeType: props.scopeType,
      scopeId:   props.scopeId,
      roleCode:  addForm.value.roleCode,
      userId:    addForm.value.userId,
    })
    ElMessage.success('已新增')
    addVisible.value = false
    await load()
  } catch {
    ElMessage.error('新增失敗')
  } finally {
    addSaving.value = false
  }
}
</script>

<style scoped>
.panel-toolbar { margin-bottom: 16px; }
.role-group { margin-bottom: 8px; }
.role-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.emp-no { font-size: 11px; color: #909399; margin-left: 6px; }
</style>
