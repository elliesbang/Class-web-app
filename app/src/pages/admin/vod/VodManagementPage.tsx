import { NavLink } from 'react-router-dom';

const VodManagementPage = () => {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-ellieGray">VOD 관리</h1>
          <p className="text-sm text-ellieGray/70">VOD 카테고리와 콘텐츠를 분리된 화면에서 관리합니다.</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <NavLink
          to="/admin/vod/categories"
          className="rounded-3xl bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="text-lg font-semibold text-ellieGray">카테고리 관리</h2>
          <p className="mt-2 text-sm text-ellieGray/70">VOD 카테고리를 생성하고 정리하세요.</p>
        </NavLink>
        <NavLink
          to="/admin/vod/content"
          className="rounded-3xl bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="text-lg font-semibold text-ellieGray">콘텐츠 관리</h2>
          <p className="mt-2 text-sm text-ellieGray/70">VOD 영상을 등록하고 수정합니다.</p>
        </NavLink>
      </section>
    </div>
  );
};

export default VodManagementPage;
