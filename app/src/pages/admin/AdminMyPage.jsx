import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '@/context/AuthContext';
import { clearAuthUser } from '../../lib/authUser';
import { supabase } from '@/lib/supabaseClient';

const ACTIONS = [
  {
    id: 'notice',
    label: '전체 공지',
    description: '공지사항을 등록하고 관리합니다.',
    to: '/admin/global',
  },
  {
    id: 'classrooms',
    label: '강의실 관리',
    description: '강의실 정보를 확인하고 수정하세요.',
    to: '/admin/classroom',
  },
  {
    id: 'vod',
    label: 'VOD 관리',
    description: 'VOD 콘텐츠를 업로드하고 관리합니다.',
    to: '/admin/vod',
  },
  {
    id: 'materials',
    label: '자료 업로드 관리',
    description: '수업 자료 업로드 현황을 확인하세요.',
    to: '/admin/assignments',
  },
  {
    id: 'feedback',
    label: '피드백 관리',
    description: '학생 피드백을 확인하고 답변합니다.',
    to: '/admin/feedback',
  },
  {
    id: 'activity',
    label: '활동 로그',
    description: '활동 내역을 한눈에 확인하세요.',
    to: '/admin',
  },
];

const AdminMyPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthUser();
  const [isAuthorised, setIsAuthorised] = useState(false);

  useEffect(() => {
    if (authUser?.role === 'admin') {
      setIsAuthorised(true);
      return;
    }

    if (authUser) {
      navigate('/my');
    } else {
      navigate('/login');
    }
  }, [authUser, navigate]);

  const actionItems = useMemo(() => ACTIONS, []);

  const handleNavigate = useCallback(
    (to) => {
      navigate(to);
    },
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthUser();
    navigate('/login');
  }, [navigate]);

  if (!isAuthorised) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-2xl font-bold text-ellieGray">관리자 대시보드</h1>
        <p className="mt-2 text-sm text-ellieGray/70">엘리의방 운영을 위한 핵심 기능을 모았습니다.</p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">빠른 이동</h2>
        <p className="mt-1 text-sm text-ellieGray/60">필요한 메뉴를 선택해 바로 이동하세요.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actionItems.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleNavigate(action.to)}
              className="group flex h-full flex-col justify-between rounded-3xl border border-transparent bg-[#fff7c2] p-5 text-left transition hover:border-[#fbd743] hover:bg-[#fef568]"
            >
              <div>
                <h3 className="text-base font-semibold text-[#404040]">{action.label}</h3>
                <p className="mt-2 text-sm text-[#6b625c]">{action.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#404040] shadow">이동하기</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-[#fef568] px-6 py-3 text-sm font-semibold text-[#404040] shadow-[0_10px_30px_rgba(254,245,104,0.4)] transition hover:bg-[#fde856]"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default AdminMyPage;
