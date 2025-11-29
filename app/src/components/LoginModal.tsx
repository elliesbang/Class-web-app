import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { setAuthUser } from '../lib/authUser';
import { login } from '@/lib/api/auth/login';
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

  const handleAdminSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (adminSubmitting) return;

      try {
        setAdminSubmitting(true);

        const { user, profile, token } = await login(adminEmail.trim(), adminPassword);

        let role = profile?.role;

        if (!role && profile?.email === (user.email ?? adminEmail)) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);

          if (!updateError) {
            role = 'admin';
          }
        }

        if (role !== 'admin') {
          alert('관리자 권한이 없습니다.');
          await supabase.auth.signOut();
          return;
        }

        setAuthUser({
          user_id: user.id,
          role: 'admin',
          name: (user.user_metadata?.name as string | undefined) ?? profile?.name ?? '',
          email: user.email ?? adminEmail,
          token,
        });
        closeModal();
        navigate('/admin/my');
      } catch (caught) {
        console.error('[LoginModal] admin login failed', caught);
        alert('관리자 권한이 없거나 로그인에 실패했습니다.');
      } finally {
        setAdminSubmitting(false);
      }
    },
    [adminEmail, adminPassword, adminSubmitting, closeModal, navigate],
  );

  const handleEmailSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;

      setError('');
      setIsSubmitting(true);

      try {
        const { user, profile, token } = await login(email.trim(), password.trim());
        const userRole = (profile?.role as UserRole | null) ?? null;

        if (userRole !== selectedRole) {
          await supabase.auth.signOut();
          throw new Error('ROLE_MISMATCH');
        }

        setAuthUser({
          user_id: user.id,
          role: selectedRole,
          name: profile?.name ?? (user.user_metadata?.name as string | undefined) ?? '',
          email: user.email ?? email,
          token,
        });

        closeModal();
        navigate(selectedRole === 'vod' ? '/vod' : '/my');
      } catch (caught) {
        console.error('[LoginModal] login failed', caught);
        setError('로그인에 실패했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeModal, email, isSubmitting, navigate, password, selectedRole],
  );

  const handleGoogleLogin = useCallback(async () => {
    localStorage.setItem('oauth_role', selectedRole);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/google/callback`,
      },
    });
  }, [selectedRole]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const renderBackButton = () => (
    <button
      type="button"
      className="absolute right-0 top-0 text-sm text-gray-500 hover:text-gray-700"
      onClick={() => setActiveForm('main')}
    >
      ← 뒤로가기
    </button>
  );

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

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
        >
          Google로 로그인/회원가입
        </button>

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

  const renderAdminForm = () => (
    <motion.div
      key="admin-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      {renderBackButton()}
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

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6 w-[400px]"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center justify-between">
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
