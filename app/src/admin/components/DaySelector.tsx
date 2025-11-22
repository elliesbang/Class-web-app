interface DaySelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DaySelector = ({ selectedDays, onChange }: DaySelectorProps) => {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
      return;
    }
    onChange([...selectedDays, day]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          className={`rounded-full px-3 py-2 text-xs font-semibold shadow-inner transition ${
            selectedDays.includes(day)
              ? 'bg-[#ffd331] text-[#3f3a37] shadow-[#f3c623]'
              : 'bg-[#fff7d6] text-[#6a5c50] hover:bg-[#ffe8a3]'
          }`}
          onClick={() => toggleDay(day)}
        >
          {day}
        </button>
      ))}
    </div>
  );
};

export default DaySelector;
