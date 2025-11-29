import React, { useState } from 'react';
import { registerUser } from '@/lib/auth';

type RegisterRole = 'student' | 'vod';

type Props = {
  onBack: () => void;
  onClose: () => void;
};

export default function RegisterModal({ onBack, onClose }: Props) {
  const [role, setRole] = useState<RegisterRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  return (
    <div className="modal-container">
      <div className="modal-box">
        <div className="modal-header">
          <h2>회원가입</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body space-y-4">
          <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />

          <div className="space-y-2">
            <label>
              <input type="radio" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
              수강생
            </label>

            <label>
              <input type="radio" value="vod" checked={role === 'vod'} onChange={() => setRole('vod')} />
              VOD
            </label>
          </div>

          <button className="ellie-btn" onClick={() => registerUser(name, email, pw, pw2, role)}>
            회원가입
          </button>

          <button className="link-btn" onClick={onBack}>
            ← 로그인 종류로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
