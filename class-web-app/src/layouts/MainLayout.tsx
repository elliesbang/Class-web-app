import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import NavbarBottom from '../components/NavbarBottom';
import LoginModal from '../components/LoginModal';

const MainLayout = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fefaf4]">
      <Header onOpenLoginModal={handleOpenLoginModal} />
      {isLoginModalOpen && <LoginModal onClose={handleCloseLoginModal} />}
      <main className="flex-1 px-4 pb-20 pt-20">
        <Outlet />
      </main>
      <NavbarBottom />
    </div>
  );
};

export default MainLayout;
