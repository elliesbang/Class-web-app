function MaterialsTab({ courseName, materials }) {
  if (materials?.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ellieGray">{courseName} 자료 보기</h2>
        <ul className="space-y-3">
          {materials.map((material) => (
            <li key={material.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-base font-semibold text-ellieGray">{material.title}</p>
              {material.description ? (
                <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{material.description}</p>
              ) : null}
              {material.fileUrl ? (
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center text-sm font-semibold text-ellieYellow hover:underline"
                >
                  자료 보기
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-ellieGray">{courseName} 자료 보기</h2>
      <p className="text-sm leading-relaxed text-ellieGray/70">
        준비 중인 자료입니다. 업로드가 완료되면 이곳에서 바로 확인할 수 있어요.
      </p>
    </div>
  );
}

export default MaterialsTab;
