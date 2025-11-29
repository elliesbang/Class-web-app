import GoogleCallback from './pages/auth/GoogleCallback';
import Signup from './pages/auth/Signup';

import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './pages/home/Home';
import VodList from '@/pages/Vod/VodList';
import Classroom from './pages/Classroom';
import MyPage from './pages/MyPage.jsx';
import Notices from './pages/admin/Notices';
import AdminLogin from './pages/auth/AdminLogin';
import ClassroomDetailPage from './pages/Classroom/ClassroomDetailPage';
import {
  AssignmentTabRoute,
  FeedbackTabRoute,
  MaterialTabRoute,
  NoticeTabRoute,
  VideoTabRoute,
} from './pages/Classroom/ClassroomTabRoutes';
import AdminLayout from './admin/layout/AdminLayout';
import DashboardHome from './admin/pages/DashboardHome';
import ClassCreatePage from './admin/pages/Classes/ClassCreatePage';
import ClassEditPage from './admin/pages/Classes/ClassEditPage';
import ClassDetailPage from './admin/pages/Classes/ClassDetailPage';
import ClassListPage from './admin/pages/Classes/ClassListPage';
import AssignmentAdminTab from './pages/admin/tabs/AssignmentAdminTab';
import StudentsPage from './admin/pages/Students/StudentsPage';
import ContentListPage from './admin/content/ContentListPage';
import AdminRoutes from './routes/AdminRoutes';

function App() {
  return (
    <Routes>
      {/* 🔥 구글 로그인 콜백 - 반드시 최상단 위치 */}
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/classroom/:classId" element={<ClassroomDetailPage />}>
          <Route index element={<Navigate to="video" replace />} />
          <Route path="video" element={<VideoTabRoute />} />
          <Route path="material" element={<MaterialTabRoute />} />
          <Route path="notice" element={<NoticeTabRoute />} />
          <Route path="assignment" element={<AssignmentTabRoute />} />
          <Route path="feedback" element={<FeedbackTabRoute />} />
        </Route>
        <Route path="/notices" element={<Notices />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/mypage" element={<MyPage />} />
        {AdminRoutes()}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/vod" element={<VodList />} />
        <Route path="/internal" element={<Navigate to="/classroom" replace />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="classes" element={<ClassListPage />} />
        <Route path="classes/create" element={<ClassCreatePage />} />
        <Route path="classes/:id/edit" element={<ClassEditPage />} />
        <Route path="classes/:id" element={<ClassDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="assignments" element={<AssignmentAdminTab />} />
        <Route path="content" element={<ContentListPage />} />
      </Route>
    </Routes>
  );
}

export default App;
