<template>
  <div class="app-layout">
    <header class="desktop-header">
      <div class="primary-header">
        <router-link to="/home" class="brand">
          <span class="brand-mark">O</span>
          <span class="brand-copy">
            <strong>OneFlow</strong>
            <small>GROUP OFFICE</small>
          </span>
        </router-link>

        <nav class="module-nav" :aria-label="t('shell.primaryNavigation')">
          <button
            v-for="module in visibleModules"
            :key="module.id"
            class="module-button"
            :class="{ active: activeModule.id === module.id }"
            @click="selectModule(module)"
          >
            <el-icon><component :is="iconMap[module.icon]" /></el-icon>
            <span>{{ moduleLabel(module) }}</span>
          </button>
        </nav>

        <div class="header-actions">
          <button class="search-trigger" @click="searchOpen = true">
            <el-icon><Search /></el-icon>
            <span>{{ t('shell.searchFunctions') }}</span>
            <kbd>Ctrl K</kbd>
          </button>

          <span class="system-status">
            <i></i>
            {{ t('shell.systemHealthy') }}
          </span>

          <el-button text circle class="icon-button" :aria-label="t('shell.notifications')">
            <el-badge is-dot>
              <el-icon size="19"><Bell /></el-icon>
            </el-badge>
          </el-button>

          <el-tooltip :content="themeToggleLabel" placement="bottom">
            <el-button
              text
              circle
              class="icon-button theme-toggle"
              :aria-label="themeToggleLabel"
              @click="toggleTheme"
            >
              <el-icon size="18"><component :is="isComfort ? Sunny : Moon" /></el-icon>
            </el-button>
          </el-tooltip>

          <el-dropdown class="locale-switcher" trigger="click" @command="switchLocale">
            <el-button text>
              <el-icon><Flag /></el-icon>
              <span>{{ currentLocaleLabel }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="loc in SUPPORTED_LOCALES"
                  :key="loc.value"
                  :command="loc.value"
                  :class="{ 'is-active': locale === loc.value }"
                >
                  {{ loc.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="34" class="user-avatar">{{ userInitial }}</el-avatar>
              <span class="user-copy">
                <strong>{{ auth.user?.displayName || t('shell.oaUser') }}</strong>
                <small>{{ primaryRole }}</small>
              </span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">{{ $t('auth.myProfile') }}</el-dropdown-item>
                <el-dropdown-item command="change-password">{{ $t('auth.changePassword') }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">{{ $t('auth.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="context-header">
        <div class="context-title">
          <span class="context-icon" :style="{ '--module-accent': activeModule.accent }">
            <el-icon><component :is="iconMap[activeModule.icon]" /></el-icon>
          </span>
          <span>
            <strong>{{ moduleLabel(activeModule) }}</strong>
            <small>{{ moduleDescription(activeModule) }}</small>
          </span>
        </div>

        <nav class="context-nav" :aria-label="t('shell.moduleFunctions', { module: moduleLabel(activeModule) })">
          <template v-for="item in activeModule.items" :key="item.id">
            <el-dropdown v-if="item.children?.length" trigger="click">
              <button class="context-link" :class="{ active: itemContainsRoute(item) }">
                <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                {{ itemLabel(item) }}
                <el-icon class="context-arrow"><ArrowDown /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu class="nav-dropdown">
                  <el-dropdown-item
                    v-for="child in item.children"
                    :key="child.id"
                    @click="navigate(child.route)"
                  >
                    <el-icon><component :is="iconMap[child.icon]" /></el-icon>
                    {{ itemLabel(child) }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <router-link
              v-else-if="item.route"
              :to="item.route"
              class="context-link"
              :class="{ active: routeMatches(item.route) }"
            >
              <el-icon><component :is="iconMap[item.icon]" /></el-icon>
              {{ itemLabel(item) }}
            </router-link>
          </template>
        </nav>

        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item
            v-for="item in ui.breadcrumbs"
            :key="item.title"
            :to="item.path"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </header>

    <header class="mobile-header">
      <router-link to="/home" class="brand">
        <span class="brand-mark">O</span>
        <span class="brand-copy"><strong>OneFlow</strong><small>GROUP OFFICE</small></span>
      </router-link>
      <div class="mobile-header-actions">
        <el-button text circle :aria-label="t('common.search')" @click="searchOpen = true">
          <el-icon size="19"><Search /></el-icon>
        </el-button>
        <el-button text circle :aria-label="t('shell.notifications')">
          <el-badge is-dot><el-icon size="19"><Bell /></el-icon></el-badge>
        </el-button>
        <el-dropdown trigger="click" @command="handleMobileCommand">
          <el-avatar :size="32" class="user-avatar">{{ userInitial }}</el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="loc in SUPPORTED_LOCALES"
                :key="loc.value"
                :command="`locale:${loc.value}`"
                :class="{ 'is-active': locale === loc.value }"
              >
                <el-icon><Flag /></el-icon>
                {{ loc.label }}
              </el-dropdown-item>
              <el-dropdown-item divided command="theme">
                <el-icon><component :is="isComfort ? Sunny : Moon" /></el-icon>
                {{ themeToggleLabel }}
              </el-dropdown-item>
              <el-dropdown-item divided command="profile">{{ t('auth.myProfile') }}</el-dropdown-item>
              <el-dropdown-item command="change-password">{{ t('auth.changePassword') }}</el-dropdown-item>
              <el-dropdown-item divided command="logout">{{ t('auth.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <nav class="mobile-bottom-nav" :aria-label="t('shell.mobileNavigation')">
      <router-link to="/home" class="bottom-link">
        <el-icon><House /></el-icon>
        <span>{{ t('nav.home') }}</span>
      </router-link>
      <router-link to="/home/manager/approvals" class="bottom-link">
        <el-badge :hidden="!auth.isManager" is-dot>
          <el-icon><Stamp /></el-icon>
        </el-badge>
        <span>{{ t('shell.pending') }}</span>
      </router-link>
      <router-link to="/home/forms/requests" class="bottom-link bottom-link--primary">
        <span class="bottom-primary-icon"><el-icon><Plus /></el-icon></span>
        <span>{{ t('nav.apply') }}</span>
      </router-link>
      <router-link to="/home/info/system-messages" class="bottom-link">
        <el-icon><Bell /></el-icon>
        <span>{{ t('shell.notifications') }}</span>
      </router-link>
      <button class="bottom-link" @click="mobileMenuOpen = true">
        <el-icon><Grid /></el-icon>
        <span>{{ t('shell.more') }}</span>
      </button>
    </nav>

    <el-drawer
      v-model="mobileMenuOpen"
      direction="btt"
      size="92%"
      :with-header="false"
      class="mobile-menu-drawer"
    >
      <div class="mobile-menu">
        <div class="mobile-menu-header">
          <div>
            <span class="mobile-menu-kicker">ALL MODULES</span>
            <h2>{{ t('shell.allFunctions') }}</h2>
          </div>
          <el-button text circle @click="mobileMenuOpen = false">
            <el-icon size="22"><Close /></el-icon>
          </el-button>
        </div>

        <el-input
          v-model="mobileQuery"
          :prefix-icon="Search"
          :placeholder="t('shell.searchFunctionName')"
          clearable
          class="mobile-search"
        />

        <div class="mobile-module-list">
          <section v-for="module in mobileFilteredModules" :key="module.id" class="mobile-module">
            <div class="mobile-module-heading">
              <span class="mobile-module-icon" :style="{ '--module-accent': module.accent }">
                <el-icon><component :is="iconMap[module.icon]" /></el-icon>
              </span>
              <span>
                <strong>{{ moduleLabel(module) }}</strong>
                <small>{{ moduleDescription(module) }}</small>
              </span>
            </div>
            <div class="mobile-feature-grid">
              <button
                v-for="item in flattenVisibleItems(module.items)"
                :key="item.id"
                class="mobile-feature"
                @click="navigateMobile(item.route)"
              >
                <span class="mobile-feature-icon">
                  <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                </span>
                <span>{{ itemLabel(item) }}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="searchOpen"
      width="min(620px, calc(100vw - 28px))"
      class="command-dialog"
      :show-close="false"
      align-center
    >
      <div class="command-panel">
        <div class="command-input">
          <el-icon><Search /></el-icon>
          <input ref="searchInput" v-model="searchQuery" :placeholder="t('shell.searchPlaceholder')" />
          <kbd>ESC</kbd>
        </div>
        <div class="command-results">
          <button
            v-for="result in searchResults"
            :key="`${result.module.id}-${result.item.id}`"
            class="command-result"
            @click="navigateFromSearch(result.item.route)"
          >
            <span class="result-icon" :style="{ '--module-accent': result.module.accent }">
              <el-icon><component :is="iconMap[result.item.icon]" /></el-icon>
            </span>
            <span class="result-copy">
              <strong>{{ itemLabel(result.item) }}</strong>
              <small>{{ moduleLabel(result.module) }}</small>
            </span>
            <el-icon><ArrowRight /></el-icon>
          </button>
          <el-empty v-if="searchResults.length === 0" :description="t('shell.noSearchResults')" :image-size="54" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import * as ElementIcons from '@element-plus/icons-vue'
import {
  ArrowDown, ArrowRight, Bell, Close, Flag, Grid, House, Moon, Plus, Search, Stamp, Sunny,
} from '@element-plus/icons-vue'
import {
  navigationItemTranslationKeys,
  navigationModules,
  navigationModuleTranslationKeys,
  type NavigationItem,
  type NavigationModule,
} from '@/config/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'
import { useTheme } from '@/composables/useTheme'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()
const { t, te, locale } = useI18n()
const { isComfort, toggleTheme } = useTheme()

const iconMap = ElementIcons as Record<string, unknown>
const mobileMenuOpen = ref(false)
const mobileQuery = ref('')
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement>()
const selectedModuleId = ref<string | null>(null)

function itemIsVisible(item: NavigationItem) {
  if (item.managerOnly && !auth.isManager) return false
  if (!auth.hasPermission(item.permissionCode)) return false
  return true
}

function filterItems(items: NavigationItem[]): NavigationItem[] {
  return items
    .filter(itemIsVisible)
    .map((item) => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined,
    }))
    .filter((item) => item.route || (item.children?.length ?? 0) > 0)
}

const visibleModules = computed<NavigationModule[]>(() =>
  navigationModules
    .filter((module) => !module.access || auth.hasModuleAccess(module.access))
    .map((module) => ({ ...module, items: filterItems(module.items) }))
    .filter((module) => module.items.length > 0),
)

function moduleContainsRoute(module: NavigationModule) {
  return flattenVisibleItems(module.items).some((item) => routeMatches(item.route))
}

const activeModule = computed(() => {
  const selected = visibleModules.value.find((module) => module.id === selectedModuleId.value)
  if (selected) return selected
  return visibleModules.value.find(moduleContainsRoute) ?? visibleModules.value[0] ?? navigationModules[0]
})

const currentLocaleLabel = computed(() =>
  SUPPORTED_LOCALES.find((item) => item.value === locale.value)?.label ?? locale.value,
)
const themeToggleLabel = computed(() =>
  isComfort.value ? t('shell.theme.useLight') : t('shell.theme.useComfort'),
)

const primaryRole = computed(() => auth.user?.userRoles?.[0]?.role.name ?? t('shell.enterprisePlatform'))
const userInitial = computed(() => auth.user?.displayName?.[0] ?? 'U')

function translatedValue(key: string | undefined, fallback: string) {
  return key && te(key) ? t(key) : fallback
}

function moduleLabel(module: NavigationModule) {
  return translatedValue(navigationModuleTranslationKeys[module.id]?.label, module.label)
}

function moduleDescription(module: NavigationModule) {
  return translatedValue(navigationModuleTranslationKeys[module.id]?.description, module.description)
}

function itemLabel(item: NavigationItem) {
  return translatedValue(navigationItemTranslationKeys[item.id], item.label)
}

function flattenVisibleItems(items: NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => item.children?.length ? flattenVisibleItems(item.children) : item.route ? [item] : [])
}

const mobileFilteredModules = computed(() => {
  const keyword = mobileQuery.value.trim().toLowerCase()
  if (!keyword) return visibleModules.value

  return visibleModules.value
    .map((module) => ({
      ...module,
      items: flattenVisibleItems(module.items).filter((item) =>
        `${itemLabel(item)} ${moduleLabel(module)}`.toLowerCase().includes(keyword),
      ),
    }))
    .filter((module) => module.items.length > 0)
})

const allSearchItems = computed(() =>
  visibleModules.value.flatMap((module) =>
    flattenVisibleItems(module.items).map((item) => ({ module, item })),
  ),
)

const searchResults = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  const results = keyword
    ? allSearchItems.value.filter(({ module, item }) =>
        `${moduleLabel(module)} ${itemLabel(item)}`.toLowerCase().includes(keyword),
      )
    : allSearchItems.value
  return results.slice(0, 10)
})

function routeMatches(path?: string) {
  if (!path) return false
  return route.path === path || (path !== '/home' && route.path.startsWith(`${path}/`))
}

function itemContainsRoute(item: NavigationItem) {
  return item.children?.some((child) => routeMatches(child.route)) ?? false
}

function selectModule(module: NavigationModule) {
  selectedModuleId.value = module.id
  if (!moduleContainsRoute(module)) {
    const firstRoute = flattenVisibleItems(module.items)[0]?.route
    if (firstRoute) router.push(firstRoute)
  }
}

function navigate(path?: string) {
  if (path) router.push(path)
}

function navigateMobile(path?: string) {
  if (!path) return
  mobileMenuOpen.value = false
  router.push(path)
}

function navigateFromSearch(path?: string) {
  if (!path) return
  searchOpen.value = false
  router.push(path)
}

function switchLocale(loc: SupportedLocale) {
  setLocale(loc)
}

function handleMobileCommand(command: string) {
  if (command.startsWith('locale:')) {
    switchLocale(command.slice('locale:'.length) as SupportedLocale)
    return
  }
  if (command === 'theme') {
    toggleTheme()
    return
  }
  handleCommand(command)
}

async function handleCommand(command: string) {
  if (command === 'logout') {
    await ElMessageBox.confirm(t('msg.confirmLogout'), t('common.confirm'), { type: 'warning' })
    await auth.logout()
    router.push('/login')
  } else if (command === 'change-password') {
    router.push('/change-password')
  }
}

function handleKeyboard(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchOpen.value = true
  }
  if (event.key === 'Escape') {
    searchOpen.value = false
  }
}

watch(() => route.path, () => {
  selectedModuleId.value = null
})

watch(searchOpen, async (open) => {
  if (open) {
    searchQuery.value = ''
    await nextTick()
    searchInput.value?.focus()
  }
})

onMounted(() => window.addEventListener('keydown', handleKeyboard))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyboard))
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--oa-canvas);
}

.desktop-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--oa-header-bg);
  border-bottom: 1px solid var(--oa-border);
  box-shadow: 0 8px 24px rgba(25, 55, 72, 0.06);
  backdrop-filter: blur(18px);
}

.primary-header {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid var(--oa-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  margin-right: 34px;
  color: var(--oa-navy);
  text-decoration: none;
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #159187, #0c625c);
  border-radius: 11px;
  box-shadow: 0 7px 16px rgba(15, 118, 110, 0.2);
  font-size: 19px;
  font-weight: 900;
}

.brand-copy {
  display: flex;
  flex-direction: column;
}

.brand-copy strong {
  font-size: 18px;
  letter-spacing: -0.025em;
}

.brand-copy small {
  margin-top: 1px;
  color: #8a9da7;
  font-size: 8px;
  letter-spacing: 0.15em;
}

.module-nav {
  height: 100%;
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  gap: 4px;
}

.module-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 15px;
  color: #5f7480;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}

.module-button::after {
  position: absolute;
  right: 13px;
  bottom: 0;
  left: 13px;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--oa-primary);
  transform: scaleX(0);
  transition: transform 0.2s;
  content: "";
}

.module-button:hover,
.module-button.active {
  color: var(--oa-primary);
  background: var(--oa-surface-hover);
}

.module-button.active::after {
  transform: scaleX(1);
}

.header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  margin-left: auto;
}

.search-trigger {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 168px;
  padding: 0 9px 0 11px;
  color: var(--oa-text-secondary);
  background: var(--oa-surface-muted);
  border: 1px solid var(--oa-border);
  border-radius: 9px;
  cursor: pointer;
  font-size: 12px;
}

.search-trigger kbd,
.command-input kbd {
  margin-left: auto;
  padding: 2px 5px;
  color: var(--oa-text-secondary);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  border-radius: 5px;
  font-family: inherit;
  font-size: 9px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  color: #668078;
  font-size: 10px;
}

.system-status i {
  width: 7px;
  height: 7px;
  background: #22a879;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(34, 168, 121, 0.12);
}

.icon-button {
  color: var(--oa-text-secondary);
  background: var(--oa-surface-muted);
}

.locale-switcher :deep(.el-button) {
  color: #526a76;
  font-size: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 7px;
  color: var(--oa-text);
  border-radius: 10px;
  cursor: pointer;
}

.user-info:hover {
  background: var(--oa-surface-muted);
}

.user-avatar {
  color: #fff;
  background: linear-gradient(145deg, #13897f, #0b5f59);
}

.user-copy {
  display: flex;
  flex-direction: column;
  min-width: 84px;
}

.user-copy strong {
  max-width: 108px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-copy small {
  margin-top: 1px;
  color: #93a2aa;
  font-size: 9px;
}

.context-header {
  height: 58px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 28px;
}

.context-title {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  padding-right: 22px;
  border-right: 1px solid var(--oa-border);
}

.context-icon,
.mobile-module-icon,
.result-icon {
  display: grid;
  place-items: center;
  color: var(--module-accent);
  background: color-mix(in srgb, var(--module-accent) 14%, var(--oa-surface));
  border-radius: 9px;
}

.context-icon {
  width: 32px;
  height: 32px;
}

.context-title > span:last-child,
.mobile-module-heading > span:last-child {
  display: flex;
  flex-direction: column;
}

.context-title strong {
  color: var(--oa-navy);
  font-size: 12px;
}

.context-title small {
  margin-top: 2px;
  color: #94a3ab;
  font-size: 9px;
}

.context-nav {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.context-nav::-webkit-scrollbar {
  display: none;
}

.context-link {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  color: #607783;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.context-link:hover,
.context-link.active {
  color: var(--oa-primary);
  background: var(--oa-primary-soft);
}

.context-arrow {
  margin-left: 2px;
  font-size: 10px;
}

.breadcrumb {
  flex: 0 0 auto;
  margin-left: auto;
  font-size: 11px;
}

.app-main {
  min-height: calc(100vh - 129px);
  padding: 24px 28px 38px;
  overflow-y: auto;
  background:
    radial-gradient(circle at 100% 0%, rgba(15, 118, 110, 0.055), transparent 28%),
    var(--oa-canvas);
}

.mobile-header,
.mobile-bottom-nav {
  display: none;
}

.mobile-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.mobile-menu-header h2 {
  margin: 3px 0 0;
  color: var(--oa-navy);
  font-size: 23px;
}

.mobile-menu-kicker {
  color: var(--oa-primary);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.15em;
}

.mobile-search {
  margin-bottom: 17px;
}

.mobile-module-list {
  flex: 1;
  overflow-y: auto;
}

.mobile-module {
  padding: 18px 0;
  border-bottom: 1px solid var(--oa-border);
}

.mobile-module:first-child {
  padding-top: 4px;
}

.mobile-module-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}

.mobile-module-icon {
  width: 38px;
  height: 38px;
}

.mobile-module-heading strong {
  color: var(--oa-navy);
  font-size: 14px;
}

.mobile-module-heading small {
  margin-top: 2px;
  color: #91a0a8;
  font-size: 10px;
}

.mobile-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.mobile-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 76px;
  padding: 9px 4px;
  color: var(--oa-text-secondary);
  background: var(--oa-surface-muted);
  border: 1px solid var(--oa-border);
  border-radius: 11px;
  font-size: 10px;
  cursor: pointer;
}

.mobile-feature-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--oa-primary);
  background: var(--oa-primary-soft);
  border-radius: 9px;
}

.command-panel {
  overflow: hidden;
  background: var(--oa-surface);
  border-radius: 16px;
}

.command-input {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 18px;
  border-bottom: 1px solid var(--oa-border);
}

.command-input > .el-icon {
  color: var(--oa-primary);
  font-size: 20px;
}

.command-input input {
  flex: 1;
  color: var(--oa-text);
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 15px;
}

.command-results {
  max-height: 430px;
  padding: 9px;
  overflow-y: auto;
}

.command-result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  color: #637986;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
}

.command-result:hover {
  color: var(--oa-primary);
  background: var(--oa-surface-hover);
}

.result-icon {
  width: 36px;
  height: 36px;
}

.result-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.result-copy strong {
  color: var(--oa-text);
  font-size: 13px;
}

.result-copy small {
  margin-top: 2px;
  color: #98a7ae;
  font-size: 10px;
}

:global(.command-dialog .el-dialog__header) {
  display: none;
}

:global(.command-dialog .el-dialog__body) {
  padding: 0;
}

:global(.mobile-menu-drawer) {
  border-radius: 22px 22px 0 0;
}

:global(.mobile-menu-drawer .el-drawer__body) {
  padding: 22px 18px 12px;
}

@media (max-width: 1180px) {
  .system-status,
  .locale-switcher,
  .search-trigger span,
  .search-trigger kbd,
  .context-title small {
    display: none;
  }

  .search-trigger {
    min-width: 36px;
    justify-content: center;
    padding: 0;
  }

  .module-button {
    padding: 0 10px;
  }

  .module-button span {
    display: none;
  }
}

@media (max-width: 767px) {
  .desktop-header {
    display: none;
  }

  .mobile-header {
    position: sticky;
    top: 0;
    z-index: 25;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    background: var(--oa-header-bg);
    border-bottom: 1px solid var(--oa-border);
    backdrop-filter: blur(16px);
  }

  .mobile-header .brand-mark {
    width: 32px;
    height: 32px;
    font-size: 17px;
  }

  .mobile-header .brand-copy strong {
    font-size: 16px;
  }

  .mobile-header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .app-main {
    min-height: calc(100vh - 126px);
    padding: 18px 14px 90px;
  }

  .mobile-bottom-nav {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 24;
    height: calc(66px + env(safe-area-inset-bottom));
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 5px 8px env(safe-area-inset-bottom);
    background: var(--oa-header-bg);
    border-top: 1px solid var(--oa-border);
    box-shadow: 0 -8px 24px rgba(25, 55, 72, 0.08);
    backdrop-filter: blur(16px);
  }

  .bottom-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #82939c;
    background: transparent;
    border: 0;
    cursor: pointer;
    font-size: 9px;
    text-decoration: none;
  }

  .bottom-link > .el-icon,
  .bottom-link :deep(.el-badge .el-icon) {
    font-size: 20px;
  }

  .bottom-link.router-link-active {
    color: var(--oa-primary);
  }

  .bottom-link--primary {
    color: var(--oa-primary);
  }

  .bottom-primary-icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    margin-top: -19px;
    color: #fff;
    background: linear-gradient(145deg, #168f85, #0b625c);
    border: 4px solid var(--oa-surface);
    border-radius: 15px;
    box-shadow: 0 7px 16px rgba(15, 118, 110, 0.25);
  }

  .bottom-primary-icon .el-icon {
    font-size: 21px;
  }
}

@media (max-width: 420px) {
  .mobile-feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
