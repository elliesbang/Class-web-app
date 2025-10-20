import { Link } from "react-router-dom";

const navItems = [
  { label: "강의실", emoji: "🏫", to: "/class/michina" },
  { label: "VOD", emoji: "▶️" },
  { label: "공지", emoji: "🔔" },
  { label: "My", emoji: "👤" },
];

const baseButtonClasses =
  "bg-white rounded-xl shadow-sm py-3 flex flex-col items-center justify-center gap-1 hover:bg-[#fef568] hover:text-gray-800 transition-all";

const NavSection = () => {
  return (
    <section className="fixed bottom-0 left-0 right-0 bg-[#fdfcf7] p-4">
      <div className="grid grid-cols-4 gap-3">
        {navItems.map(({ label, emoji, to }) => {
          const content = (
            <>
              <span aria-hidden="true" className="text-lg">
                {emoji}
              </span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </>
          );

          if (to) {
            return (
              <Link key={label} to={to} className={baseButtonClasses}>
                {content}
              </Link>
            );
          }

          return (
            <button key={label} type="button" className={baseButtonClasses}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default NavSection;
