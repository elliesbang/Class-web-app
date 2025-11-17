import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const normalizeResults = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
};

function Classroom() {
  const [classList, setClassList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadClassrooms = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/classroom/list', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('강의실 목록을 불러오지 못했습니다.');
        }
        const payload = await response.json();
        setClassList(normalizeResults(payload));
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadClassrooms();

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#fffdf6] py-6 text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4">
        <header className="rounded-3xl bg-[#fef568] px-6 py-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#bd8a00]">강의실</p>
          <h1 className="mt-2 text-2xl font-bold">실시간 강의실을 확인하세요</h1>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            Cloudflare D1에 저장된 강의실 목록을 불러와 최신 정보를 제공합니다.
          </p>
        </header>

        <section className="rounded-3xl bg-white px-6 py-6 shadow-soft">
          {isLoading ? (
            <p className="text-sm text-ellieGray/70">강의실을 불러오는 중입니다...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : classList.length === 0 ? (
            <p className="text-sm text-ellieGray/70">등록된 강의실이 없습니다.</p>
          ) : (
            <div className="classroom-list grid gap-4 sm:grid-cols-2">
              {classList.map((item) => (
                <Link key={item.class_id || item.id} to={`/classroom/${item.class_id || item.id}`}>
                  <div className="classroom-card rounded-2xl border border-[#f1e6c7] bg-[#fffaf2] p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
                    <h3 className="text-lg font-semibold text-ellieGray">{item.title || item.name}</h3>
                    <p className="mt-1 text-sm text-ellieGray/70">{item.subtitle || item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Classroom;
