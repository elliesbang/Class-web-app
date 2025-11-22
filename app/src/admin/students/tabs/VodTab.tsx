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

const VodTab = () => {
  const [members, setMembers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVodMembers = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at')
        .eq('role', 'vod')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setMembers([]);
        setError(fetchError.message);
      } else {
        setMembers(data ?? []);
        setError(null);
      }
      setLoading(false);
    };

    fetchVodMembers();
  }, []);

  return (
    <Table
      title="VOD"
      description={loading ? '불러오는 중입니다...' : `총 ${members.length}명`}
      headers={['ID', 'VOD ID', '이메일', '생성일']}
    >
      {loading ? (
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
            데이터를 불러오는 중입니다.
          </td>
        </tr>
      ) : members.length === 0 ? (
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
            구매자가 없습니다.
          </td>
        </tr>
      ) : (
        members.map((vod) => (
          <tr key={vod.id} className="hover:bg-[#fffaf0]">
            <td className="px-4 py-3 text-sm font-semibold">{vod.id}</td>
            <td className="px-4 py-3 text-sm text-[#5c5246]">{vod.name ?? '-'}</td>
            <td className="px-4 py-3 text-sm text-[#5c5246]">{vod.email ?? '-'}</td>
            <td className="px-4 py-3 text-sm text-[#5c5246]">{vod.created_at ? vod.created_at.slice(0, 10) : '-'}</td>
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

export default VodTab;
