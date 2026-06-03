<template>
  <el-config-provider :locale="elLocale">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhTW from 'element-plus/es/locale/lang/zh-tw'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import en   from 'element-plus/es/locale/lang/en'

const { locale } = useI18n()

const elLocale = computed(() => {
  if (locale.value === 'zh-CN') return zhCN
  if (locale.value === 'en')    return en
  return zhTW
})
</script>

<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 0; }
</style>
