import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminCourseManagement from './pages/admin/AdminCourseManagement';
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import AdminContentManagement from './pages/admin/AdminContentManagement';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import AdminStudentManagement from './pages/admin/AdminStudentManagement';
import AdminAssignmentsManagement from './pages/admin/AdminAssignmentsManagement';
import AdminFeedbackManagement from './pages/admin/AdminFeedbackManagement';
import AdminComingSoon from './pages/admin/AdminComingSoon';
import AdminStatistics from './pages/admin/AdminStatistics';
import Home from './pages/Home.jsx';
import InternalCourses from './pages/InternalCourses.jsx';
import Michina from './pages/Michina.jsx';
import MyPage from './pages/MyPage.jsx';
import Notices from './pages/Notices.jsx';
import VOD from './pages/VOD.jsx';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/internal" element={<InternalCourses />} />
        <Route path="/vod" element={<VOD />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/internal/michina" element={<Michina />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardHome />} />
        <Route path="courses" element={<AdminCourseManagement />} />
        <Route path="courses/:id" element={<AdminCourseDetail />} />
        <Route path="students" element={<AdminStudentManagement />} />
        <Route path="assignments" element={<AdminAssignmentsManagement />} />
        <Route path="assignments/:id" element={<AdminAssignmentsManagement />} />
        <Route path="feedback" element={<AdminFeedbackManagement />} />
        <Route path="feedback/new" element={<AdminFeedbackManagement />} />
        <Route path="feedback/edit/:id" element={<AdminFeedbackManagement />} />
        <Route path="content" element={<AdminContentManagement />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="settings" element={<AdminComingSoon title="설정" />} />
      </Route>
    </Routes>
  );
}

export default App;
