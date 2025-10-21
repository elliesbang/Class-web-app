function CourseTabs({ activeTab, onTabChange, tabs }) {
  return (
    <nav className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-ellieYellow text-ellieGray shadow-soft focus-visible:ring-ellieYellow/80'
                : 'bg-white text-ellieGray/70 shadow-soft focus-visible:ring-ellieGray/40 hover:bg-ellieYellow/10'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default CourseTabs;
