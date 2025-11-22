interface TimeRangeSelectorProps {
  startTime?: string | null;
  endTime?: string | null;
  onChange: (payload: { start: string; end: string }) => void;
}

const TimeRangeSelector = ({ startTime = '', endTime = '', onChange }: TimeRangeSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-semibold text-[#3f3a37]">
        시작
        <input
          type="time"
          value={startTime}
          onChange={(e) => onChange({ start: e.target.value, end: endTime || '' })}
          className="ml-2 rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
        />
      </label>
      <label className="text-sm font-semibold text-[#3f3a37]">
        종료
        <input
          type="time"
          value={endTime}
          onChange={(e) => onChange({ start: startTime || '', end: e.target.value })}
          className="ml-2 rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
        />
      </label>
    </div>
  );
};

export default TimeRangeSelector;
