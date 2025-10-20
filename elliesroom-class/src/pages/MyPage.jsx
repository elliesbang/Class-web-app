function MyPage() {
  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">마이페이지</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          내 강의 목록과 수강 현황을 확인하고 개인 정보를 관리하세요.
        </p>
      </header>
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">나의 강의</h2>
        <ul className="mt-3 space-y-2 text-sm text-ellieGray/80">
          <li>캔디마 · 수강중</li>
          <li>이얼챌 · 수강대기</li>
          <li>미치나 · 수강완료</li>
        </ul>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">계정 설정</h2>
        <p className="mt-2 text-sm text-ellieGray/70">
          프로필, 알림, 결제 수단 등을 손쉽게 관리할 수 있습니다.
        </p>
      </section>
    </div>
  );
}

export default MyPage;
