import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ClassroomTabs from '@/components/classroom/ClassroomTabs';

function ClassDetailPage() {
  const { id } = useParams();
  const courseId = id ?? '';
  const courseName = useMemo(() => {
    if (!courseId) {
      return '강의 정보를 찾을 수 없습니다.';
    }
    return `클래스 ${courseId}`;
  }, [courseId]);

  if (!courseId) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12">
        <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          <h1 className="text-xl font-bold text-ellieGray">{courseName}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">올바른 강의실 주소를 확인해주세요.</p>
        </header>

        <section className="rounded-3xl bg-ivory p-6 text-center shadow-soft">
          <p className="text-sm leading-relaxed text-ellieGray/70">
            강의 ID가 제공되지 않아 강의실을 표시할 수 없습니다. 링크를 다시 확인한 뒤 접속해 주세요.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{courseName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">
          수강 중인 클래스의 영상, 자료, 과제, 피드백, 공지를 한 곳에서 확인하세요.
        </p>
      </header>

      <ClassroomTabs courseId={courseId} courseName={courseName} />
    </div>
  );
}

export default ClassDetailPage;
