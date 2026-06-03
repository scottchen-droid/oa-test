<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('nav.roles') }}</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('roles.createRole') }}</el-button>
    </div>

    <el-row :gutter="20">
      <!-- 角色列表 -->
      <el-col :span="9">
        <el-card>
          <template #header>{{ $t('roles.roleList') }}</template>
          <el-table v-loading="rolesLoading" :data="roles" highlight-current-row @current-change="selectRole">
            <el-table-column prop="name" :label="$t('user.role')">
              <template #default="{ row }">
                <el-icon v-if="row.isSystem" size="13" color="#409eff" style="vertical-align:middle;margin-right:4px"><Lock /></el-icon>
                {{ row.name }}
                <el-tag v-if="row.isSystem" size="small" type="info" style="margin-left:6px">{{ $t('roles.systemRole') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="code" :label="$t('common.code')" width="140" />
            <el-table-column :label="$t('roles.assignedUsers')" width="80" align="center">
              <template #default="{ row }">{{ row._count?.userRoles ?? 0 }}</template>
            </el-table-column>
            <el-table-column :label="$t('common.actions')" width="80" align="center">
              <template #default="{ row }">
                <el-button v-if="!row.isSystem" text size="small" @click.stop="openEdit(row)">{{ $t('common.edit') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 權限設定 -->
      <el-col :span="15">
        <el-card v-if="selectedRole">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>{{ selectedRole.name }} — {{ $t('roles.permSettings') }}</span>
              <el-button type="primary" size="small" :loading="savingPerms" @click="savePermissions">
                {{ $t('roles.savePerms') }}
              </el-button>
            </div>
          </template>

          <el-alert
            v-if="isAdminRole"
            :title="$t('roles.adminReadOnly')"
            type="info"
            :closable="false"
            style="margin-bottom:16px"
          />

          <div v-for="(perms, module) in permissionsByModule" :key="module" class="perm-module">
            <div class="module-title">{{ moduleLabel(module as string) }}</div>
            <el-checkbox-group v-model="selectedPermIds">
              <el-checkbox v-for="perm in perms" :key="perm.id" :value="perm.id" :disabled="isAdminRole">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-card>

        <el-empty v-else :description="$t('common.pleaseSelect') + $t('roles.roleList')" />
      </el-col>
    </el-row>

    <!-- 新增/編輯角色 -->
    <el-dialog v-model="dialogVisible" :title="editingRole ? $t('roles.editRole') : $t('roles.createRole')" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="$t('user.role')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('roles.roleCode')" prop="code">
          <el-input v-model="form.code" :disabled="!!editingRole" :placeholder="$t('roles.codeHint')" />
        </el-form-item>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Lock } from '@element-plus/icons-vue'
import { rolesApi, permissionsApi } from '@/api/roles.api'
import { useUiStore } from '@/stores/ui.store'
import type { Role, Permission } from '@/types'

const { t } = useI18n()
const ui = useUiStore()

const MODULE_LABELS: Record<string, string> = {
  module: '模塊入口', home: '首頁功能', hr: '人事模塊',
  finance: '財務模塊', administration: '行政模塊', system: '系統模塊',
}
function moduleLabel(mod: string) { return MODULE_LABELS[mod] ?? mod }

const roles              = ref<Role[]>([])
const rolesLoading       = ref(false)
const selectedRole       = ref<Role | null>(null)
const selectedPermIds    = ref<string[]>([])
const permissionsByModule = ref<Record<string, Permission[]>>({})

const isAdminRole = computed(() => selectedRole.value?.code === 'ADMIN')

const dialogVisible = ref(false)
const editingRole   = ref<Role | null>(null)
const saving        = ref(false)
const savingPerms   = ref(false)
const formRef       = ref<FormInstance>()
const form          = reactive({ name: '', code: '', description: '' })

const rules: FormRules = {
  name: [{ required: true, message: t('common.required'), trigger: 'blur' }],
  code: [{ required: true, message: t('common.required'), trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: t('nav.systemModule') }, { title: t('nav.roles') }])
  await loadData()
})

async function loadData() {
  rolesLoading.value = true
  try {
    const [r, p] = await Promise.all([rolesApi.getAll(), permissionsApi.getAll()])
    roles.value = r
    permissionsByModule.value = p
    if (selectedRole.value) {
      const refreshed = r.find(x => x.id === selectedRole.value!.id)
      if (refreshed) selectRole(refreshed)
    }
  } finally {
    rolesLoading.value = false
  }
}

function selectRole(role: Role | null) {
  selectedRole.value = role
  if (role) selectedPermIds.value = role.rolePermissions?.map(rp => rp.permission.id) ?? []
}

async function savePermissions() {
  if (!selectedRole.value) return
  savingPerms.value = true
  try {
    await rolesApi.assignPermissions(selectedRole.value.id, selectedPermIds.value)
    ElMessage.success(t('msg.saveSuccess'))
    await loadData()
  } catch {
    ElMessage.error(t('msg.saveFailed'))
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
    editingRole.value
      ? await rolesApi.update(editingRole.value.id, form)
      : await rolesApi.create(form)
    ElMessage.success(t('msg.saveSuccess'))
    dialogVisible.value = false
    await loadData()
  } catch {
    ElMessage.error(t('msg.codeDuplicate'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.page-header h2 { font-size:20px; font-weight:600; margin:0; }
.perm-module { margin-bottom:20px; }
.module-title { font-size:13px; font-weight:600; color:#409eff; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e4e7ed; }
.perm-module :deep(.el-checkbox) { margin-right:20px; margin-bottom:8px; }
</style>
