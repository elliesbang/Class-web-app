import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitAdminAuthChange } from '../../lib/auth';

type LoginMode = 'student' | 'admin';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim();
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD ?? '').trim();

const AdminLogin = () => {
  const [mode, setMode] = useState<LoginMode>('student');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminPasswordVisible, setIsAdminPasswordVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleStudentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Placeholder for future student login integration
    alert('수강생 로그인 기능은 준비 중입니다.');
  };

  const handleAdminSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    setIsLoading(true);

    const trimmedEmail = adminEmail.trim();
    const trimmedPassword = adminPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('이메일과 비밀번호를 모두 입력하세요.');
      setIsLoading(false);
      return;
    }

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('[admin-auth] 환경변수가 설정되지 않았습니다.');
      setError('관리자 인증에 실패했습니다. 잠시 후 다시 시도해주세요.');
      alert('관리자 인증에 실패했습니다.');
      setIsLoading(false);
      return;
    }

    const isEmailMatch = trimmedEmail === ADMIN_EMAIL;
    const isPasswordMatch = trimmedPassword === ADMIN_PASSWORD;

    if (!isEmailMatch || !isPasswordMatch) {
      setError('관리자 인증에 실패했습니다.');
      alert('관리자 인증에 실패했습니다.');
      setIsLoading(false);
      return;
    }

    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem(
      'adminInfo',
      JSON.stringify({
        email: ADMIN_EMAIL,
      })
    );

    emitAdminAuthChange();

    setIsLoading(false);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-3xl bg-white/80 p-6 shadow-soft">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold text-ellieGray">로그인</h1>
          <p className="text-sm text-ellieGray/70">로그인 유형을 선택한 뒤 정보를 입력해주세요.</p>
        </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('student')}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'student'
              ? 'border-[#f6c244] bg-[#fef568] text-[#404040]'
              : 'border-[#f0e7c6] bg-white text-[#404040] hover:border-[#f6c244]'
          }`}
        >
          수강생
        </button>
        <button
          type="button"
          onClick={() => setMode('admin')}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'admin'
              ? 'border-[#f6c244] bg-[#fef568] text-[#404040]'
              : 'border-[#f0e7c6] bg-white text-[#404040] hover:border-[#f6c244]'
          }`}
        >
          관리자
        </button>
      </div>

      {mode === 'student' ? (
        <form onSubmit={handleStudentSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5c5c5c]" htmlFor="student-name">
              이름
            </label>
            <input
              id="student-name"
              name="student-name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full rounded-2xl border border-[#f0e7c6] px-4 py-3 text-sm text-[#404040] focus:border-[#f6c244] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5c5c5c]" htmlFor="student-email">
              이메일
            </label>
            <input
              id="student-email"
              name="student-email"
              type="email"
              value={studentEmail}
              onChange={(event) => setStudentEmail(event.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full rounded-2xl border border-[#f0e7c6] px-4 py-3 text-sm text-[#404040] focus:border-[#f6c244] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#fef568] px-4 py-3 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f]"
          >
            로그인
          </button>
        </form>
      ) : (
        <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5c5c5c]" htmlFor="admin-email">
              이메일
            </label>
            <input
              id="admin-email"
              name="admin-email"
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="관리자 이메일을 입력하세요"
              className="w-full rounded-2xl border border-[#f0e7c6] px-4 py-3 text-sm text-[#404040] focus:border-[#f6c244] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5c5c5c]" htmlFor="admin-password">
              비밀번호
            </label>
            <div className="relative">
              <input
                id="admin-password"
                name="admin-password"
                type={isAdminPasswordVisible ? 'text' : 'password'}
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-2xl border border-[#f0e7c6] px-4 py-3 pr-12 text-sm text-[#404040] focus:border-[#f6c244] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsAdminPasswordVisible((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-[#9a9a9a] transition-colors hover:text-[#404040]"
                aria-label={isAdminPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {isAdminPasswordVisible ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M9.88 9.88a3 3 0 004.24 4.24" />
                    <path d="M10.73 5.08A10.4 10.4 0 0112 5c5.52 0 9.57 4.33 10.89 6.09a1 1 0 010 1.18 18.62 18.62 0 01-2.1 2.41" />
                    <path d="M6.61 6.61A18.31 18.31 0 001.11 12a1 1 0 000 1.18c.48.63 1.35 1.68 2.51 2.74" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1.23 12.32a1 1 0 010-.63C2.13 9.36 6.18 5 12 5s9.87 4.36 10.77 6.69a1 1 0 010 .63C21.87 14.64 17.82 19 12 19S2.13 14.64 1.23 12.32z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-[#fef568] px-4 py-3 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('student');
              setError('');
            }}
            className="text-xs font-semibold text-ellieGray underline"
          >
            수강생 로그인 돌아가기
          </button>
        </form>
      )}
      </div>
    </div>
  );
};

export default AdminLogin;
