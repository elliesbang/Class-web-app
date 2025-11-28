import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

type StudentLoginModalProps = {
  onLoginSuccess?: () => void;
  onSignupSuccess?: () => void;
};

const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  onLoginSuccess,
  onSignupSuccess,
}) => {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-lg border border-yellow-400 py-2 text-sm font-semibold ${
            !isSignup ? 'bg-yellow-400 text-white' : 'bg-white text-yellow-600'
          }`}
          onClick={() => setIsSignup(false)}
        >
          로그인
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg border border-yellow-400 py-2 text-sm font-semibold ${
            isSignup ? 'bg-yellow-400 text-white' : 'bg-white text-yellow-600'
          }`}
          onClick={() => setIsSignup(true)}
        >
          회원가입
        </button>
      </div>

      {isSignup ? (
        <SignupForm onSuccess={onSignupSuccess} />
      ) : (
        <LoginForm onSuccess={onLoginSuccess} />
      )}
    </div>
  );
};

export default StudentLoginModal;
