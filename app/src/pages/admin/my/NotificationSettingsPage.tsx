import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthUser } from '@/hooks/useAuthUser';
import { supabase } from '@/lib/supabaseClient';

type ClassRow = {
  id: string | number;
  name?: string | null;
  code?: string | null;
};

type NotificationSettingRow = {
  classroom_id: string | number;
  notifications_enabled?: boolean | null;
};

const CREATE_TABLE_SQL = `
create table if not exists notification_settings (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references profiles(id),
  classroom_id uuid references classes(id),
  notifications_enabled boolean default true,
  created_at timestamptz default now()
);
`;

const NotificationSettingsPage = () => {
  const authUser = useAuthUser();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [settings, setSettings] = useState<Record<string | number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'admin') {
      navigate('/my');
    }
  }, [authUser, navigate]);

  const adminId = useMemo(() => authUser?.user_id ?? null, [authUser?.user_id]);

  useEffect(() => {
    const ensureTableExists = async () => {
      const { error: existenceError } = await supabase.from('notification_settings').select('id', { head: true, count: 'exact' });
      if (existenceError && existenceError.code === '42P01') {
        await supabase.rpc('execute_sql', { sql: CREATE_TABLE_SQL });
      }
    };

    const loadClasses = async () => {
      const { data, error: classError } = await supabase.from('classes').select('id, name, code');
      if (classError) {
        throw classError;
      }
      setClasses(data ?? []);
    };

    const loadSettings = async () => {
      if (!adminId) return;
      const { data, error: settingsError } = await supabase
        .from('notification_settings')
        .select('classroom_id, notifications_enabled')
        .eq('admin_id', adminId);

      if (settingsError) {
        throw settingsError;
      }

      const nextSettings: Record<string | number, boolean> = {};
      data?.forEach((row: NotificationSettingRow) => {
        nextSettings[row.classroom_id] = row.notifications_enabled ?? true;
      });
      setSettings(nextSettings);
    };

    const init = async () => {
      if (!adminId) return;
      setLoading(true);
      setError(null);
      setStatusMessage('');

      try {
        await ensureTableExists();
        await loadClasses();
        await loadSettings();
      } catch (loadError: any) {
        console.error('[NotificationSettings] failed to load data', loadError);
        setError(loadError?.message ?? '알림 설정 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [adminId]);

  const handleToggle = async (classId: string | number) => {
    if (!adminId) return;
    const nextValue = !(settings[classId] ?? true);
    setSettings((prev) => ({ ...prev, [classId]: nextValue }));
    setSaving(true);
    setStatusMessage('');

    const { error: upsertError } = await supabase.from('notification_settings').upsert({
      admin_id: adminId,
      classroom_id: classId,
      notifications_enabled: nextValue,
    });

    if (upsertError) {
      console.error('[NotificationSettings] failed to save', upsertError);
      setStatusMessage('저장에 실패했습니다. 다시 시도해주세요.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setStatusMessage('저장되었습니다.');
  };

  if (!authUser || authUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold">알림 설정</h1>
        <p className="text-sm text-[#6b625c]">클래스별 알림 수신 여부를 선택하세요.</p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-white px-4 py-5 text-sm text-[#6b625c] shadow-soft">불러오는 중입니다...</div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-5 text-sm text-[#6b625c] shadow-soft">등록된 수업이 없습니다.</div>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="rounded-2xl bg-white px-5 py-4 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">{classItem.code}</p>
                  <h3 className="text-base font-bold text-[#404040]">{classItem.name}</h3>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#404040]">
                  <input
                    type="checkbox"
                    checked={settings[classItem.id] ?? true}
                    onChange={() => handleToggle(classItem.id)}
                    className="h-5 w-5 rounded border-[#e5d4a2] text-[#fbd743] focus:ring-[#fbd743]"
                  />
                  알림 받기
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      {statusMessage ? <p className="text-sm text-[#6b625c]">{statusMessage}</p> : null}
      {saving ? <p className="text-xs text-[#6b625c]">저장 중...</p> : null}
    </div>
  );
};

export default NotificationSettingsPage;
