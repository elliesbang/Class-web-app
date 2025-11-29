import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { completeOAuthLogin } from '@/lib/auth';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      await completeOAuthLogin();
      navigate(0);
    };

    checkLogin();
  }, [navigate]);

  return <p>로그인 처리중...</p>;
};

export default GoogleCallback;
