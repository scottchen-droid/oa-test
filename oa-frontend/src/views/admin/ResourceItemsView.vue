<template>
  <div>
    <div class="page-header">
      <h2>資源項目設定</h2>
      <el-button type="primary" @click="openCreate">新增資源項目</el-button>
    </div>

    <el-table v-loading="loading" :data="items" border>
      <el-table-column label="名稱" prop="name" min-width="120" />
      <el-table-column label="代碼" prop="code" width="120" />
      <el-table-column label="類型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.category === 'account' ? '' : 'warning'" size="small">
            {{ row.category === 'account' ? '帳號' : '實體' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="負責單位" prop="responsibleUnit" min-width="100">
        <template #default="{ row }">{{ row.responsibleUnit ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="入職" width="60" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.availableOnOnboard" color="#67c23a"><Check /></el-icon>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="離職" width="60" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.requiredOnOffboard" color="#67c23a"><Check /></el-icon>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="新增" width="60" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.availableOnAdd" color="#67c23a"><Check /></el-icon>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="變更" width="60" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.availableOnChange" color="#67c23a"><Check /></el-icon>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="需回填" width="70" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.requiresAccountFill" color="#e6a23c"><Check /></el-icon>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
            {{ row.isEnabled ? '啟用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">編輯</el-button>
          <el-button size="small" :type="row.isEnabled ? 'warning' : 'success'" @click="handleToggle(row)">
            {{ row.isEnabled ? '停用' : '啟用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/編輯 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '編輯資源項目' : '新增資源項目'"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入名稱" />
        </el-form-item>
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editingId" placeholder="大寫英文+底線，如 EMAIL_ACCOUNT" />
        </el-form-item>
        <el-form-item label="類型" prop="category">
          <el-select v-model="form.category" style="width:100%">
            <el-option label="帳號 (account)" value="account" />
            <el-option label="實體 (physical)" value="physical" />
          </el-select>
        </el-form-item>
        <el-form-item label="負責單位">
          <el-input v-model="form.responsibleUnit" placeholder="選填" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" style="width:100%" />
        </el-form-item>
        <el-divider>適用情境</el-divider>
        <el-form-item label="入職時可申請">
          <el-switch v-model="form.availableOnOnboard" />
        </el-form-item>
        <el-form-item label="離職時必須回收">
          <el-switch v-model="form.requiredOnOffboard" />
        </el-form-item>
        <el-form-item label="在職新增可申請">
          <el-switch v-model="form.availableOnAdd" />
        </el-form-item>
        <el-form-item label="在職變更可申請">
          <el-switch v-model="form.availableOnChange" />
        </el-form-item>
        <el-form-item label="需回填帳號">
          <el-switch v-model="form.requiresAccountFill" />
        </el-form-item>
        <el-form-item v-if="editingId" label="啟用狀態">
          <el-switch v-model="form.isEnabled" />
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
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { resourceItemsApi, type ResourceItem } from '@/api/resource-items.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
ui.setBreadcrumbs([{ title: '系統設定' }, { title: '資源項目設定' }])

const loading = ref(false)
const items = ref<ResourceItem[]>([])

async function loadItems() {
  loading.value = true
  try {
    items.value = await resourceItemsApi.adminList()
  } catch {
    ElMessage.error('載入資源項目失敗')
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)

async function handleToggle(item: ResourceItem) {
  try {
    await resourceItemsApi.toggle(item.id)
    await loadItems()
    ElMessage.success('狀態已更新')
  } catch {
    ElMessage.error('操作失敗')
  }
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()

interface ItemForm {
  name: string
  code: string
  category: string
  responsibleUnit: string
  sortOrder: number
  availableOnOnboard: boolean
  requiredOnOffboard: boolean
  availableOnAdd: boolean
  availableOnChange: boolean
  requiresAccountFill: boolean
  isEnabled: boolean
}

const form = ref<ItemForm>({
  name: '',
  code: '',
  category: 'account',
  responsibleUnit: '',
  sortOrder: 0,
  availableOnOnboard: false,
  requiredOnOffboard: false,
  availableOnAdd: false,
  availableOnChange: false,
  requiresAccountFill: false,
  isEnabled: true,
})

const rules: FormRules = {
  name: [{ required: true, message: '請輸入名稱', trigger: 'blur' }],
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  category: [{ required: true, message: '請選擇類型', trigger: 'change' }],
}

function openCreate() {
  editingId.value = null
  form.value = {
    name: '',
    code: '',
    category: 'account',
    responsibleUnit: '',
    sortOrder: 0,
    availableOnOnboard: false,
    requiredOnOffboard: false,
    availableOnAdd: false,
    availableOnChange: false,
    requiresAccountFill: false,
    isEnabled: true,
  }
  dialogVisible.value = true
}

function openEdit(item: ResourceItem) {
  editingId.value = item.id
  form.value = {
    name: item.name,
    code: item.code,
    category: item.category,
    responsibleUnit: item.responsibleUnit ?? '',
    sortOrder: item.sortOrder,
    availableOnOnboard: item.availableOnOnboard,
    requiredOnOffboard: item.requiredOnOffboard,
    availableOnAdd: item.availableOnAdd,
    availableOnChange: item.availableOnChange,
    requiresAccountFill: item.requiresAccountFill,
    isEnabled: item.isEnabled,
  }
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
        await resourceItemsApi.update(editingId.value, {
          name: form.value.name,
          responsibleUnit: form.value.responsibleUnit || undefined,
          sortOrder: form.value.sortOrder,
          availableOnOnboard: form.value.availableOnOnboard,
          requiredOnOffboard: form.value.requiredOnOffboard,
          availableOnAdd: form.value.availableOnAdd,
          availableOnChange: form.value.availableOnChange,
          requiresAccountFill: form.value.requiresAccountFill,
          isEnabled: form.value.isEnabled,
        })
      } else {
        await resourceItemsApi.create({
          code: form.value.code,
          name: form.value.name,
          category: form.value.category,
          responsibleUnit: form.value.responsibleUnit || undefined,
          sortOrder: form.value.sortOrder,
          availableOnOnboard: form.value.availableOnOnboard,
          requiredOnOffboard: form.value.requiredOnOffboard,
          availableOnAdd: form.value.availableOnAdd,
          availableOnChange: form.value.availableOnChange,
          requiresAccountFill: form.value.requiresAccountFill,
        })
      }
      dialogVisible.value = false
      await loadItems()
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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
</style>
