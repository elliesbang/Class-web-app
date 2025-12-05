import { useEffect, useMemo, useState } from 'react'

import { fetchVodCategories, type VodCategory } from '@/lib/api/vod-categories'

type VodItem = {
  id: number | string
  title: string
  url: string
  description?: string | null
  createdAt?: string | null
}

const VodList = () => {
  const [categories, setCategories] = useState<VodCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [vodList, setVodList] = useState<VodItem[]>([])
  const [activeVideo, setActiveVideo] = useState<VodItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  useEffect(() => {
    let mounted = true
    setIsLoadingCategories(true)

    const loadCategories = async () => {
      try {
        const data = await fetchVodCategories()
        if (!mounted) return
        setCategories(data)
        setSelectedCategory((prev) => prev || (data?.[0]?.id?.toString?.() ?? ''))
      } catch (error) {
        console.error('[VodList] failed to load categories', error)
        if (!mounted) return
        setCategories([])
        setSelectedCategory('')
      } finally {
        if (!mounted) return
        setIsLoadingCategories(false)
      }
    }

    void loadCategories()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedCategory) {
      setVodList([])
      return
    }

    let mounted = true
    setIsLoading(true)

    const loadVods = async () => {
      try {
        const response = await fetch(`/api/vod-list?category_id=${selectedCategory}`)
        if (!response.ok) {
          throw new Error('failed to fetch vod list')
        }
        const payload = await response.json()
        if (!mounted) return
        setVodList(Array.isArray(payload?.data) ? payload.data : [])
      } catch (error) {
        console.error('[VodList] failed to load vod list', error)
        if (!mounted) return
        setVodList([])
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    void loadVods()

    return () => {
      mounted = false
    }
  }, [selectedCategory])

  const activeCategoryName = useMemo(
    () => categories.find((cat) => String(cat.id) === String(selectedCategory))?.name,
    [categories, selectedCategory]
  )

  const openModal = (item: VodItem) => {
    setActiveVideo(item)
  }

  const closeModal = () => {
    setActiveVideo(null)
  }

  const formatDate = (date?: string | null) => {
    if (!date) return ''
    try {
      return new Date(date).toLocaleDateString('ko-KR')
    } catch {
      return ''
    }
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '768px',
        margin: '0 auto'
      }}
    >
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '20px'
        }}
      >
        VOD 영상{activeCategoryName ? ` - ${activeCategoryName}` : ''}
      </h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {isLoadingCategories ? (
          <span style={{ color: '#999', fontSize: '14px' }}>카테고리를 불러오는 중입니다...</span>
        ) : !categories.length ? (
          <span style={{ color: '#999', fontSize: '14px' }}>표시할 카테고리가 없습니다.</span>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid #ddd',
                background: String(selectedCategory) === String(cat.id) ? '#fff4ce' : '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow:
                  String(selectedCategory) === String(cat.id)
                    ? '0 0 0 2px #ffd331 inset'
                    : 'none',
                cursor: 'pointer'
              }}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      {isLoading ? (
        <p
          style={{
            marginTop: '30px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px'
          }}
        >
          불러오는 중입니다...
        </p>
      ) : vodList.length === 0 ? (
        <p
          style={{
            marginTop: '30px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px'
          }}
        >
          등록된 영상이 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {vodList.map((item) => (
            <div
              key={item.id}
              onClick={() => openModal(item)}
              style={{
                background: '#ffffff',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '6px'
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {formatDate(item.createdAt)}
                </div>
              </div>

              <div style={{ fontSize: '20px', color: '#555' }}>▶</div>
            </div>
          ))}
        </div>
      )}

      {activeVideo && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            zIndex: 999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              padding: '20px'
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '14px'
              }}
            >
              {activeVideo.title}
            </div>

            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <iframe
                src={activeVideo.url}
                title={activeVideo.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>

            <button
              onClick={closeModal}
              style={{
                marginTop: '20px',
                padding: '10px 16px',
                width: '100%',
                background: '#ffd331',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VodList
