import { type MouseEvent, useState } from 'react';
import { createPortal } from 'react-dom';

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginView, setLoginView] = useState<'selection' | 'student'>('selection');

  const openLoginModal = () => {
    setLoginView('selection');
    setIsLoginModalOpen(true);
  };
  const closeLoginModal = () => {
    setLoginView('selection');
    setIsLoginModalOpen(false);
  };
  const openStudentLogin = () => {
    setLoginView('student');
  };
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const modal =
    isLoginModalOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/30 px-6 py-10 sm:py-0"
        onClick={closeLoginModal}
        role="presentation"
      >
        <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl" onClick={stopPropagation}>
          {loginView === 'selection' ? (
            <>
              <p className="mb-4 text-base font-semibold text-gray-800">로그인 유형을 선택하세요</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openStudentLogin}
                  className="rounded-full bg-[#fef568] px-4 py-2 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f]"
                >
                  수강생
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#f0e7c6] px-4 py-2 text-sm font-semibold text-[#404040] transition-colors hover:border-[#e3d89f] hover:bg-[#fef568]/40"
                >
                  관리자
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-base font-semibold text-gray-800">수강생 정보를 입력하세요</p>
              <form className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600" htmlFor="student-name">
                    이름
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    className="w-full rounded-full border border-[#f0e7c6] px-4 py-2 text-sm text-[#404040] focus:border-[#f6e94f] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600" htmlFor="student-email">
                    이메일
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="w-full rounded-full border border-[#f0e7c6] px-4 py-2 text-sm text-[#404040] focus:border-[#f6e94f] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#fef568] px-4 py-2 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f]"
                >
                  로그인
                </button>
              </form>
              <button
                type="button"
                onClick={() => setLoginView('selection')}
                className="mt-3 text-xs font-semibold text-ellieGray underline"
              >
                이전으로
              </button>
            </>
          )}
          <button type="button" onClick={closeLoginModal} className="mt-5 text-xs font-semibold text-ellieGray underline">
            닫기
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <header className="fixed top-0 z-30 w-full bg-white/90 shadow-md backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5">
          <a href="/" className="text-lg font-semibold text-gray-800">
            엘리의방 클래스
          </a>
          <button
            type="button"
            onClick={openLoginModal}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
          >
            로그인
          </button>
        </div>
      </header>
      {modal}
    </>
  );
};

export default Header;
