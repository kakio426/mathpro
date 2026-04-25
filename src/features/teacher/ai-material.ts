import type { CreateTeacherDraftRequest } from "@/types/teacher";

export type EducationalSimulationPromptInput = Pick<
  CreateTeacherDraftRequest,
  "concept" | "difficulty" | "goal" | "gradeBand" | "interactionKind"
>;

export type ParsedAiMaterialOutput = {
  teacherGuide?: string;
  html: string | null;
  learningQuestions: string[];
  rawText: string;
};

const allowedCdnGuide = [
  "Three.js: cdnjs.cloudflare.com 또는 cdn.jsdelivr.net",
  "p5.js: cdnjs.cloudflare.com 또는 cdn.jsdelivr.net",
  "Tailwind CDN: cdn.tailwindcss.com",
].join("\n- ");

export function buildEducationalSimulationPrompt(
  input: EducationalSimulationPromptInput,
) {
  return [
    "[페르소나: 엘리트 에듀테크 교사 & 풀스택 개발자]",
    "당신은 교육 공학 전문가이자 숙련된 웹 개발자입니다. 복잡한 과학적·수학적 원리를 학생들이 직관적으로 이해할 수 있도록 Interactive Web Simulation을 제작하는 것이 임무입니다.",
    "",
    `학습 주제: ${input.concept}`,
    `학년군: ${input.gradeBand}`,
    `수업 목표: ${input.goal}`,
    `난이도: ${input.difficulty}`,
    `활동 방향: ${input.interactionKind}`,
    "",
    "[출력 구조]",
    "아래 3개 섹션 순서를 반드시 지켜 주세요.",
    "1. 교사용 한 줄: 수업에서 어떻게 쓰면 좋은지 한 줄로 정리합니다.",
    "2. HTML 코드: 주석을 포함한 단일 HTML 전체를 ```html 코드블록으로 제공합니다.",
    "3. 학습 질문: 핵심 질문 3개를 제안합니다.",
    "",
    "[핵심 제작 원칙]",
    "- 단일 파일 완결성: 별도 이미지나 설치 없이 HTML 하나 안에 CSS와 JS를 포함합니다.",
    "- 교실 TV에서도 잘 보이도록 큰 글씨, 고대비, 넓은 버튼을 사용합니다.",
    "- 현재 상태를 실시간으로 보여주는 대시보드 영역을 포함합니다.",
    "- 재생/일시정지, 배속 조절, 리셋, 특정 이벤트 트리거 버튼을 반드시 만듭니다.",
    "- 학생이 수치를 입력하거나 슬라이더/드래그/버튼으로 직접 조작하면 결과가 즉시 변하는 실험 요소를 넣습니다.",
    "- 반응형 디자인으로 태블릿, 노트북, 전자칠판에서 깨지지 않게 만듭니다.",
    "- 수치 비교나 단위 감각이 필요한 경우 실제적인 기준과 비율을 코드 안에 반영해 왜곡을 줄입니다.",
    "",
    "[CDN / 이미지 정책]",
    "- 외부 이미지는 사용하지 말고 CSS 도형, SVG, 텍스트 라벨, 단위 스케일로 표현합니다.",
    "- CDN은 아래 허용 목록만 사용할 수 있습니다.",
    `- ${allowedCdnGuide}`,
    "- 그 외 CDN, 외부 이미지, 외부 CSS, 외부 링크 리소스는 사용하지 않습니다.",
    "",
    "[금지 항목]",
    "- fetch, XMLHttpRequest, WebSocket, EventSource, sendBeacon",
    "- localStorage, sessionStorage, indexedDB, cookie",
    "- geolocation, camera, microphone, clipboard, Notification, serviceWorker",
    "- eval, new Function, dynamic import, document.write, 문자열 setTimeout/setInterval",
    "- form 제출, 파일 업로드, iframe/object/embed 중첩, 상위 창 이동",
    "",
    "[수학프로 이벤트 전송 계약]",
    "- HTML 안에서 window.parent.postMessage를 사용해 학생 조작 과정을 보냅니다.",
    "- 모든 메시지는 source: 'mathpro-html-activity', eventType, blockId, payload를 포함합니다.",
    "- 활동 준비 시 ready 이벤트를 보냅니다.",
    "- 학생의 조작에는 interaction, select, drag-end, submit 이벤트를 사용합니다.",
    "- 활동 완료 버튼을 만들고 complete 이벤트를 반드시 보냅니다.",
    "- 예시:",
    "window.parent.postMessage({ source: 'mathpro-html-activity', type: 'submit', eventType: 'submit', blockId: 'main-activity', payload: { isCorrect: true, response: '학생 응답', misconceptionSignal: null } }, '*');",
    "",
    "[최종 확인]",
    "- 학생에게는 코드가 보이지 않고 멋진 수업 화면만 보여야 합니다.",
    "- 선생님이 바로 수업에 쓸 수 있도록 교사용 한 줄과 질문 3개를 구체적으로 작성합니다.",
  ].join("\n");
}

export function extractFirstHtmlDocument(rawText: string) {
  const fencedHtml = rawText.match(
    /```(?:html|HTML)?\s*([\s\S]*?<html[\s\S]*?<\/html>[\s\S]*?)```/i,
  );

  if (fencedHtml?.[1]) {
    return normalizeHtmlDocument(fencedHtml[1]);
  }

  const fullHtml = rawText.match(
    /(?:<!doctype\s+html[^>]*>\s*)?<html[\s\S]*?<\/html>/i,
  );

  return fullHtml?.[0] ? normalizeHtmlDocument(fullHtml[0]) : null;
}

export function parseAiMaterialOutput(
  rawText: string,
): ParsedAiMaterialOutput {
  const html = extractFirstHtmlDocument(rawText);
  const textWithoutHtml = stripHtmlBlocks(rawText);

  return {
    teacherGuide: extractTeacherGuide(textWithoutHtml),
    html,
    learningQuestions: extractLearningQuestions(textWithoutHtml),
    rawText,
  };
}

function normalizeHtmlDocument(html: string) {
  return html
    .replace(/^```(?:html|HTML)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function stripHtmlBlocks(rawText: string) {
  return rawText
    .replace(/```(?:html|HTML)?\s*[\s\S]*?```/gi, "\n")
    .replace(/(?:<!doctype\s+html[^>]*>\s*)?<html[\s\S]*?<\/html>/gi, "\n");
}

function extractTeacherGuide(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const inlineGuide = lines
    .map((line) =>
      line.match(
        /^(?:#+\s*)?(?:\d+\.\s*)?교사용\s*한\s*줄\s*[:：-]?\s*(.+)$/i,
      ),
    )
    .find((match) => match?.[1]?.trim());

  if (inlineGuide?.[1]) {
    return cleanListPrefix(inlineGuide[1]);
  }

  const guideIndex = lines.findIndex((line) =>
    /교사용\s*한\s*줄/i.test(line),
  );
  const nextLine = guideIndex >= 0 ? lines[guideIndex + 1] : undefined;

  return nextLine ? cleanListPrefix(nextLine) : undefined;
}

function extractLearningQuestions(text: string) {
  const sectionMatch = text.match(/학습\s*질문[\s\S]*$/i);
  const source = sectionMatch?.[0] ?? text;

  return source
    .split(/\r?\n/)
    .map((line) => cleanListPrefix(line.trim()))
    .filter((line) => line.length > 0)
    .filter((line) => !/^학습\s*질문/i.test(line))
    .filter((line) => line.includes("?") || /무엇|어떻게|왜|비교|설명/.test(line))
    .slice(0, 3);
}

function cleanListPrefix(text: string) {
  return text.replace(/^(?:[-*•]\s*|\d+[.)]\s*)/, "").trim();
}
