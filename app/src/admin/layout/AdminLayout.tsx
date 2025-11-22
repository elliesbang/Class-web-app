import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuthUser } from '@/hooks/useAuthUser';
import { clearStoredAuthUser } from '@/lib/authUser';
import { supabase } from '@/lib/supabase';
import AdminSidebar from './AdminSidebar';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': '대시보드 홈',
  '/admin/classes': '수업 관리',
  '/admin/classes/create': '수업 생성',
  '/admin/students': '수강생 관리',
  '/admin/assignments': '과제·피드백 관리',
};

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthUser();

  useEffect(() => {
    if (authUser?.role === 'admin') {
      setIsReady(true);
      return;
    }

    setIsReady(false);

    if (authUser) {
      alert('관리자 권한이 필요합니다.');
      navigate('/my', { replace: true });
    } else {
      alert('관리자 로그인이 필요합니다.');
      navigate('/login', { replace: true });
    }
  }, [authUser, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearStoredAuthUser();
    navigate('/', { replace: true });
  };

  if (!isReady) {
    return null;
  }

  const currentTitle = PAGE_TITLES[location.pathname] ?? '관리자 대시보드';

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#3f3a37]">
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {isSidebarOpen ? (
          <button
            type="button"
            aria-label="사이드바 닫기"
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-[#efd9b4] bg-[#fffaf0] px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-md md:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="사이드바 열기"
              >
                ☰
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">Admin</p>
                <h1 className="text-xl font-extrabold text-[#3f3a37]">{currentTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-md transition-colors hover:bg-[#fff2c2]"
              >
                홈
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                로그아웃
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-[#f7f3ea] p-6 md:p-8">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
