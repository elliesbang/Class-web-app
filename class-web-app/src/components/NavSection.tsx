import { Bell, BookOpen, Play, User } from "lucide-react";

const navItems = [
  { label: "강의실", Icon: BookOpen },
  { label: "VOD", Icon: Play },
  { label: "공지", Icon: Bell },
  { label: "My", Icon: User },
];

const NavSection = () => {
  return (
    <section className="mt-16 bg-[#fdfcf7] p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {navItems.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-[#fef568] hover:text-gray-800"
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default NavSection;
