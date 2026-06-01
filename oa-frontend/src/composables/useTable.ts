import { ref, reactive } from 'vue'

interface TableOptions<T> {
  fetchFn: (params: Record<string, unknown>) => Promise<{ items: T[]; total: number }>
  defaultParams?: Record<string, unknown>
}

export function useTable<T>(options: TableOptions<T>) {
  const loading = ref(false)
  const data = ref<T[]>([])
  const total = ref(0)
  const pagination = reactive({ page: 1, limit: 20 })

  async function fetch(extraParams?: Record<string, unknown>) {
    loading.value = true
    try {
      const result = await options.fetchFn({
        ...options.defaultParams,
        ...extraParams,
        page: pagination.page,
        limit: pagination.limit,
      })
      data.value = result.items
      total.value = result.total
    } finally {
      loading.value = false
    }
  }

  function handlePageChange(page: number) {
    pagination.page = page
    fetch()
  }

  function handleSizeChange(size: number) {
    pagination.limit = size
    pagination.page = 1
    fetch()
  }

  return {
    loading,
    data,
    total,
    pagination,
    fetch,
    handlePageChange,
    handleSizeChange,
  }
}
