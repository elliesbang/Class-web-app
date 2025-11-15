import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrCreateUserId } from '../../utils/userIdentity';

type PreferenceKey =
  | 'admin_notice'
  | 'assignment_deadline'
  | 'new_course_upload'
  | 'feedback_received'
  | 'vod_update';

type PreferenceRecord = Record<PreferenceKey, boolean>;

const PREFERENCE_OPTIONS: Array<{ key: PreferenceKey; label: string; description?: string }> = [
  {
    key: 'admin_notice',
    label: '관리자 공지',
    description: '관리자가 전송하는 주요 공지 사항을 받아보세요.',
  },
  {
    key: 'assignment_deadline',
    label: '과제 마감',
    description: '마감 임박 과제를 놓치지 않도록 알려드립니다.',
  },
  {
    key: 'new_course_upload',
    label: '새 강의 업로드',
    description: '새로운 강의 콘텐츠가 등록되면 안내받습니다.',
  },
  {
    key: 'feedback_received',
    label: '피드백 도착',
    description: '제출한 과제에 대한 피드백이 등록되면 알려드립니다.',
  },
  {
    key: 'vod_update',
    label: 'VOD 업데이트',
    description: 'VOD 콘텐츠 업데이트 소식을 받아보세요.',
  },
];

const defaultPreferences: PreferenceRecord = {
  admin_notice: true,
  assignment_deadline: true,
  new_course_upload: true,
  feedback_received: true,
  vod_update: true,
};

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<PreferenceRecord>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mergePreferences = useCallback((payload: any): PreferenceRecord => {
    const next = { ...defaultPreferences };
    if (payload && typeof payload === 'object') {
      PREFERENCE_OPTIONS.forEach(({ key }) => {
        const value = payload[key];
        if (typeof value === 'boolean') {
          next[key] = value;
        } else if (value === 1 || value === '1' || value === 'true') {
          next[key] = true;
        } else if (value === 0 || value === '0' || value === 'false') {
          next[key] = false;
        }
      });
    }
    return next;
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = getOrCreateUserId();
      const response = await fetch('/api/user-preferences', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`알림 설정을 불러오지 못했습니다. (status ${response.status})`);
      }

      const payload = await response.json();
      const rawPreferences = payload?.data ?? payload?.preferences;
      setPreferences(mergePreferences(rawPreferences));
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : '알림 설정 정보를 불러오는 중 문제가 발생했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [mergePreferences]);

  useEffect(() => {
    fetchPreferences().catch((error) => {
      console.warn('[NotificationSettings] failed to fetch preferences', error);
    });
  }, [fetchPreferences]);

  const persistPreferences = useCallback(async (next: PreferenceRecord) => {
    try {
      setIsSaving(true);
      setMessage(null);
      setError(null);
      const userId = getOrCreateUserId();
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          preferences: next,
        }),
      });

      if (!response.ok) {
        throw new Error(`알림 설정을 저장하지 못했습니다. (status ${response.status})`);
      }

      const payload = await response.json();
      if (payload?.success !== true) {
        throw new Error(payload?.message || '알림 설정 저장에 실패했습니다.');
      }

      setMessage('알림 설정이 저장되었습니다.');
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : '알림 설정 저장 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleChange = useCallback(
    (key: PreferenceKey, nextValue: boolean) => {
      const updated = {
        ...preferences,
        [key]: nextValue,
      } as PreferenceRecord;

      setPreferences(updated);

      persistPreferences(updated).catch((error) => {
        console.warn('[NotificationSettings] failed to save preferences', error);
      });
    },
    [persistPreferences, preferences],
  );

  const statusMessage = useMemo(() => {
    if (isSaving) {
      return '저장 중입니다...';
    }
    if (error) {
      return error;
    }
    if (message) {
      return message;
    }
    return null;
  }, [error, isSaving, message]);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ellieGray">알림 설정</h2>
          <p className="mt-2 text-sm text-ellieGray/70">
            받고 싶은 알림 종류를 선택해 맞춤형 소식을 받아보세요.
          </p>
        </div>
        {statusMessage ? (
          <p className={`text-xs ${error ? 'text-red-500' : 'text-ellieGray/60'}`}>
            {statusMessage}
          </p>
        ) : null}
      </div>

      <form className="mt-5 space-y-4">
        {PREFERENCE_OPTIONS.map(({ key, label, description }) => (
          <label
            key={key}
            className="flex items-start gap-3 rounded-2xl border border-transparent bg-ellieGray/5 px-4 py-3 transition-colors hover:border-[#fef568]"
          >
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={(event) => handleChange(key, event.target.checked)}
              disabled={isSaving}
              className="mt-1 h-4 w-4 rounded border-ellieGray/40 text-[#fef568] focus:ring-[#fef568]"
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ellieGray">{label}</span>
              {description ? (
                <span className="mt-1 block text-xs text-ellieGray/70">{description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </form>

      {isLoading ? (
        <p className="mt-4 text-xs text-ellieGray/60">알림 설정을 불러오는 중입니다...</p>
      ) : null}
    </section>
  );
};

export default NotificationSettings;
