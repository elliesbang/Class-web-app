import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrCreateUserId } from '../../utils/userIdentity';

const defaultSettings = {
  notify_assignment: true,
  notify_feedback: true,
  notify_global_notice: true,
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
};

const NotificationSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const normaliseSettings = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      return defaultSettings;
    }

    return {
      notify_assignment: parseBoolean(payload.notify_assignment, defaultSettings.notify_assignment),
      notify_feedback: parseBoolean(payload.notify_feedback, defaultSettings.notify_feedback),
      notify_global_notice: parseBoolean(payload.notify_global_notice, defaultSettings.notify_global_notice),
    };
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = getOrCreateUserId();
      const response = await fetch('/.netlify/functions/notification-settings', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`알림 설정을 불러오지 못했습니다. (status ${response.status})`);
      }

      const payload = await response.json();
      setSettings(normaliseSettings(payload?.data));
    } catch (caught) {
      const messageText =
        caught instanceof Error ? caught.message : '알림 설정을 불러오는 중 문제가 발생했습니다.';
      setError(messageText);
    } finally {
      setIsLoading(false);
    }
  }, [normaliseSettings]);

  useEffect(() => {
    loadSettings().catch((error) => {
      console.warn('[NotificationSettings] failed to load', error);
    });
  }, [loadSettings]);

  const saveSettings = useCallback(
    async (nextSettings) => {
      try {
        setIsSaving(true);
        setMessage(null);
        setError(null);
        const userId = getOrCreateUserId();
        const response = await fetch('/.netlify/functions/notification-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
          },
          body: JSON.stringify(nextSettings),
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
        const messageText =
          caught instanceof Error ? caught.message : '알림 설정 저장 중 오류가 발생했습니다.';
        setError(messageText);
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const handleCheckboxChange = (key) => (event) => {
    const nextSettings = { ...settings, [key]: event.target.checked };
    setSettings(nextSettings);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveSettings(settings);
  };

  const statusMessage = useMemo(() => {
    if (isSaving) return '저장 중입니다...';
    if (error) return error;
    if (message) return message;
    return null;
  }, [error, isSaving, message]);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ellieGray">알림 설정</h2>
          <p className="mt-2 text-sm text-ellieGray/70">받고 싶은 알림을 선택해 주세요.</p>
        </div>
        {statusMessage ? (
          <p className={`text-xs ${error ? 'text-red-500' : 'text-ellieGray/60'}`}>{statusMessage}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="flex items-start gap-3 rounded-2xl bg-ellieGray/5 px-4 py-3">
          <input
            type="checkbox"
            checked={settings.notify_assignment}
            onChange={handleCheckboxChange('notify_assignment')}
            disabled={isSaving}
            className="mt-1 h-4 w-4 rounded border-ellieGray/40 text-[#fef568] focus:ring-[#fef568]"
          />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ellieGray">과제 알림</span>
            <span className="mt-1 block text-xs text-ellieGray/70">새로운 과제 제출 시 안내를 받아요.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl bg-ellieGray/5 px-4 py-3">
          <input
            type="checkbox"
            checked={settings.notify_feedback}
            onChange={handleCheckboxChange('notify_feedback')}
            disabled={isSaving}
            className="mt-1 h-4 w-4 rounded border-ellieGray/40 text-[#fef568] focus:ring-[#fef568]"
          />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ellieGray">피드백 알림</span>
            <span className="mt-1 block text-xs text-ellieGray/70">새 피드백이 등록되면 알려드려요.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl bg-ellieGray/5 px-4 py-3">
          <input
            type="checkbox"
            checked={settings.notify_global_notice}
            onChange={handleCheckboxChange('notify_global_notice')}
            disabled={isSaving}
            className="mt-1 h-4 w-4 rounded border-ellieGray/40 text-[#fef568] focus:ring-[#fef568]"
          />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ellieGray">전체 공지 알림</span>
            <span className="mt-1 block text-xs text-ellieGray/70">중요한 전체 공지 소식을 받아요.</span>
          </span>
        </label>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-ellieOrange px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-ellieOrange/90"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="mt-4 text-xs text-ellieGray/60">알림 설정을 불러오는 중입니다...</p>
      ) : null}
    </section>
  );
};

export default NotificationSettings;
