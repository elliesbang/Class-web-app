import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminComingSoon from './pages/admin/AdminComingSoon';
import AdminCourseManagement from './pages/admin/AdminCourseManagement';
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import AdminContentManagement from './pages/admin/AdminContentManagement';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import AdminStudentManagement from './pages/admin/AdminStudentManagement';
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
        <Route path="assignments" element={<AdminComingSoon title="과제 관리" />} />
        <Route path="feedback" element={<AdminComingSoon title="피드백 관리" />} />
        <Route path="content" element={<AdminContentManagement />} />
        <Route path="reports" element={<AdminComingSoon title="통계 & 리포트" />} />
        <Route path="settings" element={<AdminComingSoon title="설정" />} />
      </Route>
    </Routes>
  );
}

export default App;
