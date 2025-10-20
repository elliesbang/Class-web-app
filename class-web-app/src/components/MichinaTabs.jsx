function MichinaTabs({ activeTab, onTabChange, tabs }) {
  return (
    <nav className="sticky top-0 z-10 mt-1 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
      <ul className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                  isActive
                    ? 'bg-ellieYellow text-ellieGray'
                    : 'bg-transparent text-[#8e8e8e]'
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MichinaTabs;
