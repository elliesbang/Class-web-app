import { useLoginModal } from '../../hooks/useLoginModal';

export default function LoginSelector() {
  const { setUserType, setStep } = useLoginModal();

  const choose = (type) => {
    setUserType(type);
    setStep('login-form');
  };

  return (
    <div>
      <h2 className="modal-title">로그인 종류 선택</h2>

      <div className="login-type-buttons">
        <button onClick={() => choose('admin')}>관리자 로그인</button>
        <button onClick={() => choose('student')}>수강생 로그인</button>
        <button onClick={() => choose('vod')}>VOD 로그인</button>
      </div>

      <p className="signup-link">회원가입</p>
    </div>
  );
}
