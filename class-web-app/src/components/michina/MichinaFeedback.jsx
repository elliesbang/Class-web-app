const feedbackList = [
  {
    id: 1,
    title: 'AI 스토리보드 1차 제출',
    comment: '스토리의 흐름이 자연스럽고 색감이 좋아요. 2컷에서 캐릭터 표정을 조금 더 강조해보면 좋겠습니다.',
  },
  {
    id: 2,
    title: '콘셉트 아트 리터칭',
    comment: '레이어 정리가 잘 되어 있어요! 배경에 소품을 추가하면 분위기가 더 풍성해질 것 같아요.',
  },
];

function MichinaFeedback() {
  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">피드백 보기</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">
          제출한 과제에 대한 강사 피드백을 확인해보세요.
        </p>
      </header>
      <div className="space-y-3">
        {feedbackList.map((item) => (
          <article key={item.id} className="flex gap-4 rounded-2xl bg-ivory px-5 py-4 shadow-soft">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-[#e4d6cc] text-xs font-semibold text-ellieGray">
              썸네일
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold leading-tight">{item.title}</h3>
              <p className="text-sm leading-relaxed text-ellieGray/80">{item.comment}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default MichinaFeedback;
