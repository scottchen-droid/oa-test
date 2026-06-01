<template>
  <div class="bootstrap-page">
    <div class="bootstrap-card">
      <div class="bootstrap-header">
        <el-icon size="48" color="#409eff"><Setting /></el-icon>
        <h1>系統初始化</h1>
        <p>歡迎使用 OA System。請建立第一個超級管理員帳號以開始使用。</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="電子郵件" prop="email">
          <el-input v-model="form.email" type="email" size="large" placeholder="admin@example.com" />
        </el-form-item>

        <el-form-item label="顯示名稱" prop="displayName">
          <el-input v-model="form.displayName" size="large" placeholder="系統管理員" />
        </el-form-item>

        <el-form-item label="密碼" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            show-password
            placeholder="至少 8 個字元"
          />
        </el-form-item>

        <el-form-item label="確認密碼" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            size="large"
            show-password
            placeholder="再次輸入密碼"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="submit-btn"
          @click="handleSubmit"
        >
          建立超級管理員
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { adminApi } from '@/api/admin.api'
import { useAuthStore } from '@/stores/auth.store'
import { resetBootstrapCache } from '@/router'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  displayName: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '請輸入電子郵件', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的電子郵件格式', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '請輸入顯示名稱', trigger: 'blur' }],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 8, message: '密碼至少需要 8 個字元', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '請確認密碼', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) callback(new Error('兩次密碼不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await adminApi.bootstrap({
      email: form.email,
      displayName: form.displayName,
      password: form.password,
    })

    ElMessage.success('超級管理員建立成功，正在登入...')
    resetBootstrapCache()
    await auth.login(form.email, form.password)
    router.push('/dashboard')
  } catch {
    ElMessage.error('建立失敗，請確認表單資訊')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.bootstrap-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bootstrap-card {
  width: 460px;
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.bootstrap-header {
  text-align: center;
  margin-bottom: 36px;
}

.bootstrap-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 12px 0 8px;
}

.bootstrap-header p {
  font-size: 14px;
  color: #999;
  margin: 0;
  line-height: 1.6;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
