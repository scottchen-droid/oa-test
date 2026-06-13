<template>
  <div class="login-page">
    <section class="login-showcase">
      <div class="showcase-brand">
        <div class="brand-mark">O</div>
        <div>
          <strong>OneFlow</strong>
          <span>Group Office Platform</span>
        </div>
      </div>
      <div class="showcase-copy">
        <span class="showcase-kicker">CONNECTED WORKPLACE</span>
        <h2>{{ $t('auth.showcaseTitle') }}</h2>
        <p>{{ $t('auth.showcaseDescription') }}</p>
        <div class="feature-list">
          <div><el-icon><CircleCheckFilled /></el-icon> {{ $t('auth.featureWorkflow') }}</div>
          <div><el-icon><CircleCheckFilled /></el-icon> {{ $t('auth.featureGroup') }}</div>
          <div><el-icon><CircleCheckFilled /></el-icon> {{ $t('auth.featureUpdates') }}</div>
        </div>
      </div>
      <div class="showcase-orbit showcase-orbit--one"></div>
      <div class="showcase-orbit showcase-orbit--two"></div>
    </section>

    <div class="login-card-wrap">
      <div class="mobile-brand">
        <span class="brand-mark">O</span>
        <strong>OneFlow</strong>
      </div>
      <div class="login-card">
      <div class="login-header">
        <span class="login-kicker">WELCOME BACK</span>
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
      <p class="security-note">{{ $t('auth.securityNote') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock, CircleCheckFilled } from '@element-plus/icons-vue'
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
  display: grid;
  grid-template-columns: minmax(480px, 1.15fr) minmax(460px, 0.85fr);
  background: #eef4f4;
}
.login-showcase {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  padding: 48px clamp(48px, 7vw, 100px) 80px;
  overflow: hidden;
  color: #fff;
  background:
    linear-gradient(145deg, rgba(11, 49, 60, 0.98), rgba(10, 103, 95, 0.95)),
    #0d625c;
}
.showcase-brand,
.mobile-brand {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #0b4f4a;
  background: linear-gradient(145deg, #e5fff9, #7edaca);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(30, 210, 181, 0.2);
  font-size: 21px;
  font-weight: 900;
}
.showcase-brand > div:last-child {
  display: flex;
  flex-direction: column;
}
.showcase-brand strong {
  font-size: 20px;
  letter-spacing: -0.02em;
}
.showcase-brand span {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.showcase-copy {
  position: relative;
  z-index: 2;
  max-width: 620px;
}
.showcase-kicker,
.login-kicker {
  color: #8de2d4;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.18em;
}
.showcase-copy h2 {
  max-width: 580px;
  margin: 17px 0;
  font-size: clamp(36px, 4.5vw, 58px);
  line-height: 1.18;
  letter-spacing: -0.045em;
}
.showcase-copy > p {
  max-width: 540px;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  line-height: 1.8;
}
.feature-list {
  display: grid;
  gap: 13px;
  margin-top: 35px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
}
.feature-list div {
  display: flex;
  align-items: center;
  gap: 9px;
}
.feature-list .el-icon {
  color: #85dfcf;
}
.showcase-orbit {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 50%;
}
.showcase-orbit--one {
  top: -170px;
  right: -130px;
  width: 480px;
  height: 480px;
}
.showcase-orbit--two {
  right: 12%;
  bottom: -290px;
  width: 580px;
  height: 580px;
}
.login-card-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}
.login-card {
  width: 100%;
  max-width: 430px;
  background: var(--oa-surface);
  border: 1px solid #dfe9eb;
  border-radius: 20px;
  padding: 45px 42px 30px;
  box-shadow: 0 24px 65px rgba(28, 62, 72, 0.12);
}
.login-header { margin-bottom: 32px; }
.login-kicker { color: var(--oa-primary); }
.login-header h1 {
  margin: 8px 0 7px;
  color: var(--oa-navy);
  font-size: 29px;
  font-weight: 750;
  letter-spacing: -0.03em;
}
.login-header p { margin: 0; color: #82939d; font-size: 13px; }
.forgot-link { text-align: right; margin-bottom: 24px; }
.forgot-link a { font-size: 13px; color: var(--oa-primary); text-decoration: none; }
.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 9px;
  font-weight: 700;
}
.locale-bar {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #edf1f2;
}
.locale-bar :deep(.el-button.is-active) { color: var(--oa-primary); font-weight: 700; }
.mobile-brand {
  display: none;
}
.security-note {
  margin: 18px 0 0;
  color: #91a0a8;
  font-size: 11px;
}

@media (max-width: 960px) {
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 16px;
  }
  .login-showcase {
    display: none;
  }
  .login-card-wrap {
    width: 100%;
    padding: 0;
  }
  .mobile-brand {
    display: flex;
    margin-bottom: 20px;
    color: var(--oa-navy);
  }
  .login-card {
    padding: 38px 28px 26px;
  }
}
</style>
