function VOD() {
  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">VOD</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          언제 어디서나 다시 볼 수 있는 엘리의방 VOD 콘텐츠를 만나보세요.
        </p>
      </header>
      <section className="grid gap-4">
        {[1, 2, 3].map((item) => (
          <article key={item} className="rounded-3xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">VOD 강의 {item}</h2>
              <span className="rounded-full bg-ellieYellow px-3 py-1 text-xs font-semibold text-ellieGray">
                바로보기
              </span>
            </div>
            <p className="mt-2 text-sm text-ellieGray/70">
              엘리의방 클래스에서 제공하는 프리미엄 녹화 강의입니다.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default VOD;
