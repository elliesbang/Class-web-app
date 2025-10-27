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
  const candidates = [payload.items, payload.data, payload.results, payload.materials];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const getMaterialLink = (material) => {
  if (!material || typeof material !== 'object') {
    return null;
  }
  const candidates = [material.url, material.link, material.linkUrl, material.fileUrl, material.downloadUrl];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
};

const getItemKey = (item, index) => {
  const candidates = [item?.id, item?.slug, item?.url, item?.fileUrl, item?.title];
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }
  return `material-${index}`;
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
    }).format(date);
  } catch (error) {
    console.error('[MaterialTab] Failed to format date', error);
    return '';
  }
};

function MaterialTab({ courseId, courseName }) {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setMaterials([]);
      setError('강의 정보를 불러오지 못했습니다.');
      return;
    }

    let cancelled = false;

    const fetchMaterials = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/classes/${courseId}/materials`);
        if (!response.ok) {
          throw new Error(`Failed to fetch materials. status=${response.status}`);
        }

        const payload = await parseJsonResponse(response, 'MaterialTab');
        if (cancelled) {
          return;
        }
        setMaterials(normaliseItems(payload));
      } catch (fetchError) {
        console.error('[MaterialTab] Failed to load materials', fetchError);
        if (!cancelled) {
          setError('수업 자료를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          setMaterials([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchMaterials();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const headerDescription = useMemo(() => {
    if (!courseName) {
      return '강의 자료와 참고 파일을 확인하세요.';
    }
    return `${courseName} 수업에 제공된 자료를 확인하고 다운로드하세요.`;
  }, [courseName]);

  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">자료 보기</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">{headerDescription}</p>
      </header>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 shadow-soft">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm text-ellieGray/70 shadow-soft">
          자료를 불러오는 중입니다…
        </p>
      ) : null}

      {!isLoading && !error ? (
        materials.length > 0 ? (
          <ul className="space-y-4">
            {materials.map((material, index) => {
              const key = getItemKey(material, index);
              const link = getMaterialLink(material);
              const description =
                typeof material?.description === 'string' && material.description.trim().length > 0
                  ? material.description
                  : typeof material?.summary === 'string'
                  ? material.summary
                  : '';
              const createdAt = formatDateTime(material?.createdAt ?? material?.uploadedAt);

              return (
                <li key={key} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <h3 className="text-base font-semibold text-ellieGray">
                    {material?.title ?? material?.fileName ?? `자료 ${index + 1}`}
                  </h3>
                  {description ? (
                    <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{description}</p>
                  ) : null}
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ellieYellow hover:underline"
                    >
                      자료 열기
                    </a>
                  ) : (
                    <p className="mt-4 text-sm text-ellieGray/60">연결된 자료가 없습니다.</p>
                  )}
                  {createdAt ? (
                    <p className="mt-3 text-xs text-ellieGray/50">업데이트: {createdAt}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
            <p className="text-sm leading-relaxed text-ellieGray/70">아직 등록된 자료가 없습니다.</p>
          </div>
        )
      ) : null}
    </div>
  );
}

export default MaterialTab;
