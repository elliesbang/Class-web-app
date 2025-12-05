import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getClass } from '../../api/classes';
import Table from '../../components/Table';

interface ClassDetail {
  id: number;
  name: string;
  description?: string;
  category?: string;
  code?: string;
  assignment_rule_type?: string;
  assignment_days?: string[] | null;
  assignment_start_time?: string | null;
  assignment_end_time?: string | null;
  created_at?: string;
}

const ClassDetailPage = () => {
  const { lesson_id } = useParams();
  const lessonId = lesson_id;
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!lessonId) return;
      setLoading(true);
      const { data, error: fetchError } = await getClass(lessonId);
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setClassData(data);
        setError(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [lessonId]);

  const ruleDescription = useMemo(() => {
    if (!classData) return '-';
    switch (classData.assignment_rule_type) {
      case 'always_open':
        return '상시 제출';
      case 'time_range':
        return `${classData.assignment_start_time ?? '-'} ~ ${classData.assignment_end_time ?? '-'}`;
      case 'weekly_days':
        return (classData.assignment_days ?? []).join(', ');
      case 'weekly_days_with_time':
        return `${(classData.assignment_days ?? []).join(', ')} / ${classData.assignment_start_time ?? '-'} ~ ${classData.assignment_end_time ?? '-'}`;
      default:
        return '미설정';
    }
  }, [classData]);

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 text-sm text-[#6a5c50] shadow-xl shadow-black/5">불러오는 중입니다...</div>;
  }

  if (error || !classData) {
    return (
      <div className="space-y-3 rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
        <p className="text-sm font-semibold text-red-700">수업 정보를 불러오는 중 오류가 발생했습니다.</p>
        {error ? <p className="text-sm text-[#6a5c50]">{error}</p> : null}
        <Link
          to="/admin/lessons"
          className="inline-flex w-max items-center rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-md hover:bg-[#f3c623]"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-xl shadow-black/5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">Class Detail</p>
          <h2 className="text-2xl font-black text-[#3f3a37]">{classData.name}</h2>
          <p className="text-sm text-[#6a5c50]">수업 코드: {classData.code}</p>
        </div>
        <Link
          to="/admin/lessons"
          className="inline-flex items-center rounded-full bg-[#fff7d6] px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-inner hover:bg-[#ffe8a3]"
        >
          목록으로
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
          <h3 className="text-lg font-extrabold text-[#3f3a37]">기본 정보</h3>
          <p className="text-sm text-[#6a5c50]">카테고리: {classData.category}</p>
          <p className="text-sm text-[#6a5c50]">생성일: {classData.created_at?.slice(0, 10)}</p>
          <p className="text-sm text-[#6a5c50]">설명</p>
          <p className="rounded-2xl bg-[#fff7d6] px-4 py-3 text-sm text-[#3f3a37] shadow-inner shadow-[#ffeab2]">
            {classData.description || '설명이 없습니다.'}
          </p>
        </div>

        <div className="space-y-2 rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
          <h3 className="text-lg font-extrabold text-[#3f3a37]">과제 규칙</h3>
          <p className="text-sm text-[#6a5c50]">형태: {classData.assignment_rule_type}</p>
          <p className="text-sm text-[#6a5c50]">설정 값</p>
          <p className="rounded-2xl bg-[#fff7d6] px-4 py-3 text-sm text-[#3f3a37] shadow-inner shadow-[#ffeab2]">{ruleDescription}</p>
        </div>
      </div>

      <Table title="과제 규칙 조건" description="테이블 형태로 규칙 값을 정리합니다." headers={['필드', '값']}>
        <tr>
          <td className="px-4 py-3 text-sm font-semibold">Rule Type</td>
          <td className="px-4 py-3 text-sm text-[#5c5246]">{classData.assignment_rule_type}</td>
        </tr>
        <tr>
          <td className="px-4 py-3 text-sm font-semibold">Days</td>
          <td className="px-4 py-3 text-sm text-[#5c5246]">{(classData.assignment_days ?? []).join(', ') || '-'}</td>
        </tr>
        <tr>
          <td className="px-4 py-3 text-sm font-semibold">Start Time</td>
          <td className="px-4 py-3 text-sm text-[#5c5246]">{classData.assignment_start_time || '-'}</td>
        </tr>
        <tr>
          <td className="px-4 py-3 text-sm font-semibold">End Time</td>
          <td className="px-4 py-3 text-sm text-[#5c5246]">{classData.assignment_end_time || '-'}</td>
        </tr>
      </Table>
    </div>
  );
};

export default ClassDetailPage;
