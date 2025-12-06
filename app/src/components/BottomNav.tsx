import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Home, PlayCircle, UserSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

const BottomNav = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const myPagePath = useMemo(() => {
    if (role === 'admin') return '/admin/my';
    if (role === 'vod') return '/vod/my';
    return '/student/my';
  }, [role]);

  const navItems = useMemo(
    () => [
      { key: 'home', label: '홈', icon: Home, to: '/home' },
      { key: 'vod', label: 'VOD', icon: PlayCircle, to: '/vod/list' },
      { key: 'my', label: '마이', icon: UserSquare, to: myPagePath },
      { key: 'notifications', label: '알림', icon: Bell, to: '/notifications' },
    ],
    [myPagePath],
  );

  const isActive = (key: string) => {
    const pathname = location.pathname;

    if (key === 'home') {
      return pathname === '/' || pathname === '/home';
    }

    if (key === 'vod') {
      return pathname === '/vod' || pathname.startsWith('/vod/');
    }

    if (key === 'my') {
      return ['/student/my', '/admin/my', '/vod/my'].some((target) => pathname.startsWith(target));
    }

    if (key === 'notifications') {
      return pathname === '/notifications';
    }

    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-[#e5e5e5] bg-white/90 backdrop-blur-md h-[70px]">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4">
        {navItems.map(({ key, label, icon: Icon, to }) => {
          const active = isActive(key);
          const baseClasses =
            'flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all duration-200';
          const activeClasses = 'bg-[#FFD331] text-[#404040] shadow-[0_10px_30px_rgba(0,0,0,0.12)]';
          const inactiveClasses = 'text-gray-500 hover:scale-105 hover:text-[#404040]';
          const iconColor = active ? '#404040' : '#6b7280';

          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => navigate(to)}
              className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
              initial={active ? { scale: 0.9 } : undefined}
              animate={active ? { scale: 1.1 } : { scale: 1 }}
              whileTap={{ scale: 0.95 }}
              transition={active ? { type: 'spring', stiffness: 260, damping: 18 } : { duration: 0.2 }}
            >
              <Icon size={22} color={iconColor} strokeWidth={1.8} />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
