import { Link } from 'react-router-dom';

const AdminHome = () => {
  return (
    <div className="space-y-8">
      <section className="space-y-2 rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h2 className="text-2xl font-bold text-[#404040]">엘리의방 관리자 대시보드</h2>
        <p className="text-sm text-ellieGray/70">콘텐츠와 공지를 관리하세요.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-[#404040]">콘텐츠 관리</h3>
          <p className="mt-2 text-sm text-ellieGray/70">강의실 콘텐츠, 공지, VOD를 한 곳에서 관리합니다.</p>
          <Link
            to="/admin/content"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] shadow-soft"
          >
            바로가기
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-[#404040]">알림</h3>
          <p className="mt-2 text-sm text-ellieGray/70">최신 공지와 시스템 알림을 확인하세요.</p>
          <span className="mt-4 inline-flex items-center rounded-full bg-[#f5eee9] px-4 py-2 text-xs font-semibold text-ellieGray">준비 중</span>
        </div>
      </section>
    </div>
  );
};

export default AdminHome;
