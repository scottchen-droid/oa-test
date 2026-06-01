<template>
  <div>
    <div class="page-header">
      <h2>帳號管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增帳號</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-input
          v-model="search"
          placeholder="搜尋姓名或Email"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @change="onSearch"
        />
        <el-select v-model="statusFilter" placeholder="帳號狀態" clearable style="width: 160px" @change="onSearch">
          <el-option label="待啟用" value="pending_activation" />
          <el-option label="啟用" value="active" />
          <el-option label="停用" value="suspended" />
          <el-option label="離職" value="resigned" />
          <el-option label="終止" value="terminated" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="employeeNo" label="員工編號" width="120" />
        <el-table-column prop="displayName" label="姓名" />
        <el-table-column prop="email" label="Email" />
        <el-table-column prop="status" label="狀態" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSuperAdmin" label="超級管理員" width="120" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isSuperAdmin" color="#67c23a"><Check /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最後登入" width="160">
          <template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">編輯</el-button>
            <el-button text size="small" @click="resetPassword(row.id)">重置密碼</el-button>
            <el-button
              text
              size="small"
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '啟用' }}
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingUser ? '編輯帳號' : '新增帳號'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="電子郵件" prop="email">
          <el-input v-model="form.email" :disabled="!!editingUser" />
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import type { User } from '@/types'

const ui = useUiStore()
const search = ref('')
const statusFilter = ref('')

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<User>({
  fetchFn: (params) => usersApi.getAll(params as Parameters<typeof usersApi.getAll>[0]),
})

const dialogVisible = ref(false)
const editingUser = ref<User | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ email: '', displayName: '', nameZh: '', employeeNo: '' })

const rules: FormRules = {
  email: [
    { required: true, message: '請輸入電子郵件', trigger: 'blur' },
    { type: 'email', message: '格式不正確', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '請輸入顯示名稱', trigger: 'blur' }],
}

onMounted(() => {
  ui.setBreadcrumbs([{ title: '系統管理' }, { title: '帳號管理' }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ search: search.value || undefined, status: statusFilter.value || undefined })
}

function openCreate() {
  editingUser.value = null
  Object.assign(form, { email: '', displayName: '', nameZh: '', employeeNo: '' })
  dialogVisible.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  Object.assign(form, {
    email: user.email,
    displayName: user.displayName,
    nameZh: user.nameZh ?? '',
    employeeNo: user.employeeNo ?? '',
  })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingUser.value) {
      await usersApi.update(editingUser.value.id, { displayName: form.displayName, nameZh: form.nameZh, employeeNo: form.employeeNo })
      ElMessage.success('更新成功')
    } else {
      await usersApi.create({ email: form.email, displayName: form.displayName, nameZh: form.nameZh, employeeNo: form.employeeNo })
      ElMessage.success('建立成功，系統將發送啟動信至該Email')
    }
    dialogVisible.value = false
    fetch({ search: search.value || undefined, status: statusFilter.value || undefined })
  } finally {
    saving.value = false
  }
}

async function resetPassword(id: string) {
  await ElMessageBox.confirm('確定要重置此帳號的密碼嗎？', '確認', { type: 'warning' })
  await usersApi.resetPassword(id)
  ElMessage.success('密碼重置郵件已發送')
}

async function toggleStatus(user: User) {
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  const label = newStatus === 'active' ? '啟用' : '停用'
  await ElMessageBox.confirm(`確定要${label}此帳號嗎？`, '確認', { type: 'warning' })
  await usersApi.updateStatus(user.id, newStatus)
  ElMessage.success(`${label}成功`)
  fetch({ search: search.value || undefined, status: statusFilter.value || undefined })
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending_activation: '待啟用',
    active: '啟用',
    suspended: '停用',
    resigned: '離職',
    terminated: '終止',
  }
  return map[status] ?? status
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    active: 'success',
    pending_activation: 'warning',
    suspended: 'danger',
    resigned: 'info',
    terminated: 'info',
  }
  return map[status] ?? 'info'
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

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
