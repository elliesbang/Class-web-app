import type { Student } from './StudentProgressTable';

type StudentProgressRowProps = {
  student: Student;
  completedCount: number;
  missingSessions: number[];
  totalSessions: number;
  onOpen: () => void;
};

const StudentProgressRow = ({
  student,
  completedCount,
  missingSessions,
  totalSessions,
  onOpen,
}: StudentProgressRowProps) => {
  const isCompleted = completedCount === totalSessions && totalSessions > 0;

  return (
    <tr className="hover:bg-[#fdf8f2]">
      <td className="px-6 py-4 font-semibold">{student.name}</td>
      <td className="px-6 py-4 text-[#7a6f68]">{student.email}</td>
      <td className="px-6 py-4 text-center">
        {completedCount} / {totalSessions}
      </td>
      <td className="px-6 py-4">
        {missingSessions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {missingSessions.map((sessionNo) => (
              <span
                key={sessionNo}
                className="rounded-full bg-[#f5eee9] px-3 py-1 text-xs font-semibold text-[#7a6f68]"
              >
                세션 {sessionNo}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[#46a758]">없음</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-bold ${
            isCompleted ? 'bg-[#46a758]/10 text-[#2f7a40]' : 'bg-[#ffd331]/30 text-[#8a6c00]'
          }`}
        >
          {isCompleted ? '완료' : '진행 중'}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full border border-[#e4d7c6] px-4 py-1 text-xs font-semibold text-[#404040] transition hover:border-[#d6c7b3] hover:bg-[#fdf8f2]"
        >
          보기
        </button>
      </td>
    </tr>
  );
};

export default StudentProgressRow;
