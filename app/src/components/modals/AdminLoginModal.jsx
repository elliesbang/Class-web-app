import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { setStoredAuthUser } from '../../lib/authUser';

const MODAL_ROOT_ID = 'modal-root';

function ensureModalRoot() {
  if (typeof document === 'undefined') {
    return null;
  }

  let container = document.getElementById(MODAL_ROOT_ID);
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', MODAL_ROOT_ID);
    document.body.appendChild(container);
  }

  return container;
}

function AdminLoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const modalRoot = useMemo(() => ensureModalRoot(), []);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setErrorMessage('');
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    if (onClose) {
      onClose();
    }
  }, [isSubmitting, onClose, resetForm]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      setErrorMessage('');
      setIsSubmitting(true);

      try {
        const credentials = {
          email: email.trim(),
          password,
        };

        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          throw new Error('LOGIN_FAILED');
        }

        const data = await response.json();
        if (!data?.token) {
          throw new Error('INVALID_RESPONSE');
        }

        setStoredAuthUser(data);

        handleClose();
        navigate('/admin/my');
      } catch (error) {
        console.error('[AdminLoginModal] login failed', error);
        setErrorMessage('로그인 실패');
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, handleClose, isSubmitting, navigate],
  );

  if (!isOpen || !modalRoot) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-[380px] rounded-[18px] bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
        style={{ padding: '24px' }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-sm font-semibold text-ellieGray/70 hover:text-ellieGray"
          aria-label="닫기"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-ellieGray">관리자 로그인</h2>
        <p className="mt-1 text-sm text-ellieGray/70">등록된 관리자 계정으로 로그인해 주세요.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-ellieGray">
            이메일
            <input
              type="email"
              placeholder="관리자 이메일 입력"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#f0e7c6] px-4 py-3 text-sm text-ellieGray focus:border-[#fef568] focus:outline-none focus:ring-2 focus:ring-[#fef568]/60"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-ellieGray">
            비밀번호
            <input
              type="password"
              placeholder="관리자 비밀번호 입력"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#f0e7c6] px-4 py-3 text-sm text-ellieGray focus:border-[#fef568] focus:outline-none focus:ring-2 focus:ring-[#fef568]/60"
              required
            />
          </label>

          {errorMessage ? (
            <p className="text-sm font-semibold text-red-500">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-full bg-[#fef568] py-3 text-sm font-semibold text-[#404040] shadow-[0_8px_20px_rgba(254,245,104,0.35)] transition hover:bg-[#fde856] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>,
    modalRoot,
  );
}

export default AdminLoginModal;
