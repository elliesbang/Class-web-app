import React, { useMemo } from 'react';

const parseMaterialLink = (material: any) => {
  if (!material || typeof material !== 'object') {
    return null;
  }
  const candidates = [material.fileUrl, material.file_url, material.url, material.link, material.linkUrl];
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
    }).format(date);
  } catch (error) {
    console.error('[MaterialTab] Failed to format date', error);
    return '';
  }
};

const normaliseType = (value: any) => {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim().toLowerCase();
};

const normaliseMaterials = (items: any) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => {
      const type = normaliseType(item?.type ?? item?.category ?? item?.contentType);
      return type === 'material' || type === '자료' || type === 'file' || type === 'document';
    })
    .map((item, index) => {
      const id = item?.id ?? item?.content_id ?? item?.contentId ?? `material-${index}`;
      const titleCandidate =
        item?.title ?? item?.name ?? item?.fileName ?? item?.content_title ?? `자료 ${index + 1}`;
      const descriptionCandidate =
        item?.description ?? item?.summary ?? item?.content ?? item?.text ?? '';
      const createdAtCandidate = item?.created_at ?? item?.createdAt ?? item?.uploaded_at ?? item?.uploadedAt;

      return {
        id,
        title: typeof titleCandidate === 'string' ? titleCandidate : String(titleCandidate ?? ''),
        description:
          typeof descriptionCandidate === 'string'
            ? descriptionCandidate
            : descriptionCandidate != null
            ? String(descriptionCandidate)
            : '',
        link: parseMaterialLink(item),
        createdAt: createdAtCandidate ?? null,
      };
    });
};

function MaterialTab({ courseName, contents = [], isLoadingContents = false, contentError = null }: { [key: string]: any }) {
  const materials = useMemo(() => normaliseMaterials(contents), [contents]);
  const isLoading = isLoadingContents;
  const error = contentError;

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
            {materials.map((material: any, index: number) => {
              const createdAt = formatDateTime(material?.createdAt);

              return (
                <li key={material?.id ?? `material-${index}`} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <h3 className="text-base font-semibold text-ellieGray">
                    {material?.title ?? `자료 ${index + 1}`}
                  </h3>
                  {material?.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{material.description}</p>
                  ) : null}
                  {material?.link ? (
                    <a
                      href={material.link}
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
