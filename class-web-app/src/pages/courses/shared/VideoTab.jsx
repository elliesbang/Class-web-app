function VideoTab({ courseName, videoResources }) {
  if (videoResources?.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ellieGray">{courseName} 강의 영상</h2>
        <ul className="space-y-3">
          {videoResources.map((video) => (
            <li key={video.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-base font-semibold text-ellieGray">{video.title}</p>
              {video.description ? (
                <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{video.description}</p>
              ) : null}
              {video.url ? (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center text-sm font-semibold text-ellieYellow hover:underline"
                >
                  영상 보기
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
      <h2 className="text-lg font-semibold text-ellieGray">{courseName} 강의 영상</h2>
      <p className="text-sm leading-relaxed text-ellieGray/70">
        준비 중인 강의입니다. 업로드가 완료되면 이곳에서 바로 시청할 수 있어요.
      </p>
    </div>
  );
}

export default VideoTab;
