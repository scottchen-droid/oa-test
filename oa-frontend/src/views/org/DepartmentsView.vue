<template>
  <div>
    <div class="page-header">
      <h2>部門管理</h2>
      <el-button type="primary" :icon="Plus" :disabled="!selectedCompanyId" @click="openCreate">新增部門</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="selectedCompanyId" placeholder="請選擇公司" style="width: 220px" @change="loadTree">
          <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>

      <el-tree
        v-if="tree.length"
        v-loading="loading"
        :data="tree"
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <span>{{ data.code }} — {{ data.name }}</span>
            <span class="tree-actions">
              <el-tag :type="data.isActive ? 'success' : 'info'" size="small" style="margin-right: 8px">
                {{ data.isActive ? '啟用' : '停用' }}
              </el-tag>
              <el-button text size="small" @click.stop="openEdit(data)">編輯</el-button>
              <el-button text size="small" @click.stop="openCreateChild(data)">新增子部門</el-button>
            </span>
          </span>
        </template>
      </el-tree>

      <el-empty v-else-if="!loading && selectedCompanyId" description="暫無部門資料" />
      <el-empty v-else-if="!selectedCompanyId" description="請先選擇公司" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '編輯部門' : '新增部門'" width="620px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本資訊" name="info">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="margin-top:8px">
            <el-form-item label="上級部門">
              <el-tree-select
                v-model="form.parentDepartmentId"
                :data="tree"
                node-key="id"
                :props="{ label: 'name', children: 'children' }"
                clearable
                style="width: 100%"
                placeholder="無（頂層部門）"
              />
            </el-form-item>
            <el-form-item label="代碼" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
            <el-form-item label="部門名稱" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="狀態">
              <el-switch v-model="form.isActive" active-text="啟用" inactive-text="停用" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="editing" label="審批職能" name="assignments">
          <ApprovalAssignmentPanel scope-type="department" :scope-id="editing.id" style="margin-top:8px" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="activeTab === 'info'" type="primary" :loading="saving" @click="handleSave">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { departmentsApi, companiesApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import ApprovalAssignmentPanel from '@/components/ApprovalAssignmentPanel.vue'
import type { Department, Company } from '@/types'

const ui = useUiStore()
const loading = ref(false)
const tree = ref<Department[]>([])
const companies = ref<Company[]>([])
const selectedCompanyId = ref('')
const dialogVisible = ref(false)
const editing = ref<Department | null>(null)
const saving = ref(false)
const activeTab = ref('info')
const formRef = ref<FormInstance>()
const form = reactive({ companyId: '', parentDepartmentId: '', code: '', name: '', isActive: true })

const rules: FormRules = {
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  name: [{ required: true, message: '請輸入部門名稱', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '組織架構' }, { title: '部門管理' }])
  companies.value = await companiesApi.getAll()
})

async function loadTree() {
  if (!selectedCompanyId.value) return
  loading.value = true
  try {
    tree.value = await departmentsApi.getTree(selectedCompanyId.value)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  activeTab.value = 'info'
  Object.assign(form, { companyId: selectedCompanyId.value, parentDepartmentId: '', code: '', name: '', isActive: true })
  dialogVisible.value = true
}

function openCreateChild(parent: Department) {
  editing.value = null
  activeTab.value = 'info'
  Object.assign(form, { companyId: selectedCompanyId.value, parentDepartmentId: parent.id, code: '', name: '', isActive: true })
  dialogVisible.value = true
}

function openEdit(dept: Department) {
  editing.value = dept
  activeTab.value = 'info'
  Object.assign(form, { companyId: selectedCompanyId.value, parentDepartmentId: dept.parentDepartmentId ?? '', code: dept.code, name: dept.name, isActive: dept.isActive })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const payload = { ...form, parentDepartmentId: form.parentDepartmentId || undefined }
  try {
    if (editing.value) {
      await departmentsApi.update(editing.value.id, payload)
    } else {
      await departmentsApi.create(payload)
    }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
    await loadTree()
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

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.toolbar {
  margin-bottom: 16px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 16px;
}

.tree-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
