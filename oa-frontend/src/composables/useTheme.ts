import { computed, ref } from 'vue'

export type AppTheme = 'light' | 'comfort'

const THEME_STORAGE_KEY = 'oa_theme'
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
const theme = ref<AppTheme>(storedTheme === 'comfort' ? 'comfort' : 'light')

function applyTheme(value: AppTheme) {
  theme.value = value
  document.documentElement.dataset.theme = value
  localStorage.setItem(THEME_STORAGE_KEY, value)
}

applyTheme(theme.value)

export function useTheme() {
  const isComfort = computed(() => theme.value === 'comfort')

  function toggleTheme() {
    applyTheme(isComfort.value ? 'light' : 'comfort')
  }

  return {
    theme,
    isComfort,
    setTheme: applyTheme,
    toggleTheme,
  }
}
