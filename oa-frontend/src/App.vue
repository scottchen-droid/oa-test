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
import '@/composables/useTheme'

const { locale } = useI18n()

const elLocale = computed(() => {
  if (locale.value === 'zh-CN') return zhCN
  if (locale.value === 'en')    return en
  return zhTW
})
</script>

<style>
:root {
  --oa-primary: #0f766e;
  --oa-primary-dark: #0b4f4a;
  --oa-primary-soft: #e7f5f2;
  --oa-accent: #f59e0b;
  --oa-navy: #102a43;
  --oa-text: #172b3a;
  --oa-text-secondary: #64748b;
  --oa-border: #dfe8ee;
  --oa-surface: #ffffff;
  --oa-surface-muted: #f6f9fa;
  --oa-surface-hover: #f1f8f7;
  --oa-header-bg: rgba(255, 255, 255, 0.94);
  --oa-canvas: #f3f7f8;
  --oa-shadow: 0 10px 30px rgba(25, 55, 72, 0.08);
  --el-color-primary: #0f766e;
  --el-color-primary-light-3: #4ca099;
  --el-color-primary-light-5: #87beb9;
  --el-color-primary-light-7: #beddd9;
  --el-color-primary-light-8: #d7ebe8;
  --el-color-primary-light-9: #edf7f5;
  --el-color-primary-dark-2: #0b5e58;
  --el-border-radius-base: 8px;
  --el-font-family: Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
  color-scheme: light;
}

:root[data-theme="comfort"] {
  --oa-primary: #63b3a8;
  --oa-primary-dark: #86c9c0;
  --oa-primary-soft: #2c4641;
  --oa-accent: #d6a95d;
  --oa-navy: #e0e9e5;
  --oa-text: #d3dfda;
  --oa-text-secondary: #9fb0a9;
  --oa-border: #3b4b47;
  --oa-surface: #26322f;
  --oa-surface-muted: #2b3935;
  --oa-surface-hover: #30423d;
  --oa-header-bg: rgba(31, 42, 39, 0.96);
  --oa-canvas: #1b2422;
  --oa-shadow: 0 12px 32px rgba(4, 12, 10, 0.24);
  --el-bg-color: var(--oa-surface);
  --el-bg-color-page: var(--oa-canvas);
  --el-bg-color-overlay: #2a3834;
  --el-fill-color: #31403c;
  --el-fill-color-light: #2d3b37;
  --el-fill-color-lighter: #293632;
  --el-fill-color-extra-light: #26332f;
  --el-fill-color-dark: #364943;
  --el-text-color-primary: #dbe5e1;
  --el-text-color-regular: #c6d3ce;
  --el-text-color-secondary: #9fb0a9;
  --el-text-color-placeholder: #7f938b;
  --el-border-color: #42534e;
  --el-border-color-light: #3a4a46;
  --el-border-color-lighter: #33423e;
  --el-border-color-extra-light: #2e3c38;
  --el-mask-color: rgba(6, 12, 10, 0.7);
  --el-color-primary-light-9: #2c4641;
  --el-color-primary-light-8: #31514b;
  --el-color-primary-light-7: #39625a;
  color-scheme: dark;
}

* { box-sizing: border-box; }

html,
body,
#app {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

body {
  color: var(--oa-text);
  background: var(--oa-canvas);
  font-family: var(--el-font-family);
  -webkit-font-smoothing: antialiased;
}

button,
input,
textarea,
select {
  font: inherit;
}

a {
  color: inherit;
}

::selection {
  color: #fff;
  background: var(--oa-primary);
}

.el-card {
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  border-radius: 14px;
  box-shadow: var(--oa-shadow);
}

.el-card__header {
  padding: 18px 20px;
  border-bottom-color: var(--oa-border);
}

.el-card__body {
  padding: 20px;
}

.el-button {
  font-weight: 600;
}

.el-button--primary {
  box-shadow: 0 5px 12px rgba(15, 118, 110, 0.18);
}

.el-input__wrapper,
.el-select__wrapper,
.el-textarea__inner {
  background: var(--oa-surface);
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--oa-border) inset;
}

.el-table {
  --el-table-bg-color: var(--oa-surface);
  --el-table-tr-bg-color: var(--oa-surface);
  --el-table-border-color: var(--oa-border);
  --el-table-header-bg-color: var(--oa-surface-muted);
  --el-table-row-hover-bg-color: var(--oa-surface-hover);
  border-radius: 10px;
  overflow: hidden;
}

.el-table th.el-table__cell {
  color: #526777;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.el-table td.el-table__cell {
  padding: 8px 0;
}

.el-table .cell {
  min-height: 20px;
  line-height: 20px;
}

.el-table td.el-table__cell .cell:empty::after {
  color: #b3c0c7;
  content: "—";
}

/* Keep table action controls compact and on one line across all modules. */
.el-table td.el-table__cell .cell:has(> .el-button),
.el-table td.el-table__cell .cell:has(> .table-actions) {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  white-space: nowrap;
}

.el-table td.el-table__cell .cell > .el-button + .el-button,
.el-table .table-actions > .el-button + .el-button {
  margin-left: 0;
}

.el-table .el-button--small {
  min-height: 27px;
  height: 27px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
}

.el-table .el-button.is-text.el-button--small,
.el-table .el-button.is-link.el-button--small {
  padding-right: 5px;
  padding-left: 5px;
}

.el-table .table-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: max-content;
}

.el-table .single-line-tags {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.el-table .single-line-tags .el-tag {
  flex: 0 0 auto;
  margin: 0 !important;
}

.el-dialog {
  background: var(--oa-surface);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(15, 42, 55, 0.2);
}

.page-header h2 {
  color: var(--oa-navy);
  font-size: 24px !important;
  letter-spacing: -0.02em;
}

:root[data-theme="comfort"] .el-table th.el-table__cell {
  color: #adc0b8;
}

:root[data-theme="comfort"] .el-pagination,
:root[data-theme="comfort"] .el-dropdown-menu,
:root[data-theme="comfort"] .el-drawer,
:root[data-theme="comfort"] .el-message-box {
  color: var(--oa-text);
  background: var(--oa-surface);
}

:root[data-theme="comfort"] .el-button.is-text:not(.el-button--primary) {
  color: var(--oa-text-secondary);
}

:root[data-theme="comfort"] .deleted-row td {
  background: #432f31 !important;
}
</style>
