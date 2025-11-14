import { useEffect, useMemo, useState } from 'react';

const parseJsonResponse = async (response, contextLabel) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`[${contextLabel}] JSON parse error`, {
      url: response.url,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
      error,
    });
    throw error;
  }
};

const normaliseItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const candidates = [payload.items, payload.data, payload.results, payload.feedback];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('[FeedbackTab] Failed to format date', error);
    return '';
  }
};

const getItemKey = (item, index) => {
  const candidates = [item?.id, item?.feedbackId, item?.assignmentId, item?.title];
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }
  return `feedback-${index}`;
};

function FeedbackTab({ courseId, courseName }) {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFeedbackItems([]);
    setIsLoading(false);
    setError(null);

    // const fetchFeedback = async () => {
    //   setIsLoading(true);
    //   setError(null);
    //
    //   try {
    //     const query = new URLSearchParams({ classId: String(courseId) });
    //     const response = await fetch(`/api/feedback?${query.toString()}`);
    //     if (!response.ok) {
    //       throw new Error(`Failed to fetch feedback. status=${response.status}`);
    //     }
    //
    //     const payload = await parseJsonResponse(response, 'FeedbackTab');
    //     if (cancelled) {
    //       return;
    //     }
    //     setFeedbackItems(normaliseItems(payload));
    //   } catch (fetchError) {
    //     console.error('[FeedbackTab] Failed to load feedback', fetchError);
    //     if (!cancelled) {
    //       setError('피드백 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    //       setFeedbackItems([]);
    //     }
    //   } finally {
    //     if (!cancelled) {
    //       setIsLoading(false);
    //     }
    //   }
    // };
  }, [courseId]);

  const headerDescription = useMemo(() => {
    if (!courseName) {
      return '제출한 과제에 대한 피드백을 확인하세요.';
    }
    return `${courseName} 수업의 피드백을 확인하고 다음 과제에 활용해보세요.`;
  }, [courseName]);

  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">피드백 보기</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">{headerDescription}</p>
      </header>

      {/* 데이터 오류 및 로딩 상태 표시 비활성화 */}

      {!isLoading && !error ? (
        feedbackItems.length > 0 ? (
          <ul className="space-y-4">
            {feedbackItems.map((item, index) => {
              const key = getItemKey(item, index);
              const description =
                typeof item?.content === 'string' && item.content.trim().length > 0
                  ? item.content
                  : typeof item?.comment === 'string'
                  ? item.comment
                  : '';
              const teacherName =
                typeof item?.teacher === 'string'
                  ? item.teacher
                  : typeof item?.instructor === 'string'
                  ? item.instructor
                  : item?.author ?? '';
              const assignmentTitle =
                typeof item?.assignmentTitle === 'string'
                  ? item.assignmentTitle
                  : typeof item?.title === 'string'
                  ? item.title
                  : '';
              const createdAt = formatDateTime(item?.createdAt ?? item?.submittedAt ?? item?.updatedAt);

              return (
                <li key={key} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-base font-semibold text-ellieGray">
                        {assignmentTitle ? `${assignmentTitle} 피드백` : `피드백 ${index + 1}`}
                      </h3>
                      {teacherName ? (
                        <p className="text-xs font-medium text-ellieGray/60">담당: {teacherName}</p>
                      ) : null}
                    </div>
                    {description ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-ellieGray/80">{description}</p>
                    ) : (
                      <p className="text-sm text-ellieGray/60">등록된 피드백 내용이 없습니다.</p>
                    )}
                    {createdAt ? (
                      <p className="text-xs text-ellieGray/50">작성일: {createdAt}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
            <p className="text-sm leading-relaxed text-ellieGray/70">
              아직 {courseName ?? '해당'} 수업에 등록된 피드백이 없습니다. 과제를 제출하면 담당 강사가 피드백을 남겨드릴 예정이에요.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}

export default FeedbackTab;
