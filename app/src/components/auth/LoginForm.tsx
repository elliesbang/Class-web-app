import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { login } from '@/lib/api/auth/login';
import { setAuthUser } from '@/lib/authUser';

type LoginFormProps = {
  onSuccess?: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;

      setError('');
      setIsSubmitting(true);

      try {
        const { user, profile, token } = await login(email.trim(), password.trim());

        // 학생 계정 검증
        if (profile?.role !== 'student') {
          alert('학생 계정이 아닙니다.');
          await supabase.auth.signOut();
          setIsSubmitting(false);
          return;
        }

        // 로그인 성공 → 유저 저장
        setAuthUser({
          user_id: user.id,
          email: user.email ?? email,
          name: profile?.name ?? (user.user_metadata?.name as string | undefined) ?? '',
          role: 'student',
          token,
        });

        // 성공 시에만 onSuccess 호출
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (caught) {
        console.error('[LoginForm] login failed', caught);
        setError('로그인에 실패했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, isSubmitting, onSuccess],
  );

  return (
    <form
      className="mt-2"
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        // 🔥 모바일 자동 submit 방지 (Enter key)
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
    >
      <label className="block text-sm font-medium mb-1">이메일</label>
      <input
        type="email"
        className="border rounded-md w-full p-2 mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label className="block text-sm font-medium mb-1">비밀번호</label>
      <input
        type="password"
        className="border rounded-md w-full p-2 mb-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <button
        type="submit"
        className="bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white py-2 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};

export default LoginForm;
