import { useEffect, useState } from 'react'
import ContentManager from './components/ContentManager'

// Cloudflare API 기반 카테고리 호출
const fetchCategories = async () => {
  const res = await fetch('/api/admin/content/categories')
  if (!res.ok) return []
  const json = await res.json()
  return json.data || []
}

type CategoryRecord = { id: number; name: string; parent_id: number | null }

const ContentListPage = () => {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const data = await fetchCategories()
      setCategories(data)
    }
    load()
  }, [])

  return (
    <ContentManager
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
    />
  )
}

export default ContentListPage