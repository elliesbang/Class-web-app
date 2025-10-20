import { type MouseEvent, useState } from 'react';

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
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
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/30 px-6 py-10 sm:py-0"
          onClick={closeLoginModal}
          role="presentation"
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl"
            onClick={stopPropagation}
          >
            <p className="mb-4 text-base font-semibold text-gray-800">로그인 유형을 선택하세요</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
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
            <button
              type="button"
              onClick={closeLoginModal}
              className="mt-5 text-xs font-semibold text-ellieGray underline"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
