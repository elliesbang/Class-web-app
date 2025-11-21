import React from 'react';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-8">데이터 관리</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Link
          to="/admin/content"
          className="p-6 bg-white shadow rounded-xl hover:bg-yellow-50 transition"
        >
          <h2 className="text-lg font-semibold mb-2">콘텐츠 관리</h2>
          <p className="text-gray-600 text-sm">강의실 영상 · 자료 · 공지 · VOD 업로드 관리</p>
        </Link>

        <Link
          to="/admin/classroom"
          className="p-6 bg-white shadow rounded-xl hover:bg-yellow-50 transition"
        >
          <h2 className="text-lg font-semibold mb-2">강의실 관리</h2>
          <p className="text-gray-600 text-sm">수업 생성 · 카테고리 구조 · 강의실 탭 관리</p>
        </Link>

        <Link
          to="/admin/assignment"
          className="p-6 bg-white shadow rounded-xl hover:bg-yellow-50 transition"
        >
          <h2 className="text-lg font-semibold mb-2">과제 관리</h2>
          <p className="text-gray-600 text-sm">수강생 제출 이미지 · 링크 · 피드백 관리</p>
        </Link>

        <Link
          to="/admin/notice"
          className="p-6 bg-white shadow rounded-xl hover:bg-yellow-50 transition"
        >
          <h2 className="text-lg font-semibold mb-2">공지 관리</h2>
          <p className="text-gray-600 text-sm">전체 공지 · 강의실 공지 등록/편집</p>
        </Link>

      </div>
    </div>
  );
}
