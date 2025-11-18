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

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentSubmitting, setStudentSubmitting] = useState(false);

  const [vodName, setVodName] = useState('');
  const [vodPassword, setVodPassword] = useState('');
  const [vodEmail, setVodEmail] = useState('');
  const [vodError, setVodError] = useState('');
  const [vodSubmitting, setVodSubmitting] = useState(false);

  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const navigate = useNavigate();

  /** ------------------------
   * 공통 닫기
   * ------------------------ */
  const closeModal = useCallback(() => {
    onClose();
    setActiveForm('buttons');
    setAdminEmail('');
    setAdminPassword('');
    setStudentName('');
    setStudentEmail('');
    setStudentPassword('');
    setVodName('');
    setVodEmail('');
    setVodPassword('');
    setStudentError('');
    setVodError('');
    setStudentSubmitting(false);
    setVodSubmitting(false);
    setAdminSubmitting(false);
  }, [onClose]);


  /** ------------------------
   * 관리자 로그인
   * ------------------------ */
  const handleAdminSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (adminSubmitting) return;

      try {
        setAdminSubmitting(true);

         const response = await fetch('/.netlify/functions/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail.trim(),
            password: adminPassword
          }),
        });

        if (!response.ok) throw new Error('LOGIN_FAILED');

        const data = await response.json();
        if (!data?.token) throw new Error('INVALID_RESPONSE');

        setStoredAuthUser(data);
        closeModal();
        navigate('/admin/my');
      } catch (error) {
        console.error('[LoginModal] admin login failed', error);
        alert('관리자 로그인에 실패했습니다.');
      } finally {
        setAdminSubmitting(false);
      }
    },
    [adminEmail, adminPassword, adminSubmitting, closeModal, navigate]
  );


  /** ------------------------
   * 공통 로그인 처리(student / vod)
   * ------------------------ */
  const handleRoleLogin = useCallback(
    async (endpoint: string, payload: Record<string, string>, role: 'student' | 'vod') => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('LOGIN_FAILED');

      const data = await response.json();
      if (!data?.token) throw new Error('INVALID_RESPONSE');

      setStoredAuthUser(data);
      closeModal();
      navigate(role === 'vod' ? '/vod' : '/my');
    },
    [closeModal, navigate]
  );


  /** ------------------------
   * 수강생 로그인
   * ------------------------ */
  const handleStudentSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (studentSubmitting) return;

      setStudentError('');

      const trimmedName = studentName.trim();
      const trimmedEmail = studentEmail.trim();
      const trimmedPassword = studentPassword.trim();

      if (!trimmedName) return setStudentError('이름을 입력하세요.');
      if (!trimmedPassword) return setStudentError('비밀번호를 입력하세요.');

      setStudentSubmitting(true);
      try {
        await handleRoleLogin(
          '/.netlify/functions/student/login',
          { name: trimmedName, email: trimmedEmail, password: trimmedPassword },
          'student'
        );
      } catch (e) {
        console.error(e);
        setStudentError('로그인에 실패했습니다.');
      } finally {
        setStudentSubmitting(false);
      }
    },
    [handleRoleLogin, studentEmail, studentName, studentPassword, studentSubmitting]
  );


  /** ------------------------
   * VOD 로그인
   * ------------------------ */
  const handleVodSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (vodSubmitting) return;

      setVodError('');

      const trimmedName = vodName.trim();
      const trimmedEmail = vodEmail.trim();
      const trimmedPassword = vodPassword.trim();

      if (!trimmedName) return setVodError('이름을 입력하세요.');
      if (!trimmedPassword) return setVodError('비밀번호를 입력하세요.');

      setVodSubmitting(true);
      try {
        await handleRoleLogin(
          '/.netlify/functions/vod/login',
          { name: trimmedName, email: trimmedEmail, password: trimmedPassword },
          'vod'
        );
      } catch (e) {
        console.error(e);
        setVodError('로그인에 실패했습니다.');
      } finally {
        setVodSubmitting(false);
      }
    },
    [handleRoleLogin, vodEmail, vodName, vodPassword, vodSubmitting]
  );   // ★★★ 오류 원인이었던 괄호 완전 수정됨


  /** ESC 닫기 */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);


  /** ------------------------
   * UI 블록 렌더링
   * ------------------------ */
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
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 mt-4 w-full"
        onClick={() => setActiveForm('student')}
      >
        수강생
      </button>

      <button
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        onClick={() => setActiveForm('vod')}
      >
        VOD
      </button>

      <button
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        onClick={() => {
          setAdminEmail('');
          setAdminPassword('');
          setAdminSubmitting(false);
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
        setAdminEmail('');
        setAdminPassword('');
        setStudentName('');
        setStudentEmail('');
        setStudentPassword('');
        setVodName('');
        setVodEmail('');
        setVodPassword('');
        setStudentError('');
        setVodError('');
        setAdminSubmitting(false);
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
          onChange={(e) => setStudentName(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">이메일</label>
        <input
          type="email"
          className="border rounded-md w-full p-2 mb-3"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <input
          type="password"
          className="border rounded-md w-full p-2 mb-3"
          value={studentPassword}
          onChange={(e) => setStudentPassword(e.target.value)}
          required
        />

        {studentError && <p className="text-sm text-red-500 mb-3">{studentError}</p>}

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
          onChange={(e) => setVodName(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">이이메일</label>
        <input
          type="email"
          className="border rounded-md w-full p-2 mb-3"
          value={vodEmail}
          onChange={(e) => setVodEmail(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <input
          type="password"
          className="border rounded-md w-full p-2 mb-3"
          value={vodPassword}
          onChange={(e) => setVodPassword(e.target.value)}
          required
        />

        {vodError && <p className="text-sm text-red-500 mb-3">{vodError}</p>}

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


  /** ------------------------
   * 전체 렌더
   * ------------------------ */
  return (
    <motion.div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeModal}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6 w-[400px]"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">로그인</h2>

        <div className="mt-4 min-h-[220px]">
          <AnimatePresence mode="wait">
            {activeForm === 'buttons' && renderButtons()}
            {activeForm === 'student' && renderStudentForm()}
            {activeForm === 'vod' && renderVodForm()}
            {activeForm === 'admin' && renderAdminForm()}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginModal;
