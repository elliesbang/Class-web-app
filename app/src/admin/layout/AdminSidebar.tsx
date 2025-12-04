import { NavLink } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';

const MENU_ITEMS = [
  { label: '대시보드 홈', to: '/admin/dashboard' },
  { label: '수업 관리', to: '/admin/classes' },
  { label: '수강생 관리', to: '/admin/students' },
  { label: '과제·피드백 관리', to: '/admin/assignments' },
  { label: '강의실 관리 (Classrooms)', to: '/admin/classrooms', icon: FolderKanban },
  { label: '전체 공지 관리', to: '/admin/notices' },
  { label: 'VOD 관리', to: '/admin/vod' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-[#fffaf0] px-6 pb-8 pt-10 shadow-2xl transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">Ellie's Room</p>
          <p className="text-xl font-black text-[#3f3a37]">Admin Dashboard</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-md md:hidden"
          aria-label="사이드바 닫기"
        >
          ×
        </button>
      </div>

      <nav className="space-y-2">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all hover:bg-[#ffe8a3] ${
                isActive ? 'bg-[#ffd331] text-[#3f3a37] shadow-md' : 'text-[#5c5246]'
              }`
            }
            onClick={onClose}
          >
            <span className="flex items-center gap-2">
              {item.icon ? <item.icon className="h-4 w-4" /> : null}
              {item.label}
            </span>
            <span className="text-sm">›</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
