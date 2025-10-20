import AccordionCategory from '../components/AccordionCategory.jsx';

const categories = [
  {
    title: '캔바',
    accentColor: '#fde767',
    courses: ['캔디마', '나캔디', '캔디수'],
  },
  {
    title: '중국어 캘리그라피',
    accentColor: '#ffd57a',
    courses: ['이얼챌', '글씨체', '응용반'],
  },
  {
    title: '창작',
    accentColor: '#ffec8b',
    courses: ['나컬작', '나컬작챌', '에그작', '에그작챌'],
  },
  {
    title: 'AI·콘텐츠',
    accentColor: '#ffe26a',
    courses: ['미치나', '미템나'],
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
