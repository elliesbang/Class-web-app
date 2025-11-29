import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) {
          throw signInError;
        }

        const user = data.user;
        if (!user) {
          throw new Error('로그인 정보를 확인할 수 없습니다.');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'student') {
          await supabase.auth.signOut();
          throw new Error('학생 계정이 아닙니다.');
        }

        // 성공 시에만 onSuccess 호출
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (caught) {
        console.error('[LoginForm] login failed', caught);
        const message = caught instanceof Error ? caught.message : '로그인에 실패했습니다.';
        setError(message);
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
