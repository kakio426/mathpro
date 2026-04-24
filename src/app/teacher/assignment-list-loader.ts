import { createAppTeacherService } from "@/features/teacher";
import type { PublishedAssignmentListItem } from "@/types/teacher";

export type AssignmentListLoadResult = {
  assignments: PublishedAssignmentListItem[];
  loadError: string | null;
};

export async function loadPublishedAssignmentList(): Promise<AssignmentListLoadResult> {
  const teacherService = createAppTeacherService();

  try {
    return {
      assignments: await teacherService.listPublishedAssignments(),
      loadError: null,
    };
  } catch (error) {
    return {
      assignments: [],
      loadError:
        error instanceof Error
          ? error.message
          : "잠시 후 다시 시도해 주세요.",
    };
  }
}
