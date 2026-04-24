import { TeacherActivityList } from "@/components/teacher/teacher-activity-list";
import { loadPublishedAssignmentList } from "../assignment-list-loader";

export const dynamic = "force-dynamic";

export default async function TeacherActivitiesPage() {
  const { assignments, loadError } = await loadPublishedAssignmentList();

  return (
    <TeacherActivityList
      assignments={assignments}
      loadError={loadError}
      mode="library"
    />
  );
}
