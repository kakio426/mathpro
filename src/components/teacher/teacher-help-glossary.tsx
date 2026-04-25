import { BookOpenText, HelpCircle } from "lucide-react";

type GlossaryTerm = {
  term: string;
  plainName: string;
  description: string;
  example: string;
};

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "HTML",
    plainName: "움직이는 수업자료 원본",
    description:
      "학생 화면에서 바로 열리는 한 장짜리 자료 파일입니다. 선생님이 코딩을 하는 것이 아니라, AI가 만들어 준 결과물을 이곳에 붙여넣는 방식입니다.",
    example: "예: 분수 막대를 누르면 색이 바뀌고 제출 버튼이 있는 활동",
  },
  {
    term: "AI 요청문",
    plainName: "AI에게 보내는 제작 주문서",
    description:
      "Gemini 같은 AI에게 어떤 학년, 어떤 개념, 어떤 조작 활동을 만들지 알려주는 글입니다. 수학프로가 초안을 만들어 주고 선생님은 목표만 다듬으면 됩니다.",
    example: "예: 3-4학년이 3/4을 수직선에서 찾는 활동을 만들어줘",
  },
  {
    term: "안전 검사",
    plainName: "학생 화면 보호 확인",
    description:
      "파일 업로드, 위치나 카메라 권한, 화면 강제 이동처럼 수업자료에 필요 없는 기능을 막는 확인 절차입니다. CDN이나 외부 자료는 차단하지 않고 수업 인터넷 환경 안내로만 표시합니다.",
    example: "예: 외부 라이브러리는 안내만 표시하고, 위치 권한이나 강제 이동 코드는 발행 전 수정 요청",
  },
  {
    term: "조작 기록",
    plainName: "학생이 만진 과정",
    description:
      "학생이 누른 것, 위치를 옮긴 것, 힌트를 본 것, 다시 시도한 것, 제출한 것을 시간 흐름으로 남긴 기록입니다. 점수보다 이해 과정을 읽기 위해 사용합니다.",
    example: "예: 1/4 위치를 여러 번 고른 뒤 힌트를 보고 3/4로 수정",
  },
  {
    term: "참여 코드",
    plainName: "로그인 없는 입장 번호",
    description:
      "학생이 계정 없이 수업자료에 들어가기 위한 짧은 코드입니다. 링크나 QR로도 같은 화면에 들어갈 수 있습니다.",
    example: "예: 칠판에 5993DA를 적어 두면 학생이 /join에서 입력",
  },
];

export function TeacherHelpGlossary() {
  return (
    <section
      aria-labelledby="teacher-help-glossary-title"
      className="rounded-[1.5rem] border border-border bg-[#f7efe0] p-4 shadow-card"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BookOpenText className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
            도움말
          </p>
          <h2
            className="mt-1 font-semibold tracking-tight"
            id="teacher-help-glossary-title"
          >
            선생님 용어 도움말
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            낯선 말은 수업 준비 관점의 쉬운 표현으로 다시 설명합니다.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {glossaryTerms.map((item) => (
          <details
            className="group rounded-2xl border border-white/70 bg-white/72 px-3 py-2 text-sm"
            key={item.term}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
              <span>
                {item.term}
                <span className="ml-2 text-xs font-medium text-muted">
                  {item.plainName}
                </span>
              </span>
              <HelpCircle className="size-4 shrink-0 text-primary transition group-open:rotate-12" />
            </summary>
            <div className="mt-3 space-y-2 border-t border-border/70 pt-3 text-xs leading-5 text-muted">
              <p>{item.description}</p>
              <p className="rounded-xl bg-secondary/70 px-3 py-2 text-foreground">
                {item.example}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
