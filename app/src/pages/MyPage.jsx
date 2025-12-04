import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '@/context/AuthContext';
import AdminMyPage from './admin/my/AdminMyPage';
import StudentMyPage from './Student/MyPage.jsx';
import VodMyPage from './Vod/MyPage.jsx';

const ROLE_COMPONENTS = {
  admin: AdminMyPage,
  student: StudentMyPage,
  vod: VodMyPage,
};

function normaliseRole(role) {
  if (!role) {
    return null;
  }

  return role.toString().toLowerCase();
}

const MyPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthUser();
  const [state, setState] = useState({ ready: false, role: null });

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    const role = normaliseRole(authUser.role);
    if (!role || !ROLE_COMPONENTS[role]) {
      navigate('/login');
      return;
    }

    setState({ ready: true, role });
  }, [authUser, navigate]);

  const Component = useMemo(() => {
    if (!state.ready || !state.role) {
      return null;
    }

    return ROLE_COMPONENTS[state.role] ?? null;
  }, [state.ready, state.role]);

  if (!state.ready || !Component) {
    return null;
  }

  return <Component />;
};

export default MyPage;
