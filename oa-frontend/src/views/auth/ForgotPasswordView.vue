<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>忘記密碼</h2>
      <p class="subtitle">請輸入您的電子郵件，我們將發送重置連結</p>

      <template v-if="!sent">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="電子郵件" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="請輸入電子郵件"
              size="large"
            />
          </el-form-item>

          <el-button type="primary" size="large" :loading="loading" class="full-btn" @click="handleSubmit">
            發送重置連結
          </el-button>
        </el-form>
      </template>

      <template v-else>
        <el-result icon="success" title="郵件已發送">
          <template #sub-title>
            <p>密碼重置連結已發送至 <strong>{{ form.email }}</strong>，請查收郵件。</p>
          </template>
        </el-result>
      </template>

      <div class="back-link">
        <RouterLink to="/login">返回登入</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { authApi } from '@/api/auth.api'

const formRef = ref<FormInstance>()
const loading = ref(false)
const sent = ref(false)
const form = reactive({ email: '' })

const rules: FormRules = {
  email: [
    { required: true, message: '請輸入電子郵件', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的電子郵件格式', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authApi.forgotPassword(form.email)
    sent.value = true
  } catch {
    ElMessage.error('發送失敗，請稍後再試')
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
  background: var(--oa-surface);
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px;
}

.full-btn {
  width: 100%;
  margin-top: 8px;
}

.back-link {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
}

.back-link a {
  color: #409eff;
  text-decoration: none;
}
</style>
