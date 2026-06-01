<template>
  <div>
    <div class="page-header">
      <h2>業務單位</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增業務單位</el-button>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column prop="code" label="代碼" width="120" />
        <el-table-column prop="name" label="名稱" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="isActive" label="狀態" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '啟用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">編輯</el-button>
            <el-button text size="small" :type="row.isActive ? 'warning' : 'success'" @click="handleToggle(row)">
              {{ row.isActive ? '停用' : '啟用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '編輯業務單位' : '新增業務單位'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="狀態">
          <el-switch v-model="form.isActive" active-text="啟用" inactive-text="停用" />
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
import { Plus } from '@element-plus/icons-vue'
import { businessUnitsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import type { BusinessUnit } from '@/types'

const ui = useUiStore()
const loading = ref(false)
const items = ref<BusinessUnit[]>([])
const dialogVisible = ref(false)
const editing = ref<BusinessUnit | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ code: '', name: '', description: '', isActive: true })

const rules: FormRules = {
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  name: [{ required: true, message: '請輸入名稱', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '組織架構' }, { title: '業務單位' }])
  await load()
})

async function load() {
  loading.value = true
  try {
    items.value = await businessUnitsApi.getAll()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code: '', name: '', description: '', isActive: true })
  dialogVisible.value = true
}

function openEdit(item: BusinessUnit) {
  editing.value = item
  Object.assign(form, { code: item.code, name: item.name, description: item.description ?? '', isActive: item.isActive })
  dialogVisible.value = true
}

async function handleToggle(item: BusinessUnit) {
  try {
    await businessUnitsApi.toggleActive(item.id)
    ElMessage.success(`已${item.isActive ? '停用' : '啟用'}`)
    await load()
  } catch {
    ElMessage.error('操作失敗')
  }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editing.value) {
      await businessUnitsApi.update(editing.value.id, form)
    } else {
      await businessUnitsApi.create(form)
    }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
    await load()
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
</style>
