import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

type ActiveForm = 'main' | 'admin';
type UserRole = 'student' | 'vod';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } },
};

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [activeForm, setActiveForm] = useState<ActiveForm>('main');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const navigate = useNavigate();

  /** --------------------------
   * 닫기 (모든 입력 리셋)
   * -------------------------- */
  const closeModal = useCallback(() => {
    onClose();
    setActiveForm('main');
    setEmail('');
    setPassword('');
    setError('');
    setIsSubmitting(false);
    setSelectedRole('student');
    setAdminEmail('');
    setAdminPassword('');
    setAdminSubmitting(false);
  }, [onClose]);

  /** --------------------------
   * 관리자 로그인
   * -------------------------- */
  const handleAdminSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (adminSubmitting) return;

      try {
        setAdminSubmitting(true);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail.trim(),
          password: adminPassword,
        });

        if (error) {
          throw error;
        }

        const user = data.user;
        if (!user) {
          throw new Error('로그인 실패');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role;

        if (profileError || role !== 'admin') {
          alert('관리자 권한이 없습니다.');
          await supabase.auth.signOut();
          return;
        }
        closeModal();
        navigate('/admin/my');
      } catch (caught) {
        console.error('[LoginModal] admin login failed', caught);
        alert('관리자 로그인 실패 또는 권한 없음');
      } finally {
        setAdminSubmitting(false);
      }
    },
    [adminEmail, adminPassword, adminSubmitting, closeModal, navigate],
  );

  /** --------------------------
   * 이메일 로그인 (수강생/VOD)
   * -------------------------- */
  const handleEmailSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;

      setError('');
      setIsSubmitting(true);

      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) {
          throw signInError;
        }

        const user = data.user;
        if (!user) {
          throw new Error('로그인 실패');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = (profile?.role as UserRole | null) ?? null;

        if (profileError || userRole !== selectedRole) {
          await supabase.auth.signOut();
          throw new Error('ROLE_MISMATCH');
        }

        closeModal();
        navigate(selectedRole === 'vod' ? '/vod' : '/my');
      } catch (caught) {
        console.error('[LoginModal] login failed', caught);
        const message = caught instanceof Error ? caught.message : '로그인에 실패했습니다.';
        setError(message === 'ROLE_MISMATCH' ? '선택한 역할과 일치하지 않습니다.' : message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeModal, email, isSubmitting, navigate, password, selectedRole],
  );

  /** --------------------------
   * Google OAuth 로그인 (역할 선택 포함)
   * -------------------------- */
  const handleGoogleLogin = useCallback(async () => {
    localStorage.setItem('oauth_role', selectedRole);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/google/callback` },
    });
  }, [selectedRole]);

  /** ESC로 닫기 */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  /** --------------------------
   * 메인 폼
   * -------------------------- */
  const renderMainForm = () => (
    <motion.div
      key="main-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      <div className="mt-4">
        {/* 역할 선택 */}
        <label className="block text-sm font-medium mb-2">역할 선택</label>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="student"
              checked={selectedRole === 'student'}
              onChange={() => setSelectedRole('student')}
            />
            수강생
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="vod"
              checked={selectedRole === 'vod'}
              onChange={() => setSelectedRole('vod')}
            />
            VOD
          </label>
        </div>

        {/* 이메일 로그인 */}
        <form onSubmit={handleEmailSubmit}>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            className="border rounded-md w-full p-2 mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input
            type="password"
            className="border rounded-md w-full p-2 mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 구글 로그인 */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
        >
          Google로 로그인/회원가입
        </button>

        {/* 회원가입 버튼 */}
        <button
          type="button"
          onClick={() => {
            closeModal();
            navigate('/signup');
          }}
          className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
        >
          회원가입
        </button>
      </div>
    </motion.div>
  );

  /** --------------------------
   * 관리자 로그인 폼
   * -------------------------- */
  const renderAdminForm = () => (
    <motion.div
      key="admin-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      <button
        type="button"
        className="absolute right-0 top-0 text-sm text-gray-500 hover:text-gray-700"
        onClick={() => setActiveForm('main')}
      >
        ← 뒤로가기
      </button>

      <form className="mt-6" onSubmit={handleAdminSubmit}>
        <label className="block font-medium mb-1">이메일</label>
        <input
          type="email"
          className="border rounded-md w-full p-2 mb-3"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          required
        />

        <label className="block font-medium mb-1">비밀번호</label>
        <input
          type="password"
          className="border rounded-md w-full p-2 mb-3"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
          disabled={adminSubmitting}
        >
          {adminSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </motion.div>
  );

  /** --------------------------
   * 전체 모달 렌더링
   * -------------------------- */
  return (
    <motion.div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6 w-[400px] relative"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* 🔥 X 버튼 추가 */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* 제목 + 관리자 로그인 */}
        <div className="flex items-center justify-between pr-8">
          <h2 className="text-xl font-semibold">로그인</h2>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 px-3 text-sm"
            onClick={() => setActiveForm('admin')}
          >
            관리자 로그인
          </button>
        </div>

        <div className="mt-4 min-h-[220px]">
          <AnimatePresence mode="wait">
            {activeForm === 'main' && renderMainForm()}
            {activeForm === 'admin' && renderAdminForm()}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginModal;
