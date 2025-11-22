import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Table from '../../components/Table';
import { getClasses } from '../../api/classes';

interface ClassRow {
  id: number;
  name: string;
  category: string;
  code: string;
  assignment_rule_type?: string;
  assignment_days?: string[] | null;
  assignment_start_time?: string | null;
  assignment_end_time?: string | null;
  created_at?: string;
}

const formatRule = (classRow: ClassRow) => {
  switch (classRow.assignment_rule_type) {
    case 'always_open':
      return '상시 제출';
    case 'time_range':
      return `${classRow.assignment_start_time ?? '-'} ~ ${classRow.assignment_end_time ?? '-'}`;
    case 'weekly_days':
      return (classRow.assignment_days ?? []).join(', ');
    case 'weekly_days_with_time':
      return `${(classRow.assignment_days ?? []).join(', ')} / ${classRow.assignment_start_time ?? '-'} ~ ${classRow.assignment_end_time ?? '-'}`;
    default:
      return '미설정';
  }
};

const ClassListPage = () => {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } = await getClasses();
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setClasses(data ?? []);
        setError(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-xl shadow-black/5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#3f3a37]">수업 목록</h2>
          <p className="text-sm text-[#6a5c50]">수업 코드, 카테고리, 과제 규칙을 한눈에 확인하세요.</p>
        </div>
        <Link
          to="/admin/classes/create"
          className="inline-flex items-center justify-center rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#3f3a37] shadow-md transition hover:bg-[#f3c623]"
        >
          + 새 수업 생성
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <Table
        title="수업 리스트"
        description={loading ? '불러오는 중입니다...' : '총 ' + classes.length + '개의 수업'}
        headers={['수업명', '수업 코드', '카테고리', '과제 규칙', '생성일', '']}
      >
        {loading ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              데이터를 불러오는 중입니다.
            </td>
          </tr>
        ) : classes.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              등록된 수업이 없습니다.
            </td>
          </tr>
        ) : (
          classes.map((item) => (
            <tr key={item.id} className="hover:bg-[#fffaf0]">
              <td className="px-4 py-3 font-semibold">{item.name}</td>
              <td className="px-4 py-3 text-[#5c5246]">{item.code}</td>
              <td className="px-4 py-3 text-[#5c5246]">{item.category}</td>
              <td className="px-4 py-3 text-[#5c5246]">{formatRule(item)}</td>
              <td className="px-4 py-3 text-[#5c5246]">{item.created_at?.slice(0, 10)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/admin/classes/${item.id}`}
                  className="inline-flex items-center rounded-full bg-[#fff7d6] px-3 py-1 text-xs font-semibold text-[#3f3a37] shadow-inner hover:bg-[#ffe8a3]"
                >
                  상세 보기
                </Link>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};

export default ClassListPage;
