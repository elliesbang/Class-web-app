import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AdminDataProvider } from './data/AdminDataContext';
import { AdminClassProvider } from './data/AdminClassContext';

const menuItems = [
  { label: '대시보드 홈', icon: '🏠', to: '/admin', end: true },
  { label: '수업 관리', icon: '📚', to: '/admin/class' },
  { label: '수강생 관리', icon: '👩‍🎓', to: '/admin/students' },
  { label: '과제 관리', icon: '🖼️', to: '/admin/assignments' },
  { label: '피드백 관리', icon: '💬', to: '/admin/feedback' },
  { label: '콘텐츠 관리', icon: '🎥', to: '/admin/content' },
  { label: '통계 & 리포트', icon: '📊', to: '/admin/statistics' },
  { label: '설정', icon: '⚙️', to: '/admin/settings' },
];

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isAuthenticated = localStorage.getItem('adminAuth') === 'true';

    if (!isAuthenticated) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/', { replace: true });
      return;
    }

    const storedInfo = localStorage.getItem('adminInfo');
    if (storedInfo) {
      try {
        const parsed = JSON.parse(storedInfo) as { name?: string; email?: string };
        if (parsed && (parsed.name || parsed.email)) {
          setAdminInfo({
            name: parsed.name ?? '관리자',
            email: parsed.email ?? '',
          });
        }
      } catch (error) {
        console.warn('[admin-auth] 관리자 정보 파싱 실패', error);
      }
    }

    setIsReady(true);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminInfo');
    emitAdminAuthChange();
    setIsReady(false);
    setAdminInfo(null);
    navigate('/', { replace: true });
  };

  if (!isReady) {
    return null;
  }

  return (
    <AdminClassProvider>
      <AdminDataProvider>
        <div className="flex min-h-screen bg-[#f5eee9] text-gray-800">
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white/80 p-6 shadow-xl transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-8 text-xl font-bold text-[#404040]">엘리의방 Admin</div>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-[#f5eee9] ${
                  isActive ? 'bg-[#ffd331]/90 text-[#404040]' : 'text-[#5c5c5c]'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[#e9dccf] bg-[#f5eee9]/80 px-6 py-4 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl shadow md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="사이드바 열기"
            >
              ☰
            </button>
            <h1 className="text-xl font-bold text-[#404040]">대시보드</h1>
          </div>
          <div className="flex items-center gap-3">
            {adminInfo && (
              <div className="hidden flex-col text-right text-xs font-semibold text-[#5c5c5c] sm:flex">
                <span>{adminInfo.name}</span>
                {adminInfo.email && <span className="text-[11px] text-[#7a6f68]">{adminInfo.email}</span>}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#f5eee9]"
            >
              홈
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
            >
              로그아웃
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
      </AdminDataProvider>
    </AdminClassProvider>
  );
};

export default AdminLayout;
