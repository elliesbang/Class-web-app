import GoogleCallback from './pages/auth/GoogleCallback';
import Signup from './pages/auth/Signup';

import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './pages/home/Home';
import VodList from '@/pages/Vod/VodList';
import Classroom from './pages/Classroom';
import MyPage from './pages/MyPage.jsx';
import Notices from './pages/admin/Notices';

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
import ClassroomManagementPage from './pages/admin/classrooms/ClassroomManagementPage';
import ClassroomMaterialsPage from './pages/admin/classrooms/ClassroomMaterialsPage';
import ClassroomNoticesPage from './pages/admin/classrooms/ClassroomNoticesPage';
import ClassroomVideosPage from './pages/admin/classrooms/ClassroomVideosPage';
import GlobalNoticesPage from './pages/admin/notices/GlobalNoticesPage';
import VodContentPage from './pages/admin/vod/VodContentPage';
import VodManagementPage from './pages/admin/vod/VodManagementPage';
import VodCategoryPage from './pages/admin/vod/VodCategoryPage';
import AdminRoutes from './routes/AdminRoutes';

import LoginModal from './components/LoginModal';
import LoginModalProvider, { LoginModalContext } from './context/LoginModalContext';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/home" element={<Home />} />
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

        {AdminRoutes()}

        <Route path="/signup" element={<Signup />} />
        <Route path="/vod" element={<VodList />} />
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
        <Route path="classrooms" element={<ClassroomManagementPage />} />
        <Route path="classrooms/:id/videos" element={<ClassroomVideosPage />} />
        <Route path="classrooms/:id/materials" element={<ClassroomMaterialsPage />} />
        <Route path="classrooms/:id/notices" element={<ClassroomNoticesPage />} />
        <Route path="notices" element={<GlobalNoticesPage />} />
        <Route path="vod" element={<VodManagementPage />} />
        <Route path="vod/categories" element={<VodCategoryPage />} />
        <Route path="vod/content" element={<VodContentPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <LoginModalProvider>
      <AppShell />
    </LoginModalProvider>
  );
}

function AppShell() {
  const { isOpen, close } = useContext(LoginModalContext);
  return (
    <>
      <AppRoutes />
      {isOpen && <LoginModal onClose={close} />}
    </>
  );
}

export default App;
