import {
  precisionAtK,
  recallAtK
} from "./precisionRecall.js";

import {
  averagePrecision,
  meanAveragePrecision
} from "./averagePrecision.js";

import {
  reciprocalRank,
  meanReciprocalRank
} from "./reciprocalRank.js";

import { ndcgAtK } from "./ndcg.js";

export const EvaluationMetrics = {
  precisionAtK,
  recallAtK,
  averagePrecision,
  meanAveragePrecision,
  reciprocalRank,
  meanReciprocalRank,
  ndcgAtK
};