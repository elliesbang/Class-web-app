import { Route } from 'react-router-dom';

import AdminMyPage from '@/pages/admin/my/AdminMyPage';
import AssignmentStatusPage from '@/pages/admin/my/AssignmentStatusPage';
import NotificationSettingsPage from '@/pages/admin/my/NotificationSettingsPage';

const AdminRoutes = () => (
  <>
    <Route path="/admin/my" element={<AdminMyPage />} />
    <Route path="/admin/my/notifications" element={<NotificationSettingsPage />} />
    <Route path="/admin/my/assignments" element={<AssignmentStatusPage />} />
  </>
);

export default AdminRoutes;
