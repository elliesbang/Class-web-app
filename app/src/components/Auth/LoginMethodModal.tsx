import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle } from '@/lib/auth';

type LoginType = 'admin' | 'student' | 'vod';

type Props = {
  userType: LoginType;
  onBack: () => void;
  onClose: () => void;
};

export default function LoginMethodModal({ userType, onBack, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="modal-container">
      <div className="modal-box">
        <div className="modal-header">
          <h2>로그인 방식 선택</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body space-y-4">
          <button className="google-btn" onClick={() => loginWithGoogle(userType)}>
            Google로 계속하기
          </button>

          <div className="email-login space-y-2">
            <input
              id="email"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="ellie-btn" onClick={() => loginWithEmail(email, password, userType)}>
              로그인
            </button>
          </div>

          <button className="link-btn" onClick={onBack}>
            ← 로그인 종류로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
