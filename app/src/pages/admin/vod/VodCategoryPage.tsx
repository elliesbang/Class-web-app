import { FormEvent, useEffect, useState } from 'react';

const VodCategoryPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vod/category/list');
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      setCategories(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (caught) {
      console.error('[vod] category load error', caught);
      setError('카테고리를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/vod/category/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('fail');
      setName('');
      await load();
    } catch (caught) {
      console.error('[vod] category create error', caught);
      alert('카테고리를 생성하지 못했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-ellieGray">VOD 카테고리 관리</h1>
          <p className="text-sm text-ellieGray/70">/api/vod/category/* API와 연결된 독립 화면입니다.</p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-ellieGray">
            카테고리명
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
              placeholder="예) 입문반"
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-ellieYellow px-6 py-2 text-sm font-semibold text-ellieGray"
            disabled={loading}
          >
            {loading ? '처리 중...' : '카테고리 추가'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-ellieGray/10 p-4">
          {loading ? (
            <p className="text-sm text-ellieGray/70">불러오는 중...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-ellieGray/70">등록된 카테고리가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-ellieGray/10">
              {categories.map((category) => (
                <li key={category.id ?? category.category_id} className="py-3">
                  <p className="font-semibold text-ellieGray">{category.name ?? category.title}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default VodCategoryPage;
