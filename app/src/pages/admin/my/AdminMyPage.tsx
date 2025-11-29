import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthUser } from '@/hooks/useAuthUser';

const cardClassName =
  'block w-full rounded-2xl bg-white px-5 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg';

export default function AdminMyPage() {
  const { user: authUser } = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'admin') {
      navigate('/my');
    }
  }, [authUser, navigate]);

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
