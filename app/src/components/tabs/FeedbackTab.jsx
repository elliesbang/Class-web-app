import React from 'react';

const FeedbackTab = ({ feedback = [] }) => {
  if (!feedback.length) {
    return <p className="text-sm text-ellieGray/70">아직 관리자의 코멘트가 없습니다.</p>;
  }

  return (
    <ul className="space-y-4">
      {feedback.map((item) => (
        <li key={item.id} className="rounded-2xl bg-white/90 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff9900]">관리자의 코멘트</p>
          <p className="mt-2 text-sm leading-relaxed text-ellieGray">{item.feedback}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ellieGray/60">
            <span>과제 ID: {item.assignment_id}</span>
            <span>{new Date(item.created_at).toLocaleString('ko-KR')}</span>
            {item.link_url ? (
              <a href={item.link_url} className="font-semibold text-[#ff9900]" target="_blank" rel="noreferrer">
                과제 링크 →
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default FeedbackTab;
