import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminMyPage from './admin/AdminMyPage.jsx';
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
  const [state, setState] = useState({ ready: false, role: null });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let isMounted = true;

    const evaluate = () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        navigate('/login');
        return;
      }

      const storedRole = normaliseRole(localStorage.getItem('role'));

      if (!storedRole) {
        navigate('/login');
        return;
      }

      if (!ROLE_COMPONENTS[storedRole]) {
        navigate('/login');
        return;
      }

      if (isMounted) {
        setState({ ready: true, role: storedRole });
      }
    };

    evaluate();
    window.addEventListener('storage', evaluate);
    window.addEventListener('auth-change', evaluate);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', evaluate);
      window.removeEventListener('auth-change', evaluate);
    };
  }, [navigate]);

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
