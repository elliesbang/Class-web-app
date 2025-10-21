function NoticeTab({ courseId, notices }) {
  if (notices?.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ellieGray">강의 공지</h2>
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li key={notice.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-base font-semibold text-ellieGray">{notice.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{notice.content}</p>
              <p className="mt-3 text-xs text-ellieGray/60">{notice.date}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-ellieGray">강의 공지</h2>
      <p className="text-sm leading-relaxed text-ellieGray/70">
        아직 등록된 공지가 없습니다. 새로운 소식이 생기면 {courseId} 강의실에서 안내드릴게요.
      </p>
    </div>
  );
}

export default NoticeTab;
