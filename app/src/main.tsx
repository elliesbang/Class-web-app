import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SheetsDataProvider } from './contexts/SheetsDataContext';
import './index.css';
import './lib/setupAuthFetch';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <SheetsDataProvider>
        <App />
      </SheetsDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
