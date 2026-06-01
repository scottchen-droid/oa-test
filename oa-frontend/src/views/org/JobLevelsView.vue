<template>
  <div>
    <div class="page-header">
      <h2>職級管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增職級</el-button>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column prop="code" label="代碼" width="120" />
        <el-table-column prop="name" label="職級名稱" />
        <el-table-column prop="levelOrder" label="排序" width="100" align="center" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="isActive" label="狀態" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '啟用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">編輯</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '編輯職級' : '新增職級'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="職級名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="排序" prop="levelOrder">
          <el-input-number v-model="form.levelOrder" :min="1" />
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
import { jobLevelsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import type { JobLevel } from '@/types'

const ui = useUiStore()
const loading = ref(false)
const items = ref<JobLevel[]>([])
const dialogVisible = ref(false)
const editing = ref<JobLevel | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ code: '', name: '', levelOrder: 1, description: '', isActive: true })

const rules: FormRules = {
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  name: [{ required: true, message: '請輸入職級名稱', trigger: 'blur' }],
  levelOrder: [{ required: true, message: '請輸入排序', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '組織架構' }, { title: '職級管理' }])
  await load()
})

async function load() {
  loading.value = true
  try {
    items.value = await jobLevelsApi.getAll()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code: '', name: '', levelOrder: 1, description: '', isActive: true })
  dialogVisible.value = true
}

function openEdit(item: JobLevel) {
  editing.value = item
  Object.assign(form, { code: item.code, name: item.name, levelOrder: item.levelOrder, description: item.description ?? '', isActive: item.isActive })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editing.value) {
      await jobLevelsApi.update(editing.value.id, form)
    } else {
      await jobLevelsApi.create(form)
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
