<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>重設密碼</h2>

      <template v-if="!done">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="新密碼" prop="newPassword">
            <el-input v-model="form.newPassword" type="password" show-password size="large" placeholder="請輸入新密碼" />
          </el-form-item>
          <el-form-item label="確認新密碼" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password size="large" placeholder="請再次輸入新密碼" />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="full-btn" @click="handleSubmit">
            確認重設
          </el-button>
        </el-form>
      </template>

      <template v-else>
        <el-result icon="success" title="密碼重設成功">
          <template #extra>
            <el-button type="primary" @click="router.push('/login')">前往登入</el-button>
          </template>
        </el-result>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { authApi } from '@/api/auth.api'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const done = ref(false)
const form = reactive({ newPassword: '', confirmPassword: '' })

const rules: FormRules = {
  newPassword: [
    { required: true, message: '請輸入新密碼', trigger: 'blur' },
    { min: 8, message: '密碼至少需要8個字元', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '請確認新密碼', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) callback(new Error('兩次密碼不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const token = route.query.token as string
  if (!token) {
    ElMessage.error('無效的重置連結')
    return
  }

  loading.value = true
  try {
    await authApi.resetPassword(token, form.newPassword)
    done.value = true
  } catch {
    ElMessage.error('重設失敗，連結可能已失效')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 32px;
}

.full-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
