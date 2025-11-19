import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import AssignmentTab from './tabs/AssignmentTab';
import { FeedbackTab, MaterialTab, NoticeTab, VideoTab } from './tabs';

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
  const [state, setState] = useState<ContentState>({ contents: [], loading: false, error: '' });

  useEffect(() => {
    if (!classId) return;

    const controller = new AbortController();
    const loadContent = async () => {
      setState({ contents: [], loading: true, error: '' });
      try {
        const query = new URLSearchParams({ class_id: classId, tab });
        const response = await fetch(`/.netlify/functions/classroom-content?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('탭 콘텐츠를 불러오지 못했습니다.');
        }

        const payload = await response.json();
        setState({ contents: Array.isArray(payload) ? payload : [], loading: false, error: '' });
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setState({ contents: [], loading: false, error: error?.message || '탭 콘텐츠를 불러오지 못했습니다.' });
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

export function VideoTabRoute() {
  return <ClassroomContentTab tab="video" Component={VideoTab} />;
}

export function MaterialTabRoute() {
  return <ClassroomContentTab tab="material" Component={MaterialTab} />;
}

export function NoticeTabRoute() {
  return <ClassroomContentTab tab="notice" Component={NoticeTab} />;
}

export function AssignmentTabRoute() {
  const { classId } = useParams();
  if (!classId) return null;
  return <AssignmentTab classId={classId} />;
}

export function FeedbackTabRoute() {
  const { classId } = useParams();
  if (!classId) return null;
  return <FeedbackTab courseId={classId} classId={classId} />;
}
