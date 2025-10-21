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
import AdminSettings from './pages/admin/AdminSettings';
import AdminStatistics from './pages/admin/AdminStatistics';
import Home from './pages/Home.jsx';
import InternalCourses from './pages/InternalCourses.jsx';
import Michina from './pages/Michina.jsx';
import MyPage from './pages/MyPage.jsx';
import Notices from './pages/Notices.jsx';
import VOD from './pages/VOD.jsx';
import EarlChalCoursePage from './pages/courses/earlchal/index.jsx';
import CandymaCoursePage from './pages/courses/candyma/index.jsx';
import MitemnaCoursePage from './pages/courses/mitemna/index.jsx';
import EggjakCoursePage from './pages/courses/eggjak/index.jsx';
import NacoljakCoursePage from './pages/courses/nacoljak/index.jsx';
import EggjakChalCoursePage from './pages/courses/eggjakchal/index.jsx';
import NacoljakChalCoursePage from './pages/courses/nacoljakchal/index.jsx';

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
        <Route path="/courses/earlchal" element={<EarlChalCoursePage />} />
        <Route path="/courses/candyma" element={<CandymaCoursePage />} />
        <Route path="/courses/mitemna" element={<MitemnaCoursePage />} />
        <Route path="/courses/eggjak" element={<EggjakCoursePage />} />
        <Route path="/courses/nacoljak" element={<NacoljakCoursePage />} />
        <Route path="/courses/eggjakchal" element={<EggjakChalCoursePage />} />
        <Route path="/courses/nacoljakchal" element={<NacoljakChalCoursePage />} />
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
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
