import AccordionCategory from '../components/AccordionCategory.jsx';

const categories = [
  {
    title: '캔바',
    accentColor: '#fde767',
    courses: [
      { name: '캔디마', link: '/courses/candyma' },
      { name: '나캔디' },
      { name: '캔디수' },
    ],
  },
  {
    title: '중국어 캘리그라피',
    accentColor: '#ffd57a',
    courses: [
      { name: '이얼챌', link: '/courses/earlchal' },
      { name: '글씨체' },
      { name: '응용반' },
    ],
  },
  {
    title: 'ai창작',
    accentColor: '#ffec8b',
    courses: [
      { name: '나컬작', link: '/courses/nacoljak' },
      { name: '나컬작챌', link: '/courses/nacoljakchal' },
      { name: '에그작', link: '/courses/eggjak' },
      { name: '에그작챌', link: '/courses/eggjakchal' },
    ],
  },
  {
    title: '콘텐츠',
    accentColor: '#ffe26a',
    courses: [
      { name: '미치나', link: '/internal/michina', linkState: { autoOpen: true } },
      { name: '미템나', link: '/courses/mitemna' },
    ],
  },
];

function InternalCourses() {
  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">내부 강의실</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          카테고리별 강의를 접고 펼치며 원하는 수업을 빠르게 찾아보세요.
        </p>
      </header>
      <div>
        {categories.map((category) => (
          <AccordionCategory key={category.title} {...category} />
        ))}
      </div>
    </div>
  );
}

export default InternalCourses;
