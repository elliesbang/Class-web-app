import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { setAuthUser } from '@/lib/authUser';

type SignupFormProps = {
  onSuccess?: () => void;
};

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
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
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpError) {
          throw signUpError;
        }

        const user = data?.user;
        const token = data?.session?.access_token;

        if (!user || !token) {
          throw new Error('회원가입 후 세션 정보를 불러오지 못했습니다.');
        }

        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: email.trim(),
          name: name.trim(),
          role: 'student',
        });

        if (profileError) {
          throw profileError;
        }

        setAuthUser({
          user_id: user.id,
          email: user.email ?? email,
          name: name.trim(),
          role: 'student',
          token,
        });

        onSuccess?.();
      } catch (caught) {
        console.error('[SignupForm] signup failed', caught);
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, isSubmitting, name, onSuccess, password],
  );

  return (
    <form className="mt-2" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium mb-1">이름</label>
      <input
        className="border rounded-md w-full p-2 mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

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
        {isSubmitting ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
};

export default SignupForm;
