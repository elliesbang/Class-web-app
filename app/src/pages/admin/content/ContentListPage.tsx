import { useEffect, useState } from 'react'
import ContentManager from './components/ContentManager'
import { getCategories } from '@/lib/api/category'

type CategoryRecord = { id: number; name: string; parent_id: number | null }

const ContentListPage = () => {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const data = await getCategories()
      setCategories(data || [])
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
