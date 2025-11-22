
import React from 'react';
import { useParams } from 'react-router-dom';

import ClassroomContentTab from './ClassroomContentTab';
import { VideoTab, MaterialTab, NoticeTab, FeedbackTab } from './tabs';
import AssignmentTab from './tabs/AssignmentTab';

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
// 과제 탭 라우트 — classId만 전달
// -----------------------------

export function AssignmentTabRoute() {
  const { classId } = useParams();
  if (!classId) return null;
  return <AssignmentTab classId={classId} />;
}

