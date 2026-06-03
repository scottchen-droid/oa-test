<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>{{ $t('auth.loginTitle') }}</h1>
        <p>{{ $t('auth.loginSubtitle') }}</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item :label="$t('auth.account')" prop="account">
          <el-input
            v-model="form.account"
            type="text"
            :placeholder="$t('auth.accountPlaceholder')"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item :label="$t('auth.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="$t('auth.passwordPlaceholder')"
            size="large"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="forgot-link">
          <RouterLink to="/forgot-password">{{ $t('auth.forgotPassword') }}？</RouterLink>
        </div>

        <el-button type="primary" size="large" :loading="loading" class="login-btn" @click="handleLogin">
          {{ loading ? $t('auth.loggingIn') : $t('auth.loginButton') }}
        </el-button>
      </el-form>

      <!-- 語系切換 -->
      <div class="locale-bar">
        <el-button
          v-for="loc in SUPPORTED_LOCALES"
          :key="loc.value"
          text
          size="small"
          :class="{ 'is-active': locale === loc.value }"
          @click="switchLocale(loc.value)"
        >
          {{ loc.label }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.store'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const { t, locale } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form    = reactive({ account: '', password: '' })

const rules: FormRules = {
  account:  [{ required: true, message: t('common.required'), trigger: 'blur' }],
  password: [{ required: true, message: t('common.required'), trigger: 'blur' }],
}

function switchLocale(loc: SupportedLocale) { setLocale(loc) }

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await auth.login(form.account, form.password)
    // After login, fetch full user profile to detect locale from region
    await auth.fetchCurrentUser()
    const redirect = (route.query.redirect as string) || '/home'
    router.push(redirect)
  } catch (err: any) {
    if (!err.response || err.response.status === 401) {
      ElMessage.error(t('auth.loginFailed'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px 32px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.login-header { text-align: center; margin-bottom: 36px; }
.login-header h1 { font-size: 28px; font-weight: 700; color: #333; margin: 0 0 8px; }
.login-header p  { font-size: 14px; color: #999; margin: 0; }
.forgot-link { text-align: right; margin-bottom: 24px; }
.forgot-link a { font-size: 13px; color: #409eff; text-decoration: none; }
.login-btn { width: 100%; }
.locale-bar {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.locale-bar :deep(.el-button.is-active) { color: #409eff; font-weight: 600; }
</style>
