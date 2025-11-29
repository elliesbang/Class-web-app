import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { setAuthUser } from '@/lib/authUser';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const user = session.user;
      const savedRole = localStorage.getItem('oauth_role');
      const role = savedRole === 'vod' ? 'vod' : 'student';

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? '',
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
        role,
      });

        setAuthUser({
          user_id: user.id,
          role,
          name: user.user_metadata?.full_name ?? '',
          email: user.email ?? '',
          token: session.access_token,
        });

      localStorage.removeItem('oauth_role');

      navigate(role === 'vod' ? '/vod' : '/my');
    };

    checkLogin();
  }, [navigate]);

  return <p>로그인 처리중...</p>;
};

export default GoogleCallback;
