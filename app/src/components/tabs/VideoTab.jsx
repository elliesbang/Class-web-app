import React from 'react';

const VideoCard = ({ item }) => {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft">
      <div className="relative aspect-video w-full overflow-hidden bg-[#f7f4e3]">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🎬</div>
        )}
        <button
          type="button"
          onClick={() => window.open(item.content_url, '_blank')}
          className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition hover:bg-black/40"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#ff6b00] shadow-soft">▶</span>
        </button>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-base font-semibold text-ellieGray">{item.title || '강의 영상'}</h3>
        {item.description ? <p className="text-sm text-ellieGray/70">{item.description}</p> : null}
      </div>
    </article>
  );
};

const VideoTab = ({ items = [] }) => {
  if (!items.length) {
    return <p className="text-sm text-ellieGray/70">업로드된 영상이 없습니다.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <VideoCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default VideoTab;
