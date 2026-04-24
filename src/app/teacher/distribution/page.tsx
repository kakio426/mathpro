import { TeacherActivityList } from "@/components/teacher/teacher-activity-list";
import { loadPublishedAssignmentList } from "../assignment-list-loader";

export const dynamic = "force-dynamic";

export default async function TeacherDistributionPage() {
  const { assignments, loadError } = await loadPublishedAssignmentList();

  return (
    <TeacherActivityList
      assignments={assignments.filter(
        (assignment) => assignment.status === "active",
      )}
      loadError={loadError}
      mode="distribution"
    />
  );
}
