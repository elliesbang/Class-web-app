import React from 'react';
import { useParams } from 'react-router-dom';

import ClassroomContentTab from './ClassroomContentTab';
import { VideoTab, MaterialTab, NoticeTab, FeedbackTab } from './tabs';
import AssignmentTab from './tabs/AssignmentTab';

import { supabase } from '@/lib/supabaseClient';

// -----------------------------
// 강의실 콘텐츠 탭 라우트
// -----------------------------

export function VideoTabRoute() {
  return <ClassroomContentTab tab="video" Component={VideoTab} />;
}

export function MaterialTabRoute() {
  return <ClassroomContentTab tab="material" Component={MaterialTab} />;
}

export function NoticeTabRoute() {
  return <ClassroomContentTab tab="notice" Component={NoticeTab} />;
}

export function FeedbackTabRoute() {
  const { classId } = useParams();
  if (!classId) return null;
  return <FeedbackTab courseId={classId} classId={classId} />;
}

// -----------------------------
// 과제 탭 라우트
// -----------------------------

export function AssignmentTabRoute() {
  const { classId } = useParams();
  const [state, setState] = React.useState({
    classroom: null,
    sessions: [],
    assignments: [],
    loading: true,
    error: '',
  });

  React.useEffect(() => {
    if (!classId) return;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        // 수업 정보 로드
        const { data: classroom } = await supabase
          .from('classroom')
          .select('*')
          .eq('id', classId)
          .single();

        // 세션 정보 로드
        const { data: sessions } = await supabase
          .from('classroom_sessions')
          .select('*')
          .eq('classroom_id', classId)
          .order('session_no', { ascending: true });

        // 현재 로그인한 유저 정보
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 유저의 과제 로드
        const { data: assignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('classroom_id', classId)
          .eq('student_id', user?.id ?? '')
          .order('created_at', { ascending: false });

        setState({
          classroom,
          sessions: sessions ?? [],
          assignments: assignments ?? [],
          loading: false,
          error: '',
        });
      } catch (err: any) {
        setState({
          classroom: null,
          sessions: [],
          assignments: [],
          loading: false,
          error: err?.message || '수업 정보를 불러오지 못했습니다.',
        });
      }
    };

    load();
  }, [classId]);

  if (!classId) return null;

  return (
    <AssignmentTab
      classId={classId}
      classroom={state.classroom}
      sessions={state.sessions}
      assignments={state.assignments}
      loading={state.loading}
      error={state.error}
    />
  );
}