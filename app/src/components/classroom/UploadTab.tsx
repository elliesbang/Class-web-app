import React, { useEffect, useMemo, useState } from 'react';

const parseJsonResponse = async (response: any, contextLabel: string) => {
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

const normaliseItems = (payload: any) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const candidates = [payload.items, payload.data, payload.results, payload.assignments];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const getSubmissionLink = (assignment: any) => {
  if (!assignment || typeof assignment !== 'object') {
    return null;
  }
  const candidates = [assignment.submitLink, assignment.link, assignment.linkUrl, assignment.url, assignment.formUrl];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
};

const formatDateTime = (value: any) => {
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
    console.error('[UploadTab] Failed to format date', error);
    return '';
  }
};

const getItemKey = (item: any, index: number) => {
  const candidates = [item?.id, item?.assignmentId, item?.slug, item?.title];
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }
  return `assignment-${index}`;
};

const getAttachments = (assignment: any) => {
  if (!assignment || typeof assignment !== 'object') {
    return [];
  }
  if (Array.isArray(assignment.attachments)) {
    return assignment.attachments;
  }
  if (Array.isArray(assignment.files)) {
    return assignment.files;
  }
  return [];
};

function UploadTab({ courseId, courseName }: { [key: string]: any }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setAssignments([]);
    setIsLoading(false);
    setError(null);

    // const fetchAssignments = async () => {
    //   setIsLoading(true);
    //   setError(null);
    //
    //   try {
    //     const query = new URLSearchParams({ classId: String(courseId) });
    //     const response = await fetch(`/api/assignments?${query.toString()}`);
    //     if (!response.ok) {
    //       throw new Error(`Failed to fetch assignments. status=${response.status}`);
    //     }
    //
    //     const payload = await parseJsonResponse(response, 'UploadTab');
    //     if (cancelled) {
    //       return;
    //     }
    //     setAssignments(normaliseItems(payload));
    //   } catch (fetchError) {
    //     console.error('[UploadTab] Failed to load assignments', fetchError);
    //     if (!cancelled) {
    //       setError('과제 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    //       setAssignments([]);
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
      return '제출해야 할 과제를 확인하고 안내에 따라 업로드하세요.';
    }
    return `${courseName} 수업 과제 안내를 확인하고 제출을 진행하세요.`;
  }, [courseName]);

  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">과제 업로드</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">{headerDescription}</p>
      </header>

      {/* 데이터 오류 및 로딩 상태 표시 비활성화 */}

      {!isLoading && !error ? (
        assignments.length > 0 ? (
          <ul className="space-y-4">
            {assignments.map((assignment: any, index: number) => {
              const key = getItemKey(assignment, index);
              const link = getSubmissionLink(assignment);
              const description =
                typeof assignment?.description === 'string' && assignment.description.trim().length > 0
                  ? assignment.description
                  : typeof assignment?.instructions === 'string'
                  ? assignment.instructions
                  : '';
              const dueDate = formatDateTime(assignment?.dueDate ?? assignment?.deadline);
              const attachments = getAttachments(assignment);

              return (
                <li key={key} className="space-y-3 rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <div>
                    <h3 className="text-base font-semibold text-ellieGray">
                      {assignment?.title ?? `과제 ${index + 1}`}
                    </h3>
                    {description ? (
                      <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{description}</p>
                    ) : null}
                    {dueDate ? (
                      <p className="mt-2 text-xs font-medium text-ellieGray/60">제출 마감: {dueDate}</p>
                    ) : null}
                    {assignment?.submissionType ? (
                      <p className="mt-1 text-xs text-ellieGray/60">제출 방식: {assignment.submissionType}</p>
                    ) : null}
                  </div>

                  {attachments.length > 0 ? (
                    <div className="rounded-2xl bg-ivory/80 px-4 py-3">
                      <h4 className="text-xs font-semibold text-ellieGray/80">참고 자료</h4>
                      <ul className="mt-2 space-y-1 text-xs text-ellieGray/70">
                        {attachments.map((attachment: any, attachmentIndex: number) => {
                          const attachmentKey = attachment?.id ?? attachment?.url ?? `attachment-${attachmentIndex}`;
                          const attachmentLink =
                            typeof attachment === 'string'
                              ? attachment
                              : typeof attachment?.url === 'string'
                              ? attachment.url
                              : typeof attachment?.link === 'string'
                              ? attachment.link
                              : null;
                          const attachmentLabel =
                            typeof attachment?.name === 'string'
                              ? attachment.name
                              : typeof attachment?.title === 'string'
                              ? attachment.title
                              : typeof attachment === 'string'
                              ? attachment
                              : `자료 ${attachmentIndex + 1}`;

                          return (
                            <li key={attachmentKey}>
                              {attachmentLink ? (
                                <a
                                  href={attachmentLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-ellieYellow hover:underline"
                                >
                                  {attachmentLabel}
                                </a>
                              ) : (
                                <span>{attachmentLabel}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  <div>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-ellieGray px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-ellieGray/90"
                      >
                        제출 링크 열기
                      </a>
                    ) : (
                      <p className="text-sm text-ellieGray/60">
                        제출 링크가 제공되지 않았습니다. 담당 강사의 안내에 따라 제출해 주세요.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
            <p className="text-sm leading-relaxed text-ellieGray/70">
              현재 제출할 과제가 없습니다. 새로운 과제가 등록되면 이곳에서 확인하실 수 있습니다.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}

export default UploadTab;
