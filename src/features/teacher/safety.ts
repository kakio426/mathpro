import type {
  ActivityBlock,
  HtmlArtifactSafetyStatus,
  TeacherActivityDocument,
} from "@/types/teacher";

type HtmlSafetySeverity = "warning" | "blocked";

type HtmlSafetyRule = {
  code: string;
  severity: HtmlSafetySeverity;
  pattern: RegExp;
  message: string;
};

type HtmlSafetyIssue = {
  code: string;
  severity: HtmlSafetySeverity;
  message: string;
};

export type HtmlArtifactSafetyResult = {
  status: HtmlArtifactSafetyStatus;
  warnings: string[];
  issues: HtmlSafetyIssue[];
};

const safetyRules: HtmlSafetyRule[] = [
  {
    code: "external-script",
    severity: "blocked",
    pattern: /<script\b[^>]*\bsrc\s*=/i,
    message: "외부 script src는 허용하지 않습니다. HTML 안에 필요한 코드를 직접 포함해 주세요.",
  },
  {
    code: "external-resource",
    severity: "blocked",
    pattern:
      /\b(?:href|src|action|poster|data)\s*=\s*["']?\s*https?:\/\/|@import\s+["']https?:\/\/|url\(\s*["']?https?:\/\//i,
    message: "외부 이미지, CSS, 링크, 리소스 호출은 차단합니다. 수업 자료는 단일 HTML 안에 모두 포함해 주세요.",
  },
  {
    code: "javascript-url",
    severity: "blocked",
    pattern: /\b(?:href|src|action)\s*=\s*["']?\s*javascript:/i,
    message: "javascript: URL은 숨은 코드 실행 위험이 있어 사용할 수 없습니다.",
  },
  {
    code: "nested-frame",
    severity: "blocked",
    pattern: /<(iframe|object|embed)\b/i,
    message: "iframe, object, embed 중첩은 학생 화면 sandbox 안에서 허용하지 않습니다.",
  },
  {
    code: "base-tag",
    severity: "blocked",
    pattern: /<base\b/i,
    message: "base 태그는 링크 기준 경로를 바꿀 수 있어 허용하지 않습니다.",
  },
  {
    code: "meta-refresh",
    severity: "blocked",
    pattern: /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?refresh/i,
    message: "meta refresh 자동 이동은 학생 화면을 예상 밖으로 이동시킬 수 있어 차단합니다.",
  },
  {
    code: "form-submit",
    severity: "blocked",
    pattern: /<form\b/i,
    message: "form 제출은 외부 전송 위험이 있어 사용할 수 없습니다. 버튼과 postMessage 이벤트로 기록해 주세요.",
  },
  {
    code: "file-input",
    severity: "blocked",
    pattern: /<input\b[^>]*\btype\s*=\s*["']?file/i,
    message: "파일 업로드 입력은 학생 개인정보 전송 위험이 있어 차단합니다.",
  },
  {
    code: "network-request",
    severity: "blocked",
    pattern: /\b(fetch\s*\(|XMLHttpRequest\b|WebSocket\b|EventSource\b|sendBeacon\s*\()/i,
    message: "외부 네트워크 요청은 허용하지 않습니다. 학생 조작 기록은 postMessage로만 보내 주세요.",
  },
  {
    code: "browser-storage",
    severity: "blocked",
    pattern: /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/i,
    message: "브라우저 저장소와 cookie 접근은 학생 환경 보호를 위해 차단합니다.",
  },
  {
    code: "browser-permission-api",
    severity: "blocked",
    pattern:
      /\bnavigator\.(geolocation|mediaDevices|clipboard|permissions|serviceWorker)\b|\bNotification\.requestPermission\s*\(/i,
    message: "위치, 카메라, 마이크, 클립보드, 알림 같은 브라우저 권한 API는 수업 자료에서 사용할 수 없습니다.",
  },
  {
    code: "top-navigation",
    severity: "blocked",
    pattern:
      /\b(window\.)?(top|opener)\b|(?:parent|top|window)\.location\b|\blocation\.(href|assign|replace)\b|\b(?:window\.)?parent\.document\b/i,
    message: "상위 창 제어 또는 강제 이동 코드는 허용하지 않습니다.",
  },
  {
    code: "dynamic-code-execution",
    severity: "blocked",
    pattern:
      /\b(eval\s*\(|new\s+Function\s*\(|import\s*\(|document\.write\s*\(|(?:setTimeout|setInterval)\s*\(\s*["'])/i,
    message: "eval, new Function, 동적 import, document.write, 문자열 타이머는 실행 코드를 숨길 수 있어 차단합니다.",
  },
  {
    code: "inline-event-handler",
    severity: "warning",
    pattern: /\son[a-z]+\s*=/i,
    message: "onclick 같은 inline 이벤트 핸들러가 있습니다. 가능하면 script 안의 addEventListener로 정리해 주세요.",
  },
];

function hasMathproPostMessageSource(html: string) {
  return /source\s*:\s*["']mathpro-html-activity["']/i.test(html);
}

function hasParentPostMessage(html: string) {
  return /window\.parent\.postMessage\s*\(/i.test(html);
}

function hasCompleteEvent(html: string) {
  return /eventType\s*:\s*["']complete["']|type\s*:\s*["']complete["']|mathproEvent\s*:\s*["']complete["']/i.test(
    html,
  );
}

function createCustomIssues(html: string): HtmlSafetyIssue[] {
  const issues: HtmlSafetyIssue[] = [];

  if (!hasParentPostMessage(html)) {
    issues.push({
      code: "missing-postmessage",
      severity: "warning",
      message:
        "postMessage 이벤트가 없습니다. 학생 조작 과정이 저장되지 않아 리포트가 빈약해질 수 있습니다.",
    });

    return issues;
  }

  if (!hasMathproPostMessageSource(html)) {
    issues.push({
      code: "missing-postmessage-source",
      severity: "warning",
      message:
        "postMessage에는 source: 'mathpro-html-activity'를 포함해야 분석이 안정적입니다.",
    });
  }

  if (!hasCompleteEvent(html)) {
    issues.push({
      code: "missing-complete-event",
      severity: "warning",
      message:
        "complete 이벤트가 없습니다. 학생이 활동을 끝내도 자동으로 리포트 화면으로 이동하지 못할 수 있습니다.",
    });
  }

  return issues;
}

export function validateHtmlArtifactSafety(
  html: string,
): HtmlArtifactSafetyResult {
  const issues = [
    ...safetyRules
      .filter((rule) => rule.pattern.test(html))
      .map((rule) => ({
        code: rule.code,
        severity: rule.severity,
        message: rule.message,
      })),
    ...createCustomIssues(html),
  ];

  const hasBlockedIssue = issues.some((issue) => issue.severity === "blocked");
  const hasWarningIssue = issues.some((issue) => issue.severity === "warning");

  return {
    status: hasBlockedIssue ? "blocked" : hasWarningIssue ? "warning" : "passed",
    warnings: issues.map((issue) => issue.message),
    issues,
  };
}

export function withHtmlArtifactSafety(block: ActivityBlock): ActivityBlock {
  if (block.type !== "html-artifact" || !block.html) {
    return block;
  }

  const result = validateHtmlArtifactSafety(block.html);

  return {
    ...block,
    safetyStatus: result.status,
    safetyWarnings: result.warnings,
  };
}

export function withDocumentHtmlSafety(
  document: TeacherActivityDocument,
): TeacherActivityDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) => withHtmlArtifactSafety(block)),
  };
}

export function getBlockedHtmlArtifactWarnings(
  document: TeacherActivityDocument,
) {
  return document.blocks
    .filter((block) => block.type === "html-artifact")
    .flatMap((block) =>
      block.safetyStatus === "blocked" ? (block.safetyWarnings ?? []) : [],
    );
}
