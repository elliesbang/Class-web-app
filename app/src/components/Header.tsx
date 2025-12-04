import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import NotificationBell from './notifications/NotificationBell';
import { useAuthUser } from '@/context/AuthContext';
import { LoginModalContext } from '../context/LoginModalContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthUser();
  const { open: openLoginModal } = useContext(LoginModalContext);

  const goToAdminDashboard = () => {
    navigate('/admin');
  };

  return (
    <header className="fixed top-0 z-30 w-full bg-white/90 shadow-md backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="pointer-events-none text-lg font-semibold text-gray-800">
          엘리의방 클래스
        </span>

        <div className="flex items-center gap-3">
          {/* 알림 아이콘 */}
          <NotificationBell />

          {/* 관리자 – 대시보드 버튼 */}
          {authUser?.role === 'admin' && (
            <button
              type="button"
              onClick={goToAdminDashboard}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
            >
              관리자 대시보드
            </button>
          )}

          {/* 로그인 버튼 */}
          {!authUser && (
            <button
              type="button"
              onClick={openLoginModal}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
