import { useState } from 'react';
import { useLoginModal } from '../../hooks/useLoginModal';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const { userType, close } = useLoginModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return alert(error.message);

    close();

    if (userType === 'admin') {
      nav('/admin/dashboard');
    } else {
      nav('/classroom');
    }
  };

  return (
    <div>
      <h2 className="modal-title">
        {userType === 'admin' && '관리자 로그인'}
        {userType === 'student' && '수강생 로그인'}
        {userType === 'vod' && 'VOD 로그인'}
      </h2>

      <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button className="login-btn" onClick={login}>로그인</button>
    </div>
  );
}
