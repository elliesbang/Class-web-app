import React, { useEffect, useMemo, useState } from 'react';
import AdminMyPage from './Admin/MyPage.jsx';
import StudentMyPage from './Student/MyPage.jsx';
import VodMyPage from './Vod/MyPage.jsx';

const ROLE_COMPONENTS = {
  admin: AdminMyPage,
  student: StudentMyPage,
  vod: VodMyPage,
};

function resolveRoleFromStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole;
    }

    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.role) {
        return parsed.role;
      }
    }
  } catch (error) {
    console.warn('[MyPage] failed to read role from storage', error);
  }

  return null;
}

export default function MyPage() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(resolveRoleFromStorage());
  }, []);

  const RoleComponent = useMemo(() => {
    if (!role) {
      return null;
    }

    return ROLE_COMPONENTS[role?.toLowerCase()] ?? null;
  }, [role]);

  if (!role || !RoleComponent) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          <h1 className="text-xl font-bold text-ellieGray">마이페이지</h1>
          <p className="mt-2 text-sm text-ellieGray/70">
            로그인 정보가 없습니다. 다시 로그인 후 이용해 주세요.
          </p>
        </header>
      </div>
    );
  }

  return <RoleComponent />;
}
