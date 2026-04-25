function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function toFriendlyConcept(value: string) {
  const cleaned = normalizeSpaces(
    value
      .replace(/^T\d+\s*QA\s*/i, "")
      .replace(/\bHTML\b/gi, "")
      .replace(/인터랙티브\s*자료/g, "")
      .replace(/수업자료/g, "")
      .replace(/\s+/g, " "),
  );

  return cleaned || "수학 개념";
}

function cleanTechnicalTitle(value: string) {
  return normalizeSpaces(
    value
      .replace(/^T\d+\s*QA\s*/i, "")
      .replace(/^T\d+[-_\s]*/i, "")
      .replace(/\d{4}-\d{2}-\d{2}T[0-9:.Z-]+/g, "")
      .replace(/html[-_\s]*artifact/gi, "")
      .replace(/\bHTML\b/gi, "")
      .replace(/인터랙티브\s*자료/g, "활동")
      .replace(/artifact/gi, "")
      .replace(/\s+/g, " "),
  );
}

function objectParticle(value: string) {
  const lastChar = value.trim().at(-1);

  if (!lastChar) {
    return "을";
  }

  const code = lastChar.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) {
    return "을";
  }

  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

export function hasTechnicalCopy(value: string) {
  return /html|postmessage|iframe|artifact|event|이벤트/i.test(value);
}

export function toFriendlyMaterialTitle(title: string, concept?: string) {
  const cleaned = cleanTechnicalTitle(title);
  const friendlyConcept = concept ? toFriendlyConcept(concept) : "";

  if (!cleaned || /^QA$/i.test(cleaned) || /20\d{2}/.test(cleaned)) {
    return friendlyConcept ? `${friendlyConcept} 수업자료` : "수업자료";
  }

  if (/^T\d+\s*QA/i.test(title) && friendlyConcept) {
    return `${friendlyConcept} 수업자료`;
  }

  if (hasTechnicalCopy(title) && friendlyConcept) {
    return `${friendlyConcept} 수업자료`;
  }

  return cleaned;
}

export function toFriendlyActivityTitle(title: string, concept?: string) {
  const materialTitle = toFriendlyMaterialTitle(title, concept);
  const sourceLooksTechnical =
    hasTechnicalCopy(title) || /^T\d+[-_\s]*(QA|HTML|artifact)?/i.test(title);

  if (materialTitle.endsWith("수업자료")) {
    return materialTitle.replace(/수업자료$/, "활동");
  }

  if (sourceLooksTechnical && !materialTitle.endsWith("활동")) {
    return `${materialTitle} 활동`;
  }

  return materialTitle;
}

export function toStudentActivityInstruction(value: string, concept: string) {
  const friendlyConcept = toFriendlyConcept(concept);

  if (!value || hasTechnicalCopy(value)) {
    return `${friendlyConcept}${objectParticle(friendlyConcept)} 직접 눌러 보고 움직이며 생각해 보세요. 활동이 끝나면 선생님이 여러분의 탐구 과정을 함께 살펴볼 수 있습니다.`;
  }

  return value;
}

export function toFriendlyHtmlArtifactSource(html: string, concept: string) {
  const friendlyConcept = toFriendlyConcept(concept);

  return html
    .replace(
      /T\d+\s*QA\s*\d{4}-\d{2}-\d{2}T[0-9:.Z-]+/gi,
      `${friendlyConcept} 활동`,
    )
    .replace(/T\d+\s*QA\s*/gi, "")
    .replace(/html[-_\s]*artifact/gi, "활동");
}
