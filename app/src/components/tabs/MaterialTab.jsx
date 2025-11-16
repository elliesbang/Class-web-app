import React from 'react';

const MaterialCard = ({ item }) => {
  return (
    <article className="rounded-2xl border border-[#f1e6c7] bg-white/80 p-4 shadow-inner">
      <h3 className="text-base font-semibold text-ellieGray">{item.title || '자료'}</h3>
      {item.description ? <p className="mt-1 text-sm text-ellieGray/70">{item.description}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {item.content_url ? (
          <a
            href={item.content_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-[#ffefd0] px-4 py-2 font-semibold text-ellieGray transition hover:bg-[#ffdca2]"
          >
            자료 열기
          </a>
        ) : null}
        {item.thumbnail_url ? (
          <a
            href={item.thumbnail_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-[#fff3df] px-4 py-2 font-semibold text-[#ff9900] transition hover:bg-[#ffe5c3]"
          >
            미리보기
          </a>
        ) : null}
      </div>
    </article>
  );
};

const MaterialTab = ({ items = [] }) => {
  if (!items.length) {
    return <p className="text-sm text-ellieGray/70">등록된 자료가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <MaterialCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default MaterialTab;
