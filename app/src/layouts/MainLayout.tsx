import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/Nav/BottomNav';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#fefaf4]">
      <Header />
      <main className="flex-1 px-4 pb-20 pt-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
