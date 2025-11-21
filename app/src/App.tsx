import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminClassManagement from './pages/admin/AdminClassManagement';
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import AdminContentManagement from './pages/admin/AdminContentManagement';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import AdminStudentManagement from './pages/admin/AdminStudentManagement';
import AdminAssignmentsManagement from './pages/admin/AdminAssignmentsManagement';
import AdminFeedbackManagement from './pages/admin/AdminFeedbackManagement';
// 🔥 AdminSettings 완전 제거
// import AdminSettings from './pages/admin/AdminSettings';
import AdminStatistics from './pages/admin/AdminStatistics';
import AdminMyPage from './pages/admin/AdminMyPage.jsx';
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

function App() {
  return (
    <Routes>
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
        <Route path="/admin/my" element={<AdminMyPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/vod" element={<VodList />} />
        <Route path="/internal" element={<Navigate to="/classroom" replace />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardHome />} />
        <Route path="class" element={<AdminClassManagement />} />
        <Route path="courses" element={<Navigate to="/admin/class" replace />} />
        <Route path="courses/:id" element={<AdminCourseDetail />} />
        <Route path="students" element={<AdminStudentManagement />} />
        <Route path="assignments" element={<AdminAssignmentsManagement />} />
        <Route path="assignments/:id" element={<AdminAssignmentsManagement />} />
        <Route path="feedback" element={<AdminFeedbackManagement />} />
        <Route path="feedback/new" element={<AdminFeedbackManagement />} />
        <Route path="feedback/edit/:id" element={<AdminFeedbackManagement />} />
        <Route path="dashboard/content" element={<AdminContentManagement />} />
        <Route path="content" element={<AdminContentManagement />} />
        <Route path="statistics" element={<AdminStatistics />} />

        {/* 🔥 설정(Settings) 탭 완전 삭제 */}
        {/* <Route path="settings" element={<AdminSettings />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
