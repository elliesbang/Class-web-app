import { useEffect, useState } from 'react';

import Table from '../../components/Table';
import { supabase } from '../../../lib/supabase';

interface ProfileUser {
  id: string;
  name: string | null;
  email: string | null;
  role: 'admin' | 'student' | 'vod';
  created_at: string;
}

const StudentTab = () => {
  const [students, setStudents] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setStudents([]);
        setError(fetchError.message);
      } else {
        setStudents(data ?? []);
        setError(null);
      }
      setLoading(false);
    };

    fetchStudents();
  }, []);

  return (
    <Table
      title="수강생"
      description={loading ? '불러오는 중입니다...' : `총 ${students.length}명`}
      headers={['ID', '이름', '이메일', '생성일']}
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
            <td className="px-4 py-3 text-sm text-[#5c5246]">{student.name ?? '-'}</td>
            <td className="px-4 py-3 text-sm text-[#5c5246]">{student.email ?? '-'}</td>
            <td className="px-4 py-3 text-sm text-[#5c5246]">
              {student.created_at ? student.created_at.slice(0, 10) : '-'}
            </td>
          </tr>
        ))
      )}
      {error ? (
        <tr>
          <td colSpan={4} className="px-4 py-3 text-center text-sm text-red-700">
            {error}
          </td>
        </tr>
      ) : null}
    </Table>
  );
};

export default StudentTab;
