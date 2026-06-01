import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'

export function useForm<T extends object>(initial: T) {
  const formRef = ref<FormInstance>()
  const form = ref<T>({ ...initial })
  const loading = ref(false)

  function reset() {
    form.value = { ...initial }
    formRef.value?.resetFields()
  }

  function populate(data: Partial<T>) {
    form.value = { ...initial, ...data }
  }

  async function submit(submitFn: (data: T) => Promise<void>, successMsg?: string) {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return false

    loading.value = true
    try {
      await submitFn(form.value)
      if (successMsg) ElMessage.success(successMsg)
      return true
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  return { formRef, form, loading, reset, populate, submit }
}
