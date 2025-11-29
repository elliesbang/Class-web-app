import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      setError('');
      setIsSubmitting(true);

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpError) {
          throw signUpError;
        }

        const user = data?.user;

        if (!user) {
          throw new Error('회원가입 후 사용자 정보를 불러오지 못했습니다.');
        }

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          email: email.trim(),
          name: name.trim(),
          role,
        });

        if (profileError) {
          throw profileError;
        }

        navigate('/login');
      } catch (caught) {
        console.error('[Signup] signup failed', caught);
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, isSubmitting, name, navigate, password, role],
  );

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h1 className="mb-4 text-xl font-semibold">회원가입</h1>
      <form onSubmit={handleSubmit}>
        <label className="mb-1 block text-sm font-medium">이름</label>
        <input
          className="mb-3 w-full rounded-md border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm font-medium">이메일</label>
        <input
          type="email"
          className="mb-3 w-full rounded-md border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm font-medium">비밀번호</label>
        <input
          type="password"
          className="mb-3 w-full rounded-md border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="mb-2 block text-sm font-medium">역할 선택</label>
        <div className="mb-4 flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            student
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="vod"
              checked={role === 'vod'}
              onChange={() => setRole('vod')}
            />
            vod
          </label>
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-yellow-400 py-2 text-white hover:bg-yellow-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export default Signup;
