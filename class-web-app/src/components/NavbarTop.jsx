import { NavLink } from 'react-router-dom';

const menuItems = [
  { path: '/', label: '홈' },
  { path: '/internal', label: '내부 강의실' },
  { path: '/vod', label: 'VOD' },
  { path: '/notices', label: '공지' },
  { path: '/mypage', label: '마이페이지' },
];

function NavbarTop() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ivory/90 backdrop-blur shadow-md">
      <nav className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold text-ellieGray">엘리의방 클래스</span>
        <div className="flex items-center gap-3 text-sm">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-full px-3 py-1 transition-colors duration-200 ${
                  isActive
                    ? 'bg-ellieYellow text-ellieGray font-semibold shadow-soft'
                    : 'text-ellieGray/80 hover:text-ellieGray hover:bg-ellieYellow/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default NavbarTop;
