import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOrCreateUserId } from '../../utils/userIdentity';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  createdAt: string;
};

const formatRelativeTime = (value: string): string => {
  const fallback = '방금 전';

  try {
    const target = new Date(value);
    if (Number.isNaN(target.getTime())) {
      return fallback;
    }

    const now = new Date();
    const diff = now.getTime() - target.getTime();

    if (diff < 60 * 1000) {
      return '방금 전';
    }

    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}분 전`;
    }

    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}시간 전`;
    }

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days < 7) {
      return `${days}일 전`;
    }

    return target.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('[NotificationBell] failed to format time', value, error);
    return fallback;
  }
};

const summariseMessage = (value: string): string => {
  const safe = value ?? '';
  if (safe.length <= 70) {
    return safe;
  }
  return `${safe.slice(0, 67)}...`;
};

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userIdRef = useRef<string>('');

  const ensureUserId = useCallback(() => {
    if (!userIdRef.current) {
      userIdRef.current = getOrCreateUserId();
    }
    return userIdRef.current;
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = ensureUserId();
      const response = await fetch('/.netlify/functions/notifications', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`알림을 불러오지 못했습니다. (status ${response.status})`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload?.data) ? payload.data : [];

      const normalised = items
        .map((item: any) => ({
          id: typeof item?.id === 'number' ? item.id : Number(item?.id) || 0,
          title: typeof item?.title === 'string' ? item.title : '',
          message: typeof item?.message === 'string' ? item.message : '',
          createdAt:
            typeof item?.createdAt === 'string' && item.createdAt.length > 0
              ? item.createdAt
              : typeof item?.created_at === 'string'
              ? item.created_at
              : '',
        }))
        .filter((item) => item.id > 0 && item.title);

      setNotifications(normalised);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : '알림을 불러오는 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [ensureUserId]);

  useEffect(() => {
    fetchNotifications().catch((error) => {
      console.warn('[NotificationBell] failed initial fetch', error);
    });
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (event.target instanceof Node && containerRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!prev && !isLoading) {
        fetchNotifications().catch((error) => {
          console.warn('[NotificationBell] failed to refresh', error);
        });
      }
      return next;
    });
  };

  const handleDelete = useCallback(
    async (id: number) => {
      if (!id) {
        return;
      }

      try {
        const userId = ensureUserId();
      const response = await fetch('/.netlify/functions/notifications/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`알림을 삭제하지 못했습니다. (status ${response.status})`);
      }

      const result = await response.json();
      if (result?.success !== true) {
        throw new Error(result?.message || '알림을 삭제하지 못했습니다.');
      }

      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : '알림을 삭제하는 중 오류가 발생했습니다.';
      setError(message);
    }
  }, [ensureUserId]);

  const notificationCount = notifications.length;
  const hasNotifications = notificationCount > 0;

  const dropdownContent = useMemo(() => {
    if (isLoading) {
      return <p className="py-4 text-center text-sm text-ellieGray/70">알림을 불러오는 중입니다...</p>;
    }

    if (error) {
      return <p className="py-4 text-center text-sm text-red-500">{error}</p>;
    }

    if (!hasNotifications) {
      return <p className="py-4 text-center text-sm text-ellieGray/70">새로운 알림이 없습니다.</p>;
    }

    return (
      <ul className="max-h-80 divide-y divide-gray-100 overflow-auto">
        {notifications.map((notification) => (
          <li key={notification.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ellieGray">{notification.title}</p>
              <p className="mt-1 text-xs text-ellieGray/70">{summariseMessage(notification.message)}</p>
              <p className="mt-1 text-[11px] text-ellieGray/60">{formatRelativeTime(notification.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(notification.id)}
              className="mt-1 text-xs text-ellieGray/50 transition-colors hover:text-ellieGray"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    );
  }, [error, handleDelete, hasNotifications, isLoading, notifications]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/30"
        aria-label="알림 보기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.7 1.7 0 0 0 3.4 0" />
        </svg>
        {hasNotifications ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {notificationCount}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-ellieGray">알림</p>
          </div>
          {dropdownContent}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
