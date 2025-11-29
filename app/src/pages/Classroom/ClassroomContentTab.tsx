import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

type ContentTabProps = {
  tab: string;
  Component: React.ComponentType<any>;
};

type ClassroomContent = any[];

type ContentState = {
  contents: ClassroomContent;
  loading: boolean;
  error: string;
};

function ClassroomContentTab({ tab, Component }: ContentTabProps) {
  const { classId } = useParams();
  const [state, setState] = useState<ContentState>({
    contents: [],
    loading: false,
    error: '',
  });

  useEffect(() => {
    if (!classId) return;

    const controller = new AbortController();

    const loadContent = async () => {
      setState({ contents: [], loading: true, error: '' });

      try {
        let { data, error } = await supabase
          .from('class_contents')
          .select('*, classes(*)')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const filtered =
          data?.map((item) => ({
            ...item,
            classroomId: item.classroom_id ?? item.classroomId ?? item.class_id ?? item.classId ?? null,
          }))
            .filter((item) => {
            const type = (item.type ?? item.category ?? '').toLowerCase();
            if (tab === 'video') return type === 'video' || type === '영상';
            if (tab === 'material') return type === 'material' || type === '자료';
            if (tab === 'notice') return type === 'notice' || type === '공지';
            if (tab === 'feedback') return type === 'feedback' || type === '피드백';
            return false;
          }) ?? [];

        setState({
          contents: filtered,
          loading: false,
          error: '',
        });
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setState({
            contents: [],
            loading: false,
            error: err?.message || '콘텐츠를 불러오지 못했습니다.',
          });
        }
      }
    };

    loadContent();

    return () => controller.abort();
  }, [classId, tab]);

  if (!classId) return null;

  return (
    <Component
      courseId={classId}
      classId={classId}
      contents={state.contents}
      isLoadingContents={state.loading}
      contentError={state.error}
    />
  );
}

export default ClassroomContentTab;