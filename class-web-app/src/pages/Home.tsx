import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-ellieYellow px-6 py-8 text-ellieGray shadow-soft">
        <h1 className="text-2xl font-bold">엘리의방 클래스</h1>
        <p className="mt-3 text-sm leading-relaxed">
          엘리의방 홈페이지에서 바로 연결되는 강의실 플랫폼입니다. 모바일에 최적화된
          PWA 스타일로 편안하게 강의를 만나보세요.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            to="/internal"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-md"
          >
            내부 강의실 바로가기
          </Link>
          <Link
            to="/vod"
            className="rounded-full border border-ellieGray/30 px-4 py-2 text-sm font-semibold text-ellieGray"
          >
            VOD 보기
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <article className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold">오늘의 추천</h2>
          <p className="mt-2 text-sm text-ellieGray/70">
            엘리의방 클래스에서 인기 있는 강의를 확인해보세요.
          </p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold">새로운 소식</h2>
          <p className="mt-2 text-sm text-ellieGray/70">
            공지사항에서 최신 업데이트와 이벤트 소식을 만나보세요.
          </p>
        </article>
      </section>
    </div>
  );
}

export default Home;
