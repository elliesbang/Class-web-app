import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NotificationBell from './notifications/NotificationBell';
import LoginTypeModal from './Auth/LoginTypeModal';
import LoginMethodModal from './Auth/LoginMethodModal';
import RegisterModal from './Auth/RegisterModal';
import { useAuthUser } from '../hooks/useAuthUser';

const Header: React.FC = () => {
  const { user: authUser } = useAuthUser();
  const navigate = useNavigate();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'admin' | 'student' | 'vod' | null>(null);

  const goToAdminDashboard = () => {
    navigate('/admin');
  };

  const resetModals = () => {
    setShowTypeModal(false);
    setShowMethodModal(false);
    setShowRegisterModal(false);
    setSelectedType(null);
  };

  const handleLoginClick = () => {
    setSelectedType(null);
    setShowRegisterModal(false);
    setShowMethodModal(false);
    setShowTypeModal(true);
  };

  const handleSelectType = (type: 'admin' | 'student' | 'vod') => {
    setSelectedType(type);
    setShowTypeModal(false);
    setShowMethodModal(true);
  };

  const handleRegister = () => {
    setSelectedType(null);
    setShowTypeModal(false);
    setShowMethodModal(false);
    setShowRegisterModal(true);
  };

  const backToType = () => {
    setShowMethodModal(false);
    setShowRegisterModal(false);
    setShowTypeModal(true);
  };

  return (
    <header className="fixed top-0 z-30 w-full bg-white/90 shadow-md backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="pointer-events-none text-lg font-semibold text-gray-800">엘리의방 클래스</span>

        <div className="flex items-center gap-3">
          <NotificationBell />
          {authUser?.role === 'admin' ? (
            <button
              type="button"
              onClick={goToAdminDashboard}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
            >
              관리자 대시보드
            </button>
          ) : null}
          {!authUser ? (
            <button
              type="button"
              onClick={handleLoginClick}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
            >
              로그인
            </button>
          ) : null}
        </div>
      </div>

      {showTypeModal ? (
        <LoginTypeModal onSelectType={handleSelectType} onRegister={handleRegister} onClose={resetModals} />
      ) : null}

      {showMethodModal && selectedType ? (
        <LoginMethodModal userType={selectedType} onBack={backToType} onClose={resetModals} />
      ) : null}

      {showRegisterModal ? <RegisterModal onBack={backToType} onClose={resetModals} /> : null}
    </header>
  );
};

export default Header;
