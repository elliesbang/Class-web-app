export type VodCategory = {
  id: string | number
  name: string
  description?: string | null
  orderNum?: number | null
  isVisible?: boolean | null
}

export async function fetchVodCategories(): Promise<VodCategory[]> {
  const response = await fetch('/api/vod-categories')

  if (!response.ok) {
    const message = `failed to fetch vod categories: ${response.status}`
    console.error('[vod-content] failed to load categories', message)
    throw new Error(message)
  }

  const payload = await response.json()
  const data = Array.isArray(payload?.data) ? payload.data : []
  return data as VodCategory[]
}
