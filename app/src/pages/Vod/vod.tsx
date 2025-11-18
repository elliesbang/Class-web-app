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
      {/* 페이지 제목 */}
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
              color: '#333',
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

      {/* VOD 리스트 */}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {vodList.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '18px 20px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '6px',
                }}
              >
                {item.title}
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'underline',
                }}
              >
                영상 보기
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VodPage;
