import type {
  StudentAccountRow,
  VodAccountRow,
} from '../../../../functions/api/notion/getStudents';

type StudentTableProps = {
  type: 'student' | 'vod';
  records: StudentAccountRow[] | VodAccountRow[];
  isLoading?: boolean;
  emptyMessage?: string;
};

const statusBadgeClassNames: Record<string, string> = {
  '수강 중': 'bg-green-100 text-green-700 border border-green-200',
  완료: 'bg-blue-100 text-blue-700 border border-blue-200',
  중단: 'bg-red-100 text-red-700 border border-red-200',
};

const getStatusBadgeClassName = (status: string) =>
  statusBadgeClassNames[status] ?? 'bg-[#f5eee9] text-[#404040] border border-[#e9dccf]';

const StudentTable = ({ type, records, isLoading = false, emptyMessage }: StudentTableProps) => {
  const studentRows = type === 'student' ? (records as StudentAccountRow[]) : [];
  const vodRows = type === 'vod' ? (records as VodAccountRow[]) : [];

  const hasRows = (type === 'student' ? studentRows.length : vodRows.length) > 0;

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-md md:block">
        <table className="min-w-full table-auto">
          <thead className="bg-[#f5eee9] text-left text-sm text-[#5c5c5c]">
          <tr>
            <th className="px-6 py-4 font-semibold">이름</th>
            <th className="px-6 py-4 font-semibold">이메일</th>
            <th className="px-6 py-4 font-semibold">상태</th>
            {type === 'student' ? (
              <>
                <th className="px-6 py-4 font-semibold">수강중 강의</th>
                <th className="px-6 py-4 font-semibold">등록일</th>
              </>
            ) : (
              <>
                <th className="px-6 py-4 font-semibold">VOD 권한</th>
                <th className="px-6 py-4 font-semibold">구독 정보</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#5c5c5c]">
                데이터를 불러오는 중입니다...
              </td>
            </tr>
          ) : !hasRows ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#5c5c5c]">
                {emptyMessage ?? '표시할 데이터가 없습니다.'}
              </td>
            </tr>
          ) : type === 'student' ? (
            studentRows.map((student) => (
              <tr key={student.id} className="border-t border-[#f0e2d7] text-sm text-[#404040]">
                <td className="px-6 py-4 font-semibold">{student.name}</td>
                <td className="px-6 py-4">{student.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(student.status)}`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4">{student.courseName}</td>
                <td className="px-6 py-4 text-[#5c5c5c]">{student.registeredAt}</td>
              </tr>
            ))
          ) : (
            vodRows.map((student) => (
              <tr key={student.id} className="border-t border-[#f0e2d7] text-sm text-[#404040]">
                <td className="px-6 py-4 font-semibold">{student.name}</td>
                <td className="px-6 py-4">{student.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(student.status)}`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4">{student.vodAccess}</td>
                <td className="px-6 py-4 text-[#5c5c5c]">{student.subscriptionEndsAt}</td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {isLoading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#5c5c5c] shadow-md">
            데이터를 불러오는 중입니다...
          </div>
        ) : !hasRows ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#5c5c5c] shadow-md">
            {emptyMessage ?? '표시할 데이터가 없습니다.'}
          </div>
        ) : type === 'student' ? (
          studentRows.map((student) => (
            <article key={student.id} className="rounded-2xl bg-white p-5 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#404040]">{student.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(student.status)}`}
                >
                  {student.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5c5c5c]">{student.email}</p>
              <div className="mt-4 grid gap-2 text-sm text-[#404040]">
                <div className="rounded-full bg-[#f5eee9] px-3 py-1 font-semibold">
                  수강중 강의: {student.courseName}
                </div>
                <div className="rounded-full bg-[#f5eee9] px-3 py-1 text-xs text-[#5c5c5c]">
                  등록일 {student.registeredAt}
                </div>
              </div>
            </article>
          ))
        ) : (
          vodRows.map((student) => (
            <article key={student.id} className="rounded-2xl bg-white p-5 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#404040]">{student.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(student.status)}`}
                >
                  {student.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5c5c5c]">{student.email}</p>
              <div className="mt-4 grid gap-2 text-sm text-[#404040]">
                <div className="rounded-full bg-[#f5eee9] px-3 py-1 font-semibold">VOD 권한: {student.vodAccess}</div>
                <div className="rounded-full bg-[#f5eee9] px-3 py-1 text-xs text-[#5c5c5c]">
                  구독 정보 {student.subscriptionEndsAt}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
};

export default StudentTable;

