function CourseCard({ name, accentColor }) {
  return (
    <article className="rounded-3xl bg-white px-5 py-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ellieGray">{name}</h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-ellieGray"
          style={{ backgroundColor: accentColor }}
        >
          수강하기
        </span>
      </div>
      <p className="mt-2 text-sm text-ellieGray/70">
        엘리의방 전용 강의실에서 {name} 강의를 만나보세요.
      </p>
    </article>
  );
}

export default CourseCard;
