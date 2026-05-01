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

const embeddedMathproArtifactStyle = `
  <style data-mathpro-embed-fit>
    @media screen {
      html,
      body {
        height: 100%;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      body {
        margin: 0 !important;
      }

      .app {
        height: 100%;
        min-height: 0 !important;
        overflow: hidden !important;
        padding: clamp(10px, 1.4vw, 18px) !important;
      }

      .shell {
        height: 100%;
        max-height: 100%;
        min-height: 0;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 380px) !important;
        grid-template-rows: minmax(0, 1fr) auto !important;
        gap: clamp(10px, 1.6vw, 18px) !important;
      }

      .shell > header {
        display: none !important;
      }

      .stage {
        min-height: 0 !important;
        height: 100%;
        padding: clamp(12px, 1.4vw, 18px) !important;
        gap: 12px !important;
      }

      .visual {
        min-height: 0 !important;
      }

      .dashboard {
        grid-column: 2;
        grid-row: 1 / 3;
        position: static !important;
        top: auto !important;
        max-height: 100%;
        min-height: 0;
        overflow: auto;
        padding: 14px !important;
        gap: 12px !important;
      }

      .flow {
        grid-column: 1;
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.7fr) minmax(0, 1.25fr) !important;
        min-height: 0;
        max-height: min(35vh, 250px);
        overflow: hidden;
        gap: 10px !important;
      }

      .flow-card {
        min-height: 0;
        overflow: auto;
        padding: 10px !important;
        gap: 7px !important;
      }

      .flow-card h2 {
        font-size: clamp(17px, 1.8vw, 22px) !important;
      }

      .flow-card p {
        font-size: clamp(13px, 1.25vw, 15px) !important;
        line-height: 1.3 !important;
      }

      .options {
        gap: 6px !important;
      }

      .flow-card button {
        min-height: 30px !important;
        padding: 5px 8px !important;
        font-size: 13px !important;
        line-height: 1.2 !important;
      }

      .circle {
        width: min(100%, 210px) !important;
        border-width: 8px !important;
        font-size: 22px !important;
      }

      button {
        min-height: 40px !important;
        padding: 8px 12px !important;
        font-size: clamp(14px, 1.35vw, 16px) !important;
      }

      .toolbar {
        gap: 8px !important;
      }

      .metric {
        padding: 10px !important;
      }

      .metric strong {
        font-size: clamp(24px, 3vw, 34px) !important;
      }

      .message {
        min-height: 44px !important;
        font-size: 16px !important;
      }
    }

    @media screen and (max-width: 920px) {
      html,
      body,
      .app {
        height: auto;
        min-height: 100% !important;
        overflow: auto !important;
      }

      .shell {
        height: auto;
        grid-template-columns: 1fr !important;
        grid-template-rows: none !important;
      }

      .flow {
        grid-template-columns: 1fr !important;
        max-height: none;
        overflow: visible;
      }

      .dashboard,
      .flow {
        grid-column: auto !important;
        grid-row: auto !important;
      }
    }
  </style>
`;

function shouldFitEmbeddedMathproArtifact(html: string) {
  return html.includes("mathpro-html-activity");
}

function injectEmbeddedMathproArtifactStyle(html: string) {
  if (
    !shouldFitEmbeddedMathproArtifact(html) ||
    html.includes("data-mathpro-embed-fit")
  ) {
    return html;
  }

  const headCloseMatch = html.match(/<\/head\s*>/i);

  if (!headCloseMatch || headCloseMatch.index === undefined) {
    return `${embeddedMathproArtifactStyle}${html}`;
  }

  return [
    html.slice(0, headCloseMatch.index),
    embeddedMathproArtifactStyle,
    html.slice(headCloseMatch.index),
  ].join("");
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

  const source = html
    .replace(
      /T\d+\s*QA\s*\d{4}-\d{2}-\d{2}T[0-9:.Z-]+/gi,
      `${friendlyConcept} 활동`,
    )
    .replace(/T\d+\s*QA\s*/gi, "")
    .replace(/html[-_\s]*artifact/gi, "활동");

  return injectEmbeddedMathproArtifactStyle(source);
}
