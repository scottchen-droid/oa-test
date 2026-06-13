<template>
  <div class="groups-layout">
    <!-- 左側：群組列表 -->
    <div class="groups-panel">
      <div class="panel-header">
        <span class="panel-title">處理群組</span>
        <el-button size="small" type="primary" @click="openCreate">新增群組</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="groups"
        highlight-current-row
        border
        size="small"
        @current-change="onGroupSelect"
      >
        <el-table-column label="名稱" prop="name" min-width="100" />
        <el-table-column label="成員數" width="65" align="center">
          <template #default="{ row }">{{ row.members?.length ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="狀態" width="65" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click.stop="openEdit(row)">編輯</el-button>
            <el-button size="small" :type="row.isEnabled ? 'warning' : 'success'" @click.stop="handleToggle(row)">
              {{ row.isEnabled ? '停' : '啟' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 右側：成員管理 -->
    <div class="members-panel">
      <template v-if="selectedGroup">
        <div class="panel-header">
          <span class="panel-title">{{ selectedGroup.name }} — 成員管理</span>
        </div>

        <!-- 加入成員 -->
        <div class="add-member-row">
          <el-select
            v-model="newMemberUserId"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            placeholder="搜尋員工姓名或編號"
            style="width: 220px"
            clearable
          >
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :label="`${u.displayName}（${u.employeeNo ?? ''}）`"
              :value="u.id"
            />
          </el-select>
          <el-checkbox v-model="newMemberIsLeader" label="設為負責人" style="margin-left: 8px;" />
          <el-button type="primary" :disabled="!newMemberUserId" :loading="addingMember" @click="handleAddMember">
            加入成員
          </el-button>
        </div>

        <!-- 成員列表 -->
        <el-table :data="selectedGroup.members" border size="small">
          <el-table-column label="姓名" min-width="100">
            <template #default="{ row }">{{ row.user?.displayName }}</template>
          </el-table-column>
          <el-table-column label="員工編號" width="110">
            <template #default="{ row }">{{ row.user?.employeeNo }}</template>
          </el-table-column>
          <el-table-column label="角色" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isLeader" type="warning" size="small">負責人</el-tag>
              <span v-else>成員</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                type="danger"
                link
                @click="handleRemoveMember(row.userId)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <el-empty v-else description="請從左側選擇群組以管理成員" />
    </div>

    <!-- 新增/編輯 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '編輯群組' : '新增群組'"
      width="400px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="群組名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入群組名稱" />
        </el-form-item>
        <el-form-item label="說明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="群組說明（選填）" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { workOrderGroupsApi, type WorkOrderGroup } from '@/api/work-order-groups.api'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
ui.setBreadcrumbs([{ title: '系統設定' }, { title: '工作單處理群組' }])

const loading = ref(false)
const groups = ref<WorkOrderGroup[]>([])
const selectedGroup = ref<WorkOrderGroup | null>(null)

async function loadGroups() {
  loading.value = true
  try {
    groups.value = await workOrderGroupsApi.adminList()
    // 如果之前已選中群組，重新同步資料
    if (selectedGroup.value) {
      const updated = groups.value.find(g => g.id === selectedGroup.value!.id)
      selectedGroup.value = updated ?? null
    }
  } catch {
    ElMessage.error('載入群組失敗')
  } finally {
    loading.value = false
  }
}

onMounted(loadGroups)

function onGroupSelect(group: WorkOrderGroup | null) {
  selectedGroup.value = group
}

async function handleToggle(group: WorkOrderGroup) {
  try {
    await workOrderGroupsApi.toggle(group.id)
    await loadGroups()
    ElMessage.success('狀態已更新')
  } catch {
    ElMessage.error('操作失敗')
  }
}

// ─── 加入/移除成員 ─────────────────────────────────────────────────────────────
interface UserOption { id: string; displayName: string; employeeNo?: string }

const newMemberUserId = ref('')
const newMemberIsLeader = ref(false)
const addingMember = ref(false)
const userSearchLoading = ref(false)
const userOptions = ref<UserOption[]>([])

async function searchUsers(query: string) {
  if (!query.trim()) { userOptions.value = []; return }
  userSearchLoading.value = true
  try {
    const result = await usersApi.getAll({ search: query, limit: 20 })
    userOptions.value = result.items.map(u => ({
      id: u.id,
      displayName: u.displayName,
      employeeNo: u.employeeNo,
    }))
  } catch {
    userOptions.value = []
  } finally {
    userSearchLoading.value = false
  }
}

async function handleAddMember() {
  if (!selectedGroup.value || !newMemberUserId.value) return
  addingMember.value = true
  try {
    await workOrderGroupsApi.addMember(selectedGroup.value.id, newMemberUserId.value, newMemberIsLeader.value)
    newMemberUserId.value = ''
    newMemberIsLeader.value = false
    await loadGroups()
    ElMessage.success('成員已加入')
  } catch {
    ElMessage.error('加入成員失敗')
  } finally {
    addingMember.value = false
  }
}

async function handleRemoveMember(userId: string) {
  if (!selectedGroup.value) return
  try {
    await ElMessageBox.confirm('確定要移除此成員？', '確認', { type: 'warning' })
    await workOrderGroupsApi.removeMember(selectedGroup.value.id, userId)
    await loadGroups()
    ElMessage.success('成員已移除')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('移除成員失敗')
  }
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const form = ref({ name: '', description: '' })

const rules: FormRules = {
  name: [{ required: true, message: '請輸入群組名稱', trigger: 'blur' }],
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '' }
  dialogVisible.value = true
}

function openEdit(group: WorkOrderGroup) {
  editingId.value = group.id
  form.value = { name: group.name, description: group.description ?? '' }
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  editingId.value = null
}

async function handleSave() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (editingId.value) {
        await workOrderGroupsApi.update(editingId.value, {
          name: form.value.name,
          description: form.value.description || undefined,
        })
      } else {
        await workOrderGroupsApi.create({
          name: form.value.name,
          description: form.value.description || undefined,
        })
      }
      dialogVisible.value = false
      await loadGroups()
      ElMessage.success('儲存成功')
    } catch {
      ElMessage.error('儲存失敗')
    } finally {
      saving.value = false
    }
  })
}
</script>

<style scoped>
.groups-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.groups-panel {
  width: 420px;
  flex-shrink: 0;
  background: var(--oa-surface);
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.members-panel {
  flex: 1;
  background: var(--oa-surface);
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  min-height: 300px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title { font-size: 15px; font-weight: 600; color: #303133; }

.add-member-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
