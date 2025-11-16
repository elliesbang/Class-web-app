import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { setStoredAuthUser } from '../lib/authUser';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const panelVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" }
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2, ease: "easeIn" } }
};

type ActiveForm = 'buttons' | 'student' | 'admin' | 'vod';

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [activeForm, setActiveForm] = useState<ActiveForm>('buttons');
  const [adminPassword, setAdminPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [vodName, setVodName] = useState('');
  const [vodEmail, setVodEmail] = useState('');
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [vodSubmitting, setVodSubmitting] = useState(false);
  const navigate = useNavigate();

  const closeModal = useCallback(() => {
    onClose();
    setActiveForm('buttons');
    setAdminPassword('');
    setStudentName('');
    setStudentEmail('');
    setVodName('');
    setVodEmail('');
    setStudentSubmitting(false);
    setVodSubmitting(false);
  }, [onClose]);

  const handleAdminSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      navigate('/admin-login');
      closeModal();
    },
    [closeModal, navigate],
  );

  const handleRoleLogin = useCallback(
    async (endpoint: string, payload: Record<string, string>, role: 'student' | 'vod') => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('LOGIN_FAILED');
        }

        const data = await response.json();
        if (!data?.token) {
          throw new Error('INVALID_RESPONSE');
        }

        setStoredAuthUser(data);
        closeModal();
        navigate(role === 'vod' ? '/vod' : '/my');
      } catch (error) {
        console.error('[LoginModal] login failed', error);
        alert('로그인에 실패했습니다. 정보를 다시 확인해주세요.');
      }
    },
    [closeModal, navigate],
  );

  const handleStudentSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (studentSubmitting) {
        return;
      }
      setStudentSubmitting(true);
      await handleRoleLogin(
        '/api/student/login',
        { name: studentName.trim(), email: studentEmail.trim() },
        'student',
      );
      setStudentSubmitting(false);
    },
    [handleRoleLogin, studentEmail, studentName, studentSubmitting],
  );

  const handleVodSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (vodSubmitting) {
        return;
      }
      setVodSubmitting(true);
      await handleRoleLogin('/api/vod/login', { name: vodName.trim(), email: vodEmail.trim() }, 'vod');
      setVodSubmitting(false);
    },
    [handleRoleLogin, vodEmail, vodName, vodSubmitting],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const renderButtons = () => (
    <motion.div
      key="login-options"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-3"
    >
      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 mt-4 w-full"
        onClick={() => setActiveForm('student')}
      >
        수강생
      </button>

      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        onClick={() => setActiveForm('vod')}
      >
        VOD
      </button>

      <button
        type="button"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        onClick={() => {
          setAdminPassword('');
          setActiveForm('admin');
        }}
      >
        관리자
      </button>
    </motion.div>
  );

  const renderBackButton = () => (
    <button
      type="button"
      className="absolute right-0 top-0 text-sm text-gray-500 hover:text-gray-700"
      onClick={() => {
        setActiveForm('buttons');
        setAdminPassword('');
      }}
    >
      ← 뒤로가기
    </button>
  );

  const renderStudentForm = () => (
    <motion.div
      key="student-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      {renderBackButton()}
      <form className="mt-6" onSubmit={handleStudentSubmit}>
        <label className="block text-sm font-medium mb-1">이름</label>
        <input
          className="border rounded-md w-full p-2 mb-3"
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">이메일</label>
        <input
          type="email"
          className="border rounded-md w-full p-2 mb-3"
          value={studentEmail}
          onChange={(event) => setStudentEmail(event.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
          disabled={studentSubmitting}
        >
          {studentSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </motion.div>
  );

  const renderVodForm = () => (
    <motion.div
      key="vod-form"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      {renderBackButton()}
      <form className="mt-6" onSubmit={handleVodSubmit}>
        <label className="block text-sm font-medium mb-1">이름</label>
        <input
          className="border rounded-md w-full p-2 mb-3"
          value={vodName}
          onChange={(event) => setVodName(event.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">이메일</label>
        <input
          type="email"
          className="border rounded-md w-full p-2 mb-3"
          value={vodEmail}
          onChange={(event) => setVodEmail(event.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
          disabled={vodSubmitting}
        >
          {vodSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </motion.div>
  );

  const renderAdminForm = () => (
    <motion.div key="admin-form"
      variants={panelVariants} initial="hidden" animate="visible" exit="exit"
      className="relative"
    >
      {renderBackButton()}
      <form className="mt-6" onSubmit={handleAdminSubmit}>
        <label className="block font-medium mb-1">관리자 비밀번호</label>
        <input
          type="password"
          className="border rounded-md w-full p-2 mb-3"
          value={adminPassword}
          onChange={(event) => setAdminPassword(event.target.value)}
        />

        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full">
          로그인
        </button>
      </form>
    </motion.div>
  );

  return (
    <motion.div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={closeModal}
    >
      <motion.div className="bg-white rounded-2xl shadow-xl p-6 w-[400px]"
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">로그인</h2>

        <div className="mt-4 min-h-[220px]">
          <AnimatePresence mode="wait">
            {activeForm === "buttons" && renderButtons()}
            {activeForm === "student" && renderStudentForm()}
            {activeForm === "vod" && renderVodForm()}
            {activeForm === "admin" && renderAdminForm()}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginModal;