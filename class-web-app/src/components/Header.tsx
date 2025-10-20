const Header = () => {
  return (
    <header className="fixed top-0 w-full h-12 bg-white shadow-md">
      <div className="flex h-full items-center justify-between px-4">
        <a href="/" className="font-semibold text-base text-gray-800">
          엘리의방 클래스
        </a>
        <button
          type="button"
          className="rounded-full bg-gray-900 px-4 py-1 text-sm font-medium text-white"
        >
          로그인
        </button>
      </div>
    </header>
  );
};

export default Header;
