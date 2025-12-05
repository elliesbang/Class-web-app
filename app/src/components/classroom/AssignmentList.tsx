import React, { useMemo, useState } from 'react';

import type { AssignmentWithRelations } from '@/lib/api/assignments';

type AssignmentListProps = {
  assignments: AssignmentWithRelations[];
};

const AssignmentList = ({ assignments }: AssignmentListProps) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const sortedAssignments = useMemo(
    () => [...assignments].sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    [assignments],
  );

  const formatDateTime = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (!sortedAssignments.length) {
    return <p className="text-sm">제출된 과제가 없습니다.</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {sortedAssignments.map((item) => (
          <li key={item.id} className="bg-ivory/80 rounded-xl p-4">
            <div className="flex flex-col gap-2 text-xs">
              <span className="font-semibold text-sm">
                {item.session_no}회차 · {item.status === 'success' ? '성공' : '미제출'}
              </span>
              <span>{formatDateTime(item.created_at)}</span>

              {item.type === 'image' && item.image_url && (
                <button className="text-left" type="button" onClick={() => setActiveImage(item.image_url ?? '')}>
                  <img src={item.image_url} className="rounded-xl max-h-40 object-contain" />
                </button>
              )}

              {item.type === 'link' && item.link_url && (
                <a href={item.link_url} target="_blank" className="text-[#d98200] underline text-sm font-semibold" rel="noreferrer">
                  링크 보기
                </a>
              )}

              {item.type === 'text' && item.text_content && <span className="text-sm text-ellieGray">{item.text_content}</span>}

              {!item.image_url && !item.link_url && !item.text_content && (
                <span className="text-ellieGray/60 text-sm">제출 내용이 없습니다.</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {activeImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setActiveImage(null)}>
          <div className="bg-white p-3 rounded-xl max-w-3xl max-h-[90vh] overflow-auto">
            <img src={activeImage} className="max-h-[80vh] max-w-full object-contain" />
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentList;
