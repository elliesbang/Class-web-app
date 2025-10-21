import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const summaryData = {
  totalCourses: 4,
  totalStudents: 120,
  avgSubmitRate: 82,
  avgFeedbackRate: 75,
  weeklyChange: '+5%',
  weeklyChangeLabel: '+5% from last week',
};

const courseProgress = [
  { course: '미치나 8기', students: 32, submitRate: 92, feedbackRate: 80, status: '진행 중' },
  { course: '캔디마 3기', students: 28, submitRate: 85, feedbackRate: 72, status: '진행 중' },
  { course: '나캔디 2기', students: 40, submitRate: 60, feedbackRate: 55, status: '마감 임박' },
  { course: '도트 1기', students: 20, submitRate: 78, feedbackRate: 68, status: '완료' },
];

const weeklySubmissions = [
  { date: '10/16', submissions: 42 },
  { date: '10/17', submissions: 48 },
  { date: '10/18', submissions: 50 },
  { date: '10/19', submissions: 52 },
  { date: '10/20', submissions: 57 },
  { date: '10/21', submissions: 61 },
  { date: '10/22', submissions: 64 },
];

const recentStudents = [
  { name: '김하늘', course: '미치나 8기', date: '10/21' },
  { name: '이유리', course: '캔디마 3기', date: '10/20' },
  { name: '최민수', course: '나캔디 2기', date: '10/20' },
  { name: '박서연', course: '미치나 8기', date: '10/19' },
  { name: '정하늘', course: '도트 1기', date: '10/18' },
];

const recentAssignments = [
  { name: '3회차 디자인', course: '캔디마 3기', date: '10/22' },
  { name: 'UX 리서치 보고서', course: '캔디마 3기', date: '10/21' },
  { name: '톤앤매너 정리', course: '나캔디 2기', date: '10/21' },
  { name: '최종 포트폴리오', course: '미치나 8기', date: '10/20' },
  { name: '디지털 드래프트', course: '도트 1기', date: '10/19' },
];

const recentFeedbacks = [
  { name: '컬러 구성이 좋아요', course: '나캔디 2기', date: '10/22' },
  { name: '레이아웃 개선 제안', course: '미치나 8기', date: '10/21' },
  { name: '브랜딩 메시지가 명확합니다', course: '나캔디 2기', date: '10/21' },
  { name: '스토리텔링이 좋습니다', course: '미치나 8기', date: '10/20' },
  { name: '디테일이 살아있어요', course: '도트 1기', date: '10/19' },
];

const courseReports: Record<string, { assignments: string[]; feedbacks: string[] }> = {
  '미치나 8기': {
    assignments: ['브랜딩 키워드 탐색', '3회차 디자인', '최종 포트폴리오'],
    feedbacks: ['구성이 안정적이에요', '색감 대비가 좋아요', '스토리텔링이 명확합니다'],
  },
  '캔디마 3기': {
    assignments: ['와이어프레임', '3회차 디자인', 'UX 리서치 보고서'],
    feedbacks: ['시선 유도가 좋아요', '전달력이 높습니다', '수정 속도가 빠릅니다'],
  },
  '나캔디 2기': {
    assignments: ['톤앤매너 정리', '캠페인 포스터', '최종 리뷰'],
    feedbacks: ['컬러 구성이 좋아요', '레이아웃 정리가 필요해요', '브랜딩 메시지가 명확합니다'],
  },
  '도트 1기': {
    assignments: ['콘셉트 스케치', '디지털 드래프트', '최종 발표'],
    feedbacks: ['발상이 참신합니다', '디테일이 살아있어요', '마감 품질이 높습니다'],
  },
};

const statusColors: Record<string, string> = {
  '진행 중': 'bg-[#ffd331] text-[#404040]',
  '마감 임박': 'bg-[#ff8c42] text-white',
  완료: 'bg-[#76c893] text-white',
};

const downloadCourseCsv = (course: string) => {
  const report = courseReports[course];
  if (!report) {
    console.warn(`No report data found for ${course}`);
    return;
  }
  const rows = [
    ['과제', ...report.assignments],
    ['피드백', ...report.feedbacks],
  ];

  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${course.replaceAll(' ', '_')}_report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminStatistics = () => {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: '전체 수업 수', value: summaryData.totalCourses, change: summaryData.weeklyChangeLabel },
          { label: '전체 수강생 수', value: summaryData.totalStudents, change: '+12명 지난주 대비' },
          { label: '평균 과제 제출률', value: `${summaryData.avgSubmitRate}%`, change: '+3% 지난주 대비' },
          { label: '평균 피드백 완료율', value: `${summaryData.avgFeedbackRate}%`, change: '+2% 지난주 대비' },
          { label: '이번 주 제출 증가율', value: summaryData.weeklyChange, change: '+5% from last week' },
        ].map((card) => (
          <div
            key={card.label}
            className="flex flex-col justify-between rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
          >
            <div className="text-sm font-semibold text-[#5c5c5c]">{card.label}</div>
            <div className="mt-3 text-3xl font-bold text-[#ffd331]">{card.value}</div>
            <div className="mt-2 text-xs text-[#868686]">{card.change}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#404040]">수업별 진행 현황</h2>
          <span className="text-sm text-[#868686]">최근 업데이트: 2023.10.22</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-[#f5eee9] text-left">
                <th className="px-4 py-3 font-semibold text-[#404040]">수업명</th>
                <th className="px-4 py-3 font-semibold text-[#404040]">수강생 수</th>
                <th className="px-4 py-3 font-semibold text-[#404040]">과제 제출률</th>
                <th className="px-4 py-3 font-semibold text-[#404040]">피드백 완료율</th>
                <th className="px-4 py-3 font-semibold text-[#404040]">상태</th>
                <th className="px-4 py-3 font-semibold text-[#404040]">리포트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courseProgress.map((course) => (
                <tr key={course.course} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-[#404040]">{course.course}</td>
                  <td className="px-4 py-3 text-[#404040]">{course.students}명</td>
                  <td className="px-4 py-3 text-[#404040]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-yellow-300"
                          style={{ width: `${course.submitRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#5c5c5c]">{course.submitRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#404040]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-green-400"
                          style={{ width: `${course.feedbackRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#5c5c5c]">{course.feedbackRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColors[course.status] ?? 'bg-gray-200 text-[#404040]'
                      }`}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-[#404040] shadow-md transition-all hover:bg-[#e6bd2c] hover:shadow-lg"
                      onClick={() => downloadCourseCsv(course.course)}
                    >
                      CSV 다운로드
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h3 className="mb-4 text-lg font-bold text-[#404040]">과제 제출률 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dc" />
              <XAxis dataKey="course" stroke="#404040" />
              <YAxis stroke="#404040" />
              <Tooltip cursor={{ fill: 'rgba(255, 211, 49, 0.15)' }} />
              <Bar dataKey="submitRate" fill="#ffd331" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-md">
          <h3 className="mb-4 text-lg font-bold text-[#404040]">피드백 완료율 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dc" />
              <XAxis dataKey="course" stroke="#404040" />
              <YAxis stroke="#404040" />
              <Tooltip cursor={{ fill: 'rgba(146, 196, 124, 0.15)' }} />
              <Bar dataKey="feedbackRate" fill="#92C47C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-md lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-[#404040]">최근 7일간 과제 제출 추이</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={weeklySubmissions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dc" />
              <XAxis dataKey="date" stroke="#404040" />
              <YAxis stroke="#404040" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="submissions" stroke="#ffd331" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#404040]">최근 활동 요약</h3>
          <span className="text-xs text-[#868686]">실시간 업데이트 기준</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: '최근 등록된 수강생', items: recentStudents, link: '/admin/students' },
            { title: '최근 제출된 과제', items: recentAssignments, link: '/admin/assignments' },
            { title: '최근 피드백', items: recentFeedbacks, link: '/admin/feedback' },
          ].map((group) => (
            <div key={group.title} className="flex flex-col gap-3 rounded-2xl bg-[#f5eee9]/60 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-[#404040]">{group.title}</h4>
                <a
                  href={group.link}
                  className="text-xs font-semibold text-[#ffd331] transition-colors hover:text-[#e6bd2c]"
                >
                  전체보기 →
                </a>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {group.items.map((item) => (
                  <li
                    key={`${group.title}-${item.name}-${item.date}`}
                    className="rounded-xl bg-white px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <a href={group.link} className="flex flex-col gap-1 text-[#404040]">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-xs text-[#868686]">{item.course}</span>
                      <span className="text-xs text-[#b0b0b0]">{item.date}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminStatistics;
