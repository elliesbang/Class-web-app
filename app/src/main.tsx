import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

// 🔥 Supabase 기반으로 다시 만든 Context
import { SheetsDataProvider } from './contexts/SheetsDataContext';

import './index.css';
import './lib/setupAuthFetch';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 🔥 전역 데이터 (VOD, 공지 등) 이제 Supabase에서 불러옴 */}
      <SheetsDataProvider>
        <App />
      </SheetsDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
