import { useEffect, useState } from 'react';

const CATEGORY_OPTIONS = [
  { id: 'recommended', label: '추천' },
  { id: 'basic', label: '기초' },
  { id: 'advanced', label: '심화' },
];

const VodPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [vodList, setVodList] = useState([]);

  useEffect(() => {
    fetch(`/api/vod/list?category=${selectedCategory}`)
      .then((res) => res.json())
      .then((json) => setVodList(json.results || []))
      .catch(() => setVodList([]));
  }, [selectedCategory]);

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '768px',
        margin: '0 auto',
      }}
    >
      {/* 페이지 타이틀 */}
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '20px',
          color: '#1E1E1E',
        }}
      >
        VOD 영상
      </h2>

      {/* 카테고리 탭 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              background:
                selectedCategory === cat.id ? '#fef4d1' : '#ffffff',
              color: '#333',
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

      {/* 영상 리스트 */}
      {vodList.length === 0 ? (
        <p
          style={{
            color: '#999',
            fontSize: '14px',
            marginTop: '20px',
          }}
        >
          등록된 영상이 없습니다.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {vodList.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #eee',
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#333',
                  fontWeight: 600,
                  fontSize: '16px',
                  textDecoration: 'none',
                }}
              >
                {item.title}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VodPage;
