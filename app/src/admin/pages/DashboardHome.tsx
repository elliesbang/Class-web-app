import { Link } from 'react-router-dom';

const quickLinks = [
  {
    title: '수업 관리',
    description: '수업을 생성하고 과제 규칙을 설정하세요.',
    to: '/admin/classes',
    action: '수업 목록 보기',
  },
  {
    title: '수강생 관리',
    description: '실강/챌린지 수강생과 VOD 구매자를 확인하세요.',
    to: '/admin/students',
    action: '수강생 관리로 이동',
  },
  {
    title: '과제·피드백',
    description: '제출물을 확인하고 관리자가 피드백을 남겨보세요.',
    to: '/admin/assignments',
    action: '과제·피드백 열기',
  },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white px-6 py-5 shadow-xl shadow-black/5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c18f1f]">Welcome back</p>
        <h2 className="mt-1 text-2xl font-black text-[#3f3a37]">엘리의방 관리자 대시보드</h2>
        <p className="mt-2 text-sm text-[#6a5c50]">운영에 필요한 핵심 기능을 한 곳에서 확인하고 이동하세요.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <div key={item.to} className="flex flex-col rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
            <p className="text-sm font-bold text-[#3f3a37]">{item.title}</p>
            <p className="mt-2 flex-1 text-sm text-[#6a5c50]">{item.description}</p>
            <Link
              to={item.to}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-md transition hover:bg-[#f3c623]"
            >
              {item.action}
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
        <h3 className="text-lg font-extrabold text-[#3f3a37]">운영 체크리스트</h3>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          <li className="flex items-center gap-3 rounded-2xl bg-[#fff7d6] px-4 py-3 text-sm text-[#5c5246] shadow-inner shadow-[#ffeab2]">
            <span className="text-lg">📌</span>
            <span>새로운 수업 개설 시 과제 규칙을 꼭 설정하세요.</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-[#fff7d6] px-4 py-3 text-sm text-[#5c5246] shadow-inner shadow-[#ffeab2]">
            <span className="text-lg">👀</span>
            <span>실강/챌린지와 VOD 구매자를 분리해서 관리하세요.</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-[#fff7d6] px-4 py-3 text-sm text-[#5c5246] shadow-inner shadow-[#ffeab2]">
            <span className="text-lg">📝</span>
            <span>과제 제출물에 대해 빠른 피드백을 남겨주세요.</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-[#fff7d6] px-4 py-3 text-sm text-[#5c5246] shadow-inner shadow-[#ffeab2]">
            <span className="text-lg">✅</span>
            <span>콘텐츠 관리 기능은 기존 메뉴에서 그대로 사용할 수 있습니다.</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default DashboardHome;
