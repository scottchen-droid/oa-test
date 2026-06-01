import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BreadcrumbItem {
  title: string
  path?: string
}

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const breadcrumbs = ref<BreadcrumbItem[]>([])
  const pageTitle = ref('')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setBreadcrumbs(items: BreadcrumbItem[]) {
    breadcrumbs.value = items
  }

  function setPageTitle(title: string) {
    pageTitle.value = title
  }

  return {
    sidebarCollapsed,
    breadcrumbs,
    pageTitle,
    toggleSidebar,
    setBreadcrumbs,
    setPageTitle,
  }
})
