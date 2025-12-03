import { useEffect, useState } from 'react'

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

// Cloudflare Functions 라우팅에 맞춘 정답 매핑
const API_MAP = {
  globalNotice: '/api/admin-content-global-list',
  classroomVideo: '/api/admin-content-classroom-video-list',
  classroomMaterial: '/api/admin-content-material-list',
  classroomNotice: '/api/admin-content-classroom-notice-list',
  vodVideo: '/api/admin-content-vod-list'
}

const ContentManager = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('globalNotice')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const endpoint = API_MAP[activeTab]

    try {
      const res = await fetch(endpoint)
      if (!res.ok) {
        throw new Error('API 요청 실패')
      }
      const json = await res.json()

      setItems(json?.data || [])
    } catch (err) {
      console.error(err)
      setError('콘텐츠 목록을 불러오지 못했습니다.')
    }

    setLoading(false)
  }

  return (
    <div>
      {/* Tabs */}
      <div className="tab-row">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'tab-active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <p>불러오는 중...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <div className="item-list">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <p>
                <strong>{item.title}</strong>
              </p>
              <p>{item.description || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContentManager
