import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type TabKey =
  | 'globalNotice'
  | 'classroomVideo'
  | 'classroomMaterial'
  | 'classroomNotice'
  | 'vodVideo'

const TAB_ITEMS = [
  { key: 'globalNotice', label: '전체 공지' },
  { key: 'classroomVideo', label: '강의실 영상' },
  { key: 'classroomMaterial', label: '자료' },
  { key: 'classroomNotice', label: '강의실 공지' },
  { key: 'vodVideo', label: 'VOD 영상' }
]

const TABLE_MAP = {
  globalNotice: 'notifications',
  classroomVideo: 'classroom_videos',
  classroomMaterial: 'classroom_materials',
  classroomNotice: 'classroom_notices',
  vodVideo: 'vod_videos'
}

const ContentManager = ({ categories, selectedCategoryId, onSelectCategory }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('globalNotice')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    const table = TABLE_MAP[activeTab]
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  return (
    <div>
      <div className="tab-row">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'tab-active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <p><strong>{item.title}</strong></p>
              <p>{item.description || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContentManager
