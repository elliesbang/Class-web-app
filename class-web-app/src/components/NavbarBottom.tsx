import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, GraduationCap, PlayCircle, User } from 'lucide-react';

const navItems = [
  { label: '강의실', to: '/internal', Icon: GraduationCap },
  { label: 'VOD', to: '/vod', Icon: PlayCircle },
  { label: '공지', to: '/notices', Icon: Bell },
  { label: 'My', to: '/mypage', Icon: User },
];

const baseButtonClasses =
  'flex flex-col items-center justify-center gap-1 rounded-2xl bg-white py-3 text-xs font-medium shadow-md transition-colors duration-200 focus:outline-none';

const NavbarBottom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-[#fefaf4] px-5 pb-6 pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 gap-3">
        {navItems.map(({ label, to, Icon }) => {
          const isActive = location.pathname.startsWith(to);
          const iconColor = isActive ? '#404040' : '#8e8e8e';
          const textColor = isActive ? 'text-[#404040]' : 'text-[#8e8e8e]';

          return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className={`${baseButtonClasses} ${textColor} ${isActive ? 'bg-[#fef568]/70' : 'hover:bg-[#fef568]/40'}`}
            >
              <Icon size={22} strokeWidth={1.75} color={iconColor} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavbarBottom;
