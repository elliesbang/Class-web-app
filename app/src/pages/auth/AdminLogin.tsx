import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import AdminLoginModal from '../../components/modals/AdminLoginModal.jsx';

const AdminLogin = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const { user: authUser } = useAuthUser();

  useEffect(() => {
    if (authUser?.role === 'admin') {
      navigate('/admin/my', { replace: true });
    }
  }, [authUser, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#fefaf4] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-ellieGray">관리자 로그인</h1>
        <p className="mt-3 text-sm text-ellieGray/70">
          관리자 계정으로 로그인하여 대시보드를 이용해 주세요.
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-8 w-full rounded-full bg-[#fef568] py-3 text-sm font-semibold text-[#404040] shadow-[0_10px_25px_rgba(254,245,104,0.35)] transition hover:bg-[#fde856]"
        >
          관리자 로그인하기
        </button>
      </div>

      <AdminLoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminLogin;
