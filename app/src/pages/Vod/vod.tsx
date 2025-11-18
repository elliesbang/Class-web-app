import { useEffect, useState } from 'react';

const CATEGORY_OPTIONS = [
  { id: 'recommended', label: '추천' },
  { id: 'basic', label: '기초' },
  { id: 'advanced', label: '심화' },
];

const VodPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [vodList, setVodList] = useState([]);

  const loadVodList = (category: string) => {
    fetch(`/api/vod/list?category=${category}`)
      .then((res) => res.json())
      .then((json) => {
        setVodList(json?.results ?? []);
      })
      .catch(() => {
        setVodList([]);
      });
  };

  useEffect(() => {
    loadVodList(selectedCategory);
  }, [selectedCategory]);

  return (
    <div style={{ padding: '20px' }}>
      {/* 제목 */}
      <h2 style={{ fontSize: '20px', fontWeight: 700 }}>VOD 영상</h2>

      {/* 카테고리 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border:
                selectedCategory === cat.id
                  ? '2px solid #333'
                  : '1px solid #ccc',
              background: selectedCategory === cat.id ? '#f5f5f5' : '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 영상 리스트 */}
      <div style={{ marginTop: '24px' }}>
        {vodList.length === 0 ? (
          <p style={{ color: '#777' }}>등록된 영상이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {vodList.map((item) => (
              <li key={item.id} style={{ marginBottom: '16px' }}>
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VodPage;
