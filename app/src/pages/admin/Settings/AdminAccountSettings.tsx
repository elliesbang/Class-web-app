import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
};

const AdminAccountSettings = () => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailMessage, setEmailMessage] = useState<StatusMessage | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<StatusMessage | null>(null);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      setIsLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        setEmailMessage({ type: 'error', text: '현재 이메일 정보를 불러오지 못했습니다.' });
      } else {
        setCurrentEmail(data.user?.email ?? '');
      }

      setIsLoadingUser(false);
    };

    void loadCurrentUser();
  }, []);

  const handleEmailUpdate = async () => {
    const emailToUpdate = newEmail.trim();

    if (!emailToUpdate || isUpdatingEmail) return;

    setIsUpdatingEmail(true);
    setEmailMessage(null);

    const { error } = await supabase.auth.updateUser({ email: emailToUpdate });

    if (error) {
      setEmailMessage({ type: 'error', text: '이메일 변경에 실패했습니다. 다시 시도해주세요.' });
    } else {
      setCurrentEmail(emailToUpdate);
      setNewEmail('');
      setEmailMessage({
        type: 'success',
        text: '이메일이 변경되었습니다. 새 이메일 인증이 필요할 수 있습니다.',
      });
    }

    setIsUpdatingEmail(false);
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword !== confirmPassword || isUpdatingPassword) return;

    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage({ type: 'error', text: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: '비밀번호가 안전하게 변경되었습니다.' });
    }

    setIsUpdatingPassword(false);
  };

  const isPasswordMismatched = newPassword !== confirmPassword;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#404040]">관리자 이메일 설정</h2>
            <p className="text-sm text-[#7a6e65]">현재 로그인된 관리자 이메일을 확인하고 변경할 수 있어요.</p>
          </div>
          <div className="rounded-full bg-[#f5eee9] px-4 py-2 text-xs font-semibold text-[#404040]">
            {isLoadingUser ? '불러오는 중...' : currentEmail || '이메일 정보 없음'}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="new-email" className="block text-sm font-semibold text-[#404040]">
              새 이메일 주소
            </label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="새 이메일을 입력하세요"
              className="w-full rounded-xl border border-[#e9dccf] bg-white px-4 py-3 text-sm text-[#404040] placeholder:text-[#b7a99b] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            />
          </div>

          <button
            type="button"
            onClick={handleEmailUpdate}
            disabled={!newEmail.trim() || isUpdatingEmail}
            className="w-full rounded-xl bg-[#ffd331] px-4 py-3 text-sm font-semibold text-[#404040] shadow transition hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:bg-[#f5e0a3]"
          >
            {isUpdatingEmail ? '이메일 변경 중...' : '이메일 변경하기'}
          </button>

          {emailMessage && (
            <p
              className={`text-sm font-semibold ${
                emailMessage.type === 'success' ? 'text-emerald-600' : 'text-[#c43c3c]'
              }`}
            >
              {emailMessage.text}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#404040]">비밀번호 변경</h2>
          <p className="text-sm text-[#7a6e65]">새 비밀번호를 설정하고 안전하게 계정을 보호하세요.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-semibold text-[#404040]">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="새 비밀번호"
              className="w-full rounded-xl border border-[#e9dccf] bg-white px-4 py-3 text-sm text-[#404040] placeholder:text-[#b7a99b] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#404040]">
              새 비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="새 비밀번호 확인"
              className="w-full rounded-xl border border-[#e9dccf] bg-white px-4 py-3 text-sm text-[#404040] placeholder:text-[#b7a99b] focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
            />
          </div>

          <button
            type="button"
            onClick={handlePasswordUpdate}
            disabled={!newPassword || !confirmPassword || isPasswordMismatched || isUpdatingPassword}
            className="w-full rounded-xl bg-[#ffd331] px-4 py-3 text-sm font-semibold text-[#404040] shadow transition hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:bg-[#f5e0a3]"
          >
            {isUpdatingPassword ? '비밀번호 변경 중...' : '비밀번호 변경하기'}
          </button>

          {isPasswordMismatched && newPassword && confirmPassword && (
            <p className="text-sm font-semibold text-[#c43c3c]">비밀번호가 일치하지 않습니다.</p>
          )}

          {passwordMessage && (
            <p
              className={`text-sm font-semibold ${
                passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-[#c43c3c]'
              }`}
            >
              {passwordMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAccountSettings;
