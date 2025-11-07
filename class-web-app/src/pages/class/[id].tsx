import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ClassDetail from '@/components/ClassDetail.jsx';
import classData from '../../../data/classData.json';

type ClassRecord = {
  category: string;
  classes?: Array<{
    title: string;
    desc?: string;
    videoUrl?: string;
    notice?: Array<{ title: string; content: string }>;
    resources?: Array<{ name: string; url: string; type: 'file' | 'link' }>;
    feedback?: Array<{ week?: number; content: string }>;
  }>;
  classSingle?: {
    title: string;
    desc?: string;
    videoUrl?: string;
    notice?: Array<{ title: string; content: string }>;
    resources?: Array<{ name: string; url: string; type: 'file' | 'link' }>;
    feedback?: Array<{ week?: number; content: string }>;
  };
};

type ClassItem = {
  title: string;
  desc?: string;
  videoUrl?: string;
  notice?: Array<{ title: string; content: string }>;
  resources?: Array<{ name: string; url: string; type: 'file' | 'link' }>;
  feedback?: Array<{ week?: number; content: string }>;
  category?: string;
};

const catalogue = classData as ClassRecord[];

function findClassByTitle(title: string | null): ClassItem | null {
  if (!title) {
    return null;
  }

  for (const entry of catalogue) {
    if (entry.classes) {
      const match = entry.classes.find((item) => item.title === title);
      if (match) {
        return { ...match, category: entry.category };
      }
    }

    if (entry.classSingle && entry.classSingle.title === title) {
      return { ...entry.classSingle, category: entry.category };
    }
  }

  return null;
}

function ClassDetailPage() {
  const { id } = useParams();
  const decodedTitle = useMemo(() => {
    if (!id) {
      return '';
    }

    try {
      return decodeURIComponent(id);
    } catch (error) {
      console.error('강의 타이틀 디코딩 실패', error);
      return id;
    }
  }, [id]);

  const classItem = useMemo(() => findClassByTitle(decodedTitle) ?? null, [decodedTitle]);

  if (!decodedTitle || !classItem) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12 text-ellieGray">
        <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          <h1 className="text-xl font-bold text-ellieGray">강의 정보를 찾을 수 없습니다.</h1>
          <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">올바른 강의실 주소를 확인해주세요.</p>
        </header>

        <section className="rounded-3xl bg-[#fffdf6] p-6 text-center shadow-soft">
          <p className="text-sm leading-relaxed text-ellieGray/70">
            강의 정보가 등록되지 않았습니다. 강의실 목록에서 다시 선택해 주세요.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12 text-ellieGray">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{classItem.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">
          영상, 공지, 과제, 자료, 피드백을 한 화면에서 확인해보세요.
        </p>
      </header>

      <ClassDetail classItem={classItem} />
    </div>
  );
}

export default ClassDetailPage;
