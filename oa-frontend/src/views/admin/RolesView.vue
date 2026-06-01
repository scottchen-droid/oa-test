<template>
  <div>
    <div class="page-header">
      <h2>角色權限管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增角色</el-button>
    </div>

    <el-row :gutter="20">
      <!-- Left: role list -->
      <el-col :span="9">
        <el-card>
          <template #header>角色列表</template>
          <el-table
            v-loading="rolesLoading"
            :data="roles"
            highlight-current-row
            @current-change="selectRole"
          >
            <el-table-column prop="name" label="角色名稱">
              <template #default="{ row }">
                <el-icon v-if="row.isSystem" size="13" color="#409eff" style="vertical-align: middle; margin-right: 4px"><Lock /></el-icon>
                {{ row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="code" label="代碼" width="140" />
            <el-table-column label="人數" width="60" align="center">
              <template #default="{ row }">{{ row._count?.userRoles ?? 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button v-if="!row.isSystem" text size="small" @click.stop="openEdit(row)">編輯</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- Right: permissions for selected role -->
      <el-col :span="15">
        <el-card v-if="selectedRole">
          <template #header>
            <div style="display:flex; justify-content:space-between; align-items:center">
              <span>{{ selectedRole.name }} — 權限設定</span>
              <el-button
                v-if="!isSuperAdminRole"
                type="primary"
                size="small"
                :loading="savingPerms"
                @click="savePermissions"
              >
                儲存
              </el-button>
            </div>
          </template>

          <el-alert
            v-if="isSuperAdminRole"
            title="超級管理員擁有所有功能的完整存取權限，無需設定個別權限。"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />

          <div v-for="(perms, module) in permissionsByModule" :key="module" class="perm-module">
            <div class="module-title">{{ moduleLabel(module as string) }}</div>
            <el-checkbox-group v-model="selectedPermIds">
              <el-checkbox
                v-for="perm in perms"
                :key="perm.id"
                :value="perm.id"
                :disabled="isSuperAdminRole || selectedRole.isSystem"
              >
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-card>

        <el-empty v-else description="請選擇左側角色以查看權限" />
      </el-col>
    </el-row>

    <!-- Create/Edit dialog -->
    <el-dialog v-model="dialogVisible" :title="editingRole ? '編輯角色' : '新增角色'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editingRole" placeholder="大寫英文+底線，如 DEPT_MGMT" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Lock } from '@element-plus/icons-vue'
import { rolesApi, permissionsApi } from '@/api/roles.api'
import { useUiStore } from '@/stores/ui.store'
import type { Role, Permission } from '@/types'

const MODULE_LABELS: Record<string, string> = {
  admin: '系統管理',
  org: '組織架構',
  hr: '人力資源',
  finance: '財務管理',
}

function moduleLabel(mod: string) {
  return MODULE_LABELS[mod] ?? mod
}

const ui = useUiStore()

const roles = ref<Role[]>([])
const rolesLoading = ref(false)
const selectedRole = ref<Role | null>(null)
const selectedPermIds = ref<string[]>([])
const permissionsByModule = ref<Record<string, Permission[]>>({})

const isSuperAdminRole = computed(() => selectedRole.value?.code === 'SUPER_ADMIN')

const dialogVisible = ref(false)
const editingRole = ref<Role | null>(null)
const saving = ref(false)
const savingPerms = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', code: '', description: '' })

const rules: FormRules = {
  name: [{ required: true, message: '請輸入角色名稱', trigger: 'blur' }],
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '系統管理' }, { title: '角色權限' }])
  await loadData()
})

async function loadData() {
  rolesLoading.value = true
  try {
    const [r, p] = await Promise.all([rolesApi.getAll(), permissionsApi.getAll()])
    roles.value = r
    permissionsByModule.value = p
    if (selectedRole.value) {
      const refreshed = r.find((x) => x.id === selectedRole.value!.id)
      if (refreshed) selectRole(refreshed)
    }
  } finally {
    rolesLoading.value = false
  }
}

function selectRole(role: Role | null) {
  selectedRole.value = role
  if (role) {
    selectedPermIds.value = role.rolePermissions?.map((rp) => rp.permission.id) ?? []
  }
}

async function savePermissions() {
  if (!selectedRole.value) return
  savingPerms.value = true
  try {
    await rolesApi.assignPermissions(selectedRole.value.id, selectedPermIds.value)
    ElMessage.success('權限已更新')
    await loadData()
  } catch {
    ElMessage.error('儲存失敗')
  } finally {
    savingPerms.value = false
  }
}

function openCreate() {
  editingRole.value = null
  Object.assign(form, { name: '', code: '', description: '' })
  dialogVisible.value = true
}

function openEdit(role: Role) {
  editingRole.value = role
  Object.assign(form, { name: role.name, code: role.code, description: role.description ?? '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingRole.value) {
      await rolesApi.update(editingRole.value.id, form)
    } else {
      await rolesApi.create(form)
    }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
    await loadData()
  } catch {
    ElMessage.error('儲存失敗，請確認代碼是否重複')
  } finally {
    saving.value = false
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

.perm-module {
  margin-bottom: 20px;
}
.module-title {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
}
.perm-module :deep(.el-checkbox) {
  margin-right: 20px;
  margin-bottom: 8px;
}
</style>
