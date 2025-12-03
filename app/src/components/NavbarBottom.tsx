import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Home, Megaphone, PlayCircle, User } from 'lucide-react';
import { useAuthUser } from '../hooks/useAuthUser';

const baseItems = [
  { label: '홈', to: '/', Icon: Home },
  { label: '강의실', to: '/classroom', Icon: GraduationCap },
  { label: 'VOD', to: '/vod', Icon: PlayCircle },
  { label: '공지', to: '/notices', Icon: Megaphone },
];

const baseButtonClasses =
  'flex flex-col items-center justify-center gap-1 rounded-2xl bg-white py-3 text-xs font-medium shadow-md transition-colors duration-200 focus:outline-none';

const NavbarBottom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, loading } = useAuthUser();

  // ---------------------------------------------------------
  // navItems 생성: 관리자 / 학생 / 비로그인 모두 반영
  // ---------------------------------------------------------
  const navItems = useMemo(() => {
    if (loading || !authUser) {
      return baseItems;
    }

    if (authUser.role === 'admin') {
      return [...baseItems, { label: 'My', to: '/admin/my', Icon: User }];
    }

    return [...baseItems, { label: 'My', to: '/my', Icon: User }];
  }, [authUser, loading]);

  // ---------------------------------------------------------
  // 관리자일 때 /admin 경로 아래에서는 하단 내비 숨김
  // (대시보드, 콘텐츠 관리 등 관리자 페이지에서는 노출되면 안 됨)
  // ---------------------------------------------------------
  if (authUser?.role === 'admin' && location.pathname.startsWith('/admin')) {
    return null;
  }

  // 로그인 안 된 상태 + 로딩 끝 → 기본 UI
  if (!authUser && !loading) {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-20 bg-[#fefaf4] px-5 pb-6 pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.05)]">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${baseItems.length}, minmax(0, 1fr))` }}
        >
          {baseItems.map(({ label, to, Icon }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            const iconColor = isActive ? '#404040' : '#8e8e8e';
            const textColor = isActive ? 'text-[#404040]' : 'text-[#8e8e8e]';

            return (
              <button
                key={label}
                type="button"
                onClick={() => navigate(to)}
                className={`${baseButtonClasses} ${textColor} ${
                  isActive ? 'bg-[#fef568]/70' : 'hover:bg-[#fef568]/40'
                }`}
              >
                <Icon size={22} strokeWidth={1.75} color={iconColor} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // ---------------------------------------------------------
  // 로그인 상태 — 학생 / 관리자 공통 렌더
  // ---------------------------------------------------------
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-[#fefaf4] px-5 pb-6 pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.05)]">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map(({ label, to, Icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          const iconColor = isActive ? '#404040' : '#8e8e8e';
          const textColor = isActive ? 'text-[#404040]' : 'text-[#8e8e8e]';

          return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className={`${baseButtonClasses} ${textColor} ${
                isActive ? 'bg-[#fef568]/70' : 'hover:bg-[#fef568]/40'
              }`}
            >
              <Icon size={22} strokeWidth={1.75} color={iconColor} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavbarBottom;
