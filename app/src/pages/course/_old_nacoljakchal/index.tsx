import React from 'react';
import ClassroomTabs from '@/components/classroom/ClassroomTabs';

export default function NacoljakchalPage() {
  const courseId = "nacoljakchal";
  const courseDisplayName = "나컬작챌";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{courseDisplayName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">
          영상, 자료, 과제, 피드백, 공지를 한 곳에서 확인하세요.
        </p>
      </header>

      <ClassroomTabs courseId={courseId} courseName={courseDisplayName} />
    </div>
  );
}
