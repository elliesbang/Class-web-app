function FeedbackTab({ courseId, feedbacks }) {
  if (feedbacks?.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ellieGray">제출한 과제 피드백</h2>
        <ul className="space-y-3">
          {feedbacks.map((feedback) => (
            <li key={feedback.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-base font-semibold text-ellieGray">{feedback.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{feedback.content}</p>
              <p className="mt-3 text-xs text-ellieGray/60">{feedback.date}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-ellieGray">제출한 과제 피드백</h2>
      <p className="text-sm leading-relaxed text-ellieGray/70">
        아직 {courseId} 강의에 대한 피드백이 없습니다. 과제를 제출하면 담당 강사가 피드백을 남겨드려요.
      </p>
    </div>
  );
}

export default FeedbackTab;
