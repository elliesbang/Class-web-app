const Header = () => {
  return (
    <header className="fixed top-0 z-30 w-full bg-white/90 shadow-md backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="/" className="text-lg font-semibold text-gray-800">
          엘리의방 클래스
        </a>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-ellieGray">로그인</span>
          <button
            type="button"
            className="rounded-full bg-[#fef568] px-3 py-1 text-xs font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f]"
          >
            수강생
          </button>
          <button
            type="button"
            className="rounded-full border border-[#f0e7c6] px-3 py-1 text-xs font-semibold text-[#404040] transition-colors hover:border-[#e3d89f] hover:bg-[#fef568]/40"
          >
            관리자
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
