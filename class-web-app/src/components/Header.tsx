import React, { useEffect, useState } from 'react';
import LoginModal from './LoginModal';   // ✅ 모달 직접 import
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // ✅ 모달 상태 추가
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateAuthState = () => {
      setIsAdminAuthenticated(localStorage.getItem('adminAuth') === 'true');
    };

    updateAuthState();
    window.addEventListener('focus', updateAuthState);
    window.addEventListener('storage', updateAuthState);
    window.addEventListener('admin-auth-change', updateAuthState as EventListener);

    return () => {
      window.removeEventListener('focus', updateAuthState);
      window.removeEventListener('storage', updateAuthState);
      window.removeEventListener('admin-auth-change', updateAuthState as EventListener);
    };
  }, []);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const goToAdminDashboard = () => {
    navigate('/admin');
  };

  return (
    <header className="fixed top-0 z-30 w-full bg-white/90 shadow-md backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5">

        <span className="pointer-events-none text-lg font-semibold text-gray-800">
          엘리의방 클래스
        </span>

        {isAdminAuthenticated ? (
          <button
            type="button"
            onClick={goToAdminDashboard}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
          >
            관리자 대시보드
          </button>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}   // ✅ navigate 제거 → 모달 열기
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
          >
            로그인
          </button>
        )}
      </div>

      {/* ✅ 모달 렌더링 */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </header>
  );
};

export default Header;