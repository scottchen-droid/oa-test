<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('nav.users') }}</h2>
    </div>

    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 16px"
    >
      <template #title>
        {{ $t('users.accountTip') }}
        <router-link to="/hr/employees" style="margin-left: 8px; color: #409eff">
          {{ $t('nav.employees') }} →
        </router-link>
      </template>
    </el-alert>

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
        <el-select v-model="statusFilter" :placeholder="$t('common.status')" clearable style="width: 160px" @change="onSearch">
          <el-option :label="$t('status.pending_activation')" value="pending_activation" />
          <el-option :label="$t('status.active')"             value="active" />
          <el-option :label="$t('status.suspended')"          value="suspended" />
          <el-option :label="$t('status.resigned')"           value="resigned" />
          <el-option :label="$t('status.terminated')"         value="terminated" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="data" border stripe>
        <el-table-column prop="employeeNo" :label="$t('user.employeeNo')" width="120" />
        <el-table-column :label="$t('user.displayName')">
          <template #default="{ row }">
            <span>{{ row.displayName }}</span>
            <div v-if="row.nameZh" class="sub-text">{{ row.nameZh }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" />
        <el-table-column :label="$t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ $t(`status.${row.status}`) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('user.roles')" min-width="140">
          <template #default="{ row }">
            <el-tag
              v-for="ur in row.userRoles"
              :key="ur.role.id"
              size="small"
              type="info"
              style="margin-right: 4px; margin-bottom: 2px"
            >
              {{ ur.role.name }}
            </el-tag>
            <span v-if="!row.userRoles?.length" class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('users.lastLogin')" width="160">
          <template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button text size="small" @click="resetPassword(row.id)">{{ $t('users.resetPwd') }}</el-button>
            <el-button
              text size="small"
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? $t('common.disable') : $t('common.enable') }}
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

    <!-- 編輯帳號 Dialog -->
    <el-dialog v-model="dialogVisible" :title="$t('users.editAccount')" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" disabled />
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
        <el-form-item :label="$t('common.status')">
          <el-select v-model="form.status" style="width:100%">
            <el-option :label="$t('status.pending_activation')" value="pending_activation" />
            <el-option :label="$t('status.active')"             value="active" />
            <el-option :label="$t('status.suspended')"          value="suspended" />
            <el-option :label="$t('status.resigned')"           value="resigned" />
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'
import type { User } from '@/types'

const { t } = useI18n()
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
const form = reactive({ email: '', displayName: '', nameZh: '', employeeNo: '', status: 'active' })

const rules: FormRules = {
  displayName: [{ required: true, message: t('common.required'), trigger: 'blur' }],
}

onMounted(() => {
  ui.setBreadcrumbs([{ title: t('nav.systemModule') }, { title: t('nav.users') }])
  fetch()
})

function onSearch() {
  pagination.page = 1
  fetch({ search: search.value || undefined, status: statusFilter.value || undefined })
}

function openEdit(user: User) {
  editingUser.value = user
  Object.assign(form, {
    email: user.email,
    displayName: user.displayName,
    nameZh: user.nameZh ?? '',
    employeeNo: user.employeeNo ?? '',
    status: user.status,
  })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await usersApi.update(editingUser.value!.id, {
      displayName: form.displayName,
      nameZh: form.nameZh || undefined,
      employeeNo: form.employeeNo || undefined,
      status: form.status,
    })
    ElMessage.success(t('msg.saveSuccess'))
    dialogVisible.value = false
    fetch({ search: search.value || undefined, status: statusFilter.value || undefined })
  } finally {
    saving.value = false
  }
}

async function resetPassword(id: string) {
  await ElMessageBox.confirm(t('users.confirmResetPwd'), t('common.confirm'), { type: 'warning' })
  await usersApi.resetPassword(id)
  ElMessage.success(t('users.resetPwdSent'))
}

async function toggleStatus(user: User) {
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  const label = newStatus === 'active' ? t('common.enable') : t('common.disable')
  await ElMessageBox.confirm(`${t('users.confirmToggle')} (${label})？`, t('common.confirm'), { type: 'warning' })
  await usersApi.updateStatus(user.id, newStatus)
  ElMessage.success(t('msg.operationSuccess'))
  fetch({ search: search.value || undefined, status: statusFilter.value || undefined })
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    active: 'success', pending_activation: 'warning', suspended: 'danger', resigned: 'info', terminated: 'info',
  }
  return map[status] ?? 'info'
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '—'
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.sub-text { font-size: 11px; color: #909399; }
.text-muted { color: #c0c4cc; font-size: 12px; }
</style>
