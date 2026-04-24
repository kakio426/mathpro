import type {
  CreateTeacherDraftRequest,
  InteractiveBlockKind,
  TeacherDifficulty,
} from "@/types/teacher";

export type TeacherHtmlTemplate = {
  id: string;
  title: string;
  description: string;
  concept: string;
  goal: string;
  interactionKind: InteractiveBlockKind;
  difficulty: TeacherDifficulty;
  sourceLessonSlug: string;
  html: string;
};

const fractionBarsHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f8fafc; color: #172554; }
    main { max-width: 760px; margin: 0 auto; padding: 24px; }
    button { border: 1px solid #0f766e; border-radius: 8px; background: white; padding: 14px; cursor: pointer; }
    .bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 24px 0; }
    .piece.selected { background: #5eead4; }
  </style>
</head>
<body>
  <main>
    <h1>분수 막대 만들기</h1>
    <p>초코바 1개를 4등분했다고 생각하고 2칸을 골라 2/4를 만들어 보세요.</p>
    <div class="bar">
      <button class="piece" data-index="0">1</button>
      <button class="piece" data-index="1">2</button>
      <button class="piece" data-index="2">3</button>
      <button class="piece" data-index="3">4</button>
    </div>
    <button id="submit">제출하기</button>
    <button id="complete">활동 완료</button>
    <p id="feedback"></p>
  </main>
  <script>
    const selected = new Set();
    const send = (eventType, payload) => {
      window.parent.postMessage({
        source: "mathpro-html-activity",
        type: eventType,
        eventType,
        blockId: "fraction-bar-html",
        payload
      }, "*");
    };

    send("ready", { title: "분수 막대 만들기" });

    document.querySelectorAll(".piece").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        selected.has(index) ? selected.delete(index) : selected.add(index);
        button.classList.toggle("selected");
        send("select", { selectedParts: Array.from(selected).sort() });
      });
    });

    document.querySelector("#submit").addEventListener("click", () => {
      const answer = Array.from(selected).sort().join(",");
      const isCorrect = answer === "0,1";
      document.querySelector("#feedback").textContent = isCorrect
        ? "좋아요. 4조각 중 2조각을 골랐어요."
        : "전체를 4등분했는지, 몇 조각을 골랐는지 다시 확인해 보세요.";
      send("submit", {
        isCorrect,
        response: Array.from(selected).sort(),
        misconceptionSignal: isCorrect ? null : "selected-parts-mismatch"
      });
    });

    document.querySelector("#complete").addEventListener("click", () => {
      send("complete", { isCorrect: true });
    });
  </script>
</body>
</html>`;

const numberLineHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #fffbeb; color: #12312e; }
    main { max-width: 780px; margin: 0 auto; padding: 28px; }
    .panel { border: 2px solid #0f766e; border-radius: 24px; background: white; padding: 24px; box-shadow: 0 16px 40px rgba(15, 118, 110, 0.12); }
    .line { position: relative; height: 96px; margin: 30px 0 12px; }
    .track { position: absolute; left: 0; right: 0; top: 42px; height: 6px; border-radius: 999px; background: #0f766e; }
    .ticks { display: grid; grid-template-columns: repeat(5, 1fr); position: absolute; inset: 24px 0 0; }
    .tick { position: relative; text-align: center; font-weight: 700; }
    .tick::before { content: ""; display: block; width: 3px; height: 38px; margin: 0 auto 12px; border-radius: 999px; background: #0f766e; }
    input[type="range"] { width: 100%; accent-color: #f59e0b; }
    button { border: 0; border-radius: 14px; background: #0f766e; color: white; padding: 14px 18px; font-weight: 700; cursor: pointer; }
    button.secondary { background: #f59e0b; color: #422006; }
    #feedback { min-height: 28px; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <h1>수직선에서 3/4 찾기</h1>
      <p>0과 1 사이를 같은 간격 4칸으로 나누고, 3/4 위치에 표시해 보세요.</p>
      <div class="line" aria-hidden="true">
        <div class="track"></div>
        <div class="ticks">
          <span class="tick">0</span>
          <span class="tick">1/4</span>
          <span class="tick">2/4</span>
          <span class="tick">3/4</span>
          <span class="tick">1</span>
        </div>
      </div>
      <label>
        표시 위치
        <input id="marker" type="range" min="0" max="4" step="1" value="0" />
      </label>
      <p id="selected">현재 위치: 0/4</p>
      <button id="submit">위치 확인</button>
      <button id="hint" class="secondary">힌트 보기</button>
      <button id="complete">활동 완료</button>
      <p id="feedback"></p>
    </section>
  </main>
  <script>
    const marker = document.querySelector("#marker");
    const selectedText = document.querySelector("#selected");
    const feedback = document.querySelector("#feedback");
    const send = (eventType, payload) => {
      window.parent.postMessage({
        source: "mathpro-html-activity",
        type: eventType,
        eventType,
        blockId: "number-line-html",
        payload
      }, "*");
    };

    send("ready", { title: "수직선에서 3/4 찾기" });

    marker.addEventListener("input", () => {
      selectedText.textContent = "현재 위치: " + marker.value + "/4";
      send("select", { selectedStep: Number(marker.value), partitionCount: 4 });
    });

    marker.addEventListener("change", () => {
      send("drag-end", { selectedStep: Number(marker.value), partitionCount: 4 });
    });

    document.querySelector("#hint").addEventListener("click", () => {
      feedback.textContent = "0에서 시작해 같은 간격으로 세 칸 이동하면 3/4입니다.";
      send("hint-open", { hint: "count-three-equal-steps" });
    });

    document.querySelector("#submit").addEventListener("click", () => {
      const isCorrect = Number(marker.value) === 3;
      feedback.textContent = isCorrect
        ? "정확해요. 같은 간격 세 칸이 3/4입니다."
        : "간격이 모두 같은지 확인하고 0에서 몇 칸 이동했는지 세어 보세요.";
      send("submit", {
        isCorrect,
        response: marker.value + "/4",
        misconceptionSignal: isCorrect ? null : "number-line-spacing"
      });
    });

    document.querySelector("#complete").addEventListener("click", () => {
      send("complete", { isCorrect: Number(marker.value) === 3 });
    });
  </script>
</body>
</html>`;

const dragSortHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #eefdf8; color: #12312e; }
    main { max-width: 820px; margin: 0 auto; padding: 26px; }
    .board { display: grid; gap: 16px; }
    .card { border: 2px solid #cbd5e1; border-radius: 20px; background: white; padding: 16px; }
    .choices { display: grid; gap: 10px; margin-top: 12px; }
    button { border: 1px solid #0f766e; border-radius: 14px; background: white; padding: 12px; font-weight: 700; cursor: pointer; }
    button.selected { background: #0f766e; color: white; }
    button.action { background: #f59e0b; border-color: #f59e0b; color: #422006; }
    #feedback { min-height: 28px; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>같은 전체인지 분류하기</h1>
    <p>두 그림의 전체 크기가 같아야 분수 크기를 바로 비교할 수 있습니다. 각 상황을 분류해 보세요.</p>
    <div class="board">
      <section class="card" data-id="same">
        <h2>상황 A</h2>
        <p>같은 크기의 피자 두 판에서 1/2과 1/4을 비교합니다.</p>
        <div class="choices">
          <button data-target="same">같은 전체</button>
          <button data-target="different">다른 전체</button>
        </div>
      </section>
      <section class="card" data-id="different">
        <h2>상황 B</h2>
        <p>작은 피자의 1/2과 큰 피자의 1/4을 비교합니다.</p>
        <div class="choices">
          <button data-target="same">같은 전체</button>
          <button data-target="different">다른 전체</button>
        </div>
      </section>
    </div>
    <p id="feedback"></p>
    <button id="submit" class="action">분류 확인</button>
    <button id="retry">다시 생각하기</button>
    <button id="complete">활동 완료</button>
  </main>
  <script>
    const answers = {};
    const send = (eventType, payload) => {
      window.parent.postMessage({
        source: "mathpro-html-activity",
        type: eventType,
        eventType,
        blockId: "same-whole-sort-html",
        payload
      }, "*");
    };

    send("ready", { title: "같은 전체인지 분류하기" });

    document.querySelectorAll(".card").forEach((card) => {
      card.querySelectorAll("button[data-target]").forEach((button) => {
        button.addEventListener("click", () => {
          card.querySelectorAll("button[data-target]").forEach((item) => item.classList.remove("selected"));
          button.classList.add("selected");
          answers[card.dataset.id] = button.dataset.target;
          send("select", { situationId: card.dataset.id, group: button.dataset.target });
        });
      });
    });

    document.querySelector("#retry").addEventListener("click", () => {
      send("retry", { reason: "student-wants-to-reclassify" });
      document.querySelector("#feedback").textContent = "좋아요. 전체가 같은지 먼저 보고 다시 고르세요.";
    });

    document.querySelector("#submit").addEventListener("click", () => {
      const isCorrect = answers.same === "same" && answers.different === "different";
      document.querySelector("#feedback").textContent = isCorrect
        ? "잘 분류했어요. 전체가 다르면 분수만 보고 바로 비교하면 안 됩니다."
        : "전체의 크기가 같은지 먼저 확인해 보세요.";
      send("submit", {
        isCorrect,
        response: answers,
        misconceptionSignal: isCorrect ? null : "different-whole-direct-compare"
      });
    });

    document.querySelector("#complete").addEventListener("click", () => {
      send("complete", { isCorrect: answers.same === "same" && answers.different === "different" });
    });
  </script>
</body>
</html>`;

const matchingHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #fff7ed; color: #12312e; }
    main { max-width: 860px; margin: 0 auto; padding: 26px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .stack { display: grid; gap: 10px; }
    button { border: 2px solid #fed7aa; border-radius: 16px; background: white; padding: 14px; font-weight: 700; cursor: pointer; text-align: left; }
    button.active { border-color: #0f766e; background: #ccfbf1; }
    .pairs { margin: 16px 0; border-radius: 18px; background: white; padding: 14px; }
    #feedback { min-height: 28px; font-weight: 700; }
    .action { background: #0f766e; border-color: #0f766e; color: white; text-align: center; }
  </style>
</head>
<body>
  <main>
    <h1>분모와 분자 뜻 연결하기</h1>
    <p>왼쪽의 말을 오른쪽 뜻과 짝지어 보세요.</p>
    <div class="grid">
      <section>
        <h2>말</h2>
        <div class="stack">
          <button data-left="denominator">분모</button>
          <button data-left="numerator">분자</button>
        </div>
      </section>
      <section>
        <h2>뜻</h2>
        <div class="stack">
          <button data-right="parts">전체를 같은 크기로 나눈 수</button>
          <button data-right="selected">그중 선택한 부분 수</button>
        </div>
      </section>
    </div>
    <div class="pairs">
      <strong>현재 짝:</strong>
      <p id="pairs">아직 짝이 없습니다.</p>
    </div>
    <p id="feedback"></p>
    <button id="submit" class="action">짝 확인</button>
    <button id="complete" class="action">활동 완료</button>
  </main>
  <script>
    let activeLeft = null;
    const pairs = {};
    const pairText = document.querySelector("#pairs");
    const feedback = document.querySelector("#feedback");
    const send = (eventType, payload) => {
      window.parent.postMessage({
        source: "mathpro-html-activity",
        type: eventType,
        eventType,
        blockId: "numerator-denominator-matching-html",
        payload
      }, "*");
    };

    const labels = {
      denominator: "분모",
      numerator: "분자",
      parts: "전체를 같은 크기로 나눈 수",
      selected: "선택한 부분 수"
    };

    const updatePairs = () => {
      const entries = Object.entries(pairs);
      pairText.textContent = entries.length
        ? entries.map(([left, right]) => labels[left] + " - " + labels[right]).join(" / ")
        : "아직 짝이 없습니다.";
    };

    send("ready", { title: "분모와 분자 뜻 연결하기" });

    document.querySelectorAll("button[data-left]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLeft = button.dataset.left;
        document.querySelectorAll("button[data-left]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        send("select", { selectedTerm: activeLeft });
      });
    });

    document.querySelectorAll("button[data-right]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!activeLeft) {
          feedback.textContent = "먼저 왼쪽에서 분모 또는 분자를 고르세요.";
          return;
        }
        pairs[activeLeft] = button.dataset.right;
        updatePairs();
        send("select", { selectedTerm: activeLeft, matchedMeaning: button.dataset.right, pairs });
      });
    });

    document.querySelector("#submit").addEventListener("click", () => {
      const isCorrect = pairs.denominator === "parts" && pairs.numerator === "selected";
      feedback.textContent = isCorrect
        ? "맞아요. 분모는 나눈 수, 분자는 선택한 부분 수입니다."
        : "분모와 분자의 역할을 바꾸어 생각하고 있지 않은지 확인해 보세요.";
      send("submit", {
        isCorrect,
        response: pairs,
        misconceptionSignal: isCorrect ? null : "symbol-meaning-mismatch"
      });
    });

    document.querySelector("#complete").addEventListener("click", () => {
      send("complete", { isCorrect: pairs.denominator === "parts" && pairs.numerator === "selected" });
    });
  </script>
</body>
</html>`;

export const teacherHtmlTemplates = [
  {
    id: "fraction-bars",
    title: "분수 막대 조작",
    description: "전체를 같은 크기로 나누고 선택한 부분을 확인하는 기본 활동입니다.",
    concept: "분수의 의미",
    goal: "전체를 같은 크기로 나눈 것 중 일부라는 분수의 의미를 조작으로 설명한다.",
    interactionKind: "html-artifact",
    difficulty: "standard",
    sourceLessonSlug: "whole-and-part",
    html: fractionBarsHtml,
  },
  {
    id: "number-line",
    title: "수직선 위치 찾기",
    description: "0과 1 사이를 등간격으로 나누고 분수 위치를 표시합니다.",
    concept: "수직선 위 분수",
    goal: "0과 1 사이를 같은 간격으로 나누어 3/4의 위치를 찾고 설명한다.",
    interactionKind: "number-line",
    difficulty: "standard",
    sourceLessonSlug: "fractions-on-a-number-line",
    html: numberLineHtml,
  },
  {
    id: "same-whole-sort",
    title: "같은 전체 분류",
    description: "분수 비교 전에 전체가 같은지 먼저 보는 습관을 만듭니다.",
    concept: "같은 전체에서 크기 비교",
    goal: "분수를 비교하기 전에 두 분수가 같은 전체를 기준으로 하는지 분류한다.",
    interactionKind: "drag-sort",
    difficulty: "standard",
    sourceLessonSlug: "compare-fractions-same-whole",
    html: dragSortHtml,
  },
  {
    id: "symbol-meaning-matching",
    title: "분모와 분자 매칭",
    description: "분수 기호와 조작 의미를 짝지어 기호-의미 연결을 확인합니다.",
    concept: "분모와 분자",
    goal: "분모는 나눈 수, 분자는 선택한 부분 수라는 뜻을 짝짓기 활동으로 설명한다.",
    interactionKind: "matching",
    difficulty: "easy",
    sourceLessonSlug: "denominator-and-numerator",
    html: matchingHtml,
  },
] as const satisfies readonly TeacherHtmlTemplate[];

export function createDraftRequestFromTemplate(
  template: TeacherHtmlTemplate,
): CreateTeacherDraftRequest {
  return {
    gradeBand: "3-4",
    concept: template.concept,
    goal: template.goal,
    interactionKind: template.interactionKind,
    difficulty: template.difficulty,
    sourceLessonSlug: template.sourceLessonSlug,
    html: template.html,
  };
}

