import { useEffect, useState } from 'react';

import Table from '../../components/Table';
import { getClassStudents, getVodPurchases } from '../../api/students';

interface StudentRow {
  id: number;
  class_id?: number;
  user_id?: string;
  name?: string;
  email?: string;
  created_at?: string;
}

interface VodPurchase {
  id: number;
  user_id?: string;
  vod_id?: number;
  email?: string;
  created_at?: string;
}

const StudentsPage = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [vods, setVods] = useState<VodPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: studentsData, error: studentsError }, { data: vodData, error: vodError }] = await Promise.all([
        getClassStudents(),
        getVodPurchases(),
      ]);

      if (studentsError || vodError) {
        setError(studentsError?.message || vodError?.message || '데이터를 불러오지 못했습니다.');
      } else {
        setStudents(studentsData ?? []);
        setVods(vodData ?? []);
        setError(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">Students</p>
        <h2 className="text-xl font-black text-[#3f3a37]">수강생 관리</h2>
        <p className="text-sm text-[#6a5c50]">실강/챌린지 수강생과 VOD 구매자를 구분해서 확인하세요.</p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <Table
        title="실강/챌린지 수강생"
        description={loading ? '불러오는 중입니다...' : `총 ${students.length}명`}
        headers={['ID', '클래스 ID', '이메일', '생성일']}
      >
        {loading ? (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              데이터를 불러오는 중입니다.
            </td>
          </tr>
        ) : students.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              등록된 수강생이 없습니다.
            </td>
          </tr>
        ) : (
          students.map((student) => (
            <tr key={student.id} className="hover:bg-[#fffaf0]">
              <td className="px-4 py-3 text-sm font-semibold">{student.id}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{student.class_id ?? '-'}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{student.email ?? student.user_id}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{student.created_at?.slice(0, 10)}</td>
            </tr>
          ))
        )}
      </Table>

      <Table
        title="VOD 구매자"
        description={loading ? '불러오는 중입니다...' : `총 ${vods.length}명`}
        headers={['ID', 'VOD ID', '이메일', '생성일']}
      >
        {loading ? (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              데이터를 불러오는 중입니다.
            </td>
          </tr>
        ) : vods.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              구매자가 없습니다.
            </td>
          </tr>
        ) : (
          vods.map((vod) => (
            <tr key={vod.id} className="hover:bg-[#fffaf0]">
              <td className="px-4 py-3 text-sm font-semibold">{vod.id}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{vod.vod_id ?? '-'}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{vod.email ?? vod.user_id}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{vod.created_at?.slice(0, 10)}</td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};

export default StudentsPage;
