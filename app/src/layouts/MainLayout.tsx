import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#fefaf4]">
      <Header />
      <main className="flex-1 px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
