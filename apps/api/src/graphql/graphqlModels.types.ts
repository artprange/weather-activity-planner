import type { DailyAssessmentType } from '../scoring/scoring.types.js';

type EvaluationWindowType = NonNullable<DailyAssessmentType['window']>;

export type { EvaluationWindowType };
