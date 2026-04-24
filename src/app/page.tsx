import {
  TeacherWorkspace,
  type TeacherWorkspaceReuseSource,
} from "@/components/teacher/teacher-workspace";
import { createAppTeacherService, TeacherServiceError } from "@/features/teacher";

type HomePageProps = {
  searchParams: Promise<{
    reuseAssignmentId?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loadReuseSource(
  assignmentId: string,
): Promise<{
  reuseSource: TeacherWorkspaceReuseSource | null;
  reuseLoadError: string | null;
}> {
  try {
    const teacherService = createAppTeacherService();
    const assignment = await teacherService.getAssignmentById(assignmentId);

    return {
      reuseSource: {
        assignmentId: assignment.id,
        code: assignment.code,
        title: assignment.document.title,
        document: assignment.document,
      },
      reuseLoadError: null,
    };
  } catch (error) {
    if (error instanceof TeacherServiceError && error.status === 404) {
      return {
        reuseSource: null,
        reuseLoadError:
          "선택한 자료를 찾지 못했습니다. 내 자료 화면에서 다시 선택해 주세요.",
      };
    }

    return {
      reuseSource: null,
      reuseLoadError:
        "자료를 불러오는 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.",
    };
  }
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const reuseAssignmentId = firstSearchParam(params.reuseAssignmentId);
  const reuseState = reuseAssignmentId
    ? await loadReuseSource(reuseAssignmentId)
    : {
        reuseSource: null,
        reuseLoadError: null,
      };

  return <TeacherWorkspace {...reuseState} />;
}
