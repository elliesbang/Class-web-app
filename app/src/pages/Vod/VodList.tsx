import { useEffect, useState } from 'react';

const CATEGORY_OPTIONS = [
  { id: 'recommended', label: '추천' },
  { id: 'basic', label: '기초' },
  { id: 'advanced', label: '심화' },
];

const VodList = () => {
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [vodList, setVodList] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null); // 모달에서 재생할 영상

  useEffect(() => {
    fetch(`/api/vod/list?category=${selectedCategory}`)
      .then((res) => res.json())
      .then((json) => setVodList(json.results || []))
      .catch(() => setVodList([]));
  }, [selectedCategory]);

  const openModal = (item: any) => {
    setActiveVideo(item);
  };

  const closeModal = () => {
    setActiveVideo(null);
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('ko-KR');
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '768px',
        margin: '0 auto',
      }}
    >
      {/* 제목 */}
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '20px',
        }}
      >
        VOD 영상
      </h2>

      {/* 카테고리 버튼 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #ddd',
              background:
                selectedCategory === cat.id ? '#fff4ce' : '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow:
                selectedCategory === cat.id
                  ? '0 0 0 2px #ffd331 inset'
                  : 'none',
              cursor: 'pointer',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      {vodList.length === 0 ? (
        <p
          style={{
            marginTop: '30px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px',
          }}
        >
          등록된 영상이 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {vodList.map((item: any) => (
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {formatDate(item.created_at)}
                </div>
              </div>

              <div style={{ fontSize: '20px', color: '#555' }}>▶</div>
            </div>
          ))}
        </div>
      )}

      {/* 모달 */}
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
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '14px',
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
                overflow: 'hidden',
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
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VodList;
