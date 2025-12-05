import React from 'react';

type AssignmentProgressBarProps = {
  totalSessions: number;
  completedSessions: number;
};

const AssignmentProgressBar = ({ totalSessions, completedSessions }: AssignmentProgressBarProps) => {
  const safeTotal = Math.max(totalSessions, 1);
  const ratio = Math.min(Math.max(completedSessions, 0), safeTotal);
  const percent = Math.round((ratio / safeTotal) * 100);

  return (
    <div className="rounded-2xl bg-white/70 px-5 py-4 shadow-soft">
      <div className="flex justify-between items-center mb-2 text-sm font-semibold text-ellieGray">
        <span>완주 현황</span>
        <span>
          {ratio} / {safeTotal} ({percent}%)
        </span>
      </div>
      <div className="w-full h-3 bg-ivory rounded-full overflow-hidden">
        <div className="h-full bg-[#ffd331]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default AssignmentProgressBar;
