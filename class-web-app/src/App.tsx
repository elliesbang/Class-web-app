import type { ComponentType } from 'react';
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
import AdminSettings from './pages/admin/AdminSettings';
import AdminStatistics from './pages/admin/AdminStatistics';
import Home from './pages/Home.jsx';
import InternalCourses from './pages/InternalCourses.jsx';
import Michina from './pages/Michina.jsx';
import MyPage from './pages/MyPage.jsx';
import Notices from './pages/Notices.jsx';
import VOD from './pages/VOD.jsx';
import ClassDetailPage from './pages/class/[id].tsx';
import AdminLogin from './pages/AdminLogin';

const courseModules = import.meta.glob('./pages/course/*/index.jsx', { eager: true }) as Record<string, { default: ComponentType }>;

const courseRoutes = Object.entries(courseModules)
  .map(([key, module]) => {
    const match = key.match(/\.\/pages\/course\/([^/]+)\/index\.jsx$/);
    if (!match) {
      return null;
    }

    const Component = module.default;
    if (!Component) {
      return null;
    }

    return { courseId: match[1], Component };
  })
  .filter((entry): entry is { courseId: string; Component: ComponentType } => entry !== null)
  .sort((a, b) => a.courseId.localeCompare(b.courseId));


function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/internal" element={<InternalCourses />} />
        <Route path="/vod" element={<VOD />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/internal/michina" element={<Michina />} />
        <Route path="/class/:id" element={<ClassDetailPage />} />
        {courseRoutes.map(({ courseId, Component }) => (
          <Route key={courseId} path={`/courses/${courseId}`} element={<Component />} />
        ))}
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
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
