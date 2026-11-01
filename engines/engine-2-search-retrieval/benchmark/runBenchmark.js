import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { InvertedIndex } from "../src/indexing/invertedIndex.js";
import { tokenizeText } from "../src/tokenizer/normalization.js";
import { union } from "../src/retrieval/union.js";
import { rankDocuments } from "../src/ranking/ranker.js";

import {
  precisionAtK,
  recallAtK
} from "../src/evaluation/precisionRecall.js";

import {
  meanAveragePrecision
} from "../src/evaluation/averagePrecision.js";

import {
  meanReciprocalRank
} from "../src/evaluation/reciprocalRank.js";

import { ndcgAtK } from "../src/evaluation/ndcg.js";

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url));

const documents = JSON.parse(
  fs.readFileSync(path.join(BASE_DIR, "datasets/sample-documents.json"), "utf8")
).documents;

const queries = JSON.parse(
  fs.readFileSync(path.join(BASE_DIR, "queries/sample-queries.json"), "utf8")
).queries;

const judgements = JSON.parse(
  fs.readFileSync(
    path.join(BASE_DIR, "relevance-judgements/sample-qrels.json"),
    "utf8"
  )
).judgements;

const ALGORITHMS = ["tfidf", "bm25"];
const ROUNDS = 10;
const WARMUP_RUNS = 50;
const MEASUREMENT_RUNS = 200;

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function standardDeviation(values) {
  if (values.length === 0) return 0;

  const mean = average(values);

  return Math.sqrt(
    average(values.map(value => (value - mean) ** 2))
  );
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// Build one common index.
const index = new InvertedIndex();

for (const document of documents) {
  index.addDocument(
    document.documentId,
    tokenizeText(`${document.title} ${document.content}`)
  );
}

// Prepare candidate sets once, ensuring both algorithms use identical candidates.
const preparedQueries = queries.map(query => {
  const queryTerms = [
    ...new Set(tokenizeText(query.query).map(token => token.term))
  ];

  let candidates = [];

  for (const term of queryTerms) {
    const ids = index.getPostings(term).map(posting => posting.documentId);
    candidates = union(candidates, ids);
  }

  const relevantDocumentIds = judgements
    .filter(item => item.queryId === query.queryId && item.relevance > 0)
    .map(item => item.documentId);

  const queryJudgements = judgements
    .filter(item => item.queryId === query.queryId)
    .map(item => ({
      documentId: item.documentId,
      relevance: item.relevance
    }));

  return {
    ...query,
    queryTerms,
    candidates,
    relevantDocumentIds,
    queryJudgements
  };
});

const roundResults = {
  tfidf: [],
  bm25: []
};

const executionOrders = [];

for (let round = 0; round < ROUNDS; round++) {
  const executionOrder = shuffle(ALGORITHMS);
  executionOrders.push(executionOrder);

  const roundData = {};

  for (const algorithm of executionOrder) {
    const queryResults = [];
    const latencies = [];

    for (const query of preparedQueries) {
      const input = {
        algorithm,
        queryTerms: query.queryTerms,
        candidateDocumentIds: query.candidates,
        index,
        topK: query.candidates.length || 1
      };

      // Warm-up.
      for (let i = 0; i < WARMUP_RUNS; i++) {
        rankDocuments(input);
      }

      // Measure ranking latency.
      const start = process.hrtime.bigint();

      let rankedResults;

      for (let i = 0; i < MEASUREMENT_RUNS; i++) {
        rankedResults = rankDocuments(input);
      }

      const end = process.hrtime.bigint();

      const latencyMs =
        Number(end - start) / 1_000_000 / MEASUREMENT_RUNS;

      latencies.push(latencyMs);

      const rankedDocumentIds = rankedResults.map(
        result => result.documentId
      );

      queryResults.push({
        queryId: query.queryId,
        rankedDocumentIds,
        precisionAt5: precisionAtK(
          rankedDocumentIds,
          query.relevantDocumentIds,
          5
        ),
        recallAt10: recallAtK(
          rankedDocumentIds,
          query.relevantDocumentIds,
          10
        ),
        ndcgAt10: ndcgAtK(
          rankedDocumentIds,
          query.queryJudgements,
          10
        ),
        latencyMs
      });
    }

    const evaluationQueries = queryResults.map((result, i) => ({
      rankedDocumentIds: result.rankedDocumentIds,
      relevantDocumentIds: preparedQueries[i].relevantDocumentIds
    }));

    roundData[algorithm] = {
      precisionAt5: average(queryResults.map(q => q.precisionAt5)),
      recallAt10: average(queryResults.map(q => q.recallAt10)),
      MAP: meanAveragePrecision(evaluationQueries),
      MRR: meanReciprocalRank(evaluationQueries),
      ndcgAt10: average(queryResults.map(q => q.ndcgAt10)),
      averageRankingLatencyMs: average(latencies)
    };
  }

  for (const algorithm of ALGORITHMS) {
    roundResults[algorithm].push(roundData[algorithm]);
  }

  console.log(`Completed round ${round + 1}/${ROUNDS}`);
}

const summary = {};

for (const algorithm of ALGORITHMS) {
  const metrics = Object.keys(roundResults[algorithm][0]);
  summary[algorithm] = {};

  for (const metric of metrics) {
    const values = roundResults[algorithm].map(
      round => round[metric]
    );

    summary[algorithm][metric] = {
      mean: average(values),
      standardDeviation: standardDeviation(values),
      minimum: Math.min(...values),
      maximum: Math.max(...values)
    };
  }
}

const report = {
  experiment: "TF-IDF vs BM25",
  dataset: {
    documentCount: documents.length,
    queryCount: queries.length,
    judgementCount: judgements.length,
    type: "Synthetic development dataset"
  },
  configuration: {
    rounds: ROUNDS,
    warmupRunsPerQuery: WARMUP_RUNS,
    measurementRunsPerQuery: MEASUREMENT_RUNS,
    bm25: { k1: 1.2, b: 0.75 },
    executionOrders
  },
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    cpu: os.cpus()[0]?.model ?? "Unknown",
    cpuCount: os.cpus().length
  },
  results: {
    summary,
    individualRounds: roundResults
  }
};

const outputPath = path.join(
  BASE_DIR,
  "reports/ranking-comparison.json"
);

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log("\n===== STATISTICAL RANKING COMPARISON =====\n");

for (const algorithm of ALGORITHMS) {
  console.log(`\n${algorithm.toUpperCase()}`);
  console.table(summary[algorithm]);
}

console.log("\nReport saved to:", outputPath);