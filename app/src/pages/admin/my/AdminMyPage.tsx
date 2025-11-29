import { useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthUser } from '@/hooks/useAuthUser';
import { LoginModalContext } from '@/context/LoginModalContext';

const cardClassName =
  'block w-full rounded-2xl bg-white px-5 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg';

export default function AdminMyPage() {
  const { user: authUser } = useAuthUser();
  const navigate = useNavigate();
  const { open: openLoginModal } = useContext(LoginModalContext);

  useEffect(() => {
    // 1) 비로그인 → 로그인 모달 열기 + 홈으로 이동
    if (!authUser) {
      openLoginModal();
      navigate('/my', { replace: true });
      return;
    }

    // 2) 관리자 외의 사용자 → 일반 마이페이지로 이동
    if (authUser.role !== 'admin') {
      navigate('/my', { replace: true });
    }
  }, [authUser, navigate, openLoginModal]);

  if (!authUser || authUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">관리자 메뉴</h1>

      <div className="space-y-3">
        <Link to="/admin/my/notifications" className={cardClassName}>
          <p className="text-sm font-semibold text-[#6b625c]">알림 설정</p>
          <p className="mt-1 text-base font-bold text-[#404040]">알림 선택</p>
        </Link>

        <Link to="/admin/my/assignments" className={cardClassName}>
          <p className="text-sm font-semibold text-[#6b625c]">과제 제출 현황</p>
          <p className="mt-1 text-base font-bold text-[#404040]">과제 제출 현황 보기</p>
        </Link>
      </div>
    </div>
  );
}
