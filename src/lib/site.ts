export const siteConfig = {
  name: "수학프로",
  moduleName: "분수 탐험실",
  description:
    "수학프로는 교사가 조작형 수학 활동을 만들고 학생에게 코드로 배포한 뒤 이해 과정을 분석하는 인터랙티브 수업 플랫폼입니다.",
  tagline: "교사 저작과 학생 조작 탐구를 잇는 수학 인터랙션 플랫폼",
  shellStage: "제작 스튜디오",
  lessons: [
    {
      id: "L1",
      slug: "whole-and-part",
      title: "전체와 부분",
      summary: "분수를 같은 크기로 나눈 전체 중 일부로 이해합니다.",
    },
    {
      id: "L2",
      slug: "denominator-and-numerator",
      title: "분모와 분자",
      summary: "분모와 분자의 역할을 조작과 언어로 연결합니다.",
    },
    {
      id: "L3",
      slug: "compare-fractions-same-whole",
      title: "같은 전체에서 크기 비교",
      summary: "전체가 같을 때만 분수의 크기를 비교합니다.",
    },
    {
      id: "L4",
      slug: "fractions-on-a-number-line",
      title: "수직선 위 분수",
      summary: "등간격 수직선 위에서 분수를 위치로 표현합니다.",
    },
  ],
  sessionFlow: [
    "사전진단",
    "조작",
    "예측",
    "설명",
    "일반화",
    "결과 리포트",
  ],
  reportBlocks: [
    "오늘 이해한 개념",
    "주의가 필요한 오개념",
    "아이의 설명 요약",
    "다음 추천 활동",
  ],
} as const;
