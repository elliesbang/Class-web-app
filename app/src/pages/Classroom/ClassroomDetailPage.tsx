import { Outlet, useParams } from "react-router-dom";
import ClassroomTabs from "@/components/classroom/ClassroomTabs";

export default function ClassroomDetailPage() {
  const { classId } = useParams();
  if (!classId) return null;

  return (
    <div>
      <ClassroomTabs classId={classId} />
      <div style={{ marginTop: "24px" }}>
        <Outlet />
      </div>
    </div>
  );
}
