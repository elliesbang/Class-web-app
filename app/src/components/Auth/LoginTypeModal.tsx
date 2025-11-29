import React from 'react';

type LoginType = 'admin' | 'student' | 'vod';

type Props = {
  onSelectType: (type: LoginType) => void;
  onRegister: () => void;
  onClose: () => void;
};

export default function LoginTypeModal({ onSelectType, onRegister, onClose }: Props) {
  return (
    <div className="modal-container">
      <div className="modal-box">
        <div className="modal-header">
          <h2>로그인 종류 선택</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body space-y-4">
          <button className="ellie-btn" onClick={() => onSelectType('admin')}>
            관리자 로그인
          </button>

          <button className="ellie-btn" onClick={() => onSelectType('student')}>
            수강생 로그인
          </button>

          <button className="ellie-btn" onClick={() => onSelectType('vod')}>
            VOD 로그인
          </button>

          <button className="ellie-btn-secondary" onClick={onRegister}>
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
