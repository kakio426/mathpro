# S0 Scope Freeze: Fraction Lab v1

## Summary
- Product: `Fraction Lab v1`
- Audience: `Parents and students (B2C)`
- Surface: `Responsive web`
- Access model: `Guest trial + optional signup`
- First module: `Grades 3-4 fraction exploration`
- Goal session length: `10-15 minutes`
- Core outputs:
  - One structured interactive learning session
  - Misconception-based diagnosis
  - Four-block parent report

## Frozen Session Structure
Every v1 lesson must follow the same sequence:
1. Pre-diagnosis
2. Manipulation
3. Prediction
4. Explanation
5. Generalization
6. Report

## Frozen Lesson Scope
Only the following four lessons are included in v1:

1. `L1 Whole and Part`
   - Students understand a fraction as some of the equal parts of one whole.
2. `L2 Denominator and Numerator`
   - Students interpret denominator as the number of equal parts and numerator as the number of selected parts.
3. `L3 Compare Fractions with the Same Whole`
   - Students compare fraction sizes only when the whole is the same.
4. `L4 Fractions on a Number Line`
   - Students place fractions on evenly partitioned number lines.

## Out of Scope
The following are explicitly excluded from v1:
- Decimal linkage
- Equivalent fractions
- Simplifying fractions
- Common denominators
- Improper fractions
- Mixed numbers
- Teacher dashboard
- Payment or subscription
- Admin CMS
- Real-time AI tutor chat

## Frozen Diagnostic Scope
V1 supports exactly eight misconception codes:

1. `M1 Ignore Whole`
   - The learner compares only parts without considering the whole.
2. `M2 Unequal Partition`
   - The learner misses the requirement that the whole must be split into equal parts.
3. `M3 Denominator Misread`
   - The learner interprets the denominator as the number of chosen parts.
4. `M4 Numerator Misread`
   - The learner interprets the numerator as the number of total parts.
5. `M5 Bigger Number Bias`
   - The learner assumes larger numerator or denominator means a larger fraction.
6. `M6 Compare Different Wholes`
   - The learner directly compares fractions even when the wholes differ.
7. `M7 Number Line Spacing`
   - The learner does not treat number-line intervals as equal.
8. `M8 Symbol Meaning Disconnect`
   - The learner can read the symbol but cannot connect it to the manipulation result.

Allowed diagnostic signals:
- Correctness
- Attempt count
- Time to first submit
- Hint usage count
- Self-correction after retry
- Explanation submitted or not

## AI Policy
- AI is not used for core judgment.
- AI may only be used later for:
  - Explanation-text assistance
  - Parent-report wording refinement

## Frozen Interaction Boundary
Allowed activity kinds:
- `fraction-bars`
- `number-line`
- `multiple-choice`
- `free-text`

Allowed semantic event types:
- `select`
- `drag-end`
- `drop`
- `submit`
- `hint-open`
- `retry`
- `free-text-submit`
- `complete`

Content source of truth:
- Repo-managed `JSON/MD` files only

Lesson expansion policy:
- New lessons must be added by combining:
  - `LessonSpec`
  - misconception rules
  - existing interaction kinds
- New page creation is not the default expansion path.

## Frozen Report Contract
The parent report must stay in this four-block shape:
- `Today’s understood concepts`
- `Misconceptions to watch`
- `Child explanation summary`
- `Recommended next activity`

Minimum output requirements:
- At least one understood concept
- At least one misconception sentence or `No clear misconception detected`
- Exactly one next recommended activity

## Working Assumptions
- Language support is Korean-only in v1.
- Learning must work on mobile and tablet, but delivery remains web-first.
- Future tasks `S1-S6` and `P1-P5` must treat this document as frozen product scope unless the scope is explicitly re-approved.
