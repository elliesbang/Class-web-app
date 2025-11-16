import React, { useMemo, useState } from 'react';
import Accordion from '../components/Accordion';
import { AccordionBody, AccordionHeader, AccordionItem } from '../components/Accordion';
import ClassroomItem from '../components/ClassroomItem';

const CLASSROOM_CATEGORIES = [
  {
    id: 'skill',
    title: '스킬',
    accent: 'bg-[#e4f1ff]',
    description: '핵심 디자인과 실무 스킬을 다집니다.',
    classrooms: [
      { id: 'candyma', name: '캔디마', description: '캔바 기초' },
      { id: 'earlchal', name: '이얼챌', description: '중국어 캘리 챌린지' },
      { id: 'candyup', name: '캔디업', description: '디자인 수익화 업그레이드' },
      { id: 'jungcalup', name: '중캘업', description: '중국어 캘리그라피 업' },
    ],
  },
  {
    id: 'profit',
    title: '수익화',
    accent: 'bg-[#e6f7f0]',
    description: '굿즈와 클래스 운영으로 수익을 만듭니다.',
    classrooms: [
      { id: 'cangoods', name: '캔굿즈', description: '캔바 굿즈 제작 노하우' },
      { id: 'calgoods', name: '캘굿즈', description: '캘리 굿즈 운영 전략' },
    ],
  },
  {
    id: 'ai',
    title: 'AI 창작',
    accent: 'bg-[#fff5d7]',
    description: 'AI 도구로 창작하는 모든 노하우',
    classrooms: [
      { id: 'eggjak', name: '에그작', description: 'AI 그림책 출판 수업' },
      { id: 'eggjakchal', name: '에그작챌', description: '에그작 수강생만 참여하는 챌린지' },
      { id: 'nacoljak', name: '나컬작', description: 'AI 컬러링북 출판 수업' },
      { id: 'nacoljakchal', name: '나컬작챌', description: '나컬작 수강생만 참여하는 챌린지' },
      { id: 'michina', name: '미치나', description: 'AI로 스톡사이트 요소 올리는 챌린지' },
    ],
  },
];

function Classroom() {
  const [openId, setOpenId] = useState(CLASSROOM_CATEGORIES[0]?.id ?? null);

  const categorized = useMemo(() => CLASSROOM_CATEGORIES, []);

  const handleToggle = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#fffdf6] py-6 text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4">
        <header className="rounded-3xl bg-[#fef568] px-6 py-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#bd8a00]">강의실</p>
          <h1 className="mt-2 text-2xl font-bold">나에게 맞는 강의실을 선택해보세요</h1>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            스킬 · 수익화 · AI 창작 카테고리로 정리된 강의실을 아코디언으로 펼치고 수강을 시작할 수 있습니다.
          </p>
        </header>

        <Accordion>
          {categorized.map((category) => {
            const isOpen = openId === category.id;
            return (
              <AccordionItem key={category.id}>
                <AccordionHeader
                  isOpen={isOpen}
                  onClick={() => handleToggle(category.id)}
                  accentColor={`${category.accent} border border-transparent`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ellieGray/70">{category.title}</p>
                    <p className="mt-1 text-lg font-semibold text-ellieGray">{category.description}</p>
                  </div>
                </AccordionHeader>
                <AccordionBody isOpen={isOpen}>
                  {category.classrooms.map((classroom) => (
                    <ClassroomItem key={classroom.id} classroom={classroom} />
                  ))}
                </AccordionBody>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

export default Classroom;
